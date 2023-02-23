export type TargetGroup = {
    groupId: string;
    timestamp: number | 'latest';
    value: number | 'MAX';
    additionalProperties?: any;
  }
  
  export type TargetComposedGroup = {
    groups: TargetGroup;
    operator: 'AND' | 'OR';
  }
  
  export type PwsProofRequest = {
    appId: string;
    serviceName: string;
    targetGroup: TargetGroup | TargetComposedGroup;
    callbackPath?: string;
    version: string;
  }
  
  export type PwsProof = { 
    appId: string;
    serviceName: string;
    membershipProofs: Membership[]; 
    version: string;
  };
  
  export type Membership = {
      proofId: string;
      groupId: string;
      value: number;
      timestamp: number | 'latest';
      additionalProperties?: Record<string, any>;
      provingScheme: string;
      version: string;
      proof: any; 
  }
  
  export type PwsReceipt = {
    proofId?: string;
    proofIds: string[];
    provedMembership?: Membership;
    provedMemberships: Membership[];
  };
  

  
// export type Request = {
//     appId: string;
//     serviceName: string;
//     groupId: string;
//     timestamp?: number | "latest";
//     value?: number | "MAX";
//     acceptHigherValue?: boolean;
// }

// export type Proof = {
//     snarkProof: {
//         a: string[], 
//         b: string[][], 
//         c: string[], 
//         input: string[]
//     },
//     version: string;
// }

// export type Claim = {
//     appId: string;
//     serviceName: string;
//     value: number | "MAX";
//     groupId: string;
//     timestamp: number | "latest";
//     acceptHigherValue: boolean;
// }

// export type VerifiedClaim = {
//     appId: string;
//     serviceName: string;
//     serviceId: string;
//     value: number | "MAX";
//     groupId: string;
//     timestamp: number | "latest";
//     acceptHigherValue: boolean;
//     proofId: string;
//     groupSnapshotId: string;
//     requestIdentifier: string;
//     __snarkProof: any;
// }