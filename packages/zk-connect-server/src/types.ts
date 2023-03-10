import { VerifierOpts } from "./verifier";
import { DataRequest, ZkConnectResponse } from "./common-types";
import { Provider } from "@ethersproject/abstract-provider";

export type ZkConnectParams = {
  appId: string;
  opts?: {
    provider?: Provider;
    verifier?: VerifierOpts;
    isDevMode?: boolean;
  };
};

export type VerifyParamsZkConnect = {
  zkConnectResponse: ZkConnectResponse;
  dataRequest?: DataRequest;
  namespace?: string;
};
