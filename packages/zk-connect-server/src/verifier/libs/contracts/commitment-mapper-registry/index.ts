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
    return await this.contract.getEdDSAPubKey();
  }
}

export interface CommitmentMapperRegistryContract {
  getCommitmentMapperPubKey(): Promise<[BigNumber, BigNumber]>;
} 