import { ethers } from "ethers";

export const isHexlify = (value) => {
    try {
        ethers.utils.hexlify(value)
        return true;
    } catch (e) {
        return false;
    }
}