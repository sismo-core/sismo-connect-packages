import { BigNumberish, Contract } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import ContractABI from "../commons/abis/AvailableRootsRegistry.json";
import { AvailableRootsRegistry } from "../commons/typechain/AvailableRootsRegistry";

const OFFCHAIN_ATTESTER_ADDRESS = "0xBbE9377123AEd30a3ec60daef42ca8Ef50C1632C";

export class AvailableRootsRegistryContract {
  private contract: AvailableRootsRegistry;

  constructor({
    provider,
    address,
  }: {
    provider: Provider;
    address: string;
  }) {
    this.contract = new Contract(
      address,
      ContractABI,
      provider
    ) as AvailableRootsRegistry;
  }

  public async IsRootAvailable(registryRoot: BigNumberish) {
    return await this.contract.isRootAvailableForAttester(
      OFFCHAIN_ATTESTER_ADDRESS,
      registryRoot
    );
  }
}
