import { HydraS1Verifier } from "@sismo-core/hydra-s1";
import { 
    GNOSIS_AVAILABLE_ROOTS_REGISTRY_ADDRESS, 
    GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS, 
    GNOSIS_HYDRAS1_OFFCHAIN_ATTESTER_ADDRESS, 
    VERSION 
} from "./constants";
import { AvailableRootsRegistryContract, CommitmentMapperRegistryContract } from "./libs/contracts";
import { Claim, Proof, Request, VerifiedClaim } from "./types";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "ethers";
import { getWeb3Provider } from "./libs/web3-providers";
import { BigNumber } from "@ethersproject/bignumber";
import { encodeRequestIdentifier } from "./utils/encodeRequestIdentifier";
import { encodeAccountsTreeValue } from "./utils/encodeAccountsTreeValue";
import { encodeServiceId } from "./utils/encodeServiceId";

export type VerifyParams = {
    proofs: Proof[];
    claims: Claim[];
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
    signerOrProvider?: Signer | Provider,
    commitmentMapperRegistryAddress?: string,
    availableRootsRegistryAddress?: string,
    attesterAddress?: string
}

export class PwsVerifier {
    private commitmentMapperRegistry: CommitmentMapperRegistryContract;
    private availableRootsRegistry: AvailableRootsRegistryContract;
    private attesterAddress: string;
    public appId: string;

    constructor({ appId }: VerifierParams, opts?: VerifierOpts) {
        this.appId = appId;
        this.attesterAddress = opts?.attesterAddress || GNOSIS_HYDRAS1_OFFCHAIN_ATTESTER_ADDRESS;

        //By default use public gnosis provider
        const signerOrProvider = opts?.signerOrProvider || getWeb3Provider(); 
        this.commitmentMapperRegistry = new CommitmentMapperRegistryContract({ 
            address: opts?.commitmentMapperRegistryAddress || GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS,
            signerOrProvider
        });
        this.availableRootsRegistry = new AvailableRootsRegistryContract({
            address: opts?.commitmentMapperRegistryAddress || GNOSIS_AVAILABLE_ROOTS_REGISTRY_ADDRESS,
            signerOrProvider
        });
    }

