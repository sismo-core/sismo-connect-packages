import { DEFAULT_BASE_URL, VERSION } from "./constants";
import { DataRequest, ZkConnectResponse } from "./types";

export type ZkConnectParams = {
    appId: string;
    opts?: {
        vaultAppBaseUrl?: string;
    }
}

export type RequestParams = {
    dataRequest?: DataRequest;
    namespace?: string;
    callbackPath?: string;
}

export class ZkConnect {
    private _appId: string;
    private _vaultAppBaseUrl: string;

    constructor({ appId, opts }: ZkConnectParams) {
        this._appId = appId;
        this._vaultAppBaseUrl = opts?.vaultAppBaseUrl || DEFAULT_BASE_URL;
    }

    public request = ({ dataRequest, namespace, callbackPath }: RequestParams)  => {
        if (!window) throw new Error(`requestProof is not available outside of a browser`);

        let url = `${this._vaultAppBaseUrl}/connect?version=${VERSION}&appId=${this._appId}`;

        if(dataRequest) {
            url += `&dataRequest=${JSON.stringify(dataRequest)}`;
        }

        if (callbackPath) {
            url += `&callbackPath=${callbackPath}`;
        }
        url += `&namespace=${ namespace ?? 'main'}`;

        window.location.href = encodeURI(url);
    }

    public getResponse = (): ZkConnectResponse | null => {
        if (!window) throw new Error(`getResponse is not available outside of a browser`);
        const url = new URL(window.location.href);
        if (url.searchParams.has("zkConnectResponse")) {
            return JSON.parse(url.searchParams.get("zkConnectResponse") as string) as ZkConnectResponse;
        }   
        return null;
    }
}