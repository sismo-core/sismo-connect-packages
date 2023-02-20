
export type Request = {
    appId: string;
    serviceName: string;
    groupId: string;
    timestamp?: number | "latest";
    value?: number | "MAX";
    acceptHigherValue?: boolean;
}

export type Proof = {
    snarkProof: {
        a: string[], 
        b: string[][], 
        c: string[], 
        input: string[]
    },
    version: string;
}

export type Claim = {
    value: number | "MAX";
    groupId: string;
    timestamp: number | "latest";
    acceptHigherValue: boolean;
}

export type VerifiedClaim = {
    appId: string;
    serviceName: string;
    serviceId: string;
    value: number | "MAX";
    groupId: string;
    timestamp: number | "latest";
    acceptHigherValue: boolean;
    proofId: string;
    groupSnapshotId: string;
    requestIdentifier: string;
    __snarkProof: any;
}