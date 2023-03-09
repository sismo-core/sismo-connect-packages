import { HydraS1Verifier as HydraS1VerifierPS } from "@sismo-core/hydra-s1";
import {
  GNOSIS_AVAILABLE_ROOTS_REGISTRY_ADDRESS,
  GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS,
} from "../constants";
import {
  AvailableRootsRegistryContract,
  CommitmentMapperRegistryContract,
} from "./libs/contracts";
import { Provider } from "@ethersproject/abstract-provider";
import { BigNumber } from "@ethersproject/bignumber";
import { encodeRequestIdentifier } from "./utils/encodeRequestIdentifier";
import { encodeAccountsTreeValue } from "./utils/encodeAccountsTreeValue";
import { BaseVerifier, VerifyParams } from "./base-verifier";

export type ProofPublicInputs = {
  destinationIdentifier: string;
  extraData: string;
  commitmentMapperPubKeyX: string;
  commitmentMapperPubKeyY: string;
  registryTreeRoot: string;
  requestIdentifier: string;
  proofIdentifier: string;
  statementValue: string;
  accountsTreeValue: string;
  statementComparator: string;
  vaultIdentifier: string;
  vaultNamespace: string;
  sourceVerificationEnabled: string;
  destinationVerificationEnabled: string;
};

export type VerifierParams = {
  appId: string;
};

export type HydraS1VerifierOpts = {
  provider?: Provider;
  commitmentMapperRegistryAddress?: string;
  availableRootsRegistryAddress?: string;
  isDevMode?: boolean;
};

export type SnarkProof = {
  a: string[];
  b: string[][];
  c: string[];
  input: string[];
};

export const HYDRAS1_VERIFIER_VERSION = "2.0.0-beta4";

export class HydraS1Verifier extends BaseVerifier {
  private _commitmentMapperRegistry: CommitmentMapperRegistryContract;
  private _availableRootsRegistry: AvailableRootsRegistryContract;
  private _isDevMode: boolean;

  constructor(provider: Provider, opts?: HydraS1VerifierOpts) {
    super();

    this._commitmentMapperRegistry = new CommitmentMapperRegistryContract({
      address:
        opts?.commitmentMapperRegistryAddress ||
        GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS,
      provider,
    });
    this._availableRootsRegistry = new AvailableRootsRegistryContract({
      address:
        opts?.availableRootsRegistryAddress ||
        GNOSIS_AVAILABLE_ROOTS_REGISTRY_ADDRESS,
      provider,
    });
    this._isDevMode = opts.isDevMode;
  }

  async verify({
    appId,
    namespace,
    verifiableStatement,
  }: VerifyParams): Promise<boolean> {
    const snarkProof = verifiableStatement.proof;
    await this._matchPublicInput({ appId, namespace, verifiableStatement });
    return HydraS1VerifierPS.verifyProof(
      snarkProof.a,
      snarkProof.b,
      snarkProof.c,
      snarkProof.input
    );
  }

  async verifyAuthProof({
    appId,
    authProof,
  }: {
    appId: string;
    authProof: { proof: SnarkProof };
  }): Promise<{ vaultIdentifier: string }> {
    const vaultIdentifier = BigNumber.from(authProof.proof.input[10]);
    const vaultNamespace = BigNumber.from(authProof.proof.input[11]);
    if (!vaultNamespace.eq(BigNumber.from(appId))) {
      throw new Error(
        `vaultNamespace "${vaultNamespace}" mismatch with appId "${BigNumber.from(
          appId
        ).toString()}"`
      );
    }
    if (
      !(await HydraS1VerifierPS.verifyProof(
        authProof.proof.a,
        authProof.proof.b,
        authProof.proof.c,
        authProof.proof.input
      ))
    ) {
      throw new Error("Snark Proof Invalid!");
    }
    return { vaultIdentifier: vaultIdentifier.toHexString() };
  }

