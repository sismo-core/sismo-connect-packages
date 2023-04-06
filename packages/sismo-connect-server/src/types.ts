import { VerifierOpts } from './verifier'
import { AuthRequest, ClaimRequest, SignatureRequest } from './common-types'
import { Provider } from '@ethersproject/abstract-provider'

export type VerifyParamsSismoConnect = {
  claims?: ClaimRequest[]
  auths?: AuthRequest[]
  signature?: SignatureRequest;
  namespace?: string
}

//////////////////

export type SismoConnectServerConfig = {
  appId: string
  devMode?: {
    enabled?: boolean
  }
  options?: {
    provider?: Provider
    verifier?: VerifierOpts
  }
}
