import { SNARK_FIELD } from "@sismo-core/hydra-s2";
import { BigNumber, ethers } from "ethers";
import { encodeServiceId } from "./encodeServiceId";

export const encodeRequestIdentifier = (
    appId: string,
    groupId: string,
    timestamp: number | "latest",
    namespace: string,
  ) => {
    const encodedTimestamp =
      timestamp === "latest"
        ? BigNumber.from(ethers.utils.formatBytes32String("latest")).shr(128)
        : BigNumber.from(timestamp);
  
    const groupSnapshotId = ethers.utils.solidityPack(
      ["uint128", "uint128"],
      [groupId, encodedTimestamp]
    );

    const serviceId = encodeServiceId(appId, namespace);

    const requestIdentifier = BigNumber.from(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["bytes32", "bytes32"],
          [serviceId, groupSnapshotId]
        )
      )
    )
      .mod(SNARK_FIELD)
      .toHexString();
  
    return requestIdentifier;
  };