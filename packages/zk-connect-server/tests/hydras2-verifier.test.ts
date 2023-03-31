import { proofMock1 } from './mocks'
import { BigNumber } from '@ethersproject/bignumber'
import { HydraS2VerifierMocked } from './hydras2-verifier-mocked'
import { encodeRequestIdentifier } from '../src/verifier/utils/encodeRequestIdentifier'
import { encodeAccountsTreeValue } from '../src/verifier/utils/encodeAccountsTreeValue'
import { ProofPublicInputs } from '../src/verifier/hydras2-verifier'
import {
  Claim,
  ClaimType,
  RequestContentLib,
  VerifiedClaim,
  ZkConnectProof,
  ZkConnectRequestContent,
  ZkConnectVerifier,
} from '../src'
import { ProvingScheme } from '../src'
import {
  decodeProofData,
  encodeProofData,
} from '../src/verifier/utils/proofData'

describe('ZkConnect Verifier', () => {
  let appId: string
  let groupId: string
  let groupTimestamp: number | 'latest'
  let value: number
  let claimType: ClaimType

  let requestContent: ZkConnectRequestContent
  let proofPublicInputs: ProofPublicInputs
  let verifiedClaim: VerifiedClaim
  let proof: ZkConnectProof

  let hydraS2VerifierMocked: HydraS2VerifierMocked
  let zkConnectVerifier: ZkConnectVerifier
  let namespace: string

  let proofIdentifier: string
  let vaultIdentifier: string

  let expectVerifyClaimToThrow: (
    proof: ZkConnectProof,
    expectedError: string
  ) => Promise<void>

  beforeAll(() => {
    appId = '0xf68985adfc209fafebfb1a956913e7fa'
    groupId = '0x682544d549b8a461d7fe3e589846bb7b'
    namespace = 'main'
    groupTimestamp = 'latest'
    value = 1
    claimType = ClaimType.GTE

    requestContent = RequestContentLib.build({
      claimRequest: {
        groupId,
        groupTimestamp,
        value,
        claimType,
      },
    })

    proofPublicInputs = {
      destinationIdentifier: proofMock1.snarkProof.input[0],
      extraData: proofMock1.snarkProof.input[1],
      commitmentMapperPubKeyX: proofMock1.snarkProof.input[2],
      commitmentMapperPubKeyY: proofMock1.snarkProof.input[3],
      registryTreeRoot: proofMock1.snarkProof.input[4],
      requestIdentifier: proofMock1.snarkProof.input[5],
      proofIdentifier: proofMock1.snarkProof.input[6],
      claimValue: proofMock1.snarkProof.input[7],
      accountsTreeValue: proofMock1.snarkProof.input[8],
      claimType: proofMock1.snarkProof.input[9],
      vaultIdentifier: proofMock1.snarkProof.input[10],
      vaultNamespace: proofMock1.snarkProof.input[11],
      sourceVerificationEnabled: proofMock1.snarkProof.input[12],
      destinationVerificationEnabled: proofMock1.snarkProof.input[13],
    }

    hydraS2VerifierMocked = new HydraS2VerifierMocked({
      commitmentMapperPubKey: [
        BigNumber.from(proofMock1.snarkProof.input[2]),
        BigNumber.from(proofMock1.snarkProof.input[3]),
      ],
    })

    verifiedClaim = {
      groupId,
      groupTimestamp,
      value,
      claimType,
      proofId: BigNumber.from(proofPublicInputs.proofIdentifier).toHexString(),
      __proof: encodeProofData(
        proofMock1.snarkProof.a,
        proofMock1.snarkProof.b,
        proofMock1.snarkProof.c,
        proofMock1.snarkProof.input
      ),
    }

    proof = {
      claim: {
        groupId,
        groupTimestamp,
        value,
        claimType,
      },
      provingScheme:ProvingScheme.HYDRA_S2,
      proofData: encodeProofData(proofMock1.snarkProof.a, proofMock1.snarkProof.b, proofMock1.snarkProof.c, proofMock1.snarkProof.input),
      extraData: "",
    };

    vaultIdentifier = proofPublicInputs.vaultIdentifier
    proofIdentifier = proofPublicInputs.proofIdentifier

    expectVerifyClaimToThrow = async (
      proof: ZkConnectProof,
      errorMessage: string
    ) => {
      await expect(
        hydraS2VerifierMocked.verifyClaimProof({
          namespace,
          appId,
          proof,
        })
      ).rejects.toThrow(errorMessage)
    }
  })

  it('Should encode the right external nullifier', async () => {
    const externalNullifier = encodeRequestIdentifier(
      appId,
      groupId,
      groupTimestamp,
      namespace
    )
    expect(BigNumber.from(externalNullifier).toString()).toEqual(
      proofPublicInputs.requestIdentifier
    )
  })

  it('Should encode the right Accounts Tree value', async () => {
    const accountsTreeValue = encodeAccountsTreeValue(groupId, groupTimestamp)
    expect(BigNumber.from(accountsTreeValue).toString()).toEqual(
      proofPublicInputs.accountsTreeValue
    )
  })

  describe('verifyClaimProof', () => {
    /********************************************************************************************************/
    /******************************************** VALIDATE INPUT ********************************************/
    /********************************************************************************************************/

    describe('validateInput', () => {
      it('Should throw with incorrect input claimType', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as ZkConnectProof
        invalidProof.claim = invalidProof.claim as Claim

        invalidProof.claim.claimType = ClaimType.EQ
        const claimTypeFromInput = proofPublicInputs.claimType === '0'
        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" claimType "${
            invalidProof.claim.claimType
          }" mismatch with proof input claimType "${!claimTypeFromInput}"`
        )
      })

      it('Should throw with incorrect proof value', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as ZkConnectProof
        invalidProof.claim = invalidProof.claim as Claim
        invalidProof.claim.value = 2
        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" value "${invalidProof.claim.value}" mismatch with proof input claimValue "${proofPublicInputs.claimValue}"`
        )
      })

      it('Should throw with incorrect input requestIdentifier', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as ZkConnectProof
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
        const invalidProof = JSON.parse(JSON.stringify(proof)) as ZkConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[2] = proofDecoded.input[2] + '1'
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
            proofMock1.commitmentMapperPubKey[0]
          ).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(
            proofDecoded.input[2]
          ).toHexString()}"`
        )
      })

      it('Should throw with incorrect input commitmentMapperPubKeyX', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as ZkConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[3] = '1'
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
            proofMock1.commitmentMapperPubKey[1]
          ).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(
            proofDecoded.input[3]
          ).toHexString()}"`
        )
      })

      it('should throw with incorrect input sourceVerificationEnabled', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as ZkConnectProof
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
        const invalidProof = JSON.parse(JSON.stringify(proof)) as ZkConnectProof
        const proofDecoded = decodeProofData(invalidProof.proofData)
        proofDecoded.input[8] = '123456789'
        const proofEncoded = encodeProofData(
          proofDecoded.a,
          proofDecoded.b,
          proofDecoded.c,
          proofDecoded.input
        )
        invalidProof.proofData = proofEncoded
        invalidProof.claim = invalidProof.claim as Claim

        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" groupId "${invalidProof.claim.groupId}" or timestamp "${invalidProof.claim.groupTimestamp}" incorrect`
        )
      })
    })

    /********************************************************************************************************/
    /****************************************** PROOF VALIDITY **********************************************/
    /********************************************************************************************************/

    describe('proof validity', () => {
      it('Should return false', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as ZkConnectProof
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
          hydraS2VerifierMocked.verifyClaimProof({
            appId,
            namespace,
            proof: invalidProof,
          })
        ).rejects.toThrow('Snark Proof Invalid!')
      })

      it('Should return true', async () => {
        const isVerified = await hydraS2VerifierMocked.verifyClaimProof({
          appId,
          namespace,
          proof,
        })
        expect(isVerified).toEqual(verifiedClaim)
      })
    })
  })
})
