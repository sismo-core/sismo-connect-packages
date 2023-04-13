import {
  ClaimType,
  VerifiedClaim,
  VerifiedAuth,
  ProvingScheme,
  AuthRequest,
  ClaimRequest,
  SismoConnectResponse,
  SismoConnectVerifiedResult,
  SignatureRequest,
  SismoConnectProof,
  AuthType,
} from '../common-types'
import { HydraS2Verifier, HydraS2VerifierOpts } from './hydras2-verifier'
import { Provider } from '@ethersproject/abstract-provider'

export type VerifierOpts = {
  hydraS2?: HydraS2VerifierOpts
  isDevMode?: boolean
}

export type VerifyParams = {
  sismoConnectResponse: SismoConnectResponse
  claims?: ClaimRequest[]
  auths?: AuthRequest[]
  signature?: SignatureRequest
  namespace?: string
}

export class SismoConnectVerifier {
  private hydraS2Verifier: HydraS2Verifier

  constructor(provider: Provider, opts?: VerifierOpts) {
    this.hydraS2Verifier = new HydraS2Verifier(provider, {
      ...opts?.hydraS2,
      isDevMode: opts?.isDevMode,
    })
  }

  async verify({
    sismoConnectResponse,
    claims,
    auths,
    signature,
  }: VerifyParams): Promise<SismoConnectVerifiedResult> {
    const verifiedClaims: VerifiedClaim[] = []
    const verifiedAuths: VerifiedAuth[] = []

    await this._checkRequiredRequests(sismoConnectResponse, claims, auths);

    for (let proof of sismoConnectResponse.proofs) {
      await this._checkProofMatchRequest(proof,sismoConnectResponse, claims, auths, signature);
  
      if (proof.auths && proof.auths.length > 0) {
        const verifiedAuth = await this._verifyAuthProof(proof, sismoConnectResponse.signedMessage)
        verifiedAuths.push(verifiedAuth)
      }
  
      if (proof.claims && proof.claims.length > 0) {
        const verifiedAuth = await this._verifyClaimProof(
          sismoConnectResponse.appId,
          sismoConnectResponse.signedMessage,
          sismoConnectResponse.namespace,
          proof
        )
        verifiedClaims.push(verifiedAuth)
      }
    
      if (
          (!proof.claims || proof.claims.length === 0) && 
          (!proof.auths || proof.auths.length === 0) && 
          sismoConnectResponse.signedMessage
        ) {
        await this._verifySignedMessageProof(proof, sismoConnectResponse.signedMessage)
      }
    }

    return new SismoConnectVerifiedResult({
      response: sismoConnectResponse,
      claims: verifiedClaims,
      auths: verifiedAuths
    });
  }

  private async _checkRequiredRequests(
    sismoConnectResponse: SismoConnectResponse,
    claimRequests: ClaimRequest[],
    authRequests: AuthRequest[]
  ) {
    //Verify that for every not optional request the user generate a proof

    let countNotOptional = 0;
    if (claimRequests) {
      for (let claimRequest of claimRequests) {
        if (!claimRequest.isOptional) {
          countNotOptional++;
          const proofFounded = sismoConnectResponse.proofs.find(proof => {
            if (!proof.claims) return false;
            for (let claim of proof.claims) {
              if (claimRequest.groupId === claim.groupId && claimRequest.groupTimestamp === claim.groupTimestamp && claimRequest.claimType === claim.claimType) {
                return true;
              }
            }
            return false;
          })
          if (!proofFounded) {
            throw new Error(
              `A required proof is missing for the claimRequest with groupId ${claimRequest.groupId}, groupTimestamp ${claimRequest.groupTimestamp} and claimType ${claimRequest.claimType}`
            )
          }
        }
      }
    }
    
    if (authRequests) {
      for (let authRequest of authRequests) {
        if (!authRequest.isOptional) {
          countNotOptional++;
          const proofFounded = sismoConnectResponse.proofs.find(proof => {
            if (!proof.auths) return false;
            for (let auth of proof.auths) {
              //If the request ask a specific userId
              if (authRequest.authType !== AuthType.VAULT && !authRequest.isSelectableByUser && authRequest.userId !== auth.userId) {
                return false;
              }
              if (authRequest.authType === auth.authType) {
                return true;
              }
            }
            return false;
          })
          if (!proofFounded) {
            throw new Error(
              `A required proof is missing for the authRequest with authType ${authRequest.authType}`
            )
          }
        }
      }
    }

    if (sismoConnectResponse.proofs.length < countNotOptional) {
      throw new Error(
        `Number of proofs in the response (${sismoConnectResponse.proofs.length}) lower than the number of not optional requests (${countNotOptional})`
      )
    }
  }

