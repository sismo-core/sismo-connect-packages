import { HydraS1Verifier, SNARK_FIELD } from "@sismo-core/hydra-s1";
import { 
    GNOSIS_AVAILABLE_ROOTS_REGISTRY_ADDRESS, 
    GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS, 
    GNOSIS_HYDRAS1_OFFCHAIN_ATTESTER_ADDRESS, 
    VERSION 
} from "./constants";
import { AvailableRootsRegistryContract, CommitmentMapperRegistryContract } from "./libs/contracts";
import { Claim, Proof, Request, VerifiedClaim } from "./types";
import { Provider } from "@ethersproject/abstract-provider";
import { ethers, Signer } from "ethers";
import { getWeb3Provider } from "./libs/web3-providers";
import { BigNumber } from "@ethersproject/bignumber";

export type VerifyParams = {
    proofs: Proof[];
    claims: Claim[];
    serviceName?: string;
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

    async verify (request: Request, { proofs, claims }: VerifyParams): Promise<VerifiedClaim[]> {
       const { 
            claim, 
            proof,
            snarkProof,
            proofPublicInputs
       } = this.sanitize(request, claims, proofs);

        if (proof.version !== VERSION) throw new Error(`version of the proof "${proof.version}" not compatible with this verifier "${VERSION}"`);
        if (claim.appId !== this.appId) throw new Error(`claim appId "${claim.appId}" mismatch with verifier appId "${this.appId}"`);

        //Check that the public input of the proof matches the claim
        await this.validateInput(proofPublicInputs, claim);

        //Check the request
        this.validateRequest(request, claim);

        //Check the validity of the proof
        const isValid = await HydraS1Verifier.verifyProof(snarkProof.a, snarkProof.b, snarkProof.c, snarkProof.input);
        if (!isValid) throw new Error("proof not valid");

        const verifiedClaim: VerifiedClaim = {
            appId: claim.appId,
            serviceName: claim.serviceName,
            value: claim.value,
            isStrict: claim.isStrict,
            groupId: claim.groupId,
            timestamp: claim.timestamp,
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
        if (typeof request.acceptHigherValue === 'undefined') request.acceptHigherValue = true;

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
        if (request.value === "MAX" && claim.isStrict === false) {
            throw new Error(`request value "MAX" mismatch with claim isStrict "false"`);
        }
        if (request.acceptHigherValue === false && request.value !== "MAX" && request.value !== claim.value) {
            throw new Error(`with acceptHigherValue "false" request value ${request.value} must be equal to claim value ${claim.value}`);
        }
    }

    private async validateInput(proofPublicInputs: ProofPublicInputs, claim: Claim) {
        const isStrict = proofPublicInputs.isStrict === "0" ? false : true
        if (isStrict !== claim.isStrict) {
            throw new Error(`claim isStrict "${claim.isStrict}" mismatch with proof input isStrict "${isStrict}"`);
        }

        if (proofPublicInputs.claimedValue !== claim.value.toString()) {
            throw new Error(`claim value "${claim.value}" mismatch with proof input claimedValue "${proofPublicInputs.claimedValue}"`);
        }

        // const externalNullifier = this.encodeExternalNullifier(claim.appId, claim.groupId, claim.timestamp, claim.serviceName);
        // if (proofPublicInputs.externalNullifier !== externalNullifier) {
        //     throw new Error("claim externalNullifier mismatch");
        // }

        const [commitmentMapperPubKeyX, commitmentMapperPubKeyY] = await this.getCommitmentMapperPubKey();
        if (commitmentMapperPubKeyX.toString() !== proofPublicInputs.commitmentMapperPubKeyX) {
            throw new Error(`commitmentMapperPubKeyX "${commitmentMapperPubKeyX}" mismatch with proof input commitmentMapperPubKeyX "${proofPublicInputs.commitmentMapperPubKeyX}"`);
        }
        if (commitmentMapperPubKeyY.toString() !== proofPublicInputs.commitmentMapperPubKeyY) {
            throw new Error(`commitmentMapperPubKeyY "${commitmentMapperPubKeyY}" mismatch with proof input commitmentMapperPubKeyY "${proofPublicInputs.commitmentMapperPubKeyY}"`);
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
        
        // const groupSnapshotId = this.encodeTreeValue(claim.groupId, claim.timestamp);
        // if (proofPublicInputs.accountsTreeValue !== groupSnapshotId) {
        //     throw new Error("claim accountsTreeValue mismatch");
        // }
    }

    protected getCommitmentMapperPubKey = async () => {
        return await this.commitmentMapperRegistry.getCommitmentMapperPubKey();
    }

    protected isRootAvailableForAttester = async (attesterAddress: string, registryTreeRoot: string) => {
        return await this.availableRootsRegistry.isRootAvailableForAttester(attesterAddress, registryTreeRoot);
    }

    public encodeTreeValue = (
        groupId: string,
        timestamp: number | "latest"
      ) => {
        const encodedGroupId = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(groupId)
        );
      
        const encodedTimestamp =
          timestamp === "latest"
            ? ethers.utils.formatBytes32String("latest")
            : BigNumber.from(timestamp);
        
        const accountsTreeValue = BigNumber.from(
          ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["bytes32", "bytes32"],
              [encodedGroupId, encodedTimestamp]
            )
          )
        )
          .mod(SNARK_FIELD)
          .toHexString();
        return accountsTreeValue;
      };

    public encodeExternalNullifier = (
        appId: string,
        groupId: string,
        timestamp: number | "latest",
        serviceName: string,
      ) => {
        const encodedAppId = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(appId)
        );

        
        const encodedGroupId = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(groupId)
        );
      
        const encodedTimestamp =
          timestamp === "latest"
            ? ethers.utils.formatBytes32String("latest")
            : BigNumber.from(timestamp);
      
        const encodedServiceName = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(serviceName)
        );

        const externalNullifier = BigNumber.from(
          ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["bytes32", "bytes32", "bytes32", "bytes32"],
              [encodedAppId, encodedGroupId, encodedTimestamp, encodedServiceName]
            )
          )
        )
          .mod(SNARK_FIELD)
          .toHexString();
      
        return externalNullifier;
    };
}