import { RequestParams, ZkConnectClientConfig } from './types'
import {
  Auth,
  AuthType,
  Claim,
  ClaimType,
  DevConfig,
  ZkConnectResponse,
  ZK_CONNECT_VERSION,
} from './common-types'
import { Sdk, GroupParams } from './sdk'
import { DEV_VAULT_APP_BASE_URL, PROD_VAULT_APP_BASE_URL } from './constants'
import {
  dataSlice,
  ethers,
  hexlify,
  keccak256,
  toUtf8Bytes,
  zeroPadBytes,
} from 'ethers'

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
      this._devConfig = devMode
    }
    this._sdk = new Sdk(sismoApiUrl)
  }

  public request = ({
    requestContent,
    namespace,
    callbackPath,
  }: RequestParams) => {
    if (!window)
      throw new Error(`requestProof is not available outside of a browser`)
    const url = this.getRequestLink({ requestContent, namespace, callbackPath })
    window.location.href = encodeURI(url)
  }

  public getRequestLink = ({
    requestContent,
    namespace,
    callbackPath,
  }: RequestParams): string => {
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

  public getABIResponse = (): string | null => {
    const zkConnectResponse = this.getResponse()
    const AbiCoder = new ethers.AbiCoder()

    const zkResponseABIEncoded = AbiCoder.encode(
      [
        'tuple(bytes16 appId, bytes16 namespace, bytes32 version, tuple(tuple(bytes16 groupId, bytes16 groupTimestamp, uint256 value, uint8 claimType, bytes extraData) claim, tuple(uint8 authType, bool anonMode, uint256 userId, bytes extraData) auth, bytes signedMessage, bytes32 provingScheme,bytes proofData,bytes extraData)[] proofs) zkConnectResponse',
      ],
      [
        {
          appId: zeroPadBytes(hexlify(zkConnectResponse.appId), 16),
          namespace: dataSlice(
            keccak256(toUtf8Bytes(zkConnectResponse.namespace ?? 'main')),
            0,
            16
          ),
          version: zeroPadBytes(toUtf8Bytes(zkConnectResponse.version), 32),
          proofs: zkConnectResponse.proofs.map((proof) => {
            const claimForEncoding = {
              groupId: zeroPadBytes(hexlify(proof.claim?.groupId ?? '0x0'), 16),
              groupTimestamp: zeroPadBytes(
                toUtf8Bytes(
                  proof.claim?.groupTimestamp?.toString() ?? 'latest'
                ),
                16
              ),
              value: proof.claim?.value ?? 1,
              claimType: proof.claim?.claimType ?? ClaimType.EMPTY,
              extraData: toUtf8Bytes(proof.claim?.extraData ?? ''),
            } as Claim

            const authForEncoding = {
              authType: proof.auth?.authType ?? AuthType.EMPTY,
              anonMode: proof.auth?.anonMode ?? false,
              userId: proof.auth?.userId ?? 0,
              extraData: toUtf8Bytes(proof.auth?.extraData ?? ''),
            } as Auth

            return {
              claim: claimForEncoding,
              auth: authForEncoding,
              signedMessage: toUtf8Bytes(proof.signedMessage ?? ''),
              provingScheme: zeroPadBytes(
                toUtf8Bytes(proof.provingScheme ?? 'hydra-s2.1'),
                32
              ),
              proofData: proof.proofData,
              extraData: toUtf8Bytes(proof.extraData ?? ''),
            }
          }),
        },
      ]
    )

    return zkResponseABIEncoded
  }
}
