import { HydraS1Verifier as HydraS1VerifierPS } from "@sismo-core/hydra-s1";
import { 
    GNOSIS_AVAILABLE_ROOTS_REGISTRY_ADDRESS, 
    GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS
} from "../constants";
import { AvailableRootsRegistryContract, CommitmentMapperRegistryContract } from "./libs/contracts";
import { Membership, TargetGroup } from "../types";
import { Provider } from "@ethersproject/abstract-provider";
import { BigNumber } from "@ethersproject/bignumber";
import { encodeRequestIdentifier } from "./utils/encodeRequestIdentifier";
import { encodeAccountsTreeValue } from "./utils/encodeAccountsTreeValue";
import { BaseVerifier, VerifyParams } from "./base-verifier";

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

export type HydraS1VerifierOpts = {
    provider?: Provider,
    commitmentMapperRegistryAddress?: string,
    availableRootsRegistryAddress?: string
}

export type SnarkProof = {
    a: string[], 
    b: string[][], 
    c: string[], 
    input: string[]
}

export const HYDRAS1_VERIFIER_VERSION = "1.0.7";


export class HydraS1Verifier extends BaseVerifier {
    private _commitmentMapperRegistry: CommitmentMapperRegistryContract;
    private _availableRootsRegistry: AvailableRootsRegistryContract;

    constructor(provider: Provider, opts?: HydraS1VerifierOpts) {
        super();

        this._commitmentMapperRegistry = new CommitmentMapperRegistryContract({ 
            address: opts?.commitmentMapperRegistryAddress || GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS,
            provider
        });
        this._availableRootsRegistry = new AvailableRootsRegistryContract({
            address: opts?.availableRootsRegistryAddress || GNOSIS_AVAILABLE_ROOTS_REGISTRY_ADDRESS,
            provider
        });
    }

    async verify ({ appId, serviceName, membership, targetGroup }: VerifyParams): Promise<boolean> {
        if (typeof targetGroup.additionalProperties === 'undefined') targetGroup.additionalProperties = {};
        if (typeof targetGroup.additionalProperties.acceptHigherValue === 'undefined') targetGroup.additionalProperties.acceptHigherValue = true;

        if (membership.version !== HYDRAS1_VERIFIER_VERSION) throw new Error(`on proofId "${membership.proofId}" proving scheme version "${membership.version}" must be "${HYDRAS1_VERIFIER_VERSION}"`);

        this.validateTargetGroup(membership, targetGroup);

        const snarkProof = membership.proof;
        await this.validateInput(snarkProof.input, membership, appId, serviceName, targetGroup);

        return await HydraS1VerifierPS.verifyProof(snarkProof.a, snarkProof.b, snarkProof.c, snarkProof.input);
    }

    private validateTargetGroup(membership: Membership, targetGroup: TargetGroup) {
        if (membership.groupId !== targetGroup.groupId) {
            throw new Error(`on proofId "${membership.proofId}" groupId "${membership.groupId}" mismatch with targetGroup groupId "${targetGroup.groupId}"`);
        }
        if (membership.timestamp !== targetGroup.timestamp) {
            throw new Error(`on proofId "${membership.proofId}" timestamp "${membership.timestamp}" mismatch with targetGroup timestamp "${targetGroup.timestamp}"`);
        }
        if (targetGroup.value !== 'MAX' &&  (Number(membership.value) !== Number(targetGroup.value))) {
            throw new Error(`on proofId "${membership.proofId}" value "${membership.value}" is not equal to targetGroup value "${targetGroup.value}"`);
        }
    }

    private async validateInput(input: string[], membership: Membership, appId: string, serviceName: string, targetGroup: TargetGroup) {
        // destination: input[0]
        // chainId: input[1]
        // commitmentMapperPubKeyX: input[2]
        // commitmentMapperPubKeyY: input[3]
        // registryTreeRoot: input[4]
        // externalNullifier: input[5]
        // nullifier: input[6]
        // claimedValue: input[7]
        // accountsTreeValue: input[8]
        // isStrict: input[9]

        const proofAcceptHigherValue = BigNumber.from(input[9]).eq("0");
        if (proofAcceptHigherValue !== targetGroup.additionalProperties.acceptHigherValue) {
            throw new Error(`on proofId "${membership.proofId}" acceptHigherValue "${targetGroup.additionalProperties.acceptHigherValue}" mismatch with proof input acceptHigherValue "${proofAcceptHigherValue}"`);
        }

        if (!BigNumber.from(input[7]).eq(membership.value)) {
            throw new Error(`on proofId "${membership.proofId}" value "${membership.value}" mismatch with proof input claimedValue "${input[7]}"`);
        }

        if (!BigNumber.from(input[6]).eq(membership.proofId)) {
            throw new Error(`on proofId "${membership.proofId}" invalid proof input nullifier "${input[6]}"`);
        }

        const requestIdentifier = encodeRequestIdentifier(appId, membership.groupId, membership.timestamp, serviceName);
        if (!BigNumber.from(input[5]).eq(requestIdentifier)) {
            throw new Error(`on proofId "${membership.proofId}" requestIdentifier "${BigNumber.from(requestIdentifier).toHexString()}" mismatch with proof input externalNullifier "${BigNumber.from(input[5]).toHexString()}"`);
        }

        const [commitmentMapperPubKeyX, commitmentMapperPubKeyY] = await this.getCommitmentMapperPubKey();
        if (!commitmentMapperPubKeyX.eq(input[2])) {
            throw new Error(`on proofId "${membership.proofId}" commitmentMapperPubKeyX "${BigNumber.from(commitmentMapperPubKeyX).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(input[2]).toHexString()}"`);
        }
        if (!commitmentMapperPubKeyY.eq(input[3])) {
            throw new Error(`on proofId "${membership.proofId}" commitmentMapperPubKeyY "${BigNumber.from(commitmentMapperPubKeyY).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(input[3]).toHexString()}"`);
        }

        if (!BigNumber.from(input[1]).eq("0")) {
            throw new Error(`on proofId "${membership.proofId}" proof input chainId must be 0`);
        }
        if (!BigNumber.from(input[0]).eq("0x0000000000000000000000000000000000515110")) {
            throw new Error(`on proofId "${membership.proofId}" proof input destination must be 0x0000000000000000000000000000000000515110`);
        }
        const isAvailable = await this.IsRootAvailable(input[4])
        if (!isAvailable) {
            throw new Error(`on proofId "${membership.proofId}" registry root "${BigNumber.from(input[4]).toHexString()}" not available`);
        }
        const groupSnapshotId = encodeAccountsTreeValue(membership.groupId, membership.timestamp);
        if (!BigNumber.from(input[8]).eq(groupSnapshotId)) {
            throw new Error(`on proofId "${membership.proofId}" groupId "${targetGroup.groupId}" or timestamp "${targetGroup.timestamp}" incorrect`);
        }
    }
    
    protected getCommitmentMapperPubKey = async () => {
        return this._commitmentMapperRegistry.getCommitmentMapperPubKey();
    }

    protected IsRootAvailable = async (registryTreeRoot: string) => {
        return this._availableRootsRegistry.IsRootAvailable(registryTreeRoot);
    }
}