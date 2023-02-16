import { BigNumberish, Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import ContractABI from "../commons/abis/AvailableRootsRegistry.json";
import { AvailableRootsRegistry } from "../commons/typechain/AvailableRootsRegistry";

export class AvailableRootsRegistryContract {
  private contract: AvailableRootsRegistry;

  constructor({
    signerOrProvider,
    address,
  }: {
    signerOrProvider: Signer | Provider | undefined;
    address: string;
  }) {
    this.contract = new Contract(
      address,
      ContractABI,
      signerOrProvider
    ) as AvailableRootsRegistry;
  }

  public async isRootAvailable(registryRoot: BigNumberish) {
    return await this.contract.isRootAvailableForMe(
      registryRoot
    );
  }
}
