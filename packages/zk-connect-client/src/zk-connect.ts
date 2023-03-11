import { RequestParams, ZkConnectClientConfig } from "./types";
import { ZkConnectResponse } from "./common-types";
import { Sdk, GroupParams } from "./sdk";

import { DEV_VAULT_APP_BASE_URL, PROD_VAULT_APP_BASE_URL, VERSION } from "./constants";
import { BigNumberish } from "@ethersproject/bignumber";

export const ZkConnect = (config: ZkConnectClientConfig): ZkConnectClient => {
  return new ZkConnectClient(config);
};

export class ZkConnectClient {
  private _appId: string;
  private _vaultAppBaseUrl: string;
  private _devModeEnabled: boolean;
  private _devAddresses: Record<string, Number | BigNumberish> | null;
  private _sdk: Sdk;

  constructor({ appId, devMode, vaultAppBaseUrl, env }: ZkConnectClientConfig) {
    this._appId = appId;
    this._devModeEnabled = devMode?.enabled ?? false;
    this._vaultAppBaseUrl =
      vaultAppBaseUrl ?? (this._devModeEnabled ? DEV_VAULT_APP_BASE_URL : PROD_VAULT_APP_BASE_URL);
    if (this._devModeEnabled) {
      console.warn("zkConnect launch in DevMode! Never use this mode in production!");
    }
    if (devMode?.devAddresses) {
      console.warn(
        `These Eligibles addresses will be used in data groups. Never use this in production!`
      );
      if (Array.isArray(devMode.devAddresses)) {
        this._devAddresses = devMode.devAddresses.reduce((acc, address) => {
          acc[address] = 1;
          return acc;
        }, {});
      } else if (typeof devMode.devAddresses === "object") {
        this._devAddresses = devMode.devAddresses;
      } else {
        throw new Error(`devAddresses must be of type Record<string, Number | BigNumberish>`);
      }
    }
    this._sdk = new Sdk(env ?? "prod");
  }

  public request = ({ dataRequest, namespace, callbackPath }: RequestParams = {}) => {
    if (!window) throw new Error(`requestProof is not available outside of a browser`);

    let url = `${this._vaultAppBaseUrl}/connect?version=${VERSION}&appId=${this._appId}`;

    if (dataRequest) {
      const statementRequestsWithDevAddresses = dataRequest.statementRequests.map(
        (statementRequest) => {
          if (this._devAddresses) {
            console.info(
              `Eligible group data for groupId ${statementRequest.groupId} is overridden with:`,
              this._devAddresses
            );
            statementRequest.extraData = {
              ...statementRequest.extraData,
              devAddresses: this._devAddresses,
            };
          }
          return statementRequest;
        }
      );
      url += `&dataRequest=${JSON.stringify({
        ...dataRequest,
        statementRequests: statementRequestsWithDevAddresses,
      })}`;
    }

    if (callbackPath) {
      url += `&callbackPath=${callbackPath}`;
    }
    url += `&namespace=${namespace ?? "main"}`;

    window.location.href = encodeURI(url);
  };

  public getResponse = (): ZkConnectResponse | null => {
    if (!window) throw new Error(`getResponse is not available outside of a browser`);
    const url = new URL(window.location.href);
    if (url.searchParams.has("zkConnectResponse")) {
      return JSON.parse(url.searchParams.get("zkConnectResponse") as string) as ZkConnectResponse;
    }
    return null;
  };

  public async getGroup({ id, name, timestamp }: GroupParams) {
    return this._sdk.getGroup({ id, name, timestamp });
  }
}
