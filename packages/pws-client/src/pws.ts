import { BASE_URL, DEFAULT_SERVICE_NAME, VERSION } from "./constants";
import { PwsProof, TargetComposedGroup, TargetGroup } from "./types";

export type PwsParams = {
    appId: string;
}

export type PwsProofRequestParams = {
    appId: string;
    serviceName: string;
    targetGroup: TargetGroup | TargetComposedGroup;
    callbackPath?: string;
}

export type PwsProofRequestOpts = {
    url?: string;
}

export class Pws {
    private appId: string;

    constructor(params: PwsParams) {
        this.appId = params.appId;
    }

    public requestProof = (params: PwsProofRequestParams, opts?: PwsProofRequestOpts)  => {
        if (!window) throw new Error(`requestProof is not available outside of a browser`);

        let url = `${opts?.url || BASE_URL}/pws?version=${VERSION}&appId=${this.appId}`;

        url += `&serviceName=${params.serviceName || DEFAULT_SERVICE_NAME}`

        if ((params.targetGroup as TargetGroup).groupId) {
            let targetGroup: TargetGroup = (params.targetGroup as TargetGroup);

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

        if (typeof params.callbackPath !== 'undefined') {
            url += `&callbackPath=${params.callbackPath}`
        }

        window.location.href = url;
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