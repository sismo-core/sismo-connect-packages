import { RequestParams, SismoConnectClientConfig } from './types'
import {
  DevConfig, RequestBuilder, SismoConnectResponse, SISMO_CONNECT_VERSION,
} from './common-types'
import { Sdk, GroupParams } from './sdk'
import { DEV_VAULT_APP_BASE_URL, PROD_VAULT_APP_BASE_URL } from './constants'
//import { toSismoConnectResponseBytes } from './utils/toSismoResponseBytes'
import { unCompressResponse } from './utils/unCompressResponse'
import { toSismoConnectResponseBytes } from './utils/toSismoResponseBytes'

export const SismoConnect = (config: SismoConnectClientConfig): SismoConnectClient => {
  return new SismoConnectClient(config)
}

export class SismoConnectClient {
  private _appId: string
  private _vaultAppBaseUrl: string
  private _devConfig: DevConfig
  private _devModeEnabled: boolean
  private _sdk: Sdk

  constructor({
    appId,
    devMode,
    vaultAppBaseUrl,
    sismoApiUrl,
  }: SismoConnectClientConfig) {
    this._appId = appId
    this._devModeEnabled = devMode?.enabled ?? false
    this._vaultAppBaseUrl =
      vaultAppBaseUrl ??
      (this._devModeEnabled ? DEV_VAULT_APP_BASE_URL : PROD_VAULT_APP_BASE_URL)
    if (this._devModeEnabled) {
      console.warn(
        'sismoConnect launch in DevMode! Never use this mode in production!'
      )
    }
    if (devMode?.devGroups) {
      console.warn(
        `These Eligibles addresses will be used in data groups. Never use this in production!`
      )
    }
    this._devConfig = devMode;
    this._sdk = new Sdk(sismoApiUrl)
  }

  public request = ({
    claims,
    claim,
    auths,
    auth,
    signature,
    namespace,
    callbackPath,
    callbackUrl
  }: RequestParams) => {
    if (!window)
      throw new Error(`requestProof is not available outside of a browser`)

    if (!callbackUrl) {
      callbackUrl = window.location.origin + window.location.pathname;
    }
    
    let url = this.getRequestLink({
      claims,
      claim,
      auths,
      auth,
      signature,
      namespace,
      callbackPath,
      callbackUrl
    })
    window.location.href = encodeURI(url)
  }

  public getRequestLink = ({
    claims,
    claim,
    auths,
    auth,
    signature,
    namespace,
    callbackPath,
    callbackUrl
  }: RequestParams): string => {
    if (!claims && !auths && !signature && !claim && !auth) {
      throw new Error(
        `claims or auths or signature is required`
      )
    }

    if (auths && auth) {
      throw new Error("You can't use both auth and auths");
    }

    if (claims && claim) {
      throw new Error("You can't use both claim and claims");
    }

    let url = `${
      this._vaultAppBaseUrl
    }/connect?version=${SISMO_CONNECT_VERSION}&appId=${
      this._appId
    }`

    if (claims) {
      url += `&claims=${JSON.stringify(RequestBuilder.buildClaims(claims))}`;
    }
    if (claim) {
      url += `&claims=${JSON.stringify(RequestBuilder.buildClaims(claim))}`;
    }
    if (auths) {
      url += `&auths=${JSON.stringify(RequestBuilder.buildAuths(auths))}`;
    }
    if (auth) {
      url += `&auths=${JSON.stringify(RequestBuilder.buildAuths(auth))}`;
    }
    if (signature) {
      signature = RequestBuilder.buildSignature(signature);
      url += `&signature=${JSON.stringify(signature)}`
    }

    if (this._devConfig) {
      url += `&devConfig=${JSON.stringify(this._devConfig)}`
    }
    if (callbackPath) {
      url += `&callbackPath=${callbackPath}`
    }
    if (namespace) {
      url += `&namespace=${namespace}`
    }
    if (callbackUrl) {
      url += `&callbackUrl=${callbackUrl}`;
    }
    url += `&compressed=true`
    return url
  }

  public getResponse = (): SismoConnectResponse | null => {
    if (!window)
      throw new Error(`getResponse is not available outside of a browser`)
    const url = new URL(window.location.href)
    if (url.searchParams.has('sismoConnectResponseCompressed')) {
      const compressedResponse = url.searchParams.get('sismoConnectResponseCompressed');
      const uncompressedResponse = unCompressResponse(compressedResponse);
      return JSON.parse(uncompressedResponse) as SismoConnectResponse;
    }
    return null
  }

  public async getGroup({ id, name, timestamp }: GroupParams) {
    return this._sdk.getGroup({ id, name, timestamp })
  }

  public getResponseBytes = (): string | null => {
    if (!window)
      throw new Error(`getResponse is not available outside of a browser`)
    const url = new URL(window.location.href)
    if (url.searchParams.has('sismoConnectResponseCompressed')) {
      const compressedResponse = url.searchParams.get('sismoConnectResponseCompressed');
      const uncompressedResponse = unCompressResponse(compressedResponse);
      const sismoConnectResponse = JSON.parse(uncompressedResponse) as SismoConnectResponse;
      return toSismoConnectResponseBytes(sismoConnectResponse);
    }
    return null
  }
}
