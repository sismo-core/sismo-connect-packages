import { DataRequest } from "./types";
import { ZkConnectResponse, ZkConnectVerifiedResult } from "./types";
import { Provider } from "@ethersproject/abstract-provider";
import { ZkConnectVerifier, VerifierOpts } from "./verifier";
import { ethers } from "ethers";

export type ZkConnectParams = {
  appId: string;
  opts?: {
    provider?: Provider;
    verifier?: VerifierOpts;
  };
};

export type VerifyParams = {
  zkConnectResponse: ZkConnectResponse;
  dataRequest?: DataRequest;
  namespace?: string;
};

export const ZK_CONNECT_VERSION = `off-chain-1`;

export class ZkConnect {
  private _appId: string;
  private _verifier: ZkConnectVerifier;

  constructor({ appId, opts }: ZkConnectParams) {
    this._appId = appId;

    //By default use public gnosis provider
    const provider =
      opts?.provider ||
      new ethers.providers.JsonRpcProvider(
        "https://rpc.gnosis.gateway.fm",
        100
      )
    this._verifier = new ZkConnectVerifier(provider, opts?.verifier);
  }

  public verify = async ({
    zkConnectResponse,
    dataRequest,
    namespace,
  }: VerifyParams): Promise<ZkConnectVerifiedResult> => {
    if (zkConnectResponse.version !== ZK_CONNECT_VERSION) {
      throw new Error(
        `version of the zkConnectResponse "${zkConnectResponse.version}" not compatible with this version "${ZK_CONNECT_VERSION}"`
      );
    }
    if (zkConnectResponse.appId !== this._appId) {
      throw new Error(
        `zkConnectResponse appId "${zkConnectResponse.appId}" does not match with server appId "${this._appId}"`
      );
    }
    if (zkConnectResponse.namespace !== zkConnectResponse.namespace) {
      throw new Error(
        `zkConnectResponse namespace "${zkConnectResponse.namespace}" does not match with server namespace "${zkConnectResponse.namespace}"`
      );
    }

    return this._verifier.verify({ zkConnectResponse, dataRequest, namespace });
  };
}
