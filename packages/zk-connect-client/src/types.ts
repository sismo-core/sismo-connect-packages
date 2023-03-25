import { DevConfig, ZkConnectRequestContent } from "./common-types";

export type RequestParams = {
  requestContent: ZkConnectRequestContent;
  namespace?: string;
  callbackPath?: string;
};

export type ZkConnectClientConfig = {
  appId: string,
  devMode?: DevConfig,
  vaultAppBaseUrl?: string
  sismoApiUrl?: string
}