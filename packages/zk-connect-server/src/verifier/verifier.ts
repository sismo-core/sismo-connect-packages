import {
  ZkConnectResponse,
  ZkConnectVerifiedResult,
  ZkConnectRequestContent,
  ZkConnectProof,
  ClaimType,
  VerifiedClaim,
  VerifiedAuth,
  ProvingScheme,
  AuthType,
  Auth,
  Claim,
  RequestContentLib,
} from '../common-types'
import { HydraS2Verifier, HydraS2VerifierOpts } from './hydras2-verifier'
import { Provider } from '@ethersproject/abstract-provider'

export type VerifierOpts = {
  hydraS2?: HydraS2VerifierOpts
  isDevMode?: boolean
}

export type VerifyParams = {
  zkConnectResponse: ZkConnectResponse
  claimRequest?: Claim
  authRequest?: Auth
  messageSignatureRequest?: any
  namespace?: string
}

export class ZkConnectVerifier {
  private hydraS2Verifier: HydraS2Verifier

  constructor(provider: Provider, opts?: VerifierOpts) {
    this.hydraS2Verifier = new HydraS2Verifier(provider, {
      ...opts?.hydraS2,
      isDevMode: opts?.isDevMode,
    })
  }

  async verify({
    zkConnectResponse,
    claimRequest,
    authRequest,
    messageSignatureRequest,
  }: VerifyParams): Promise<ZkConnectVerifiedResult> {
    const signedMessages: string[] = []
    const verifiedClaims: VerifiedClaim[] = []
    const verifiedAuths: VerifiedAuth[] = []

    const requestContent: ZkConnectRequestContent = RequestContentLib.build({
      claimRequest,
      authRequest,
      messageSignatureRequest,
    })

    //await this._checkOperators(zkConnectResponse, requestContent)

    // we only support one proof for now
    // no aggregation

    if (zkConnectResponse.proofs.length > 1) {
      throw new Error('We only support one proof for now.')
    }

    const proof = zkConnectResponse.proofs[0]

    await this._checkProofMatchContentRequest(proof, requestContent)

    if (proof.auth && proof.auth.authType !== AuthType.EMPTY) {
      const verifiedAuth = await this._verifyAuthProof(proof)
      verifiedAuths.push(verifiedAuth)
    }
    if (proof.claim && proof.claim.claimType !== ClaimType.EMPTY) {
      const verifiedAuth = await this._verifyClaimProof(
        zkConnectResponse.appId,
        zkConnectResponse.namespace,
        proof
      )
      verifiedClaims.push(verifiedAuth)
    }
    if (proof.signedMessage) {
      const signedMessage = await this._verifySignedMessageProof(proof)
      signedMessages.push(signedMessage)
    }

    const zkConnectVerifiedResult: ZkConnectVerifiedResult = {
      ...zkConnectResponse,
      verifiedClaims,
      verifiedAuths,
      signedMessages,
    }

    return zkConnectVerifiedResult
  }

  // private async _checkOperators(
  //   zkConnectResponse: ZkConnectResponse,
  //   requestContent: ZkConnectRequestContent
  // ) {
  //   if (requestContent.operators[0] === 'AND') {
  //     if (
  //       zkConnectResponse.proofs.length !== requestContent.dataRequests.length
  //     ) {
  //       throw new Error(
  //         `With AND operator the number of proof in the zkConnectResponse should be equal to the number of dataRequest`
  //       )
  //     }
  //   }
  //   if (requestContent.operators[0] === 'OR') {
  //     if (zkConnectResponse.proofs.length !== 1) {
  //       throw new Error(
  //         `With OR operator you should have only one proof in the zkConnectResponse`
  //       )
  //     }
  //   }
  // }

