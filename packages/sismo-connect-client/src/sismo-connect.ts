import { RequestParams } from './types'
import {
  RequestBuilder,
  SismoConnectResponse,
  SISMO_CONNECT_VERSION,
  SismoConnectConfig,
  Vault,
  DevConfig,
  DevVault,
  ClaimType,
} from './common-types'
import { Sdk, GroupParams } from './sdk'
import {
  DEV_VAULT_APP_BASE_URL,
  MAIN_VAULT_APP_BASE_URL,
  DEMO_VAULT_APP_BASE_URL,
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
  private _appId: string
  private _vaultAppBaseUrl: string
  private _displayRawResponse: boolean
  private _vault: Vault
  private _devVault: DevVault
  private _sdk: Sdk
  private _config: SismoConnectConfig

  constructor({ config }: { config: SismoConnectConfig }) {
    this._config = config
    if (!this._config) {
      throw new Error('No SismoConnect config provided.')
    }
    this._appId = this._config.appId
    this._vault = this._config.vault ?? Vault.Main

    if (!this._config.vaultAppBaseUrl)
      switch (this._vault) {
        case Vault.Dev:
          this._vaultAppBaseUrl = DEV_VAULT_APP_BASE_URL
          break
        case Vault.Main:
          this._vaultAppBaseUrl = MAIN_VAULT_APP_BASE_URL
          break
        case Vault.Demo:
          this._vaultAppBaseUrl = DEMO_VAULT_APP_BASE_URL
          break
      }
    else
      this._vaultAppBaseUrl = this._vaultAppBaseUrl =
        this._config.vaultAppBaseUrl

    this._displayRawResponse = this._config.displayRawResponse
    if (this._config.displayRawResponse) {
      console.warn(
        'Sismo Connect displayRawResponse is true. Never use this mode in production!'
      )
    }

    if (this._config.vault === Vault.Dev) {
      this._devVault = this._config.devVault
      console.warn(
        'Sismo Connect redirect to the Dev Vault. Never use this mode in production!'
      )
      if (this._config.devVault?.groupsOverride) {
        console.warn(
          `Groups override in the Dev Vault by your groups added in the config. Never use this in production!`
        )
      }
    }

    if (this._config.vault === Vault.Demo) {
      console.warn(
        'Sismo Connect redirect to the Demo Vault. Never use this mode in production!'
      )
    }

    this._sdk = new Sdk(this._config.sismoApiUrl)
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

    let url = `${this._vaultAppBaseUrl}/connect?version=${SISMO_CONNECT_VERSION}&appId=${this._appId}`

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

    if (this._vault === Vault.Dev || this._vault === Vault.Demo) {
      let devGroups = null

      if (this._vault === Vault.Dev && this._devVault?.groupsOverride) {
        devGroups = this._devVault.groupsOverride
      }

      if (this._vault === Vault.Demo) {
        if (claims || claim) {
          claims = claims ?? [claim]
          devGroups = claims.map((_claim) => {
            let value = 1
            if (_claim) {
              switch (_claim.claimType) {
                case ClaimType.EQ:
                  value = _claim.value
                  break
                case ClaimType.GT:
                  value = _claim.value + 1
                  break
                case ClaimType.GTE:
                  value = _claim.value + 1
                  break
                case ClaimType.LT:
                  value = _claim.value - 1
                  break
                case ClaimType.LTE:
                  value = _claim.value - 1
                  break
              }
            }
            return {
              groupId: _claim.groupId,
              data: {
                // Add vitalik account
                '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': value,
              },
            }
          })
        }
      }

      const devConfig: DevConfig = {
        enabled: true,
        displayRawResponse: this._displayRawResponse,
        devGroups: devGroups,
      }

      url += `&devConfig=${JSON.stringify(devConfig)}`
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
