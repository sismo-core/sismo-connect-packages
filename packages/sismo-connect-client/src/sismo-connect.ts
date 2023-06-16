import { RequestParams } from './types'
import {
  RequestBuilder,
  SismoConnectResponse,
  SISMO_CONNECT_VERSION,
  SismoConnectConfig,
} from './common-types'
import { Sdk, GroupParams } from './sdk'
import {
  IMPERSONATION_VAULT_APP_BASE_URL,
  MAIN_VAULT_APP_BASE_URL,
} from './constants'
import { unCompressResponse } from './utils/unCompressResponse'
import { toSismoConnectResponseBytes } from './utils/toSismoResponseBytes'

export const SismoConnect = ({
  config,
}: {
  config: SismoConnectConfig
}): SismoConnectClient => {
  return new SismoConnectClient({ config })
}

export class SismoConnectClient {
  private _sdk: Sdk
  private _sismoConnectConfig: SismoConnectConfig

  constructor({ config }: { config: SismoConnectConfig }) {
    if (!config) {
      throw new Error('No SismoConnect config provided.')
    }

    config.vault = config.vault ?? { impersonate: [] }
    this._sismoConnectConfig = config

    const isImpersonationMode: boolean =
      this._sismoConnectConfig.vault?.impersonate?.length > 0

    if (!this._sismoConnectConfig.vaultAppBaseUrl) {
      if (isImpersonationMode) {
        this._sismoConnectConfig.vaultAppBaseUrl =
          IMPERSONATION_VAULT_APP_BASE_URL
      } else {
        this._sismoConnectConfig.vaultAppBaseUrl = MAIN_VAULT_APP_BASE_URL
      }
    }

    if (!this._sismoConnectConfig.displayRawResponse) {
      this._sismoConnectConfig.displayRawResponse = false
    }

    if (this._sismoConnectConfig.displayRawResponse) {
      console.warn(
        'Sismo Connect displayRawResponse is true. Never use this mode in production!'
      )
    }

    if (isImpersonationMode) {
      console.warn(
        `Sismo Connect redirects to the Impersonation Vault. The generated proofs are based on impersonated accounts: ${this._sismoConnectConfig.vault.impersonate}. Never use this mode in production!`
      )
    }

    this._sdk = new Sdk(this._sismoConnectConfig.sismoApiUrl)
  }

  public request = ({
    claims,
    claim,
    auths,
    auth,
    signature,
    namespace,
    callbackPath,
    callbackUrl,
  }: RequestParams) => {
    if (!window)
      throw new Error(`requestProof is not available outside of a browser`)

    if (!callbackUrl) {
      callbackUrl = window.location.origin + window.location.pathname
    }

    let url = this.getRequestLink({
      claims,
      claim,
      auths,
      auth,
      signature,
      namespace,
      callbackPath,
      callbackUrl,
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
    callbackUrl,
  }: RequestParams): string => {
    if (!claims && !auths && !signature && !claim && !auth) {
      throw new Error(`claims or auths or signature is required`)
    }

    if (auths && auth) {
      throw new Error("You can't use both auth and auths")
    }

    if (claims && claim) {
      throw new Error("You can't use both claim and claims")
    }

    let url = `${this._sismoConnectConfig.vaultAppBaseUrl}/connect?version=${SISMO_CONNECT_VERSION}&appId=${this._sismoConnectConfig.appId}`

    if (claims) {
      url += `&claims=${JSON.stringify(RequestBuilder.buildClaims(claims))}`
    }
    if (claim) {
      url += `&claims=${JSON.stringify(RequestBuilder.buildClaims(claim))}`
    }
    if (auths) {
      url += `&auths=${JSON.stringify(RequestBuilder.buildAuths(auths))}`
    }
    if (auth) {
      url += `&auths=${JSON.stringify(RequestBuilder.buildAuths(auth))}`
    }
    if (signature) {
      signature = RequestBuilder.buildSignature(signature)
      url += `&signature=${JSON.stringify(signature)}`
    }

    if (this._sismoConnectConfig.vault?.impersonate?.length > 0) {
      url += `&vault=${JSON.stringify(this._sismoConnectConfig.vault)}`
    }

    if (this._sismoConnectConfig.displayRawResponse) {
      url += `&displayRawResponse=true`
    }

    if (callbackPath) {
      url += `&callbackPath=${callbackPath}`
    }
    if (namespace) {
      url += `&namespace=${namespace}`
    }
    if (callbackUrl) {
      url += `&callbackUrl=${callbackUrl}`
    }
    url += `&compressed=true`
    return url
  }

  public getResponse = (): SismoConnectResponse | null => {
    if (!window)
      throw new Error(`getResponse is not available outside of a browser`)
    const url = new URL(window.location.href)
    if (url.searchParams.has('sismoConnectResponseCompressed')) {
      const compressedResponse = url.searchParams.get(
        'sismoConnectResponseCompressed'
      )
      const uncompressedResponse = unCompressResponse(compressedResponse)
      return JSON.parse(uncompressedResponse) as SismoConnectResponse
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
      const compressedResponse = url.searchParams.get(
        'sismoConnectResponseCompressed'
      )
      const uncompressedResponse = unCompressResponse(compressedResponse)
      const sismoConnectResponse = JSON.parse(
        uncompressedResponse
      ) as SismoConnectResponse
      return toSismoConnectResponseBytes(sismoConnectResponse)
    }
    return null
  }
}
