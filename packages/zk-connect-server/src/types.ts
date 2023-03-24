import { VerifierOpts } from "./verifier";
import { ZkConnectRequestContent } from "./common-types";
import { Provider } from "@ethersproject/abstract-provider";

export type VerifyParamsZkConnect = {
  requestContent?: ZkConnectRequestContent;
  namespace?: string;
};

//////////////////

export type ZkConnectServerConfig = {
  appId: string,
  devMode?: {
    enabled?: boolean
  },
  options?: {
    provider?: Provider;
    verifier?: VerifierOpts;
  }
};