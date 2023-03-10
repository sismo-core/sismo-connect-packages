import { DataRequest } from "./common-types";

export type ZkConnectParams = {
  appId: string;
  opts?: {
    isDevMode?: boolean;
    vaultAppBaseUrl?: string;
  };
};

export type RequestParams = {
  dataRequest?: DataRequest;
  namespace?: string;
  callbackPath?: string;
};
