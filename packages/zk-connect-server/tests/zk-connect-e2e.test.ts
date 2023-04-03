import {
  AuthType,
  Claim,
  ClaimType,
  RequestContentLib,
  VerifiedClaim,
  ZkConnect,
  ZkConnectRequestContent,
  ZkConnectResponse,
  ZkConnectServer,
  ZkConnectVerifiedResult,
  ZK_CONNECT_VERSION,
} from '../src'
import { proofId, zkConnectResponseMock, zkConnectResponseMock2 } from './mocks'
import { ethers } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'
import {
  decodeProofData,
  encodeProofData,
} from '../src/verifier/utils/proofData'
import { SNARK_FIELD } from '@sismo-core/hydra-s2'

describe('ZkConnect', () => {
  let verifiedClaim: VerifiedClaim
  let zkConnect: ZkConnectServer
  let zkConnectResponse: ZkConnectResponse
  let appId: string
  let groupId: string
  let namespace: string
  let claimRequest: Claim
  let groupTimestamp: number | 'latest'
  let value: number
  let claimType: ClaimType

  beforeAll(() => {
    appId = '0xf68985adfc209fafebfb1a956913e7fa'
    groupId = '0x682544d549b8a461d7fe3e589846bb7b'
    namespace = 'main'
    zkConnectResponse = zkConnectResponseMock
    groupTimestamp = 'latest'
    value = 1
    claimType = ClaimType.GTE

    const _provider = new ethers.providers.JsonRpcProvider(
      'https://rpc.ankr.com/eth_goerli',
      5
    )

    claimRequest = {
      groupId,
    }

    zkConnect = ZkConnect({
      appId,
      options: {
        provider: _provider,
        verifier: {
          hydraS2: {
            commitmentMapperPubKeys: [
              '0x07f6c5612eb579788478789deccb06cf0eb168e457eea490af754922939ebdb9',
              '0x20706798455f90ed993f8dac8075fc1538738a25f0c928da905c0dffd81869fa',
            ],
          },
        },
      },
    })

    const snarkProof = decodeProofData(zkConnectResponse.proofs[0].proofData)

    verifiedClaim = {
      groupId,
      groupTimestamp,
      value,
      claimType,
      proofId: BigNumber.from(snarkProof.input[6]).toHexString(),
      __proof: zkConnectResponse.proofs[0].proofData,
    }

    // Mocking the IsRootAvailable method to return true even if the root is no longer available
    const isRootAvailableMock = jest.spyOn(
      zkConnect['_verifier']['hydraS2Verifier'] as any,
      'IsRootAvailable'
    )
    isRootAvailableMock.mockImplementation(async () => {
      return true
    })
  })

  describe('zkConnect server', () => {
    describe('verify with statements', () => {
      it('should throw with an invalid zkConnectResponse', async () => {
        const invalidZkConnectResponse = null
        await expect(
          zkConnect.verify(invalidZkConnectResponse as any, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(`zkConnectResponse provided is undefined`)
      })

      it('should throw with an invalid zkConnectResponse', async () => {
        const invalidZkConnectResponse = {}
        await expect(
          zkConnect.verify(invalidZkConnectResponse as any, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(
          `no version provided in your zkConnectResponse, please use the zkConnectResponse that was returned by the Sismo vault app`
        )
      })

      it('should throw with an invalid version', async () => {
        const invalidZkConnectResponse = JSON.parse(
          JSON.stringify(zkConnectResponse)
        ) as ZkConnectResponse
        invalidZkConnectResponse.version = 'invalid-version'
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(
          `version of the zkConnectResponse "${invalidZkConnectResponse.version}" not compatible with this version "${ZK_CONNECT_VERSION}"`
        )
      })

      it('should throw with an invalid appId', async () => {
        const invalidZkConnectResponse = JSON.parse(
          JSON.stringify(zkConnectResponse)
        ) as ZkConnectResponse
        invalidZkConnectResponse.appId = '0x123'
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(
          `zkConnectResponse appId "${invalidZkConnectResponse.appId}" does not match with server appId "${appId}"`
        )
      })

      it('should throw with an invalid namespace', async () => {
        const invalidZkConnectResponse = JSON.parse(
          JSON.stringify(zkConnectResponse)
        ) as ZkConnectResponse
        invalidZkConnectResponse.namespace = 'main2'
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(
          `zkConnectResponse namespace "${invalidZkConnectResponse.namespace}" does not match with server namespace "${namespace}"`
        )
      })

      it('should throw with an invalid groupId', async () => {
        const invalidZkConnectResponse = JSON.parse(
          JSON.stringify(zkConnectResponse)
        ) as ZkConnectResponse
        invalidZkConnectResponse.proofs[0].claim = invalidZkConnectResponse
          .proofs[0].claim as Claim
        invalidZkConnectResponse.proofs[0].claim.groupId = '0x123'
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(
          `No dataRequest found for claimRequest groupId ${invalidZkConnectResponse.proofs[0].claim.groupId} and groupTimestamp ${invalidZkConnectResponse.proofs[0].claim.groupTimestamp}`
        )
      })

      it('should throw with an invalid groupTimestamp', async () => {
        const invalidZkConnectResponse = JSON.parse(
          JSON.stringify(zkConnectResponse)
        ) as ZkConnectResponse
        invalidZkConnectResponse.proofs[0].claim = invalidZkConnectResponse
          .proofs[0].claim as Claim
        invalidZkConnectResponse.proofs[0].claim.groupTimestamp = 123456
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(
          `No dataRequest found for claimRequest groupId ${invalidZkConnectResponse.proofs[0].claim.groupId} and groupTimestamp ${invalidZkConnectResponse.proofs[0].claim.groupTimestamp}`
        )
      })

      it('should throw with an invalid comparator', async () => {
        const invalidZkConnectResponse = JSON.parse(
          JSON.stringify(zkConnectResponse)
        ) as ZkConnectResponse
        invalidZkConnectResponse.proofs[0].claim = invalidZkConnectResponse
          .proofs[0].claim as Claim
        invalidZkConnectResponse.proofs[0].claim.claimType = ClaimType.LT
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(
          `The proof claimType ${invalidZkConnectResponse.proofs[0].claim.claimType} does not match the requestContent claimType ${zkConnectResponse.proofs[0].claim?.claimType}`
        )
      })

      it('should throw with an invalid value', async () => {
        const invalidZkConnectResponse = JSON.parse(
          JSON.stringify(zkConnectResponse)
        ) as ZkConnectResponse
        invalidZkConnectResponse.proofs[0].claim = invalidZkConnectResponse
          .proofs[0].claim as Claim
        invalidZkConnectResponse.proofs[0].claim.value = -1
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(
          `The proof value ${invalidZkConnectResponse.proofs[0].claim.value} is not equal or greater than the requestContent value ${zkConnectResponse.proofs[0].claim?.value}`
        )
      })

      it('Should throw with incorrect signedMesage', async () => {
        const invalidZkConnectResponse = JSON.parse(
          JSON.stringify(zkConnectResponse)
        ) as ZkConnectResponse
        invalidZkConnectResponse.proofs[0].signedMessage =
          ethers.utils.defaultAbiCoder.encode(['string'], ['fakeSignedMessage'])
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            claimRequest,
            namespace,
          })
        ).rejects.toThrow(
          `on proofId "${BigNumber.from(proofId)}" extraData "${BigNumber.from(
            decodeProofData(invalidZkConnectResponse.proofs[0].proofData)
              .input[1]
          ).toHexString()}" mismatch with signedMessage "${BigNumber.from(
            ethers.utils.keccak256(
              invalidZkConnectResponse.proofs[0].signedMessage
            )
          )
            .mod(SNARK_FIELD)
            .toHexString()}"`
        )
      })

      it('Should verify', async () => {
        const zkConnectVerifiedResult = await zkConnect.verify(
          zkConnectResponse,
          {
            claimRequest,
            namespace: 'main',
          }
        )
        expect(zkConnectVerifiedResult).toEqual({
          ...zkConnectResponse,
          verifiedClaims: [verifiedClaim],
          signedMessages: [],
          verifiedAuths: [],
        } as ZkConnectVerifiedResult)
      })

      it('Should verify with signedMessage', async () => {
        const appId = '0x11b1de449c6c4adb0b5775b3868b28b3'
        const groupId = '0xe9ed316946d3d98dfcd829a53ec9822e'
        const signedMessage =
          '0x000000000000000000000000040200040600000201150028570102001e030e26'

        // we create a new zkConnect mock with the beta dev commitment mapper pubkey
        const zkConnectMock = ZkConnect({
          appId,
          options: {
            verifier: {
              hydraS2: {
                // we use the beta dev commitment mapper pubkey for this test since the proof is made with it
                commitmentMapperPubKeys: [
                  '0x2ab71fb864979b71106135acfa84afc1d756cda74f8f258896f896b4864f0256', // beta dev commitment mapper pubKey x
                  '0x30423b4c502f1cd4179a425723bf1e15c843733af2ecdee9aef6a0451ef2db74', // beta dev commitment mapper pubKey y
                ],
              },
            },
          },
        })

        // we create a new zkConnectResponse with the signedMessage and the groupId we want
        // notice that the proofData changes
        const zkConnectResponseWithSignedMessage = JSON.parse(
          JSON.stringify({
            ...zkConnectResponse,
            appId,
            groupId,
            proofs: [
              {
                ...zkConnectResponse.proofs[0],
                claim: {
                  ...zkConnectResponse.proofs[0].claim,
                  groupId,
                },
                proofData:
                  '0x0b0c5bbc3df72e9d6dd05ea034c31125f45417e29656c1495fc18ee6c51215e927ccfe87780fb12df4335bba03df6ccde3a3858d1c7db8dfe6648f7d4c81e6c10fbe0e3f0f2b041ac6646795449770a3c4feba26202d5e7bd2c89d7c364baae312ef73dcadf53e6408ff69d61dc0d43aa13975846a72734a0ad79e28b78f80f71fb35163c46e8cae1ec1e986f4e3b17628fcd71ca00d67e1e887b8b8408a0e6a20f4b2e3b9e1235940c258ba03cd804bdd70422f14b988c0bb3243c1b5ae0882012e75376642517e817b5f8e3863ff1966dd501c8721add9590f8e9e1f4ada1e13248f22a4fc19275664b1e09e6bd2bb8027d885b18d4191839db82ded0fc57400000000000000000000000000000000000000000000000000000000000000001e762fcc1e79cf55469b1e6ada7c8f80734bc7484f73098f3168be945a2c00842ab71fb864979b71106135acfa84afc1d756cda74f8f258896f896b4864f025630423b4c502f1cd4179a425723bf1e15c843733af2ecdee9aef6a0451ef2db74126f694813ae22c129a784a369f10de1ede83dfde50edfaf341567e1ac5c2d5504f81599b826fa9b715033e76e5b2fdda881352a9b61360022e30ee33ddccad90744e9b92802056c722ac4b31612e1b1de544d5b99481386b162a0b59862e0850000000000000000000000000000000000000000000000000000000000000001285bf79dc20d58e71b9712cb38c420b9cb91d3438c8e3dbaf07829b03ffffffc0000000000000000000000000000000000000000000000000000000000000000174c0f7d68550e40962c4ae6db9b04940288cb4aeede625dd8a9b0964939cdeb0000000000000000000000000000000011b1de449c6c4adb0b5775b3868b28b300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
                signedMessage,
              },
            ],
          })
        ) as ZkConnectResponse

        const zkConnectVerifiedResult = await zkConnectMock.verify(
          zkConnectResponseWithSignedMessage,
          {
            claimRequest: {
              groupId,
            },
            messageSignatureRequest: signedMessage,
            namespace,
          }
        )
        expect(zkConnectVerifiedResult).toEqual({
          ...zkConnectResponseWithSignedMessage,
          verifiedClaims: [
            {
              ...verifiedClaim,
              groupId,
              proofId:
                '0x0744e9b92802056c722ac4b31612e1b1de544d5b99481386b162a0b59862e085',
              __proof:
                '0x0b0c5bbc3df72e9d6dd05ea034c31125f45417e29656c1495fc18ee6c51215e927ccfe87780fb12df4335bba03df6ccde3a3858d1c7db8dfe6648f7d4c81e6c10fbe0e3f0f2b041ac6646795449770a3c4feba26202d5e7bd2c89d7c364baae312ef73dcadf53e6408ff69d61dc0d43aa13975846a72734a0ad79e28b78f80f71fb35163c46e8cae1ec1e986f4e3b17628fcd71ca00d67e1e887b8b8408a0e6a20f4b2e3b9e1235940c258ba03cd804bdd70422f14b988c0bb3243c1b5ae0882012e75376642517e817b5f8e3863ff1966dd501c8721add9590f8e9e1f4ada1e13248f22a4fc19275664b1e09e6bd2bb8027d885b18d4191839db82ded0fc57400000000000000000000000000000000000000000000000000000000000000001e762fcc1e79cf55469b1e6ada7c8f80734bc7484f73098f3168be945a2c00842ab71fb864979b71106135acfa84afc1d756cda74f8f258896f896b4864f025630423b4c502f1cd4179a425723bf1e15c843733af2ecdee9aef6a0451ef2db74126f694813ae22c129a784a369f10de1ede83dfde50edfaf341567e1ac5c2d5504f81599b826fa9b715033e76e5b2fdda881352a9b61360022e30ee33ddccad90744e9b92802056c722ac4b31612e1b1de544d5b99481386b162a0b59862e0850000000000000000000000000000000000000000000000000000000000000001285bf79dc20d58e71b9712cb38c420b9cb91d3438c8e3dbaf07829b03ffffffc0000000000000000000000000000000000000000000000000000000000000000174c0f7d68550e40962c4ae6db9b04940288cb4aeede625dd8a9b0964939cdeb0000000000000000000000000000000011b1de449c6c4adb0b5775b3868b28b300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
            },
          ],
          signedMessages: [signedMessage],
          verifiedAuths: [],
        } as ZkConnectVerifiedResult)
      })
    })

    describe('verify without claim', () => {
      it('should throw with no claimRequest, no authRequest and no signedMessage', async () => {
        const invalidZkConnectResponse = JSON.parse(
          JSON.stringify(zkConnectResponse)
        ) as ZkConnectResponse
        invalidZkConnectResponse.proofs[0].auth = { authType: AuthType.EMPTY }
        invalidZkConnectResponse.proofs[0].claim = {
          claimType: ClaimType.EMPTY,
        }
        const invalidRequestContent = JSON.parse(
          JSON.stringify(claimRequest)
        ) as Claim
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            claimRequest: invalidRequestContent,
            namespace,
          })
        ).rejects.toThrow(
          `No claim, no auth and no signed message in the proof, please provide at least one`
        )
      })
    })
  })
})
