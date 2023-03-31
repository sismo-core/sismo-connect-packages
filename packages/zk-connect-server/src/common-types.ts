import { BigNumberish } from '@ethersproject/bignumber'

export type DevConfig = {
  enabled?: boolean; // https://dev.vault-beta.sismo.io/
  displayRawResponse?: boolean; // if bytes, open a modal with the ZkConnectResponse direclty encoded in bytes + registryTreeRoot displayed
  // Allow to customize data for each groupId
  devGroups?: DevGroup[]
}

export type DevGroup = {
  groupId: string;
  groupTimestamp?: number | "latest";
  data: DevAddresses;
};

export type DevAddresses = string[] | Record<string, Number | BigNumberish>

export const ZK_CONNECT_VERSION = `zk-connect-v2`
export type ZkConnectRequest = {
  appId: string;
  namespace?: string;
  requestContent?: ZkConnectRequestContent; // updated
  devConfig?: DevConfig;
  callbackPath?: string;
  version: string;
};
export type ZkConnectRequestContent = {
  dataRequests: DataRequest[]
  operators: LogicalOperator[]
}

export type RequestContentArgs = {
  claimRequest?: Claim
  authRequest?: Auth
  messageSignatureRequest?: any
}

export enum ProvingScheme {
  HYDRA_S2 = 'hydra-s2.1',
}

export class RequestContentLib {
  static build({
    claimRequest,
    authRequest,
    messageSignatureRequest,
  }: RequestContentArgs): ZkConnectRequestContent {
    // we build a dataRequest from claimRequest, authRequest or messageSignatureRequest
    // we support only one of each
    const dataRequest: DataRequest = {}

    if (!authRequest && !claimRequest && !messageSignatureRequest) {
      throw new Error(
        'Must provide at least one authRequest or claimRequest or messageSignatureRequest in your dataRequests'
      )
    }

    if (authRequest) {
      dataRequest.authRequest = {
        authType: authRequest.authType,
        anonMode: authRequest.anonMode ?? false,
        userId: authRequest.userId ?? '0',
        extraData: authRequest.extraData ?? '',
      }
    }
    if (claimRequest) {
      dataRequest.claimRequest = {
        groupId: claimRequest.groupId,
        groupTimestamp: claimRequest.groupTimestamp ?? 'latest',
        value: claimRequest.value ?? 1,
        claimType: claimRequest.claimType ?? ClaimType.GTE,
        extraData: claimRequest.extraData ?? '',
      }
    }
    if (messageSignatureRequest) {
      dataRequest.messageSignatureRequest = messageSignatureRequest
    }

    return {
      dataRequests: [dataRequest],
      operators: [],
    }
  }
}

export type LogicalOperator = 'AND' | 'OR'

export type DataRequest = {
  authRequest?: Auth
  claimRequest?: Claim
  messageSignatureRequest?: any
}

export type Claim = {
  groupId?: string
  groupTimestamp?: number | 'latest' // default to "latest"
  value?: number // default to 1
  claimType?: ClaimType // default to GTE
  extraData?: any // default to ''
}

export enum ClaimType {
  EMPTY,
  GTE,
  GT,
  EQ,
  LT,
  LTE,
  USER_SELECT,
}

export enum AuthType {
  EMPTY,
  ANON,
  GITHUB,
  TWITTER,
  EVM_ACCOUNT,
}

export type Auth = {
  // twitter// github// evmAccount
  authType: AuthType
  // if anonMode == true, user does not reveal the Id
  // they only prove ownership of one account of this type in the vault
  anonMode?: boolean // anonMode default false;
  // githubAccount / twitter account / ethereum address
  // if userId == 0, user can chose any userId
  userId?: string // default 0
  extraData?: any // default ''
}

export type ZkConnectResponse = Pick<
  ZkConnectRequest,
  'appId' | 'namespace' | 'version'
> & {
  proofs: ZkConnectProof[]
}

export type ZkConnectProof = {
  auth?: Auth;
  claim?: Claim;
  signedMessage?: string | any;
  provingScheme: string;
  proofData: string;
  extraData: any;
};

export type ZkConnectVerifiedResult = ZkConnectResponse & {
  signedMessages: string[]
  verifiedClaims: VerifiedClaim[]
  verifiedAuths: VerifiedAuth[]
}

export type VerifiedClaim = Claim & {
  proofId: string
  __proof: string
}

export type VerifiedAuth = Auth & {
  __proof: string
}
