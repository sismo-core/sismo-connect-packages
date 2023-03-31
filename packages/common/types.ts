import { BigNumberish } from "@ethersproject/bignumber";

export type DevConfig = {
  enabled?: boolean; // https://dev.vault-beta.sismo.io/
  displayRawResponse?: boolean;
  // Allow to customize data for each groupId
  devGroups?: DevGroup[];
};

export type DevGroup = {
  groupId: string;
  groupTimestamp?: number | "latest";
  data: DevAddresses;
};

export type DevAddresses = string[] | Record<string, Number | BigNumberish>;

export const ZK_CONNECT_VERSION = `zk-connect-v2`;
export type ZkConnectRequest = {
  appId: string;
  namespace?: string;
  requestContent?: ZkConnectRequestContent; // updated
  devConfig?: DevConfig;
  callbackPath?: string;
  version: string;
};
export type ZkConnectRequestContent = {
  dataRequests: DataRequest[];
  operators: LogicalOperator[];
};

export type RequestContentArgs = { dataRequests: Partial<DataRequest>[], operator?: LogicalOperator };

export enum ProvingScheme {
  HYDRA_S2 = "hydra-s2.1",
}

export class RequestContentLib {
  static build({ dataRequests, operator }: RequestContentArgs): ZkConnectRequestContent {
    if (dataRequests.length === 0) {
      throw new Error("Must provide at least one dataRequest");
    }
    for (let dataRequest of dataRequests) {
      if (!dataRequest.authRequest && !dataRequest.claimRequest && !dataRequest.messageSignatureRequest) {
        throw new Error("Must provide at least one authRequest or claimRequest or messageSignatureRequest in your dataRequests");
      }
      if (dataRequest.authRequest) {
        dataRequest.authRequest = {
          authType: dataRequest.authRequest.authType,
          anonMode: dataRequest.authRequest.anonMode ?? false,
          userId: dataRequest.authRequest.userId ?? "0",
          extraData: dataRequest.authRequest.extraData ?? ''
        };
      }
      if (dataRequest.claimRequest) {
        dataRequest.claimRequest = {
          groupId: dataRequest.claimRequest.groupId,
          groupTimestamp: dataRequest.claimRequest.groupTimestamp ?? "latest",
          value: dataRequest.claimRequest.value ?? 1,
          claimType: dataRequest.claimRequest.claimType ?? ClaimType.GTE,
          extraData: dataRequest.claimRequest.extraData ?? ''
        }
      }
      if (dataRequest.messageSignatureRequest) {
        dataRequest.messageSignatureRequest = dataRequest.messageSignatureRequest;
      }
    }
    return {
      dataRequests,
      operators: new Array(dataRequests.length - 1).fill(operator ?? "AND")
    };
  }
}

export type LogicalOperator = "AND" | "OR";
    
export type DataRequest = {
  authRequest?: Auth;
  claimRequest?: Claim;
  messageSignatureRequest?: any;
}

export type Claim = {
  groupId?: string;
  groupTimestamp?: number | "latest"; // default to "latest"
  value?: number; // default to 1
  claimType?: ClaimType; // default to GTE
  extraData?: any; // default to ''
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
  EVM_ACCOUNT 
}

export type Auth = {
  // twitter// github// evmAccount
   authType: AuthType;
  // if anonMode == true, user does not reveal the Id
  // they only prove ownership of one account of this type in the vault
   anonMode?: boolean; // anonMode default false;
  // githubAccount / twitter account / ethereum address
  // if userId == 0, user can chose any userId
   userId?: string; // default 0
   extraData?: any; // default ''
}

export type ZkConnectResponse = Pick<ZkConnectRequest, "appId" | "namespace" | "version"> & {
  proofs: ZkConnectProof[];
};

export type ZkConnectProof = {
  auth?: Auth;
  claim?: Claim;
  signedMessage?: string | any;
  provingScheme: string;
  proofData: string;
  extraData: any;
};

export type ZkConnectVerifiedResult = ZkConnectResponse & {
  signedMessages: string[];
  verifiedClaims: VerifiedClaim[];
  verifiedAuths: VerifiedAuth[];
};

export type VerifiedClaim = Claim & {
  proofId: string;
  __proof: string;
}

export type VerifiedAuth = Auth & {
  __proof: string;
}
