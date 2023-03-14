import {
  ProvingScheme,
  VerifiedStatement,
  ZkConnectResponse,
  ZkConnectVerifiedResult,
  VerifiableStatement,
  AuthProof,
  DataRequestType,
} from "../common-types";
import { HydraS2Verifier, HydraS2VerifierOpts } from "./hydras2-verifier";
import { Provider } from "@ethersproject/abstract-provider";
import { BigNumber } from "@ethersproject/bignumber";

export type VerifierOpts = {
  hydraS2?: HydraS2VerifierOpts;
  isDevMode?: boolean;
};

export type VerifyParams = {
  zkConnectResponse: ZkConnectResponse;
  dataRequest?: DataRequestType;
  namespace?: string;
};

export class ZkConnectVerifier {
  private hydraS2Verifier: HydraS2Verifier;

  constructor(provider: Provider, opts?: VerifierOpts) {
    this.hydraS2Verifier = new HydraS2Verifier(provider, {
      ...opts?.hydraS2,
      isDevMode: opts.isDevMode,
    });
  }

  async verify({
    zkConnectResponse,
    dataRequest,
  }: VerifyParams): Promise<ZkConnectVerifiedResult> {
    const verifiedStatements: VerifiedStatement[] = [];

    if (
      zkConnectResponse.verifiableStatements.length === 0 &&
      dataRequest.statementRequests.length === 0
    ) {
      const verifiedProof = await this._verifyAuthProof(
        zkConnectResponse.appId,
        zkConnectResponse.authProof
      );
      return {
        ...zkConnectResponse,
        vaultId: verifiedProof.vaultIdentifier,
        verifiedStatements: [],
      };
    }
    if (
      zkConnectResponse.verifiableStatements.length <
      dataRequest.statementRequests.length
    ) {
      throw new Error(
        "The zkConnectResponse contains less verifiableStatements than requested statements."
      );
    }

    if (zkConnectResponse.verifiableStatements.length > 1) {
      throw new Error(
        "The zkConnectResponse contains more than one verifiableStatement, this is not supported yet."
      );
    }
    let vaultIdentifier: string;
    for (let verifiableStatement of zkConnectResponse.verifiableStatements) {
      await this._checkVerifiableStatementMatchDataRequest(
        verifiableStatement,
        dataRequest
      );
      const verifiedProof = await this._verifyProof(
        zkConnectResponse.appId,
        zkConnectResponse.namespace,
        verifiableStatement
      );
      vaultIdentifier = verifiedProof.vaultIdentifier;
      verifiedStatements.push({
        ...verifiableStatement,
        proofId: verifiedProof.proofIdentifier,
      });
    }

    const zkConnectVerifiedResult: ZkConnectVerifiedResult = {
      ...zkConnectResponse,
      vaultId: vaultIdentifier,
      verifiedStatements,
    };

    return zkConnectVerifiedResult;
  }

  private async _checkVerifiableStatementMatchDataRequest(
    verifiableStatement: VerifiableStatement,
    dataRequest: DataRequestType
  ) {
    const groupId = verifiableStatement.groupId;
    const groupTimestamp = verifiableStatement.groupTimestamp;
    const statementRequest = dataRequest.statementRequests.find(
      (statementRequest) =>
        statementRequest.groupId === groupId &&
        statementRequest.groupTimestamp === groupTimestamp
    );
    if (!statementRequest) {
      throw new Error(
        `No statementRequest found for verifiableStatement groupId ${groupId} and groupTimestamp ${groupTimestamp}`
      );
    }
    const requestedComparator = statementRequest.comparator;
    if (requestedComparator !== verifiableStatement.comparator) {
      throw new Error(
        `The verifiableStatement comparator ${verifiableStatement.comparator} does not match the statementRequest comparator ${requestedComparator}`
      );
    }
    const requestedValue = statementRequest.requestedValue;
    if (requestedValue !== verifiableStatement.value) {
      if (requestedValue !== "USER_SELECTED_VALUE") {
        throw new Error(
          `The verifiableStatement value ${verifiableStatement.value} does not match the statementRequest requestedValue ${requestedValue}`
        );
      }
    }
  }

  private async _verifyProof(
    appId: string,
    namespace: string,
    verifiableStatement: VerifiableStatement
  ): Promise<{
    proofIdentifier: string;
    vaultIdentifier: string;
  }> {
    switch (verifiableStatement.provingScheme) {
      case ProvingScheme.HYDRA_S2:
        const isVerified = await this.hydraS2Verifier.verify({
          appId,
          namespace,
          verifiableStatement,
        });
        if (isVerified) {
          return {
            proofIdentifier: BigNumber.from(
              verifiableStatement.proof.input[6]
            ).toHexString(),
            vaultIdentifier: BigNumber.from(
              verifiableStatement.proof.input[10]
            ).toHexString(),
          };
        } else {
          throw new Error(
            `verifiableStatement with proof "${verifiableStatement.proof}" is not valid `
          );
        }
      default:
        throw new Error(
          `verifiableStatement proving scheme "${verifiableStatement.provingScheme}" not supported in this version`
        );
    }
  }

  private async _verifyAuthProof(
    appId: string,
    authProof: AuthProof
  ): Promise<{
    vaultIdentifier: string;
  }> {
    if (!authProof) {
      throw new Error(
        "The authProof is required when no verifiableStatements are provided"
      );
    }
    switch (authProof.provingScheme) {
      case ProvingScheme.HYDRA_S2:
        return this.hydraS2Verifier.verifyAuthProof({
          appId,
          authProof,
        });
      default:
        throw new Error(
          `authProof proving scheme "${authProof.provingScheme}" not supported in this version`
        );
    }
  }
}
