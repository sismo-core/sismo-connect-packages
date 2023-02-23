import { PwsProof, PwsReceipt, TargetComposedGroup, TargetGroup } from "./types";
import { Verifier } from "./verifier";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "ethers";

export type PwsParams = {
    appId: string;
}

export type VerifyParams = {
    proof: PwsProof,
    targetGroup: TargetGroup | TargetComposedGroup,
    serviceName: string,
}

export type PwsOpts = {
    verifier?: {
        hydraS1?: {
            signerOrProvider?: Signer | Provider,
            commitmentMapperRegistryAddress?: string,
            availableRootsRegistryAddress?: string,
            attesterAddress?: string
        }
    }
}

export const PWS_VERSION = `off-chain-1`;

export class Pws {
    private appId: string;
    private verifier: Verifier;

    constructor(params: PwsParams, opts?: PwsOpts) {
        const { appId } = params;
        this.appId = appId;
        this.verifier = new Verifier(opts?.verifier);
    }

    public verify = async (params: VerifyParams): Promise<PwsReceipt>  => {
        const { proof, serviceName, targetGroup } = this.sanitize(params);

        if (proof.version !== PWS_VERSION) {
            throw new Error(`version of the proof "${proof.version}" not compatible with this version "${PWS_VERSION}"`);
        }
        if (proof.appId !== this.appId) {
            throw new Error(`proof appId "${proof.appId}" does not match with server appId "${this.appId}"`);
        }
        if (proof.serviceName !== serviceName) {
            throw new Error(`proof serviceName "${proof.serviceName}" does not match with server serverName "${serviceName}"`);
        }

        return await this.verifier.verify(proof, targetGroup);
    }

    private sanitize = (params: VerifyParams): { proof: PwsProof, serviceName: string, targetGroup: TargetGroup } => {
        let { proof, serviceName, targetGroup } = params;

        if ((targetGroup as TargetComposedGroup).operator) {
            throw new Error(`TargetComposedGroup is not already available in this version. Please notify us if you need it.`);
        }
        targetGroup = targetGroup as TargetGroup

        if (typeof targetGroup.additionalProperties.acceptHigherValue === 'undefined') {
            targetGroup.additionalProperties.acceptHigherValue = true;
        }

        if (typeof targetGroup.timestamp  === 'undefined') targetGroup.timestamp = 'latest';
        if (typeof targetGroup.value  === 'undefined') targetGroup.value = 1;
        return { proof, serviceName, targetGroup };
    }
}