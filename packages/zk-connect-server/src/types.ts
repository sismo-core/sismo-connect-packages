import { VerifierOpts } from './verifier'
import { Auth, Claim, ZkConnectRequestContent } from './common-types'
import { Provider } from '@ethersproject/abstract-provider'

export type VerifyParamsZkConnect = {
  claimRequest?: Claim
  authRequest?: Auth
  messageSignatureRequest?: any
  namespace?: string
}

//////////////////

export type ZkConnectServerConfig = {
  appId: string
  devMode?: {
    enabled?: boolean
  }
  options?: {
    provider?: Provider
    verifier?: VerifierOpts
  }
}
