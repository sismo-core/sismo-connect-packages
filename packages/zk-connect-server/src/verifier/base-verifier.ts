import { DataRequest, VerifiableStatement } from "../types";

export type VerifyParams = {
  appId: string;
  namespace: string;
  verifiableStatement: VerifiableStatement;
  dataRequest: DataRequest;
};

export abstract class BaseVerifier {
  abstract verify(params: VerifyParams): Promise<boolean>;
}
