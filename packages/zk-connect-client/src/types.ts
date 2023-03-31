import { Auth, Claim, DevConfig, ZkConnectRequestContent } from './common-types'

export type RequestParams = {
  claimRequest?: Claim
  authRequest?: Auth
  messageSignatureRequest?: any
  namespace?: string
  callbackPath?: string
}

export type ZkConnectClientConfig = {
  appId: string
  devMode?: DevConfig
  vaultAppBaseUrl?: string
  sismoApiUrl?: string
}
