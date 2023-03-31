import { decodeProofData, encodeProofData } from "../../src/verifier/utils/proofData";


export const updateProofDataInput = (proofData: string, input: number, updatedValue: string): string => {
    const proofDecoded = decodeProofData(proofData);
    proofDecoded.input[input] = updatedValue;
    return encodeProofData(proofDecoded.a, proofDecoded.b, proofDecoded.c, proofDecoded.input);
}