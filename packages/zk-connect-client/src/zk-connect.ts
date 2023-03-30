import { RequestParams, ZkConnectClientConfig } from './types'
import {
  Auth,
  AuthType,
  Claim,
  ClaimType,
  DevConfig,
  RequestContentLib,
  ZkConnectRequestContent,
  ZkConnectResponse,
  ZK_CONNECT_VERSION,
} from './common-types'
import { Sdk, GroupParams } from './sdk'
import { DEV_VAULT_APP_BASE_URL, PROD_VAULT_APP_BASE_URL } from './constants'

export const ZkConnect = (config: ZkConnectClientConfig): ZkConnectClient => {
  return new ZkConnectClient(config)
}

export class ZkConnectClient {
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
  }: ZkConnectClientConfig) {
    this._appId = appId
    this._devModeEnabled = devMode?.enabled ?? false
    this._vaultAppBaseUrl =
      vaultAppBaseUrl ??
      (this._devModeEnabled ? DEV_VAULT_APP_BASE_URL : PROD_VAULT_APP_BASE_URL)
    if (this._devModeEnabled) {
      console.warn(
        'zkConnect launch in DevMode! Never use this mode in production!'
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
    claimRequest,
    authRequest,
    messageSignatureRequest,
    namespace,
    callbackPath,
  }: RequestParams) => {
    if (!window)
      throw new Error(`requestProof is not available outside of a browser`)
    const url = this.getRequestLink({
      claimRequest,
      authRequest,
      messageSignatureRequest,
      namespace,
      callbackPath,
    })
    window.location.href = encodeURI(url)
  }

  public getRequestLink = ({
    claimRequest,
    authRequest,
    messageSignatureRequest,
    namespace,
    callbackPath,
  }: RequestParams): string => {
    if (!claimRequest && !authRequest && !messageSignatureRequest) {
      throw new Error(
        `requestContent or claimRequest or authRequest or messageSignatureRequest is required`
      )
    }

    const requestContent: ZkConnectRequestContent = RequestContentLib.build({
      claimRequest,
      authRequest,
      messageSignatureRequest,
    })

    if (requestContent.operators && requestContent.operators.length > 0) {
      if (
        requestContent.operators.length >
        requestContent.dataRequests.length - 1
      ) {
        throw new Error(
          `too much operators, please add dataRequests.length - 1 operators`
        )
      }
      if (
        requestContent.operators.length <
        requestContent.dataRequests.length - 1
      ) {
        throw new Error(
          `not enough operators, please add dataRequests.length - 1 operators`
        )
      }
      let firstOperator = requestContent.operators[0]
      for (let operator of requestContent.operators) {
        if (operator !== firstOperator) {
          throw new Error(`all operators must be equals`)
        }
      }
    }
    let url = `${
      this._vaultAppBaseUrl
    }/connect?version=${ZK_CONNECT_VERSION}&appId=${
      this._appId
    }&requestContent=${JSON.stringify(requestContent)}`
    if (this._devConfig) {
      url += `&devConfig=${JSON.stringify(this._devConfig)}`
    }
    if (callbackPath) {
      url += `&callbackPath=${callbackPath}`
    }
    if (namespace) {
      url += `&namespace=${namespace}`
    }
    return url
  }

  public getResponse = (): ZkConnectResponse | null => {
    if (!window)
      throw new Error(`getResponse is not available outside of a browser`)
    const url = new URL(window.location.href)
    if (url.searchParams.has('zkConnectResponse')) {
      return JSON.parse(
        url.searchParams.get('zkConnectResponse') as string
      ) as ZkConnectResponse
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
    if (url.searchParams.has('zkConnectResponseBytes')) {
      return url.searchParams.get('zkConnectResponseBytes') as string
    }
    return null
  }
}
