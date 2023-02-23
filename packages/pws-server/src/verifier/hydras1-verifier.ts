import { HydraS1Verifier as HydraS1VerifierPS } from "@sismo-core/hydra-s1";
import { 
    GNOSIS_AVAILABLE_ROOTS_REGISTRY_ADDRESS, 
    GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS, 
    GNOSIS_HYDRAS1_OFFCHAIN_ATTESTER_ADDRESS
} from "../constants";
import { AvailableRootsRegistryContract, CommitmentMapperRegistryContract } from "./libs/contracts";
import { Membership, TargetGroup } from "../types";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "ethers";
import { getWeb3Provider } from "./libs/web3-providers";
import { BigNumber } from "@ethersproject/bignumber";
import { encodeRequestIdentifier } from "./utils/encodeRequestIdentifier";
import { encodeAccountsTreeValue } from "./utils/encodeAccountsTreeValue";

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

export type SnarkProof = {
    a: string[], 
    b: string[][], 
    c: string[], 
    input: string[]
}

export const HYDRAS1_VERIFIER_VERSION = "1.0.7";

export type VerifyParams = {
    membership: Membership, 
    appId: string, 
    serviceName: string, 
    targetGroup: TargetGroup
}

export class HydraS1Verifier {
    private commitmentMapperRegistry: CommitmentMapperRegistryContract;
    private availableRootsRegistry: AvailableRootsRegistryContract;
    private attesterAddress: string;

    constructor(opts?: VerifierOpts) {
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

    async verify (params: VerifyParams): Promise<boolean> {
       const { 
            appId,
            serviceName,
            membership,
            targetGroup,
            snarkProof,
            proofPublicInputs
       } = this.sanitize(params);

       if (membership.version !== HYDRAS1_VERIFIER_VERSION) throw new Error(`on proofId "${membership.proofId}" proving scheme version "${membership.version}" must be "${HYDRAS1_VERIFIER_VERSION}"`);

       this.validateTargetGroup(membership, targetGroup);

        await this.validateInput(proofPublicInputs, membership, appId, serviceName, targetGroup);

        return await HydraS1VerifierPS.verifyProof(snarkProof.a, snarkProof.b, snarkProof.c, snarkProof.input);
    }

    private sanitize(params: VerifyParams): {
        appId: string,
        serviceName: string,
        membership: Membership,
        targetGroup: TargetGroup,
        snarkProof: SnarkProof,
        proofPublicInputs: ProofPublicInputs,
    } {
        const { membership, appId, serviceName, targetGroup } = params;
        const snarkProof = membership.proof;

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

        return {
            appId,
            serviceName,
            membership,
            targetGroup,
            snarkProof,
            proofPublicInputs
        }
    }

    private validateTargetGroup(membership: Membership, targetGroup: TargetGroup) {
        if (membership.groupId !== targetGroup.groupId) {
            throw new Error(`on proofId "${membership.proofId}" groupId "${membership.groupId}" mismatch with targetGroup groupId "${targetGroup.groupId}"`);
        }
        if (membership.timestamp !== targetGroup.timestamp) {
            throw new Error(`on proofId "${membership.proofId}" timestamp "${membership.timestamp}" mismatch with targetGroup timestamp "${targetGroup.timestamp}"`);
        }
        if (membership.value < targetGroup.value) {
            throw new Error(`on proofId "${membership.proofId}" value "${membership.value}" is lower than targetGroup value "${targetGroup.value}"`);
        }
        if (!targetGroup.additionalProperties.acceptHigherValue && (membership.value > targetGroup.value)) {
            throw new Error(`on proofId "${membership.proofId}" value "${membership.value}" can't be higher than targetGroup value "${targetGroup.value}" with acceptHigherValue "false"`);
        }
    }

    private async validateInput(proofPublicInputs: ProofPublicInputs, membership: Membership, appId: string, serviceName: string, targetGroup: TargetGroup) {
        const proofAcceptHigherValue = (proofPublicInputs.isStrict === "0");
        if (proofAcceptHigherValue !== targetGroup.additionalProperties.acceptHigherValue) {
            throw new Error(`on proofId "${membership.proofId}" acceptHigherValue "${targetGroup.additionalProperties.acceptHigherValue}" mismatch with proof input acceptHigherValue "${proofAcceptHigherValue}"`);
        }

        if (proofPublicInputs.claimedValue !== membership.value.toString()) {
            throw new Error(`on proofId "${membership.proofId}" value "${membership.value}" mismatch with proof input claimedValue "${proofPublicInputs.claimedValue}"`);
        }

        if (proofPublicInputs.nullifier !== membership.proofId) {
            throw new Error(`on proofId "${membership.proofId}" invalid proof input nullifier "${proofPublicInputs.nullifier}"`);
        }

        const requestIdentifier = encodeRequestIdentifier(appId, membership.groupId, membership.timestamp, serviceName);
        if (!BigNumber.from(proofPublicInputs.externalNullifier).eq(requestIdentifier)) {
            throw new Error(`on proofId "${membership.proofId}" requestIdentifier "${BigNumber.from(requestIdentifier).toHexString()}" mismatch with proof input externalNullifier "${BigNumber.from(proofPublicInputs.externalNullifier).toHexString()}"`);
        }

        const [commitmentMapperPubKeyX, commitmentMapperPubKeyY] = await this.getCommitmentMapperPubKey();
        if (!commitmentMapperPubKeyX.eq(proofPublicInputs.commitmentMapperPubKeyX)) {
            throw new Error(`on proofId "${membership.proofId}" commitmentMapperPubKeyX "${BigNumber.from(commitmentMapperPubKeyX).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(proofPublicInputs.commitmentMapperPubKeyX).toHexString()}"`);
        }
        if (!commitmentMapperPubKeyY.eq(proofPublicInputs.commitmentMapperPubKeyY)) {
            throw new Error(`on proofId "${membership.proofId}" commitmentMapperPubKeyY "${BigNumber.from(commitmentMapperPubKeyY).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(proofPublicInputs.commitmentMapperPubKeyY).toHexString()}"`);
        }

        if (proofPublicInputs.chainId !== "0") {
            throw new Error(`on proofId "${membership.proofId}" proof input chainId must be 0`);
        }
        if (!BigNumber.from(proofPublicInputs.destination).eq("0x0000000000000000000000000000000000515110")) {
            throw new Error(`on proofId "${membership.proofId}" proof input destination must be 0x0000000000000000000000000000000000515110`);
        }
        const isAvailable = await this.isRootAvailableForAttester(this.attesterAddress, proofPublicInputs.registryTreeRoot)
        if (!isAvailable) {
            throw new Error(`on proofId "${membership.proofId}" registry root "${proofPublicInputs.registryTreeRoot}" not available for attester with address ${this.attesterAddress}`);
        }
        const groupSnapshotId = encodeAccountsTreeValue(membership.groupId, membership.timestamp);
        if (!BigNumber.from(proofPublicInputs.accountsTreeValue).eq(groupSnapshotId)) {
            throw new Error(`on proofId "${membership.proofId}" groupId "${targetGroup.groupId}" or timestamp "${targetGroup.timestamp}" incorrect`);
        }
    }

    protected getCommitmentMapperPubKey = async () => {
        return await this.commitmentMapperRegistry.getCommitmentMapperPubKey();
    }

    protected isRootAvailableForAttester = async (attesterAddress: string, registryTreeRoot: string) => {
        return await this.availableRootsRegistry.isRootAvailableForAttester(attesterAddress, registryTreeRoot);
    }
}