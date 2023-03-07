export type ZkConnectRequest = {
    claim: DataRequest;
    appId: string;
    serviceName?: string;
    callbackPath?: string;
    version: string;
  };


export enum ProvingScheme {
    HYDRA_S1 = "hydra-s1",
}

export class DataRequest {
  public statementRequests: StatementRequest[];
  public operator: LogicalOperator;

  constructor(args: {
    statementRequests?: StatementRequest[];
    operator?: LogicalOperator;
    groupId?: string;
    groupTimestamp?: string;
    requestedValue?: number | "MAX";
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
        comparator: args.comparator ?? "HTE", 
        provingScheme: args.provingScheme ?? ProvingScheme.HYDRA_S1, 
    }];
    this.operator = args.operator ?? null;
  }

  public toJSON(){
    return {
      operator: this.operator,
      statementRequests: this.statementRequests
    }
  }
}

export type StatementRequest = {
    groupId: string;
    groupTimestamp?: string; // default to "latest"
    requestedValue?: number | "MAX"; // If "MAX" the max value inside the group should be selected. The user can select what he wants to reveal 
    comparator?: StatementComparator; // default to "HTE". , "EQ" . If requestedValue="MAX" comparator should be empty
    provingScheme?: any; 
  };
export type StatementComparator = "HTE" | "EQ";


export type VerifiableStatement = StatementRequest & { selectedValue: number, proof: string };
export type VerifiedStatement = VerifiableStatement & { proofId: string };

export type LogicalOperator = "AND" | "OR";

export type ZkConnectResponse = Omit<ZkConnectRequest, "callbackPath"> & {
  verifiableStatements: VerifiableStatement[];
};

export type ZkconnectVerifiedResult = ZkConnectResponse & {
  vaultId: string;
  verifiedStatements: VerifiedStatement[];
};