import { HydraS1Verifier, keccak256 } from "@sismo-core/hydra-s1";
import { VERSION } from "./constants";
import { Claim, Proof, Request, VerifiedClaim } from "./types";

export type VerifyParams = {
    proofs: Proof[];
    claims: Claim[];
    serviceId?: string;
}

export type ProofPublicInputs = {
    destination: string; 
    chainId: string;
    commitmentMapperPubKeyX: string;
    commitmentMapperPubKeyY: string;
    registryTreeRoot: string;
    externalNullifier: string;
    nullifier: string;
    claimedValue: string;
    accountsTreeValue: string;
    isStrict: string;
}

export class PwsVerifier {
    public appId: string;

    constructor({ appId }: { appId: string }) {
        this.appId = appId;
    }

    async verify (request: Request, params: VerifyParams): Promise<VerifiedClaim> {
       const { 
            claim, 
            proof,
            snarkProof,
            proofPublicInputs
       } = this.sanitize(request, params.claims, params.proofs);

        if (proof.version !== VERSION) throw new Error(`version of the proof (${proof.version}) not compatible with this verifier`);
        if (claim.appId !== this.appId) throw new Error(`appId mismatch`);

        //Check that the public input of the proof matches the claim
        this.validateInput(proofPublicInputs, claim);

        //Check the request
        this.validateRequest(request, claim);

        //check the validity of the proof
        const isValid = await HydraS1Verifier.verifyProof(snarkProof.a, snarkProof.b, snarkProof.c, snarkProof.input);
        if (!isValid) throw new Error("proof not valid");

        const verifiedClaim: VerifiedClaim = {
            appId: claim.appId,
            serviceId: claim.serviceId,
            value: claim.value,
            isStrict: claim.isStrict,
            groupSnapshotId: claim.groupSnapshotId,
            proofId: proofPublicInputs.nullifier
        };

        return verifiedClaim;
    }

    private sanitize(request: Request, claims: Claim[], proofs: Proof[]) {
        const proof = proofs[0];
        const claim = claims[0];
        const snarkProof = proof.snarkProof;

        const proofPublicInputs: ProofPublicInputs = {
            destination: snarkProof.input[0],
            chainId: snarkProof.input[1],
            commitmentMapperPubKeyX: snarkProof.input[2],
            commitmentMapperPubKeyY: snarkProof.input[3],
            registryTreeRoot: snarkProof.input[4],
            externalNullifier: snarkProof.input[5],
            nullifier: snarkProof.input[6],
            claimedValue: snarkProof.input[7],
            accountsTreeValue: snarkProof.input[8],
            isStrict: snarkProof.input[9],
        }

        if (typeof request.mode  === 'undefined') request.mode = "==";
        if (typeof request.timestamp  === 'undefined') request.timestamp = 0;
        if (request.timestamp  === 'latest') request.timestamp = 0;
        if (typeof request.value  === 'undefined') request.value = "MAX";

        return {
            claim, 
            proof,
            snarkProof,
            proofPublicInputs
        }
    }

    private async validateRequest(request: Request, claim: Claim) {
        const groupSnapshotId = this.encodeGroupSnapshotId(request.groupId, request.timestamp as number);
        if (groupSnapshotId !== claim.groupSnapshotId) {
            throw new Error("request groupId mismatch");
        }

        if (request.mode === "==" && claim.isStrict !== "1") {
            throw new Error("request isStrict mismatch");
        }
        if (request.mode !== "==" && claim.isStrict === "1") {
            throw new Error("request isStrict mismatch");
        }
        
        if (request.value == "MAX") {
            //TODO A bit weird the MAX with the mode in request
            if (claim.isStrict !== "1") {
                throw new Error("request isStrict mismatch");
            }
            if (request.mode !== "==") {
                throw new Error("request wrong input");
            }
        } else {
            request.value = request.value as number;
            switch (request.mode) {
                case '==':
                    if (request.value !== claim.value) {
                        throw new Error("request value mismatch");
                    }
                    break;
                case '>':
                    if (request.value > claim.value) {
                        throw new Error("request value mismatch");
                    }
                    break;
                case '>=':
                    if (request.value >= claim.value) {
                        throw new Error("request value mismatch");
                    }
                    break;
                case '<':
                    if (request.value < claim.value) {
                        throw new Error("request value mismatch");
                    }
                    break;
                case '<=':
                    if (request.value <= claim.value) {
                        throw new Error("request value mismatch");
                    }
                    break;
            }
        }

    }

    private async validateInput(proofPublicInputs: ProofPublicInputs, claim: Claim) {
        if (proofPublicInputs.isStrict !== claim.isStrict) {
            throw new Error("claim isStrict mismatch");
        }
        if (proofPublicInputs.claimedValue !== claim.value.toString()) {
            throw new Error("claim value mismatch");
        }

        const externalNullifier =  this.encodeExternalNullifier(claim.appId, claim.groupSnapshotId, claim.serviceId);

        if (proofPublicInputs.externalNullifier !== externalNullifier) {
            throw new Error("claim externalNullifier mismatch");
        }

        //TODO check registryTreeRoot
        //TODO check accountsTreeValue
        //Ignore destination, chainId, commitmentMapper
    }

    private encodeGroupSnapshotId = (groupId: string, timestamp: number) => {
        return keccak256([keccak256([groupId]), timestamp]).toString()
    }

    private encodeExternalNullifier = (appId: string, groupSnapshotId: string, serviceId: string) => {
        return keccak256([appId, groupSnapshotId, serviceId]).toString();
    }
}