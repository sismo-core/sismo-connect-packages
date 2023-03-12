import { BigNumberish } from "@ethersproject/bignumber";


export const ZK_CONNECT_VERSION = `off-chain-1`;
export type ZkConnectRequest = {
  appId: string;
  dataRequest?: DataRequest;
  namespace?: string;
  callbackPath?: string;
  version: string;
};

export class DataRequest {
  public statementRequests: StatementRequest[];
  public operator: LogicalOperator | null;

  constructor(args: DataRequestArgs) {
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

    this.statementRequests = args.statementRequests || [
      {
        groupId: args.groupId,
        groupTimestamp: args.groupTimestamp ?? "latest",
        requestedValue: args.requestedValue ?? 1,
        comparator: args.comparator ?? "GTE",
        provingScheme: args.provingScheme ?? ProvingScheme.HYDRA_S1,
        extraData: args.extraData ?? null,
      } as StatementRequest,
    ];
    this.operator = args.operator ?? null;
  }
}

export type DataRequestArgs =  Partial<DataRequestType> & Partial<StatementRequest>;

export type DataRequestType = {
  statementRequests: StatementRequest[];
  operator: LogicalOperator | null;
}

export type StatementRequest = {
  groupId: string;
  groupTimestamp?: number | "latest"; // default to "latest"
  requestedValue?: number | BigNumberish | "USER_SELECTED_VALUE"; // default to 1
  comparator?: StatementComparator; // default to "GTE". "EQ" If requestedValue="USER_SELECTED_VALUE"
  provingScheme?: "hydra-s1.2"; // default to "hydra-s1.2"
  extraData?: any;
};

export enum ProvingScheme {
  HYDRA_S1 = "hydra-s1.2",
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