  private async _matchPublicInput({
    verifiableStatement,
    appId,
    namespace,
  }: Omit<VerifyParams, "dataRequest">) {
    // destinationIdentifier: string; [0]
    // extraData: string; [1]
    // commitmentMapperPubKeyX: string; [2]
    // commitmentMapperPubKeyY: string; [3]
    // registryTreeRoot: string; [4]
    // requestIdentifier: string; [5]
    // proofIdentifier: string; [6]
    // statementValue: string; [7]
    // accountsTreeValue: string; [8]
    // statementComparator: string; [9]
    // vaultIdentifier: string; [10]
    // vaultNamespace: string; [11]
    // sourceVerificationEnabled: string; [12]
    // destinationVerificationEnabled: string; [13]

    const input = verifiableStatement.proof.input;
    const proofPublicInputs: ProofPublicInputs = {
      destinationIdentifier: input[0],
      extraData: input[1],
      commitmentMapperPubKeyX: input[2],
      commitmentMapperPubKeyY: input[3],
      registryTreeRoot: input[4],
      requestIdentifier: input[5],
      proofIdentifier: input[6],
      statementValue: input[7],
      accountsTreeValue: input[8],
      statementComparator: input[9],
      vaultIdentifier: input[10],
      vaultNamespace: input[11],
      sourceVerificationEnabled: input[12],
      destinationVerificationEnabled: input[13],
    };

    const proofIdentifier = proofPublicInputs.proofIdentifier;

    const statementComparatorFromInput = BigNumber.from(
      proofPublicInputs.statementComparator
    ).eq("1");
    const statementComparatorFromVerifiableStatement =
      verifiableStatement.comparator === "EQ";
    if (
      statementComparatorFromInput !==
      statementComparatorFromVerifiableStatement
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" statement comparator "${verifiableStatement.comparator}" mismatch with proof input statementComparator "${statementComparatorFromInput}"`
      );
    }

    if (
      !BigNumber.from(proofPublicInputs.statementValue).eq(
        BigNumber.from(verifiableStatement.value)
      )
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" value "${verifiableStatement.value}" mismatch with proof input claimedValue "${proofPublicInputs.statementValue}"`
      );
    }

    const requestIdentifier = encodeRequestIdentifier(
      appId,
      verifiableStatement.groupId,
      verifiableStatement.groupTimestamp,
      namespace
    );
    if (
      !BigNumber.from(proofPublicInputs.requestIdentifier).eq(requestIdentifier)
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" requestIdentifier "${BigNumber.from(
          requestIdentifier
        ).toHexString()}" mismatch with proof input requestIdentifier "${BigNumber.from(
          proofPublicInputs.requestIdentifier
        ).toHexString()}"`
      );
    }

    const [commitmentMapperPubKeyX, commitmentMapperPubKeyY] =
      await this.getCommitmentMapperPubKey();
    if (
      !commitmentMapperPubKeyX.eq(proofPublicInputs.commitmentMapperPubKeyX)
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" commitmentMapperPubKeyX "${BigNumber.from(
          commitmentMapperPubKeyX
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(
          proofPublicInputs.commitmentMapperPubKeyX
        ).toHexString()}"`
      );
    }
    if (
      !commitmentMapperPubKeyY.eq(proofPublicInputs.commitmentMapperPubKeyY)
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" commitmentMapperPubKeyY "${BigNumber.from(
          commitmentMapperPubKeyY
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(
          proofPublicInputs.commitmentMapperPubKeyY
        ).toHexString()}"`
      );
    }

    if (!BigNumber.from(proofPublicInputs.destinationIdentifier).eq("0")) {
      throw new Error(
        `on proofId "${proofIdentifier}" proof input destination must be 0`
      );
    }

    if (
      !BigNumber.from(proofPublicInputs.destinationVerificationEnabled).eq("0")
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" proof input destinationVerificationEnabled must be 0`
      );
    }

    if (!BigNumber.from(proofPublicInputs.sourceVerificationEnabled).eq("1")) {
      throw new Error(
        `on proofId "${proofIdentifier}" proof input sourceVerificationEnabled must be 1`
      );
    }

    const isAvailable = await this.IsRootAvailable(
      proofPublicInputs.registryTreeRoot
    );

    // We don't check the root if we are in dev mode
    if (!isAvailable && !this._isDevMode) {
      throw new Error(
        `on proofId "${proofIdentifier}" registry root "${BigNumber.from(
          proofPublicInputs.registryTreeRoot
        ).toHexString()}" not available`
      );
    }

    const groupSnapshotId = encodeAccountsTreeValue(
      verifiableStatement.groupId,
      verifiableStatement.groupTimestamp
    );
    if (
      !BigNumber.from(proofPublicInputs.accountsTreeValue).eq(groupSnapshotId)
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" groupId "${verifiableStatement.groupId}" or timestamp "${verifiableStatement.groupTimestamp}" incorrect`
      );
    }

    if (proofPublicInputs.vaultNamespace !== BigNumber.from(appId).toString()) {
      throw new Error(
        `on proofId "${proofIdentifier}" vaultNamespace "${
          proofPublicInputs.vaultNamespace
        }" mismatch with appId "${BigNumber.from(appId).toString()}"`
      );
    }
  }

  protected getCommitmentMapperPubKey = async () => {
    return this._commitmentMapperRegistry.getCommitmentMapperPubKey();
  };

  protected IsRootAvailable = async (registryTreeRoot: string) => {
    return this._availableRootsRegistry.IsRootAvailable(registryTreeRoot);
  };
}
