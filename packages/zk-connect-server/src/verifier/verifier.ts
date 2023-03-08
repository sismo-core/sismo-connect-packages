import {
  DataRequest,
  ProvingScheme,
  VerifiableStatement,
  VerifiedStatement,
  ZkConnectResponse,
  ZkConnectVerifiedResult,
} from "../types";
import { HydraS1Verifier, HydraS1VerifierOpts } from "./hydras1-verifier";
import { Provider } from "@ethersproject/abstract-provider";
import { VerifyParams } from "packages/zk-connect-server/src/verifier/base-verifier";

export type VerifierOpts = {
  hydraS1?: HydraS1VerifierOpts;
};

export class ZkConnectVerifier {
  private hydraS1Verifier: HydraS1Verifier;

  constructor(provider: Provider, opts?: VerifierOpts) {
    this.hydraS1Verifier = new HydraS1Verifier(provider, opts?.hydraS1);
  }

  async verify(
    zkConnectResponse: ZkConnectResponse,
    dataRequest: DataRequest
  ): Promise<ZkConnectVerifiedResult> {
    const verifiedStatements: VerifiedStatement[] = [];
    for (let verifiableStatement of zkConnectResponse.verifiableStatements) {
      const { proofIdentifier } = await this._verifyProof({
        appId: zkConnectResponse.appId,
        namespace: zkConnectResponse.namespace,
        verifiableStatement,
      });
      verifiedStatements.push({ ...verifiableStatement, proofId: proofIdentifier });
    }

    const zkConnectVerifiedResult: ZkConnectVerifiedResult = {
      ...zkConnectResponse,
      vaultId: zkConnectResponse.verifiableStatements[0].proof.input[10],
      verifiedStatements,
    };

    return zkConnectVerifiedResult;
  }

  private async _verifyProof({
    verifiableStatement,
    appId,
    namespace,
  }: VerifyParams): Promise<{ proofIdentifier: string }> {
    switch (verifiableStatement.provingScheme) {
      case ProvingScheme.HYDRA_S1_V1:
        const isVerified = await this.hydraS1Verifier.verify({
          appId,
          namespace,
          verifiableStatement,
        });
        console.log("isVerified", isVerified);
        if (isVerified) {
          return { proofIdentifier: verifiableStatement.proof.input[6] };
        } else {
          throw new Error(
            `verifiableStatement with proof "${verifiableStatement.proof}" could not be verified `
          );
        }
      default:
        throw new Error(
          `verifiableStatement proving scheme "${verifiableStatement.provingScheme}" not supported in this version`
        );
    }
  }
}
