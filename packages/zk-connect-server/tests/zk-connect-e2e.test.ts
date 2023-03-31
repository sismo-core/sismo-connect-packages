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
} from "../src";
import { zkConnectResponseMock, zkConnectResponseMock2 } from "./mocks";
import { ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { decodeProofData, encodeProofData } from "../src/verifier/utils/proofData";

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
              "0x07f6c5612eb579788478789deccb06cf0eb168e457eea490af754922939ebdb9",
              "0x20706798455f90ed993f8dac8075fc1538738a25f0c928da905c0dffd81869fa"
            ]
          },
        },
      },
    })

    const snarkProof = decodeProofData(zkConnectResponse.proofs[0].proofData);

    verifiedClaim = {
        groupId,
        groupTimestamp,
        value,
        claimType,
        proofId: BigNumber.from(snarkProof.input[6]).toHexString(),
        __proof: zkConnectResponse.proofs[0].proofData
    };

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
