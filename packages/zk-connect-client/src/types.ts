import { BigNumberish } from '@ethersproject/bignumber';
import { ZkConnectRequestContent } from "./common-types";

export type RequestParams = {
  requestContent: ZkConnectRequestContent;
  namespace?: string;
  callbackPath?: string;
};

export type ZkConnectClientConfig = {
  appId: string,
  devMode?: {
    enabled?: boolean, // will use the Dev Sismo Data Vault https://dev.vault-beta.sismo.io/
    devAddresses?: string[] | Record<string, Number | BigNumberish> // Will insert this addresses in data groups 
  },
  vaultAppBaseUrl?: string
  sismoApiUrl?: string
}