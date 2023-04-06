import {
  AuthType,
  ClaimRequest,
  ClaimType,
  VerifiedClaim,
  SismoConnect,
  SismoConnectResponse,
  SismoConnectServer,
  AuthRequest,
  SISMO_CONNECT_VERSION,
} from "../src";
import { sismoConnectResponseMock } from "./mocks";
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

  beforeAll(() => {
    appId = '0xf68985adfc209fafebfb1a956913e7fa'
    groupId = '0x682544d549b8a461d7fe3e589846bb7b'
    namespace = 'main'
    sismoConnectResponse = sismoConnectResponseMock
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

    sismoConnect = SismoConnect({
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

    const snarkProof = decodeProofData(sismoConnectResponse.proofs[0].proofData);

    verifiedClaim = {
        groupId,
        groupTimestamp,
        value,
        claimType,
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
        const invalidClaim = invalidSismoConnectResponse.proofs[0].claims[0];
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toThrow(
          `No claimRequest found for groupId ${invalidClaim.groupId}, groupTimestamp ${invalidClaim.groupTimestamp} and claimType ${invalidClaim.claimType}`
        )
      })

      it('should throw with an invalid groupTimestamp', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.proofs[0].claims = invalidSismoConnectResponse
          .proofs[0].claims as ClaimRequest[]
        invalidSismoConnectResponse.proofs[0].claims[0].groupTimestamp = 123456
        const invalidClaim = invalidSismoConnectResponse.proofs[0].claims[0];
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toThrow(
          `No claimRequest found for groupId ${invalidClaim.groupId}, groupTimestamp ${invalidClaim.groupTimestamp} and claimType ${invalidClaim.claimType}`
        )
      })

      it('should throw with an invalid comparator', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        invalidSismoConnectResponse.proofs[0].claims = invalidSismoConnectResponse
          .proofs[0].claims as ClaimRequest[]
        invalidSismoConnectResponse.proofs[0].claims[0].claimType = ClaimType.LT;
        const invalidClaim = invalidSismoConnectResponse.proofs[0].claims[0];
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [claimRequest],
            namespace,
          })
        ).rejects.toThrow(
          `No claimRequest found for groupId ${invalidClaim.groupId}, groupTimestamp ${invalidClaim.groupTimestamp} and claimType ${invalidClaim.claimType}`
        )
      })

      it('should throw with an invalid value', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse

        invalidSismoConnectResponse.proofs[0].claims = invalidSismoConnectResponse.proofs[0].claims as ClaimRequest[];
        invalidSismoConnectResponse.proofs[0].claims[0].value = -1;

        console.log("test claimRequest", claimRequest);
        console.log("test invalidSismoConnectResponse", invalidSismoConnectResponse.proofs[0].claims);

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
        expect(zkConnectVerifiedResult.verifiedClaims[0]).toEqual(verifiedClaim);
      })
    })

    describe('verify without claim', () => {
      it('should throw with no claimRequest, no authRequest and no signedMessage', async () => {
        const invalidSismoConnectResponse = JSON.parse(
          JSON.stringify(sismoConnectResponse)
        ) as SismoConnectResponse
        console.log("hey claimRequest", claimRequest);
        console.log("hey invalidSismoConnectResponse", JSON.stringify(invalidSismoConnectResponse));

        (invalidSismoConnectResponse.proofs[0].auths as AuthRequest[]) = [{ authType: AuthType.GITHUB }];
        (invalidSismoConnectResponse.proofs[0].claims as ClaimRequest[]) = [{ claimType: ClaimType.GT }];

        const invalidRequestContent = JSON.parse(
          JSON.stringify(claimRequest)
        ) as ClaimRequest
        await expect(
          sismoConnect.verify(invalidSismoConnectResponse, {
            claims: [invalidRequestContent],
            namespace,
          })
        ).rejects.toThrow(
          `No claim, no auth and no signed message in the proof, please provide at least one`
        )
      })
    })
  })
})
