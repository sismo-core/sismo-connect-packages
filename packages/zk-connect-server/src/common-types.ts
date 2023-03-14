import { BigNumberish } from "@ethersproject/bignumber";


export const ZK_CONNECT_VERSION = `zk-connect-v1`;
export type ZkConnectRequest = {
  appId: string;
  dataRequest?: DataRequestType;
  namespace?: string;
  callbackPath?: string;
  version: string;
};

export type DataRequestArgs =  Partial<DataRequestType> & Partial<StatementRequest>;
export type DataRequestType = {
  statementRequests: StatementRequest[];
  operator: LogicalOperator | null;
}
export const DataRequest = (args: DataRequestArgs): DataRequestType => {
  if (args.statementRequests) {
    if (args.groupId) {
      throw new Error("Cannot provide both statements and groupId");
    }
    if (args.groupTimestamp) {
      throw new Error("Cannot provide both statements and groupTimestamp");
    }
    if (args.requestedValue) {
      throw new Error("Cannot provide both statements and selectValue");
    }
    if (args.comparator) {
      throw new Error("Cannot provide both statements and comparator");
    }
    if (args.provingScheme) {
      throw new Error("Cannot provide both statements and provingScheme");
    }
    if (args.extraData) {
      throw new Error("Cannot provide both statements and extraData");
    }
  } else {
    if (!args.groupId) {
      throw new Error("Must provide groupId");
    }
  }

  return {
    statementRequests: args.statementRequests || [{
      groupId: args.groupId,
      groupTimestamp: args.groupTimestamp ?? "latest",
      requestedValue: args.requestedValue ?? 1,
      comparator: args.comparator ?? "GTE",
      provingScheme: args.provingScheme ?? ProvingScheme.HYDRA_S2,
      extraData: args.extraData ?? null,
    } as StatementRequest],
    operator: args.operator ?? null
  };
}

export type StatementRequest = {
  groupId: string;
  groupTimestamp?: number | "latest"; // default to "latest"
  requestedValue?: number | BigNumberish | "USER_SELECTED_VALUE"; // default to 1
  comparator?: StatementComparator; // default to "GTE". "EQ" If requestedValue="USER_SELECTED_VALUE"
  provingScheme?: "hydra-s2.1"; // default to "hydra-s2.1"
  extraData?: any;
};

export enum ProvingScheme {
  HYDRA_S2 = "hydra-s2.1",
}

export type StatementComparator = "GTE" | "EQ";

export type VerifiableStatement = StatementRequest & {
  value: number | BigNumberish;
  proof: any;
};
export type VerifiedStatement = VerifiableStatement & { proofId: string };

export type LogicalOperator = "AND" | "OR";

export type AuthProof = {
  provingScheme: string;
  proof: any;
};

export type ZkConnectResponse = Omit<
  ZkConnectRequest,
  "callbackPath" | "dataRequest"
> & {
  authProof?: AuthProof;
  verifiableStatements: VerifiableStatement[];
};

export type ZkConnectVerifiedResult = ZkConnectResponse & {
  vaultId: string;
  verifiedStatements: VerifiedStatement[];
};
