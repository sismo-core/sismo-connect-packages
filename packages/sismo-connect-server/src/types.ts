import { AuthRequest, ClaimRequest, SignatureRequest } from './common-types'
import { SismoConnectProvider } from './verifier/libs/onchain-provider'

export type VerifyParamsSismoConnect = {
  claims?: ClaimRequest[]
  auths?: AuthRequest[]
  signature?: SignatureRequest
  namespace?: string
}

export const SISMO_SERVER_COMPATIBLE_VERSIONS = ['sismo-connect-v1.1']

export type SismoConnectServerOptions = {
  provider?: SismoConnectProvider
  verifier?: {
    hydraS3?: {
      registryRoot?: string
      commitmentMapperPubKeys?: [string, string]
      commitmentMapperRegistryAddress?: string
      availableRootsRegistryAddress?: string
    }
  }
}
