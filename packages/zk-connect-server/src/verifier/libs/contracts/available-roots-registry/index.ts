import { BigNumberish, Contract } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import ContractABI from "../commons/abis/AvailableRootsRegistry.json";

export class AvailableRootsRegistryContract {
  private contract;

  constructor({
    provider,
    address,
  }: {
    provider: Provider;
    address: string;
  }) {
    this.contract = new Contract(
      address,
      ContractABI.abi,
      provider
    );
  }

  public async IsRootAvailable(registryRoot: BigNumberish) {
    return await this.contract.isRootAvailable(
      registryRoot
    );
  }
}
