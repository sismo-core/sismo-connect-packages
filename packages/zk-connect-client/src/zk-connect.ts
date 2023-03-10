import { RequestParams, ZkConnectParams } from "./types";
import { ZkConnectResponse } from "./common-types";

import { DEFAULT_BASE_URL, VERSION } from "./constants";

export class ZkConnect {
  private _appId: string;
  private _vaultAppBaseUrl: string;
  private _isDevMode: boolean;

  constructor({ appId, opts }: ZkConnectParams) {
    this._appId = appId;
    this._vaultAppBaseUrl = opts?.vaultAppBaseUrl || DEFAULT_BASE_URL;
    this._isDevMode = opts?.isDevMode ?? false;
    if (this._isDevMode) {
      console.warn(
        "zkConnect launch in DevMode! Never use this mode in production!"
      );
    }
  }

  public request = ({
    dataRequest,
    namespace,
    callbackPath,
  }: RequestParams = {}) => {
    if (!window)
      throw new Error(`requestProof is not available outside of a browser`);

    let url = `${this._vaultAppBaseUrl}/connect?version=${VERSION}&appId=${this._appId}`;

    if (dataRequest) {
      for (const statementRequest of dataRequest.statementRequests) {
        const devModeOverrideEligibleGroupData =
          statementRequest.extraData?.devModeOverrideEligibleGroupData;
        if (devModeOverrideEligibleGroupData) {
          if (!this._isDevMode) {
            console.error(`
devModeOverrideEligibleGroupData can only be used in DevMode!

Use this option to enable it: 

const zkConnect = new ZkConnect({
    appId: YOUR_APP_ID,
    opts: {
      isDevMode: true, // <<--------  Here
    }
});
`);
            return;
          }
          console.info(
            `Eligible group data for groupId ${statementRequest.groupId} is overridden with:`,
            devModeOverrideEligibleGroupData
          );
        }
      }
      url += `&dataRequest=${JSON.stringify(dataRequest)}`;
    }

    if (callbackPath) {
      url += `&callbackPath=${callbackPath}`;
    }
    url += `&namespace=${namespace ?? "main"}`;

    window.location.href = encodeURI(url);
  };

  public getResponse = (): ZkConnectResponse | null => {
    if (!window)
      throw new Error(`getResponse is not available outside of a browser`);
    const url = new URL(window.location.href);
    if (url.searchParams.has("zkConnectResponse")) {
      return JSON.parse(
        url.searchParams.get("zkConnectResponse") as string
      ) as ZkConnectResponse;
    }
    return null;
  };
}
