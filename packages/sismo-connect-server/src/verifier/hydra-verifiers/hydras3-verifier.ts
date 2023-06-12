import { ProofDecoded } from '../utils/proofData'
import { HydraS3Verifier as HydraS3VerifierPS } from '@sismo-core/hydra-s3'
import { HydraVerifier } from './hydra-verifier'

export class HydraS3Verifier extends HydraVerifier {
  protected async _verifyProof(snarkProof: ProofDecoded) {
    return HydraS3VerifierPS.verifyProof(
      snarkProof.a,
      snarkProof.b,
      snarkProof.c,
      snarkProof.input
    )
  }
}
