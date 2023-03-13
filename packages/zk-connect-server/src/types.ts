import { VerifierOpts } from "./verifier";
import { DataRequestType } from "./common-types";
import { Provider } from "@ethersproject/abstract-provider";

export type VerifyParamsZkConnect = {
  dataRequest?: DataRequestType;
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