import { SNARK_FIELD } from "@sismo-core/hydra-s2";
import { BigNumber, ethers } from "ethers";

export const encodeAccountsTreeValue = (
    groupId: string,
    timestamp: number | "latest"
  ) => {
    const encodedTimestamp =
      timestamp === "latest"
        ? BigNumber.from(ethers.utils.formatBytes32String("latest")).shr(128)
        : BigNumber.from(timestamp);
  
    const groupSnapshotId = ethers.utils.solidityPack(
      ["uint128", "uint128"],
      [groupId, encodedTimestamp]
    );
  
    const accountsTreeValue = BigNumber.from(groupSnapshotId)
      .mod(SNARK_FIELD)
      .toHexString();
    return accountsTreeValue;
  };