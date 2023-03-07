import { ZkConnectResponse, PwsReceipt, TargetComposedGroup, TargetGroup } from "./types";
import { Provider } from "@ethersproject/abstract-provider";
import { Verifier, VerifierOpts } from "./verifier";
import { ethers } from "ethers";

export type PwsParams = {
    appId: string;
    opts?: {
        provider?: Provider,
        verifier?: VerifierOpts
    }
}

export type VerifyParams = {
    proof: ZkConnectResponse,
    targetGroup: TargetGroup | TargetComposedGroup,
    serviceName?: string,
}

export const PWS_VERSION = `off-chain-1`;

export class Pws {
    private _appId: string;
    private _verifier: Verifier;

    constructor({ appId, opts }: PwsParams) {
        this._appId = appId;

        //By default use public gnosis provider
        const provider = opts?.provider || new ethers.providers.JsonRpcProvider(
            "https://rpc.gnosis.gateway.fm",
            100
        );
        
        this._verifier = new Verifier(provider, opts?.verifier);
    }

    public verify = async ({ proof, targetGroup, serviceName }: VerifyParams): Promise<PwsReceipt>  => {
        if ((targetGroup as TargetComposedGroup).operator) {
            throw new Error(`TargetComposedGroup is not already available in this version. Please notify us if you need it.`);
        }
        targetGroup = targetGroup as TargetGroup

        if (typeof targetGroup.timestamp  === 'undefined') targetGroup.timestamp = 'latest';
        if (typeof targetGroup.value  === 'undefined') targetGroup.value = 1;
        if (typeof serviceName  === 'undefined') serviceName = 'main';

        if (proof.version !== PWS_VERSION) {
            throw new Error(`version of the proof "${proof.version}" not compatible with this version "${PWS_VERSION}"`);
        }
        if (proof.appId !== this._appId) {
            throw new Error(`proof appId "${proof.appId}" does not match with server appId "${this._appId}"`);
        }
        if (proof.serviceName !== serviceName) {
            throw new Error(`proof serviceName "${proof.serviceName}" does not match with server serverName "${serviceName}"`);
        }

        return this._verifier.verify(proof, targetGroup);
    }
}