  private async _checkProofMatchRequest(
    proof: SismoConnectProof,
    response: SismoConnectResponse,
    claimRequests: ClaimRequest[],
    authRequests: AuthRequest[],
    signatureRequest: SignatureRequest
  ) {
    const signedMessage = response.signedMessage;

    if (!claimRequests || claimRequests.length === 0) {
      if (!authRequests || authRequests.length === 0) {
        if (!response.signedMessage) {
          throw new Error(
            `No claim, no auth and no signed message in the proof, please provide at least one`
          )
        }
      }
    }

    if (signatureRequest) {
      if (!signatureRequest.isSelectableByUser) {
        if (signedMessage !== signatureRequest.message) {
          throw new Error(
            `The proof signedMessage ${signedMessage} does not match signatureRequest ${signatureRequest.message} ${
              signedMessage
            }`
          );
        }
      }
    } else {
      if (signedMessage) {
        throw new Error(
          `The signature is missing in the verify function. Please ensure that the same signature is specified in the verify function as in your frontend.`
        );
      }
    }

    if (claimRequests && proof.claims) {
      for (let claim of proof.claims) {
        if (!claim) continue;
        const groupId = claim?.groupId;
        const groupTimestamp = claim?.groupTimestamp;
        const claimType = claim?.claimType;

        const claimRequest = claimRequests.find((_claimRequest) => {
            if (
              _claimRequest.groupId !== groupId ||
              _claimRequest.groupTimestamp !== groupTimestamp || 
              _claimRequest.claimType !== claimType
            ) {
              return false;
            }
            return true;
        })
    
        if (!claimRequest) {
          throw new Error(
            `No claimRequest found for groupId ${groupId}, groupTimestamp ${groupTimestamp} and claimType ${claimType}`
          );
        }
  
        const requestedClaimType = claimRequest.claimType
        if (requestedClaimType !== claim.claimType) {
          throw new Error(
            `The proof claimType ${claim.claimType} does not match the requested claimType ${requestedClaimType}`
          )
        }
        const requestedValue = claimRequest.value
        if (claim.claimType == ClaimType.EQ) {
          if (claim.value != requestedValue) {
            throw new Error(
              `The proof value ${claim.value} is not equal to the requested value ${requestedValue}`
            )
          }
        }
  
        if (claim.claimType == ClaimType.GT) {
          if (claim.value <= requestedValue) {
            throw new Error(
              `The proof value ${claim.value} is not greater than the requested value ${requestedValue}`
            )
          }
        }
  
        if (claim.claimType == ClaimType.GTE) {
          if (claim.value < requestedValue) {
            throw new Error(
              `The proof value ${claim.value} is not equal or greater than the requested value ${requestedValue}`
            )
          }
        }
  
        if (claim.claimType == ClaimType.LT) {
          if (claim.value >= requestedValue) {
            throw new Error(
              `The proof value ${claim.value} is not lower than the requested value ${requestedValue}`
            )
          }
        }
  
        if (claim.claimType == ClaimType.LTE) {
          if (claim.value > requestedValue) {
            throw new Error(
              `The proof value ${claim.value} is not equal or lower than the requested value ${requestedValue}`
            )
          }
        }
      }
    }

    if (authRequests && proof.auths) {
      for (let auth of proof.auths) {
        if (!auth) continue;
        const authType = auth?.authType;
        const isAnon = auth?.isAnon;
        const authRequest = authRequests.find((_authRequest) => {
            //If the request ask a specific userId
            if (_authRequest.userId !== '0' && !_authRequest.isSelectableByUser && _authRequest.userId !== auth.userId) {
              return false;
            }
            if (
              _authRequest.authType !== authType
            ) {
              return false;
            }
            return true;
        })
    
        if (!authRequest) {
          throw new Error(
            `No authRequest found for authType ${authType} and isAnon ${isAnon}`
          );
        }
        const requestedUserId = authRequest.userId
        if (requestedUserId !== '0') {
          if (auth.userId !== requestedUserId) {
            throw new Error(
              `The proof auth userId ${auth.userId} does not match the requested auth userId ${requestedUserId}`
            )
          }
        }
      }
    }
  }

  private async _verifySignedMessageProof(
    proof: SismoConnectProof,
    signedMessage: string
  ): Promise<void> {
    switch (proof.provingScheme) {
      case ProvingScheme.HYDRA_S2:
        return this.hydraS2Verifier.verifySignedMessageProof({
          proof,
          signedMessage
        })
      default:
        throw new Error(
          `proof proving scheme "${proof.provingScheme}" not supported in this version`
        )
    }
  }

  private async _verifyAuthProof(proof: SismoConnectProof, signedMessage: string): Promise<VerifiedAuth> {
    switch (proof.provingScheme) {
      case ProvingScheme.HYDRA_S2:
        return this.hydraS2Verifier.verifyAuthProof({
          proof,
          signedMessage
        })
      default:
        throw new Error(
          `proof proving scheme "${proof.provingScheme}" not supported in this version`
        )
    }
  }

  private async _verifyClaimProof(
    appId: string,
    signedMessage: string,
    namespace: string,
    proof: SismoConnectProof
  ): Promise<VerifiedClaim> {
    switch (proof.provingScheme) {
      case ProvingScheme.HYDRA_S2:
        return await this.hydraS2Verifier.verifyClaimProof({
          appId,
          signedMessage,
          namespace,
          proof,
        })
      default:
        throw new Error(
          `proof proving scheme "${proof.provingScheme}" not supported in this version`
        )
    }
  }
}
