import { BigNumberish } from '@ethersproject/bignumber';
import { SupportedEnvs } from "./api/types";
import { DataRequest, DataRequestType } from "./common-types";

export type ZkConnectParams = {
  appId: string;
  opts?: {
    isDevMode?: boolean;
    vaultAppBaseUrl?: string;
    env?: SupportedEnvs;
  };
};

export type RequestParams = {
  dataRequest?: DataRequestType;
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
  env?: SupportedEnvs
}