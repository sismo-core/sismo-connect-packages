export type TargetGroup = {
    groupId: string;
    timestamp?: number | 'latest';
    value?: number | 'MAX';
    additionalProperties?: any;
}

export type TargetComposedGroup = {
    groups: TargetGroup;
    operator: 'AND' | 'OR';
}

export type ZkConnectResponseRequest = {
    appId: string;
    serviceName: string;
    targetGroup: TargetGroup | TargetComposedGroup;
    callbackPath?: string;
    version: string;
}

export type ZkConnectResponse = { 
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