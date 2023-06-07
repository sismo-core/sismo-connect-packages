import { sismoConnectSimpleClaimResponseMock } from './mocks'
import { BigNumber } from '@ethersproject/bignumber'
import {
  ClaimType,
  VerifiedClaim,
  SismoConnectProof,
} from '../src'
import {
  decodeProofData,
  encodeProofData,
} from '../src/verifier/utils/proofData'
import { HydraS3VerifierMocked } from './hydras3-verifier-mocked'

describe('HydraS3 Verifier test', () => {
  let appId: string
  let groupId: string
  let groupTimestamp: number | 'latest'
  let value: number
  let claimType: ClaimType

  let verifiedClaim: VerifiedClaim
  let proof: SismoConnectProof

  let hydraS3VerifierMocked: HydraS3VerifierMocked
  let namespace: string

  let commitmentMapperPubKey: [BigNumber, BigNumber];

  beforeAll(() => {
    appId = '0x112a692a2005259c25f6094161007967'
    groupId = '0x682544d549b8a461d7fe3e589846bb7b'
    namespace = 'main'
    groupTimestamp = 'latest'
    value = 1
    claimType = ClaimType.GTE

    const snarkProof = decodeProofData(sismoConnectSimpleClaimResponseMock.proofs[0].proofData);

    commitmentMapperPubKey = [
      BigNumber.from(snarkProof.input[2]),
      BigNumber.from(snarkProof.input[3]),
    ]

    hydraS3VerifierMocked = new HydraS3VerifierMocked({
      commitmentMapperPubKey,
    })

    const proofId = BigNumber.from(snarkProof.input[6]).toHexString();

    verifiedClaim = {
      groupId,
      groupTimestamp,
      value,
      claimType,
      isSelectableByUser: false,
      extraData: "",
      proofId: proofId,
      proofData: encodeProofData(
        snarkProof.a,
        snarkProof.b,
        snarkProof.c,
        snarkProof.input
      ),
    }

    proof = sismoConnectSimpleClaimResponseMock.proofs[0];
  })

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
            hydraS3VerifierMocked.verifyClaimProof({
            appId,
            namespace,
            proof: invalidProof,
          })
        ).rejects.toThrow('Snark Proof Invalid!')
      })

      it('Should return true', async () => {
        throw new Error("Not implemented yet");
        // const isVerified = await hydraS3VerifierMocked.verifyClaimProof({
        //   appId,
        //   namespace,
        //   proof,
        // })
        // expect(isVerified).toEqual(verifiedClaim)
      })
    })
})
