import { SismoConnectServerOptions, VerifyParamsSismoConnect } from './types'
import { ethers } from 'ethers'
import {
  RequestBuilder,
  SismoConnectResponse,
  SismoConnectVerifiedResult,
  SISMO_CONNECT_VERSION,
  SismoConnectConfig,
} from './common-types'
import { SismoConnectVerifier } from './verifier'
import {
  OnChainProvider,
  OnchainProviderProd,
} from './verifier/libs/onchain-provider'

export const SismoConnect = ({
  config,
  options,
}: {
  config: SismoConnectConfig
  options?: SismoConnectServerOptions
}): SismoConnectServer => {
  return new SismoConnectServer({ config, options })
}

export class SismoConnectServer {
  private _sismoConnectConfig: SismoConnectConfig
  private _verifier: SismoConnectVerifier

  constructor({
    config,
    options,
  }: {
    config: SismoConnectConfig
    options?: SismoConnectServerOptions
  }) {
    if (!config) {
      throw new Error('No SismoConnect config provided.')
    }

    config.vault = config.vault ?? { impersonate: [] }
    this._sismoConnectConfig = config

    const isImpersonationMode: boolean = config.vault?.impersonate?.length > 0

    if (isImpersonationMode) {
      console.warn(
        `Sismo Connect redirects to the Impersonation Vault. The generated proofs are based on impersonated accounts: ${config.vault.impersonate}. Never use this mode in production!`
      )
    }

    //By default use public gnosis provider
    const onChainProvider: OnChainProvider =
      options?.onChainProvider ??
      new OnchainProviderProd({ url: 'https://rpc.gnosis.gateway.fm' })

    this._verifier = new SismoConnectVerifier(onChainProvider, {
      ...(options?.verifier ?? {}),
      isImpersonationMode,
    })
  }

  public verify = async (
    sismoConnectResponse: SismoConnectResponse,
    { auths, claims, signature, namespace }: VerifyParamsSismoConnect = {}
  ): Promise<SismoConnectVerifiedResult> => {
    if (!sismoConnectResponse) {
      throw new Error(`sismoConnectResponse provided is undefined`)
    }

    auths = RequestBuilder.buildAuths(auths)
    claims = RequestBuilder.buildClaims(claims)
    signature = RequestBuilder.buildSignature(signature)

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
    if (sismoConnectResponse.appId !== this._sismoConnectConfig.appId) {
      throw new Error(
        `sismoConnectResponse appId "${sismoConnectResponse.appId}" does not match with server appId "${this._sismoConnectConfig.appId}"`
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
