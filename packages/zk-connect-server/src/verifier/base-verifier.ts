import { Membership, TargetGroup } from "../types"

export type VerifyParams = {
    membership: Membership, 
    appId: string, 
    serviceName: string, 
    targetGroup: TargetGroup
}

export abstract class BaseVerifier {
    abstract verify (params: VerifyParams): Promise<boolean> 
}