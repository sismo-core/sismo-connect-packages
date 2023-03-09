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
    isDevMode?: boolean;
  };
};

export type VerifyParamsZkConnect = {
  zkConnectResponse: ZkConnectResponse;
  dataRequest?: DataRequest;
  namespace?: string;
};

export const ZK_CONNECT_VERSION = `off-chain-1`;

export class ZkConnect {
  private _appId: string;
  private _verifier: ZkConnectVerifier;
  private _isDevMode: boolean;

  constructor({ appId, opts }: ZkConnectParams) {
    this._appId = appId;

    //By default use public gnosis provider
    const provider =
      opts?.provider ||
      new ethers.providers.JsonRpcProvider(
        "https://rpc.gnosis.gateway.fm",
        100
      );
    this._verifier = new ZkConnectVerifier(provider, {
      ...opts?.verifier,
      isDevMode: this._isDevMode,
    });

    this._isDevMode = opts?.isDevMode ?? false;
    if (this._isDevMode) {
      console.warn(
        "zkConnect launch in DevMode! Never use this mode in production!"
      );
    }
  }

  public verify = async ({
    zkConnectResponse,
    dataRequest,
    namespace,
  }: VerifyParamsZkConnect): Promise<ZkConnectVerifiedResult> => {
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
    if (zkConnectResponse.namespace !== namespace) {
      throw new Error(
        `zkConnectResponse namespace "${zkConnectResponse.namespace}" does not match with server namespace "${namespace}"`
      );
    }

    dataRequest = dataRequest ?? {
      statementRequests: [],
      operator: null,
    };

    return this._verifier.verify({ zkConnectResponse, dataRequest, namespace });
  };
}
