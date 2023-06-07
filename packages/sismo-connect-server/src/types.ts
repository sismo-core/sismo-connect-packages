import { VerifierOpts } from './verifier'
import { AuthRequest, ClaimRequest, SignatureRequest } from './common-types'
import { OnChainProvider } from './verifier/libs/onchain-provider'

export type VerifyParamsSismoConnect = {
  claims?: ClaimRequest[]
  auths?: AuthRequest[]
  signature?: SignatureRequest
  namespace?: string
}

export type SismoConnectServerOptions = {
  onChainProvider?: OnChainProvider
  verifier?: VerifierOpts
}
