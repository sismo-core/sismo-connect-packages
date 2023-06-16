import { sismoConnectSimpleClaimResponseMock } from './mocks'
import { BigNumber } from '@ethersproject/bignumber'
import {
  ClaimType,
  VerifiedClaim,
  SismoConnectProof,
  ClaimRequest,
  AuthType,
  AuthRequest,
  VerifiedAuth,
} from '../src'
import {
  decodeProofData,
  encodeProofData,
} from '../src/verifier/utils/proofData'
import { ethers } from 'ethers'
import { HydraS3VerifierMocked } from './hydras3-verifier-mocked'
import { encodeRequestIdentifier } from '../src/verifier/utils/encodeRequestIdentifier'
import { ProofPublicInputs } from '../src/verifier/hydra-verifiers'
import { encodeAccountsTreeValue } from '../src/verifier/utils/encodeAccountsTreeValue'
import { SNARK_FIELD } from '@sismo-core/hydra-s3'

describe('HydraS3 Verifier test', () => {
  let appId: string
  let groupId: string
  let groupTimestamp: number | 'latest'
  let value: number
  let claimType: ClaimType
  let signedMessage: string;

  let authProofPublicInputs: ProofPublicInputs
  let claimProofPublicInputs: ProofPublicInputs
  let vaultProofPublicInputs: ProofPublicInputs

  let verifiedClaim: VerifiedClaim
  let verifiedAuth: VerifiedAuth
  let verifiedVault: VerifiedAuth

  let claimProof: SismoConnectProof
  let vaultProof: SismoConnectProof
  let authProof: SismoConnectProof

  let hydraS3VerifierMocked: HydraS3VerifierMocked
  let namespace: string

  let authType: AuthType;
  let vaultType: AuthType;

  let userId: string;
  let vaultId: string;

  let proofIdentifier: string
  let commitmentMapperPubKey: [BigNumber, BigNumber];

  let expectVerifyClaimToThrow: (
    proof: SismoConnectProof,
    expectedError: string
  ) => Promise<void>

  beforeAll(() => {
    appId = '0xf4977993e52606cfd67b7a1cde717069';
    groupId = '0x8543f5652418334ff011c1888fd8d96f';
    namespace = 'main';
    groupTimestamp = 'latest';
    value = 1;
    claimType = ClaimType.GTE;
    vaultId = "0x106e40fa5d1d2ace741f7cab6f9d55c614bf25c3febebe148a2fa09e3bbaa096"; 
    userId = "0x1002000000000000000001553049041977724928";
    vaultType = 0;
    authType = 2;
    signedMessage = 'Hello';

    const snarkClaimProof = decodeProofData(sismoConnectSimpleClaimResponseMock.proofs[0].proofData);

    claimProofPublicInputs = {
      destinationIdentifier: BigNumber.from(snarkClaimProof.input[0]).toHexString(),
      extraData: BigNumber.from(snarkClaimProof.input[1]).toHexString(),
      commitmentMapperPubKeyX: BigNumber.from(
        snarkClaimProof.input[2]
      ).toHexString(),
      commitmentMapperPubKeyY: BigNumber.from(
        snarkClaimProof.input[3]
      ).toHexString(),
      registryTreeRoot: BigNumber.from(snarkClaimProof.input[4]).toHexString(),
      requestIdentifier: BigNumber.from(snarkClaimProof.input[5]).toString(),
      proofIdentifier: BigNumber.from(snarkClaimProof.input[6]).toString(),
      claimValue: BigNumber.from(snarkClaimProof.input[7]).toString(),
      accountsTreeValue: BigNumber.from(snarkClaimProof.input[8]).toString(),
      claimType: BigNumber.from(snarkClaimProof.input[9]).toString(),
      vaultIdentifier: BigNumber.from(snarkClaimProof.input[10]).toHexString(),
      vaultNamespace: BigNumber.from(snarkClaimProof.input[11]).toHexString(),
      sourceVerificationEnabled: BigNumber.from(
        snarkClaimProof.input[12]
      ).toHexString(),
      destinationVerificationEnabled: BigNumber.from(
        snarkClaimProof.input[13]
      ).toHexString(),
    }

    const snarkVaultProof = decodeProofData(sismoConnectSimpleClaimResponseMock.proofs[1].proofData);

    vaultProofPublicInputs = {
      destinationIdentifier: BigNumber.from(snarkVaultProof.input[0]).toHexString(),
      extraData: BigNumber.from(snarkVaultProof.input[1]).toHexString(),
      commitmentMapperPubKeyX: BigNumber.from(
        snarkVaultProof.input[2]
      ).toHexString(),
      commitmentMapperPubKeyY: BigNumber.from(
        snarkVaultProof.input[3]
      ).toHexString(),
      registryTreeRoot: BigNumber.from(snarkVaultProof.input[4]).toHexString(),
      requestIdentifier: BigNumber.from(snarkVaultProof.input[5]).toString(),
      proofIdentifier: BigNumber.from(snarkVaultProof.input[6]).toString(),
      claimValue: BigNumber.from(snarkVaultProof.input[7]).toString(),
      accountsTreeValue: BigNumber.from(snarkVaultProof.input[8]).toString(),
      claimType: BigNumber.from(snarkVaultProof.input[9]).toString(),
      vaultIdentifier: BigNumber.from(snarkVaultProof.input[10]).toHexString(),
      vaultNamespace: BigNumber.from(snarkVaultProof.input[11]).toHexString(),
      sourceVerificationEnabled: BigNumber.from(
        snarkVaultProof.input[12]
      ).toHexString(),
      destinationVerificationEnabled: BigNumber.from(
        snarkVaultProof.input[13]
      ).toHexString(),
    }
    
    const snarkAuthProof = decodeProofData(sismoConnectSimpleClaimResponseMock.proofs[2].proofData);

    authProofPublicInputs = {
      destinationIdentifier: BigNumber.from(snarkAuthProof.input[0]).toHexString(),
      extraData: BigNumber.from(snarkAuthProof.input[1]).toHexString(),
      commitmentMapperPubKeyX: BigNumber.from(
        snarkAuthProof.input[2]
      ).toHexString(),
      commitmentMapperPubKeyY: BigNumber.from(
        snarkAuthProof.input[3]
      ).toHexString(),
      registryTreeRoot: BigNumber.from(snarkAuthProof.input[4]).toHexString(),
      requestIdentifier: BigNumber.from(snarkAuthProof.input[5]).toString(),
      proofIdentifier: BigNumber.from(snarkAuthProof.input[6]).toString(),
      claimValue: BigNumber.from(snarkAuthProof.input[7]).toString(),
      accountsTreeValue: BigNumber.from(snarkAuthProof.input[8]).toString(),
      claimType: BigNumber.from(snarkAuthProof.input[9]).toString(),
      vaultIdentifier: BigNumber.from(snarkAuthProof.input[10]).toHexString(),
      vaultNamespace: BigNumber.from(snarkAuthProof.input[11]).toHexString(),
      sourceVerificationEnabled: BigNumber.from(
        snarkAuthProof.input[12]
      ).toHexString(),
      destinationVerificationEnabled: BigNumber.from(
        snarkAuthProof.input[13]
      ).toHexString(),
    }

    commitmentMapperPubKey = [
      BigNumber.from(snarkAuthProof.input[2]),
      BigNumber.from(snarkAuthProof.input[3]),
    ]

    hydraS3VerifierMocked = new HydraS3VerifierMocked({
      commitmentMapperPubKey,
    })

    const proofId = BigNumber.from(snarkClaimProof.input[6]).toHexString();

    verifiedClaim = {
      groupId,
      groupTimestamp,
      value,
      claimType,
      isSelectableByUser: false,
      extraData: "",
      proofId: proofId,
      proofData: encodeProofData(
        snarkClaimProof.a,
        snarkClaimProof.b,
        snarkClaimProof.c,
        snarkClaimProof.input
      ),
    }

    verifiedVault= {
      authType: vaultType,
      userId: vaultId,
      isSelectableByUser: true,
      extraData: "",
      proofData: encodeProofData(
        snarkVaultProof.a,
        snarkVaultProof.b,
        snarkVaultProof.c,
        snarkVaultProof.input
      )
    }

    verifiedAuth = {
      authType,
      userId: "1553049041977724928",
      isSelectableByUser: true,
      extraData: "",
      proofData: encodeProofData(
        snarkAuthProof.a,
        snarkAuthProof.b,
        snarkAuthProof.c,
        snarkAuthProof.input
      )
    }

    claimProof = sismoConnectSimpleClaimResponseMock.proofs[0];
    vaultProof = sismoConnectSimpleClaimResponseMock.proofs[1];
    authProof = sismoConnectSimpleClaimResponseMock.proofs[2];
    proofIdentifier = claimProofPublicInputs.proofIdentifier

    expectVerifyClaimToThrow = async (
      proof: SismoConnectProof,
      errorMessage: string
    ) => {
      await expect(
        hydraS3VerifierMocked.verifyClaimProof({
          namespace,
          appId,
          proof,
        })
      ).rejects.toThrow(errorMessage)
    }
  })

  /**********************************************************************************/
  /************************************* CLAIM **************************************/
  /**********************************************************************************/

  describe('Verify Claim proof', () => {
    describe('Validate input', () => {
      it('Should throw with incorrect input claimType', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(claimProof)
        ) as SismoConnectProof
        invalidProof.claims = invalidProof.claims as ClaimRequest[]

        invalidProof.claims[0].claimType = ClaimType.EQ
        const claimTypeFromInput = claimProofPublicInputs.claimType === '0'

        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" claimType "${
            invalidProof.claims[0].claimType
          }" mismatch with proof input claimType "${!claimTypeFromInput}"`
        )
      })

      it('Should throw with incorrect input claim value', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(claimProof)
        ) as SismoConnectProof
        invalidProof.claims = invalidProof.claims as ClaimRequest[]
        invalidProof.claims[0].value = 2
        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" value "${invalidProof.claims[0].value}" mismatch with proof input claimValue "${claimProofPublicInputs.claimValue}"`
        )
      })

      it('Should throw with incorrect input requestIdentifier', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(claimProof)
        ) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[5] = '1'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        const requestIdentifier = encodeRequestIdentifier(
          appId,
          groupId,
          groupTimestamp,
          namespace
        )

        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" requestIdentifier "${BigNumber.from(
            requestIdentifier
          ).toHexString()}" mismatch with proof input requestIdentifier "${BigNumber.from(
            proofDecoded.input[5]
          ).toHexString()}"`
        )
      })

      it('Should throw with incorrect input commitmentMapperPubKeyX', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(claimProof)
        ) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[2] = '0x1'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" commitmentMapperPubKeyX "${BigNumber.from(
            commitmentMapperPubKey[0]
          ).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(
            proofDecoded.input[2]
          ).toHexString()}"`
        )
      })

      it('Should throw with incorrect input commitmentMapperPubKeyY', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(claimProof)
        ) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[3] = '0x1'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" commitmentMapperPubKeyY "${BigNumber.from(
            commitmentMapperPubKey[1]
          ).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(
            proofDecoded.input[3]
          ).toHexString()}"`
        )
      })

      it('should throw with incorrect input sourceVerificationEnabled', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(claimProof)
        ) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[12] = '123456789'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" proof input sourceVerificationEnabled must be 1`
        )
      })

      it('Should throw with incorrect accountsTreeValue', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(claimProof)
        ) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[8] = '123456789'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded
        invalidProof.claims = invalidProof.claims as ClaimRequest[]

        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" groupId "${invalidProof.claims[0].groupId}" or timestamp "${invalidProof.claims[0].groupTimestamp}" incorrect`
        )
      })
    })

    describe('proof validity', () => {
      it('Should return false', async () => {
        const invalidProof = JSON.parse(JSON.stringify(claimProof)) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.a[0] = '123456789'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        await expect(
            hydraS3VerifierMocked.verifyClaimProof({
            appId,
            namespace,
            proof: invalidProof,
          })
        ).rejects.toThrow('Snark Proof Invalid!')
      })

      it('Should return true', async () => {
        const isVerified = await hydraS3VerifierMocked.verifyClaimProof({
          appId,
          namespace,
          proof: claimProof,
        })
        expect(isVerified).toEqual(verifiedClaim)
      })
    })
  })

  /**********************************************************************************/
  /********************************** SIGNATURE *************************************/
  /**********************************************************************************/

  describe('Verify Signature proof', () => {
    describe('Validate input', () => {
      it('Should throw on claim proof with incorrect input signature', async () => {
        const invalidMessage = "invalid message";

        const expectedSignedMessage = BigNumber.from(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signedMessage))
        ).mod(SNARK_FIELD);

        const invalidSignedMessage = BigNumber.from(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid message"))
        ).mod(SNARK_FIELD);

        const messageClaim = `on proofId "${proofIdentifier}" extraData "${expectedSignedMessage.toHexString()}" mismatch with signedMessage "${invalidSignedMessage.toHexString()}"`;
        
        await expect(
          hydraS3VerifierMocked.verifySignedMessageProof({
            proof: claimProof,
            signedMessage: invalidMessage
          })
        ).rejects.toThrow(messageClaim)
      })

      it('Should throw on auth proof with incorrect input signature', async () => {
        const invalidMessage = "invalid message";

        const expectedSignedMessage = BigNumber.from(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signedMessage))
        ).mod(SNARK_FIELD);

        const invalidSignedMessage = BigNumber.from(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid message"))
        ).mod(SNARK_FIELD);

        const messageAuth = `on proofId "0" extraData "${expectedSignedMessage.toHexString()}" mismatch with signedMessage "${invalidSignedMessage.toHexString()}"`;
        
        await expect(
          hydraS3VerifierMocked.verifySignedMessageProof({
            proof: authProof,
            signedMessage: invalidMessage
          })
        ).rejects.toThrow(messageAuth)
      })
    })
  })

  /**********************************************************************************/
  /************************************* AUTH ***************************************/
  /**********************************************************************************/

  describe('Verify Auth proof', () => {
    describe('Validate input', () => {
      it('Should throw with incorrect input destination identifier', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(authProof)
        ) as SismoConnectProof
        invalidProof.auths = invalidProof.auths as AuthRequest[]
        invalidProof.auths[0].userId = "2";

        await expect(
          hydraS3VerifierMocked.verifyAuthProof({
            proof: invalidProof,
            signedMessage
          })
        ).rejects.toThrow(`userId \"0x02\" mismatch with proof input destinationIdentifier 0x1002000000000000000001553049041977724928`)
      })

      it('should throw with incorrect input destinationVerificationEnabled', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(authProof)
        ) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[13] = '123456789'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        await expect(
          hydraS3VerifierMocked.verifyAuthProof({
            proof: invalidProof,
            signedMessage
          })
        ).rejects.toThrow("proof input destinationVerificationEnabled must be 1")
      })

      it('Should throw with incorrect input commitmentMapperPubKeyX', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(authProof)
        ) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[2] = '0x1'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        await expect(
          hydraS3VerifierMocked.verifyAuthProof({
            proof: invalidProof,
            signedMessage
          })
        ).rejects.toThrow(`commitmentMapperPubKeyX "${BigNumber.from(
          commitmentMapperPubKey[0]
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(
          proofDecoded.input[2]
        ).toHexString()}"`)
      })

      it('Should throw with incorrect input commitmentMapperPubKeyY', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(authProof)
        ) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[3] = '0x1'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        await expect(
          hydraS3VerifierMocked.verifyAuthProof({
            proof: invalidProof,
            signedMessage
          })
        ).rejects.toThrow(`commitmentMapperPubKeyY "${BigNumber.from(
          commitmentMapperPubKey[1]
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(
          proofDecoded.input[3]
        ).toHexString()}"`)
      })
    })

    describe('proof validity', () => {
      it('Should return false', async () => {
        const invalidProof = JSON.parse(JSON.stringify(authProof)) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.a[0] = '123456789'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        await expect(
          hydraS3VerifierMocked.verifyAuthProof({
            proof: invalidProof,
            signedMessage
          })
        ).rejects.toThrow('Snark Proof Invalid!')
      })

      it('Should return true', async () => {
        const isVerified = await hydraS3VerifierMocked.verifyAuthProof({
          proof: authProof,
          signedMessage
        })
        expect(isVerified).toEqual(verifiedAuth)
      })
    })
  })

  /**********************************************************************************/
  /************************************* VAULT ***************************************/
  /**********************************************************************************/

  describe('Verify Vault proof', () => {
    describe('Validate input', () => {

      it('Should throw with incorrect input Vault identifier', async () => {
        const invalidProof = JSON.parse(
          JSON.stringify(vaultProof)
        ) as SismoConnectProof
        invalidProof.auths = invalidProof.auths as AuthRequest[]
        invalidProof.auths[0].userId = "2";

        await expect(
          hydraS3VerifierMocked.verifyAuthProof({
            proof: invalidProof,
            signedMessage
          })
        ).rejects.toThrow(`userId \"0x02\" mismatch with proof input vaultIdentifier 0x106e40fa5d1d2ace741f7cab6f9d55c614bf25c3febebe148a2fa09e3bbaa096`)
      })
    })

    describe('proof validity', () => {
      it('Should return false', async () => {
        const invalidProof = JSON.parse(JSON.stringify(vaultProof)) as SismoConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.a[0] = '123456789'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded

        await expect(
          hydraS3VerifierMocked.verifyAuthProof({
            proof: invalidProof,
            signedMessage
          })
        ).rejects.toThrow('Snark Proof Invalid!')
      })

      it('Should return true', async () => {
        const isVerified = await hydraS3VerifierMocked.verifyAuthProof({
          proof: vaultProof,
          signedMessage
        })
        expect(isVerified).toEqual(verifiedVault)
      })
    })
  })

  /**********************************************************************************/
  /*********************************** HELPERS **************************************/
  /**********************************************************************************/

  it('Should encode the right request identifier', async () => {
    const requestIdentifier = encodeRequestIdentifier(
      appId,
      groupId,
      groupTimestamp,
      namespace
    )
    expect(BigNumber.from(requestIdentifier).toString()).toEqual(
      claimProofPublicInputs.requestIdentifier
    )
  })

  it('Should encode the right Accounts Tree value', async () => {
    const accountsTreeValue = encodeAccountsTreeValue(groupId, groupTimestamp)
    expect(BigNumber.from(accountsTreeValue).toString()).toEqual(
      claimProofPublicInputs.accountsTreeValue
    )
  })
})
