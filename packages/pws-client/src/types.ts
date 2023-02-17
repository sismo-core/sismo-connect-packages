
export type Request = {
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
    appId: string;
    serviceName: string;
    value: number;
    groupId: string;
    timestamp: number;
    isStrict: boolean;
}

export type VerifiedClaim = {
    appId: string;
    serviceName: string;
    value: number;
    groupId: string;
    timestamp: number;
    isStrict: boolean;
    proofId: string;
}