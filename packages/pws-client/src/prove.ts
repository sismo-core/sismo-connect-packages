import { BASE_URL, DEFAULT_SERVICE_ID, VERSION } from "./constants";
import { Claim, Proof, Request } from "./types";

export type ProveParams = {
    appId: string;
    request: Request;
    serviceId?: string;
    callbackPath?: string;
    acceptHigherValues?: boolean;
}

export type ProveOpts = {
    url?: string;
}

export const getProveUrl = (params: ProveParams, opts?: ProveOpts) => {
    let url = `${opts?.url || BASE_URL}/pws?version=${VERSION}&appId=${params.appId}&groupId=${params.request.groupId}`;
    if (typeof params.request.timestamp !== 'undefined') {
        url += `&timestamp=${params.request.timestamp}`
    } else {
        url += `&timestamp=latest`
    }
    if (typeof params.request.value !== 'undefined') {
        url += `&value=${params.request.value}`
    } else {
        url += `&value=MAX`
    }
    if (typeof params.callbackPath !== 'undefined') {
        url += `&callbackPath=${params.callbackPath}`
    }
    url += `&serviceId=${params.serviceId || DEFAULT_SERVICE_ID}`
    url += `&acceptHigherValues=${Boolean(params.acceptHigherValues)}`
    return url;
}

export const prove = (params: ProveParams, opts?: ProveOpts): void => {
    if (!window) throw new Error(`prove is not available outside of a browser`);
    const url = getProveUrl(params, opts);
    window.location.href = url;
}

export type Response = {
    proofs: Proof[];
    claims: Claim[];
}

export const getResponse = (): Response | null => {
    if (!window) throw new Error(`getProof is not available outside of a browser`);
    const url = new URL(window.location.href);
    if (url.searchParams.has("proof") && url.searchParams.has("claims")) {
        const proofs = JSON.parse(url.searchParams.get("proofs") as string);
        const claims = JSON.parse(url.searchParams.get("claims") as string);
        return {
            proofs,
            claims
        }
    }   
    return null;
}