export type Request = {
    groupId: string;
    timestamp?: number | "latest";
    value?: number | "MAX";
}

export type Proof = {
    claims: Claim[];
    content: string[];
    version: string;
}

export type Claim = {
    appId: string;
    serviceId: string;
    request: Request;
    isStrict: boolean;
}