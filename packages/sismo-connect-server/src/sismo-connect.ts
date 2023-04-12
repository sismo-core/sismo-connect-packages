import { SismoConnectServerConfig, VerifyParamsSismoConnect } from './types'
import { ethers } from 'ethers'
import {
  RequestBuilder,
  SismoConnectResponse,
  SismoConnectVerifiedResult,
  SISMO_CONNECT_VERSION,
} from './common-types'
import { SismoConnectVerifier } from './verifier'

export const SismoConnect = (config: SismoConnectServerConfig): SismoConnectServer => {
  return new SismoConnectServer(config)
}

export class SismoConnectServer {
  private _appId: string
  private _verifier: SismoConnectVerifier
  private _devModeEnabled: boolean

  constructor({ appId, devMode, options }: SismoConnectServerConfig) {
    this._appId = appId;
    
    this._devModeEnabled = devMode?.enabled ?? false;
    if (this._devModeEnabled) {
      console.warn(
        'zkConnect launch in DevMode! Never use this mode in production!'
      )
    }

    //By default use public gnosis provider 
    const verifierProvider =
      options?.provider ??
        new ethers.providers.JsonRpcProvider({
          url: 'https://rpc.gnosis.gateway.fm',
          skipFetchSetup: true,
        });

    this._verifier = new SismoConnectVerifier(verifierProvider, {
      ...(options?.verifier ?? {}),
      isDevMode: this._devModeEnabled,
    })
  }

  public verify = async (
    sismoConnectResponse: SismoConnectResponse,
    {
      auths,
      claims,
      signature,
      namespace,
    }: VerifyParamsSismoConnect = {}
  ): Promise<SismoConnectVerifiedResult> => {
    if (!sismoConnectResponse) {
      throw new Error(`sismoConnectResponse provided is undefined`)
    }

    auths = RequestBuilder.buildAuths(auths);
    claims = RequestBuilder.buildClaims(claims);
    signature = RequestBuilder.buildSignature(signature);

    if (!sismoConnectResponse.version) {
      throw new Error(
        `no version provided in your sismoConnectResponse, please use the sismoConnectResponse that was returned by the Sismo vault app`
      )
    }
    if (!sismoConnectResponse.appId) {
      throw new Error(
        `no appId provided in your sismoConnectResponse, please use the sismoConnectResponse that was returned by the Sismo vault app`
      )
    }
    if (!sismoConnectResponse.namespace) {
      throw new Error(
        `no namespace provided in your sismoConnectResponse, please use the sismoConnectResponse that was returned by the Sismo vault app`
      )
    }

    namespace = namespace ?? 'main'
    if (sismoConnectResponse.version !== SISMO_CONNECT_VERSION) {
      throw new Error(
        `version of the sismoConnectResponse "${sismoConnectResponse.version}" not compatible with this version "${SISMO_CONNECT_VERSION}"`
      )
    }
    if (sismoConnectResponse.appId !== this._appId) {
      throw new Error(
        `sismoConnectResponse appId "${sismoConnectResponse.appId}" does not match with server appId "${this._appId}"`
      )
    }
    if (sismoConnectResponse.namespace !== namespace) {
      throw new Error(
        `sismoConnectResponse namespace "${sismoConnectResponse.namespace}" does not match with server namespace "${namespace}"`
      )
    }

    return this._verifier.verify({
      sismoConnectResponse,
      auths,
      claims,
      signature,
      namespace,
    })
  }
}
