import {
  ClaimRequest,
  ClaimType,
  VerifiedClaim,
  SismoConnect,
  SismoConnectResponse,
  SismoConnectServer,
  SISMO_CONNECT_VERSION,
} from "../src";
import { sismoConnectSimpleClaimResponseMock } from "./mocks";
import { ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { decodeProofData } from "../src/verifier/utils/proofData";

describe('ZkConnect', () => {
  let verifiedClaim: VerifiedClaim
  let sismoConnect: SismoConnectServer
  let sismoConnectResponse: SismoConnectResponse
  let appId: string
  let groupId: string
  let namespace: string
  let claimRequest: ClaimRequest
  let groupTimestamp: number | 'latest'
  let value: number
  let claimType: ClaimType
  let commitmentMapperPubKey: [string, string];

  beforeAll(() => {
    appId = '0x112a692a2005259c25f6094161007967'
    groupId = '0x682544d549b8a461d7fe3e589846bb7b'
    namespace = 'main'
    sismoConnectResponse = sismoConnectSimpleClaimResponseMock
    groupTimestamp = 'latest'
    value = 1
    claimType = ClaimType.GTE

    const _provider = new ethers.providers.JsonRpcProvider(
      'https://rpc.ankr.com/eth_goerli',
      5
    )
    
    const snarkProof = decodeProofData(sismoConnectResponse.proofs[0].proofData);
    commitmentMapperPubKey = [
      BigNumber.from(snarkProof.input[2]).toHexString(),
      BigNumber.from(snarkProof.input[3]).toHexString(),
    ]

    claimRequest = {
      groupId,
    }

    sismoConnect = SismoConnect({
      appId,
      options: {
        provider: _provider,
        verifier: {
          hydraS2: {
            commitmentMapperPubKeys: commitmentMapperPubKey
          },
        },
      },
    })

    verifiedClaim = {
        groupId,
        groupTimestamp,
        value,
        claimType,
        extraData: "",
        isSelectableByUser: false,
        proofId: BigNumber.from(snarkProof.input[6]).toHexString(),
        proofData: sismoConnectResponse.proofs[0].proofData
    };

    // Mocking the IsRootAvailable method to return true even if the root is no longer available
    const isRootAvailableMock = jest.spyOn(
      sismoConnect['_verifier']['hydraS2Verifier'] as any,
      'IsRootAvailable'
    )
    isRootAvailableMock.mockImplementation(async () => {
      return true
    })
  })

  describe('zkConnect server', () => {
    describe('verify with statements', () => {
      it('should throw with an invalid sismoConnectResponse', async () => {
        const invalidSismoConnectResponse = null
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse as any, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toThrow(`sismoConnectResponse provided is undefined`)
      })

      it('should throw with an invalid sismoConnectResponse', async () => {
        const invalidSismoConnectResponse = {}
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse as any, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toThrow(
          `no version provided in your sismoConnectResponse, please use the sismoConnectResponse that was returned by the Sismo vault app`
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
        ).rejects.toThrow(
          `version of the sismoConnectResponse "${invalidSismoConnectResponse.version}" not compatible with this version "${SISMO_CONNECT_VERSION}"`
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
        ).rejects.toThrow(
          `sismoConnectResponse appId "${invalidSismoConnectResponse.appId}" does not match with server appId "${appId}"`
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
        ).rejects.toThrow(
          `sismoConnectResponse namespace "${invalidSismoConnectResponse.namespace}" does not match with server namespace "${namespace}"`
        )
      })

      it('should throw with an invalid groupId', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.proofs[0].claims = invalidSismoConnectResponse
          .proofs[0].claims as ClaimRequest[]
        invalidSismoConnectResponse.proofs[0].claims[0].groupId = '0x123'
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toThrow(
          `A required proof is missing for the claimRequest with groupId ${claimRequest.groupId}, groupTimestamp ${claimRequest.groupTimestamp} and claimType ${claimRequest.claimType}`
        )
      })

      it('should throw with an invalid groupTimestamp', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.proofs[0].claims = invalidSismoConnectResponse
          .proofs[0].claims as ClaimRequest[]
        invalidSismoConnectResponse.proofs[0].claims[0].groupTimestamp = 123456
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toThrow(
          `A required proof is missing for the claimRequest with groupId ${claimRequest.groupId}, groupTimestamp ${claimRequest.groupTimestamp} and claimType ${claimRequest.claimType}`
        )
      })

      it('should throw with an invalid comparator', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.proofs[0].claims = invalidSismoConnectResponse
          .proofs[0].claims as ClaimRequest[]
        invalidSismoConnectResponse.proofs[0].claims[0].claimType = ClaimType.LT;
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toThrow(
          `A required proof is missing for the claimRequest with groupId ${claimRequest.groupId}, groupTimestamp ${claimRequest.groupTimestamp} and claimType ${claimRequest.claimType}`
        )
      })

      it('should throw with an invalid value', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse

        invalidSismoConnectResponse.proofs[0].claims = invalidSismoConnectResponse.proofs[0].claims as ClaimRequest[];
        invalidSismoConnectResponse.proofs[0].claims[0].value = -1;

        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toThrow(
          `The proof value ${invalidSismoConnectResponse.proofs[0].claims[0].value} is not equal or greater than the requested value ${(sismoConnectResponse.proofs[0].claims as ClaimRequest[])[0]?.value}`
        )
      })

      it('Should verify', async () => {
        const zkConnectVerifiedResult = await sismoConnect.verify(
          sismoConnectResponse,
          {
            claims: [claimRequest],
            namespace: 'main',
          }
        )
        expect(zkConnectVerifiedResult.claims[0]).toEqual(verifiedClaim);
      })
    })

    describe('verify without claim', () => {
      it('should throw with no claimRequest, no authRequest and no signedMessage', async () => {
        await expect(
          sismoConnect.verify(sismoConnectResponse, {
            namespace,
          })
        ).rejects.toThrow(
          `No claim, no auth and no signed message in the proof, please provide at least one`
        )
      })
    })
  })
})