    async verify (request: Request, params: VerifyParams): Promise<VerifiedClaim[]> {
       const { 
            claim, 
            proof,
            snarkProof,
            proofPublicInputs
       } = this.sanitize(request, params.claims, params.proofs);

        if (proof.version !== VERSION) throw new Error(`version of the proof "${proof.version}" not compatible with this verifier "${VERSION}"`);

        //Check that the public input of the proof matches the claim
        await this.validateInput(proofPublicInputs, claim, request);

        //Check the request
        this.validateRequest(request, claim);

        //Check the validity of the proof
        const isValid = await HydraS1Verifier.verifyProof(snarkProof.a, snarkProof.b, snarkProof.c, snarkProof.input);
        if (!isValid) throw new Error("proof not valid");

        const verifiedClaim: VerifiedClaim = {
            appId: request.appId,
            serviceId: encodeServiceId(request.appId, request.serviceName),
            serviceName: request.serviceName,
            value: claim.value,
            acceptHigherValue: claim.acceptHigherValue,
            groupId: claim.groupId,
            timestamp: claim.timestamp,
            proofId: proofPublicInputs.nullifier,
            groupSnapshotId: encodeAccountsTreeValue(claim.groupId, claim.timestamp),
            requestIdentifier: encodeRequestIdentifier(request.appId, request.groupId, request.timestamp, request.serviceName),
            __snarkProof: snarkProof
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

        if (typeof request.timestamp  === 'undefined') request.timestamp = 'latest';
        if (typeof request.value  === 'undefined') request.value = "MAX";
        if (typeof request.acceptHigherValue === 'undefined') request.acceptHigherValue = true;
        if (typeof request.serviceName === 'undefined') request.serviceName = "main";

        return {
            claim, 
            proof,
            snarkProof,
            proofPublicInputs
        }
    }

    private validateRequest(request: Request, claim: Claim) {
        if (request.groupId !== claim.groupId) {
            throw new Error(`request groupId "${request.groupId}" mismatch with claim groupId "${claim.groupId}"`);
        }
        if (request.acceptHigherValue !== claim.acceptHigherValue) {
            throw new Error(`request acceptHigherValue "${request.acceptHigherValue}" mismatch with claim acceptHigherValue "${claim.acceptHigherValue}"`);
        }
        if (request.appId !== this.appId) throw new Error(`request appId "${request.appId}" mismatch with verifier appId "${this.appId}"`);
      }

    private async validateInput(proofPublicInputs: ProofPublicInputs, claim: Claim, request: Request) {
        const proofAcceptHigherValue = proofPublicInputs.isStrict !== "0"
        if (proofAcceptHigherValue !== claim.acceptHigherValue) {
            throw new Error(`claim acceptHigherValue "${claim.acceptHigherValue}" mismatch with proof input acceptHigherValue "${proofAcceptHigherValue}"`);
        }

        if (proofPublicInputs.claimedValue !== claim.value.toString()) {
            throw new Error(`claim value "${claim.value}" mismatch with proof input claimedValue "${proofPublicInputs.claimedValue}"`);
        }

        const [commitmentMapperPubKeyX, commitmentMapperPubKeyY] = await this.getCommitmentMapperPubKey();
        if (!commitmentMapperPubKeyX.eq(proofPublicInputs.commitmentMapperPubKeyX)) {
            throw new Error(`commitmentMapperPubKeyX "${BigNumber.from(commitmentMapperPubKeyX).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(proofPublicInputs.commitmentMapperPubKeyX).toHexString()}"`);
        }
        if (!commitmentMapperPubKeyY.eq(proofPublicInputs.commitmentMapperPubKeyY)) {
            throw new Error(`commitmentMapperPubKeyY "${BigNumber.from(commitmentMapperPubKeyY).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(proofPublicInputs.commitmentMapperPubKeyY).toHexString()}"`);
        }

        const requestIdentifier = encodeRequestIdentifier(request.appId, request.groupId, request.timestamp, request.serviceName);
        if (!BigNumber.from(proofPublicInputs.externalNullifier).eq(requestIdentifier)) {
            throw new Error(`requestIdentifier "${BigNumber.from(requestIdentifier).toHexString()}" mismatch with proof input externalNullifier "${BigNumber.from(proofPublicInputs.externalNullifier).toHexString()}"`);
        }

        if (proofPublicInputs.chainId !== "0") {
            throw new Error(`proof input chainId must be 0`);
        }
        if (!BigNumber.from(proofPublicInputs.destination).eq("0x0000000000000000000000000000000000515110")) {
            throw new Error(`proof input destination must be 0x0000000000000000000000000000000000515110`);
        }

        const isAvailable = await this.isRootAvailableForAttester(this.attesterAddress, proofPublicInputs.registryTreeRoot)
        if (!isAvailable) {
            throw new Error(`registry root "${proofPublicInputs.registryTreeRoot}" not available for attester with address ${this.attesterAddress}`);
        }
        
        const groupSnapshotId = encodeAccountsTreeValue(claim.groupId, claim.timestamp);
        if (!BigNumber.from(proofPublicInputs.accountsTreeValue).eq(groupSnapshotId)) {
            throw new Error(`claim accountsTreeValue "${groupSnapshotId}" mismatch with proof input accountsTreeValue "${proofPublicInputs.accountsTreeValue}"`);
        }
    }

    protected getCommitmentMapperPubKey = async () => {
        return await this.commitmentMapperRegistry.getCommitmentMapperPubKey();
    }

    protected isRootAvailableForAttester = async (attesterAddress: string, registryTreeRoot: string) => {
        return await this.availableRootsRegistry.isRootAvailableForAttester(attesterAddress, registryTreeRoot);
    }
}