import { sismoConnectSimpleClaimResponseMock } from './mocks'
import { BigNumber } from '@ethersproject/bignumber'
import { HydraS2VerifierMocked } from './hydras2-verifier-mocked'
import { encodeRequestIdentifier } from '../src/verifier/utils/encodeRequestIdentifier'
import { encodeAccountsTreeValue } from '../src/verifier/utils/encodeAccountsTreeValue'
import { ProofPublicInputs } from '../src/verifier/hydras2-verifier'
import {
  ClaimRequest,
  ClaimType,
  VerifiedClaim,
  SismoConnectProof,
} from '../src'
import {
  decodeProofData,
  encodeProofData,
} from '../src/verifier/utils/proofData'

describe('Sismo Connect Verifier', () => {
  let appId: string
  let groupId: string
  let groupTimestamp: number | 'latest'
  let value: number
  let claimType: ClaimType

  let proofPublicInputs: ProofPublicInputs
  let verifiedClaim: VerifiedClaim
  let proof: SismoConnectProof

  let hydraS2VerifierMocked: HydraS2VerifierMocked
  let namespace: string

  let claimRequest: ClaimRequest

  let proofIdentifier: string
  let vaultIdentifier: string

  let commitmentMapperPubKey: [BigNumber, BigNumber];

  let expectVerifyClaimToThrow: (
    proof: SismoConnectProof,
    expectedError: string
  ) => Promise<void>

  beforeAll(() => {
    appId = '0x112a692a2005259c25f6094161007967'
    groupId = '0x682544d549b8a461d7fe3e589846bb7b'
    namespace = 'main'
    groupTimestamp = 'latest'
    value = 1
    claimType = ClaimType.GTE

    claimRequest = {
        groupId,
        groupTimestamp,
        value,
        claimType
    };

    const snarkProof = decodeProofData(sismoConnectSimpleClaimResponseMock.proofs[0].proofData);

    proofPublicInputs = {
      destinationIdentifier: BigNumber.from(snarkProof.input[0]).toHexString(),
      extraData: BigNumber.from(snarkProof.input[1]).toHexString(),
      commitmentMapperPubKeyX: BigNumber.from(snarkProof.input[2]).toHexString(),
      commitmentMapperPubKeyY: BigNumber.from(snarkProof.input[3]).toHexString(),
      registryTreeRoot: BigNumber.from(snarkProof.input[4]).toHexString(),
      requestIdentifier: BigNumber.from(snarkProof.input[5]).toString(),
      proofIdentifier: BigNumber.from(snarkProof.input[6]).toString(),
      claimValue: BigNumber.from(snarkProof.input[7]).toString(),
      accountsTreeValue: BigNumber.from(snarkProof.input[8]).toString(),
      claimType: BigNumber.from(snarkProof.input[9]).toString(),
      vaultIdentifier: BigNumber.from(snarkProof.input[10]).toHexString(),
      vaultNamespace: BigNumber.from(snarkProof.input[11]).toHexString(),
      sourceVerificationEnabled: BigNumber.from(snarkProof.input[12]).toHexString(),
      destinationVerificationEnabled: BigNumber.from(snarkProof.input[13]).toHexString(),
    }

    commitmentMapperPubKey = [
      BigNumber.from(snarkProof.input[2]),
      BigNumber.from(snarkProof.input[3]),
    ]

    hydraS2VerifierMocked = new HydraS2VerifierMocked({
      commitmentMapperPubKey,
    })

    verifiedClaim = {
      groupId,
      groupTimestamp,
      value,
      claimType,
      isSelectableByUser: false,
      extraData: "",
      proofId: BigNumber.from(proofPublicInputs.proofIdentifier).toHexString(),
      proofData: encodeProofData(
        snarkProof.a,
        snarkProof.b,
        snarkProof.c,
        snarkProof.input
      ),
    }

    proof = sismoConnectSimpleClaimResponseMock.proofs[0];

    vaultIdentifier = proofPublicInputs.vaultIdentifier
    proofIdentifier = proofPublicInputs.proofIdentifier

    expectVerifyClaimToThrow = async (
      proof: SismoConnectProof,
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

  it('Should encode the right request identifier', async () => {
    const requestIdentifier = encodeRequestIdentifier(
      appId,
      groupId,
      groupTimestamp,
      namespace
    )
    expect(BigNumber.from(requestIdentifier).toString()).toEqual(
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
        const invalidProof = JSON.parse(JSON.stringify(proof)) as SismoConnectProof
        invalidProof.claims = invalidProof.claims as ClaimRequest[]

        invalidProof.claims[0].claimType = ClaimType.EQ
        const claimTypeFromInput = proofPublicInputs.claimType === '0'
        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" claimType "${
            invalidProof.claims[0].claimType
          }" mismatch with proof input claimType "${!claimTypeFromInput}"`
        )
      })

      it('Should throw with incorrect proof value', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as SismoConnectProof
        invalidProof.claims = invalidProof.claims as ClaimRequest[]
        invalidProof.claims[0].value = 2
        await expectVerifyClaimToThrow(
          invalidProof,
          `on proofId "${proofIdentifier}" value "${invalidProof.claims[0].value}" mismatch with proof input claimValue "${proofPublicInputs.claimValue}"`
        )
      })

      it('Should throw with incorrect input requestIdentifier', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as SismoConnectProof
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
        const invalidProof = JSON.parse(JSON.stringify(proof)) as SismoConnectProof
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

      it('Should throw with incorrect input commitmentMapperPubKeyX', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as SismoConnectProof
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
        const invalidProof = JSON.parse(JSON.stringify(proof)) as SismoConnectProof
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
        const invalidProof = JSON.parse(JSON.stringify(proof)) as SismoConnectProof
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

    /********************************************************************************************************/
    /****************************************** PROOF VALIDITY **********************************************/
    /********************************************************************************************************/

    describe('proof validity', () => {
      it('Should return false', async () => {
        const invalidProof = JSON.parse(JSON.stringify(proof)) as SismoConnectProof
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
