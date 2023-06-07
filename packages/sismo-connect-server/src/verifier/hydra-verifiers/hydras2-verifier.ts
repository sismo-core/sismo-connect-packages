import { ProofDecoded } from '../utils/proofData';
import { HydraS2Verifier as HydraS2VerifierPS } from '@sismo-core/hydra-s2';
import { HydraVerifier } from './hydra-verifier';

export class HydraS2Verifier extends HydraVerifier {
  protected async _verifyProof(snarkProof: ProofDecoded){
    return HydraS2VerifierPS.verifyProof(
        snarkProof.a,
        snarkProof.b,
        snarkProof.c,
        snarkProof.input
    )
  }
}