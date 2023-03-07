export type ZkConnectRequest = {
    claim: DataRequest;
    appId: string;
    namespace?: string;
    callbackPath?: string;
    version: string;
  };


export enum ProvingScheme {
    HYDRA_S1 = "hydra-s1.1",
}

export class DataRequest {
  public statementRequests: StatementRequest[];
  public operator: LogicalOperator;

  constructor(args: {
    statementRequests?: StatementRequest[];
    operator?: LogicalOperator;
    groupId?: string;
    groupTimestamp?: number | "latest";
    requestedValue?: number | "USER_SELECTED_VALUE";
    comparator?: StatementComparator;
    provingScheme?: ProvingScheme;
  }) {
    if(args.statementRequests) {
        if(args.groupId) {
            throw new Error("Cannot provide both statements and groupId");
        }
        if(args.groupTimestamp) {
            throw new Error("Cannot provide both statements and groupTimestamp");
        }
        if(args.requestedValue) {
            throw new Error("Cannot provide both statements and selectValue");
        }
        if(args.comparator) {
            throw new Error("Cannot provide both statements and comparator");
        }
        if(args.provingScheme) {
            throw new Error("Cannot provide both statements and provingScheme");
        }
    } else {
        if(!args.groupId) {
            throw new Error("Must provide groupId");
        }
    }

    this.statementRequests = args.statementRequests || [{
        groupId: args.groupId,
        groupTimestamp: args.groupTimestamp ?? 'latest',
        requestedValue: args.requestedValue ?? 1,
        comparator: args.comparator ?? "GTE",
        provingScheme: args.provingScheme ?? ProvingScheme.HYDRA_S1, 
    }];
    this.operator = args.operator ?? null;
  }
}


export type StatementRequest = {
  groupId: string;
  groupTimestamp?: number | "latest"; // default to "latest"
  requestedValue?: number | "USER_SELECTED_VALUE"; // If "MAX" the max value inside the group should be selected. The user can select what he wants to reveal 
  comparator?: StatementComparator; // default to "GTE". , "EQ" If requestedValue="USER_SELECTED_VALUE" comparator "GTE"
  provingScheme?: any; 
};

export type StatementComparator = "GTE" | "EQ";

export type VerifiableStatement = StatementRequest & { value: number, proof: any };
export type VerifiedStatement = VerifiableStatement & { proofId: string };

export type LogicalOperator = "AND" | "OR";

export type ZkConnectResponse = Omit<ZkConnectRequest, "callbackPath"> & {
  verifiableStatements: VerifiableStatement[];
};