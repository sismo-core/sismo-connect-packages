import { BigNumber, ethers } from "ethers";


export interface ProofDecoded {
    input: string[],
    a: [string, string],
    b: [[string, string], [string, string]],
    c: [string, string]
}

export const decodeProofData = (bytes: string): ProofDecoded => {
    try {
        const decodedBytes = ethers.utils.defaultAbiCoder.decode(["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[14]"], bytes);
        return {
            a: [...decodedBytes[0]] as [string, string],
            b: [[...decodedBytes[1][0]], [...decodedBytes[1][1]]] as [[string, string], [string, string]],
            c: [...decodedBytes[2]] as [string, string],
            input: [...decodedBytes[3]],
        }
    } catch (e) {
        throw new Error(`Invalid proofData`)
    }
}

export const encodeProofData = (a: [string, string], b: [[string, string], [string, string]], c: [string, string], input: string[]): string => {
    return ethers.utils.defaultAbiCoder.encode(["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[14]"], [
        a, b, c, input
    ]);
}