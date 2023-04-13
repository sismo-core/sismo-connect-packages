import { AuthRequest, ClaimRequest, DevConfig, SignatureRequest } from './common-types'

export type RequestParams = {
  claims?: ClaimRequest[]
  claim?: ClaimRequest
  auths?: AuthRequest[]
  auth?: AuthRequest
  signature?: SignatureRequest
  namespace?: string
  callbackPath?: string
}

export type SismoConnectClientConfig = {
  appId: string
  devMode?: DevConfig
  vaultAppBaseUrl?: string
  sismoApiUrl?: string
}
