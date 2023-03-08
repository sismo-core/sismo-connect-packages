import { VerifiableStatement } from "../types";

export type VerifyParams = {
  appId: string;
  namespace: string;
  verifiableStatement: VerifiableStatement;
};

export abstract class BaseVerifier {
  abstract verify(params: VerifyParams): Promise<boolean>;
}
