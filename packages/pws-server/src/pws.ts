import { PwsProof, PwsReceipt, TargetComposedGroup, TargetGroup } from "./types";
import { Verifier, VerifierOpts } from "./verifier";

export type PwsParams = {
    appId: string;
    opts?: {
        verifier?: VerifierOpts
    }
}

export type VerifyParams = {
    proof: PwsProof,
    targetGroup: TargetGroup | TargetComposedGroup,
    serviceName?: string,
}

export const PWS_VERSION = `off-chain-1`;

export class Pws {
    private _appId: string;
    private _verifier: Verifier;

    constructor(params: PwsParams) {
        const { appId } = params;
        this._appId = appId;
        this._verifier = new Verifier(params?.opts?.verifier);
    }

    public verify = async (params: VerifyParams): Promise<PwsReceipt>  => {
        const { proof, serviceName, targetGroup } = this.sanitize(params);

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

    private sanitize = (params: VerifyParams): { proof: PwsProof, serviceName: string, targetGroup: TargetGroup } => {
        let { proof, serviceName, targetGroup } = params;

        if ((targetGroup as TargetComposedGroup).operator) {
            throw new Error(`TargetComposedGroup is not already available in this version. Please notify us if you need it.`);
        }
        targetGroup = targetGroup as TargetGroup

        if (typeof targetGroup.timestamp  === 'undefined') targetGroup.timestamp = 'latest';
        if (typeof targetGroup.value  === 'undefined') targetGroup.value = 1;
        if (typeof serviceName  === 'undefined') serviceName = 'main';
        
        return { proof, serviceName, targetGroup };
    }
}