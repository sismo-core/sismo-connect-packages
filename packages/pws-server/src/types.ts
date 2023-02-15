
export type Request = {
    groupId: string;
    timestamp?: number | "latest";
    value?: number | "MAX";
    mode?: "==" | ">" | ">=" | "<" | "<="
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
    serviceId: string;
    value: number;
    groupSnapshotId: string;
    isStrict: string;
}

export type VerifiedClaim = {
    appId: string;
    serviceId: string;
    value: number;
    groupSnapshotId: string;
    isStrict: string;
    proofId: string;
}