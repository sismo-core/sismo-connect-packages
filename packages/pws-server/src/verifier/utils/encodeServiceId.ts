import { BigNumber, ethers } from "ethers";

export const encodeServiceId = (
    appId: string,
    serviceName: string,
  ) => {
  
    const hashedServiceName = BigNumber.from(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(serviceName))
    ).shr(128);
  
    return ethers.utils.solidityPack(
        ["uint128", "uint128"],
        [appId, hashedServiceName]
      );
};
