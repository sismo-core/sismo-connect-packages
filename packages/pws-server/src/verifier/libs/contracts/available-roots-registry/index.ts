import { BigNumberish, Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import ContractABI from "../commons/abis/AvailableRootsRegistry.json";
import { AvailableRootsRegistry } from "../commons/typechain/AvailableRootsRegistry";

const OFFCHAIN_ATTESTER_ADDRESS = "0x67eD29a0d69D278cd617A26A7822746602a2c308";

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

  public async IsRootAvailable(registryRoot: BigNumberish) {
    return await this.contract.isRootAvailableForAttester(
      OFFCHAIN_ATTESTER_ADDRESS,
      registryRoot
    );
  }
}
