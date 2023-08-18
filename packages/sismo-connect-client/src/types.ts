import { AuthRequest, ClaimRequest, SignatureRequest } from "@sismo-core/sismo-connect-common";

export type RequestParams = {
  claims?: ClaimRequest[];
  claim?: ClaimRequest;
  auths?: AuthRequest[];
  auth?: AuthRequest;
  signature?: SignatureRequest;
  namespace?: string;
  callbackPath?: string;
  callbackUrl?: string;
};
