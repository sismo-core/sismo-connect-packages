import { BigNumber, Contract } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import { CommitmentMapperRegistry } from "../commons/typechain/CommitmentMapperRegistry";
import ContractABI from "../commons/abis/CommitmentMapperRegistry.json";

export class CommitmentMapperRegistryContractProd implements CommitmentMapperRegistryContract {
  private contract: CommitmentMapperRegistry;

  constructor({ provider, address }: { provider: Provider; address: string }) {
    this.contract = new Contract(address, ContractABI, provider) as CommitmentMapperRegistry;
  }

  public async getCommitmentMapperPubKey(): Promise<[BigNumber, BigNumber]> {
    return [
      BigNumber.from("0x07f6c5612eb579788478789deccb06cf0eb168e457eea490af754922939ebdb9"),
      BigNumber.from("0x20706798455f90ed993f8dac8075fc1538738a25f0c928da905c0dffd81869fa"),
    ];
    // return await this.contract.getEdDSAPubKey();
  }
}

export interface CommitmentMapperRegistryContract {
  getCommitmentMapperPubKey(): Promise<[BigNumber, BigNumber]>;
} 