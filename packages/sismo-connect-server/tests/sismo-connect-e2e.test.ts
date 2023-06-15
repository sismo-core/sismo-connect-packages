import {
  ClaimRequest,
  ClaimType,
  VerifiedClaim,
  SismoConnect,
  SismoConnectResponse,
  SismoConnectServer,
  SISMO_CONNECT_VERSION,
  AuthRequest,
  AuthType,
} from '../src'
import { BigNumber } from '@ethersproject/bignumber'
import { decodeProofData } from '../src/verifier/utils/proofData'
import { JsonRpcProviderMock } from '../src/verifier/libs/onchain-provider'
import { sismoConnectSimpleClaimResponseMock } from './mocks'

describe('SismoConnect', () => {
  let verifiedClaim: VerifiedClaim
  let sismoConnect: SismoConnectServer
  let sismoConnectResponse: SismoConnectResponse
  let appId: string
  let groupId: string
  let namespace: string
  let claimRequest: ClaimRequest
  let authRequests: AuthRequest[]
  let groupTimestamp: number | 'latest'
  let value: number
  let claimType: ClaimType
  let commitmentMapperPubKey: [string, string]
  let signedMessage: string


  beforeEach(async () => {
    appId = '0xf4977993e52606cfd67b7a1cde717069';
    groupId = '0x8543f5652418334ff011c1888fd8d96f';
    namespace = 'main';
    groupTimestamp = 'latest';
    value = 1;
    claimType = ClaimType.GTE;
    signedMessage = 'Hello';

    sismoConnectResponse = sismoConnectSimpleClaimResponseMock;
    
    const snarkProof = decodeProofData(sismoConnectResponse.proofs[0].proofData);

    commitmentMapperPubKey = [
      BigNumber.from(snarkProof.input[2]).toHexString(),
      BigNumber.from(snarkProof.input[3]).toHexString(),
    ]

    claimRequest = {
      groupId,
    }

    authRequests = [{
      authType: AuthType.VAULT
    }, {
      authType: AuthType.TWITTER
    }]

    sismoConnect = SismoConnect({
      config: {
        appId,
      },
      options: {
        provider: new JsonRpcProviderMock(),
        verifier: {
          hydraS3: {
            commitmentMapperPubKeys: commitmentMapperPubKey,
          },
        },
      },
    })

    verifiedClaim = {
      groupId,
      groupTimestamp,
      value,
      claimType,
      extraData: '',
      isSelectableByUser: false,
      proofId: BigNumber.from(snarkProof.input[6]).toHexString(),
      proofData: sismoConnectResponse.proofs[0].proofData,
    }
  })

  describe('Sismo Connect server', () => {
    describe('verify with statements', () => {
      it('should throw with an invalid sismoConnectResponse', async () => {
        const invalidSismoConnectResponse = undefined
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse as any, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toEqual(Error(`sismoConnectResponse provided is undefined`))
      })

      it('should throw with an invalid sismoConnectResponse', async () => {
        const invalidSismoConnectResponse = {}
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse as any, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toEqual(
          Error(
            `no version provided in your sismoConnectResponse, please use the sismoConnectResponse that was returned by the Sismo vault app`
          )
        )
      })

      it('should throw with an invalid version', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.version = 'invalid-version'
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toEqual(
          Error(
            `version of the sismoConnectResponse "${invalidSismoConnectResponse.version}" not compatible with this version "${SISMO_CONNECT_VERSION}"`
          )
        )
      })

      it('should throw with an invalid appId', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.appId = '0x123'
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toEqual(
          Error(
            `sismoConnectResponse appId "${invalidSismoConnectResponse.appId}" does not match with server appId "${appId}"`
          )
        )
      })

      it('should throw with an invalid namespace', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.namespace = 'main2'
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toEqual(
          Error(
            `sismoConnectResponse namespace "${invalidSismoConnectResponse.namespace}" does not match with server namespace "${namespace}"`
          )
        )
      })

      it('should throw with an invalid groupId', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.proofs[0].claims =
          invalidSismoConnectResponse.proofs[0].claims as ClaimRequest[]
        invalidSismoConnectResponse.proofs[0].claims[0].groupId = '0x123'
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toEqual(
          Error(
            `A required proof is missing for the claimRequest with groupId ${claimRequest.groupId}, groupTimestamp ${claimRequest.groupTimestamp} and claimType ${claimRequest.claimType}`
          )
        )
      })

      it('should throw with an invalid groupTimestamp', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.proofs[0].claims =
          invalidSismoConnectResponse.proofs[0].claims as ClaimRequest[]
        invalidSismoConnectResponse.proofs[0].claims[0].groupTimestamp = 123456
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toEqual(
          Error(
            `A required proof is missing for the claimRequest with groupId ${claimRequest.groupId}, groupTimestamp ${claimRequest.groupTimestamp} and claimType ${claimRequest.claimType}`
          )
        )
      })

      it('should throw with an invalid comparator', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.proofs[0].claims =
          invalidSismoConnectResponse.proofs[0].claims as ClaimRequest[]
        invalidSismoConnectResponse.proofs[0].claims[0].claimType = ClaimType.LT
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toEqual(
          Error(
            `A required proof is missing for the claimRequest with groupId ${claimRequest.groupId}, groupTimestamp ${claimRequest.groupTimestamp} and claimType ${claimRequest.claimType}`
          )
        )
      })

      it('should throw with an invalid value', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse

        invalidSismoConnectResponse.proofs[0].claims =
          invalidSismoConnectResponse.proofs[0].claims as ClaimRequest[]
        invalidSismoConnectResponse.proofs[0].claims[0].value = -1

        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            signature: { message: signedMessage },
            auths: authRequests,
            namespace,
          })
        ).rejects.toEqual(
          Error(
            `The proof value ${
              invalidSismoConnectResponse.proofs[0].claims[0].value
            } is not equal or greater than the requested value ${
              (sismoConnectResponse.proofs[0].claims as ClaimRequest[])[0]
                ?.value
            }`
          )
        )
      })

      it('Should verify', async () => {
        const sismoConnectVerifiedResult = await sismoConnect.verify(
          sismoConnectResponse,
          {
            claims: [claimRequest],
            auths: authRequests,
            signature: { message: signedMessage },
            namespace: 'main',
          }
        )

        expect(sismoConnectVerifiedResult.claims[0]).toEqual(verifiedClaim)
      })
    })

    describe('verify without claim', () => {
      it('should throw with no claimRequest, no authRequest and no signedMessage', async () => {
        const sismoConnectResponseWithoutSignature = {
          ...sismoConnectResponse,
          signedMessage: undefined
        } as SismoConnectResponse
        await expect(
          sismoConnect.verify(sismoConnectResponseWithoutSignature, {
            namespace,
          })
        ).rejects.toEqual(
          Error(
            `No claim, no auth and no signed message in the proof, please provide at least one`
          )
        )
      })
    })
  })
})