  private async _checkProofMatchContentRequest(
    proof: ZkConnectProof,
    requestContent: ZkConnectRequestContent
  ) {
    const groupId = proof.claim?.groupId
    const groupTimestamp = proof.claim?.groupTimestamp
    const authType = proof.auth?.authType
    const anonMode = proof.auth?.anonMode
    const signedMessage = proof.signedMessage

    if (!proof.claim || proof.claim.claimType === ClaimType.EMPTY) {
      if (!proof.auth || proof.auth.authType === AuthType.EMPTY) {
        if (!proof.signedMessage) {
          throw new Error(
            `No claim, no auth and no signed message in the proof, please provide at least one`
          )
        }
      }
    }

    const dataRequest = requestContent.dataRequests.find((dataRequest) => {
      if (
        dataRequest.claimRequest &&
        proof.claim.claimType !== ClaimType.EMPTY
      ) {
        if (
          dataRequest.claimRequest.groupId !== groupId ||
          dataRequest.claimRequest.groupTimestamp !== groupTimestamp
        ) {
          return false
        }
      }
      if (dataRequest.authRequest && proof.auth.authType !== AuthType.EMPTY) {
        if (
          dataRequest.authRequest.authType !== authType ||
          dataRequest.authRequest.anonMode !== anonMode
        ) {
          return false
        }
      }
      return true
    })

    if (!dataRequest) {
      throw new Error(
        `No dataRequest found for claimRequest groupId ${groupId} and groupTimestamp ${groupTimestamp} ${
          signedMessage && `, authRequest authType ${authType} and anonMode ${anonMode}`
        } ${
          signedMessage && `, signedMessage ${signedMessage}`
        }`
      );
    }

    if (proof.claim && proof.claim.claimType !== ClaimType.EMPTY) {
      const requestedClaimType = dataRequest.claimRequest.claimType
      if (requestedClaimType !== proof.claim.claimType) {
        throw new Error(
          `The proof claimType ${proof.claim.claimType} does not match the requestContent claimType ${requestedClaimType}`
        )
      }
      const requestedValue = dataRequest.claimRequest.value
      if (proof.claim.claimType == ClaimType.EQ) {
        if (proof.claim.value != requestedValue) {
          throw new Error(
            `The proof value ${proof.claim.value} is not equal to the requestContent value ${requestedValue}`
          )
        }
      }

      if (proof.claim.claimType == ClaimType.GT) {
        if (proof.claim.value <= requestedValue) {
          throw new Error(
            `The proof value ${proof.claim.value} is not greater than the requestContent value ${requestedValue}`
          )
        }
      }

      if (proof.claim.claimType == ClaimType.GTE) {
        if (proof.claim.value < requestedValue) {
          throw new Error(
            `The proof value ${proof.claim.value} is not equal or greater than the requestContent value ${requestedValue}`
          )
        }
      }

      if (proof.claim.claimType == ClaimType.LT) {
        if (proof.claim.value >= requestedValue) {
          throw new Error(
            `The proof value ${proof.claim.value} is not lower than the requestContent value ${requestedValue}`
          )
        }
      }

      if (proof.claim.claimType == ClaimType.LTE) {
        if (proof.claim.value > requestedValue) {
          throw new Error(
            `The proof value ${proof.claim.value} is not equal or lower than the requestContent value ${requestedValue}`
          )
        }
      }
    }

    if (proof.auth && proof.auth.authType !== AuthType.EMPTY) {
      const requestedUserId = dataRequest.authRequest.userId
      if (requestedUserId !== '0') {
        if (proof.auth.userId !== requestedUserId) {
          throw new Error(
            `The proof auth userId ${proof.auth.userId} does not match the requestContent auth userId ${requestedUserId}`
          )
        }
      }
    }
  }

  private async _verifySignedMessageProof(
    proof: ZkConnectProof
  ): Promise<string> {
    switch (proof.provingScheme) {
      case ProvingScheme.HYDRA_S2:
        return this.hydraS2Verifier.verifySignedMessageProof({
          proof,
        })
      default:
        throw new Error(
          `proof proving scheme "${proof.provingScheme}" not supported in this version`
        )
    }
  }

  private async _verifyAuthProof(proof: ZkConnectProof): Promise<VerifiedAuth> {
    switch (proof.provingScheme) {
      case ProvingScheme.HYDRA_S2:
        return this.hydraS2Verifier.verifyAuthProof({
          proof,
        })
      default:
        throw new Error(
          `proof proving scheme "${proof.provingScheme}" not supported in this version`
        )
    }
  }

  private async _verifyClaimProof(
    appId: string,
    namespace: string,
    proof: ZkConnectProof
  ): Promise<VerifiedClaim> {
    switch (proof.provingScheme) {
      case ProvingScheme.HYDRA_S2:
        return await this.hydraS2Verifier.verifyClaimProof({
          appId,
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
