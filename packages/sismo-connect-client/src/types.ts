import { AuthRequest, ClaimRequest, SignatureRequest } from './common-types'

export type RequestParams = {
  claims?: ClaimRequest[]
  claim?: ClaimRequest
  auths?: AuthRequest[]
  auth?: AuthRequest
  signature?: SignatureRequest
  namespace?: string
  callbackPath?: string
  callbackUrl?: string
}
