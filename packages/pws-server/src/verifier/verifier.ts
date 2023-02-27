import { Membership, PwsProof, PwsReceipt, TargetGroup } from "../types";
import { HydraS1Verifier, HydraS1VerifierOpts } from "./hydras1-verifier";
import { Provider } from "@ethersproject/abstract-provider";

export type VerifierOpts = {
    hydraS1?: HydraS1VerifierOpts
}

export class Verifier {
    private hydraS1Verifier: HydraS1Verifier;

    constructor(provider: Provider, opts?: VerifierOpts) {
        this.hydraS1Verifier = new HydraS1Verifier(provider, opts?.hydraS1);
    }

    async verify (proof: PwsProof, targetGroup: TargetGroup): Promise<PwsReceipt> {
        const provedMemberships: Membership[] = [];

        for (let membershipProof of proof.membershipProofs) {
            let isVerified = false;
            switch(membershipProof.provingScheme) {
                case "hydraS1":
                    isVerified = await this.hydraS1Verifier.verify({
                        membership: membershipProof, 
                        appId: proof.appId, 
                        serviceName: proof.serviceName, 
                        targetGroup
                    });
                    break;
                default:
                    throw new Error(`proof proving scheme "${membershipProof.provingScheme}" not supported in this version`)
            }
            if (isVerified) provedMemberships.push(membershipProof);
        }

        const receipt: PwsReceipt = {
            proofIds: provedMemberships.map(provedMembership => provedMembership.proofId),
            provedMemberships
        }

        if (provedMemberships.length === 1) {
            receipt.proofId = provedMemberships[0].proofId;
            receipt.provedMembership = provedMemberships[0];
        }
    
        return receipt;
    }
}