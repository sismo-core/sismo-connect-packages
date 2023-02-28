import { DEFAULT_BASE_URL, VERSION } from "./constants";
import { PwsProof, TargetComposedGroup, TargetGroup } from "./types";

export type PwsParams = {
    appId: string;
    opts?: {
        vaultAppBaseUrl?: string;
    }
}

export type RequestProofParams = {
    targetGroup: TargetGroup | TargetComposedGroup;
    serviceName?: string;
    callbackPath?: string;
}

export class Pws {
    private _appId: string;
    private _vaultAppBaseUrl: string;

    constructor({ appId, opts }: PwsParams) {
        this._appId = appId;
        this._vaultAppBaseUrl = opts?.vaultAppBaseUrl || DEFAULT_BASE_URL;
    }

    public requestProof = ({ targetGroup, serviceName, callbackPath }: RequestProofParams)  => {
        if (!window) throw new Error(`requestProof is not available outside of a browser`);

        let url = `${this._vaultAppBaseUrl}/pws?version=${VERSION}&appId=${this._appId}`;
        if ((targetGroup as TargetGroup).groupId) {
            targetGroup = (targetGroup as TargetGroup);
            if (typeof targetGroup.timestamp === 'undefined') {
                targetGroup.timestamp = `latest`;
            }
            if (typeof targetGroup.value === 'undefined') {
                targetGroup.value = 1;
            } 
            url += `&targetGroup=${JSON.stringify(targetGroup)}`;
        } else {
            throw new Error(`TargetComposedGroup is not already available in this version. Please notify us if you need it.`);
        }
        if (typeof callbackPath !== 'undefined') {
            url += `&callbackPath=${callbackPath}`;
        }
        if (typeof serviceName !== 'undefined') {
            url += `&serviceName=${serviceName}`;
        }

        window.location.href = encodeURI(url);
    }

    public getRequestedProof = (): PwsProof | null => {
        if (!window) throw new Error(`getRequestedProof is not available outside of a browser`);
        const url = new URL(window.location.href);
        if (url.searchParams.has("pwsProof")) {
            return JSON.parse(url.searchParams.get("pwsProof") as string) as PwsProof;
        }   
        return null;
    }
}