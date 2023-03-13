import { BigNumber } from "ethers";
import { CommitmentMapperRegistryContract }  from "./index";

export class CommitmentMapperRegistryContractDev implements CommitmentMapperRegistryContract {
  public async getCommitmentMapperPubKey(): Promise<[BigNumber, BigNumber]> {
    return [
      BigNumber.from("0x2ab71fb864979b71106135acfa84afc1d756cda74f8f258896f896b4864f0256"),
      BigNumber.from("0x30423b4c502f1cd4179a425723bf1e15c843733af2ecdee9aef6a0451ef2db74"),
    ];
    // return await this.contract.getEdDSAPubKey();
  }
}
