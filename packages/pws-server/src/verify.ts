import { HydraS1Verifier, keccak256 } from "@sismo-core/hydra-s1";
import { AVAILABLE_ROOTS_REGISTRY_ADDRESS, COMMITMENT_MAPPER_REGISTRY_ADDRESS, VERSION } from "./constants";
import { AvailableRootsRegistryContract, CommitmentMapperRegistryContract } from "./contracts";
import { Claim, Proof, Request, VerifiedClaim } from "./types";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "ethers";
import { getWeb3Provider } from "./contracts/web3-providers";

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

export type VerifierParams = {
    appId: string;
}

export type VerifierOpts = {
    signerOrProvider: Signer | Provider,
    commitmentMapperRegistryAddress: string,
    availableRootsRegistryAddress: string
}

export class PwsVerifier {
    private commitmentMapperRegistry: CommitmentMapperRegistryContract;
    private availableRootsRegistry: AvailableRootsRegistryContract;
    public appId: string;

    constructor({ appId }: VerifierParams, opts?: VerifierOpts) {
        this.appId = appId;
        //By default use public gnosis provider
        const signerOrProvider = opts?.signerOrProvider || getWeb3Provider(); 
        this.commitmentMapperRegistry = new CommitmentMapperRegistryContract({ 
            address: opts?.commitmentMapperRegistryAddress || COMMITMENT_MAPPER_REGISTRY_ADDRESS,
            signerOrProvider
        });
        this.availableRootsRegistry = new AvailableRootsRegistryContract({
            address: opts?.commitmentMapperRegistryAddress || AVAILABLE_ROOTS_REGISTRY_ADDRESS,
            signerOrProvider
        });
    }

    async verify (request: Request, { proofs, claims }: VerifyParams): Promise<VerifiedClaim[]> {
       const { 
            claim, 
            proof,
            snarkProof,
            proofPublicInputs
       } = this.sanitize(request, claims, proofs);

        if (proof.version !== VERSION) throw new Error(`version of the proof (${proof.version}) not compatible with this verifier`);
        if (claim.appId !== this.appId) throw new Error(`appId mismatch`);

        //Check that the public input of the proof matches the claim
        this.validateInput(proofPublicInputs, claim);

        //Check the request
        this.validateRequest(request, claim);

        //Check the validity of the proof
        const isValid = await HydraS1Verifier.verifyProof(snarkProof.a, snarkProof.b, snarkProof.c, snarkProof.input);
        if (!isValid) throw new Error("proof not valid");

        const verifiedClaim: VerifiedClaim = {
            appId: claim.appId,
            serviceId: claim.serviceId,
            value: claim.value,
            isStrict: claim.isStrict,
            groupId: claim.groupId,
            groupTimestamp: claim.groupTimestamp,
            proofId: proofPublicInputs.nullifier
        };

        return [verifiedClaim];
    }

    private sanitize(request: Request, claims: Claim[], proofs: Proof[]) {
        if (claims.length > 1) {
            throw new Error("current version of the package does not support more than one claim");
        }
        if (proofs.length > 1) {
            throw new Error("current version of the package does not support more than one proof");
        }

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
        if (request.groupId !== claim.groupId) {
            throw new Error("request groupId mismatch");
        }
        if (request.value == "MAX" && claim.isStrict !== "1") {
            throw new Error("request isStrict mismatch");
        }
    }

    private async validateInput(proofPublicInputs: ProofPublicInputs, claim: Claim) {
        if (proofPublicInputs.isStrict !== claim.isStrict) {
            throw new Error("claim isStrict mismatch");
        }
        if (proofPublicInputs.claimedValue !== claim.value.toString()) {
            throw new Error("claim value mismatch");
        }

        const externalNullifier =  this.encodeExternalNullifier(claim.appId, claim.groupId, claim.groupTimestamp, claim.serviceId);
        if (proofPublicInputs.externalNullifier !== externalNullifier) {
            throw new Error("claim externalNullifier mismatch");
        }

        const [commitmentMapperPubKeyX, commitmentMapperPubKeyY] = await this.commitmentMapperRegistry.getCommitmentMapperPubKey();
        if (commitmentMapperPubKeyX.toString() !== proofPublicInputs.commitmentMapperPubKeyX) {
            throw new Error("claim commitmentMapper mismatch");
        }
        if (commitmentMapperPubKeyY.toString() !== proofPublicInputs.commitmentMapperPubKeyY) {
            throw new Error("claim commitmentMapper mismatch");
        }

        if (proofPublicInputs.chainId !== "0") {
            throw new Error("claim chainId must be 0");
        }
        if (proofPublicInputs.destination !== "0x0000000000000000000000000000000000515110") {
            throw new Error("claim destination must be 0x0000000000000000000000000000000000515110");
        }

        const isAvailable = await this.availableRootsRegistry.isRootAvailable(proofPublicInputs.registryTreeRoot)
        if (!isAvailable) {
            throw new Error("registry root not available");
        }
        
        const groupSnapshotId = this.encodeGroupSnapshotId(claim.groupId, claim.groupTimestamp);
        if (proofPublicInputs.accountsTreeValue !== groupSnapshotId) {
            throw new Error("claim accountsTreeValue mismatch");
        }
    }

    private encodeGroupSnapshotId = (groupId: string, timestamp: number) => {
        return keccak256([keccak256([groupId]), timestamp]).toString()
    }

    private encodeExternalNullifier = (appId: string, groupId: string, groupTimestamp: number, serviceId: string) => {
        return keccak256([appId, groupId, groupTimestamp, serviceId]).toString();
    }
}