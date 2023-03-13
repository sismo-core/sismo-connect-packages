import { VerifyParamsZkConnect, ZkConnectServerConfig } from "./types";
import { ethers } from "ethers";
import { ZkConnectResponse, ZkConnectVerifiedResult, ZK_CONNECT_VERSION } from "./common-types";
import { ZkConnectVerifier } from "./verifier";


export const ZkConnect = (config: ZkConnectServerConfig): ZkConnectServer => {
  return new ZkConnectServer(config);
}

export class ZkConnectServer {
  private _appId: string;
  private _verifier: ZkConnectVerifier;
  private _devModeEnabled: boolean;

  constructor({ appId, devMode, options }: ZkConnectServerConfig) {
    this._appId = appId;

    this._devModeEnabled = devMode?.enabled ?? false;
    if (this._devModeEnabled) {
      console.warn(
        "zkConnect launch in DevMode! Never use this mode in production!"
      );
    }

    //By default use public gnosis provider
    const verifierProvider = options?.provider ??
      new ethers.providers.JsonRpcProvider({
        url: "https://rpc.gnosis.gateway.fm",
        skipFetchSetup: true,
      });
    this._verifier = new ZkConnectVerifier(verifierProvider, {
      ...(options?.verifier ?? {}),
      isDevMode: this._devModeEnabled,
    });
  }

  public verify = async (zkConnectResponse: ZkConnectResponse, {
    dataRequest,
    namespace,
  }: VerifyParamsZkConnect): Promise<ZkConnectVerifiedResult> => {
    namespace = namespace ?? "main";
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
