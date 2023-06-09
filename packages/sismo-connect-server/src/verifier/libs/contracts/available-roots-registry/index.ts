import { BigNumberish, Contract } from 'ethers'
import { Provider } from '@ethersproject/abstract-provider'
import ContractABI from '../commons/abis/AvailableRootsRegistry.json'
import { SismoConnectProvider } from '../../onchain-provider'

export class AvailableRootsRegistryContractProd
  implements AvailableRootsRegistryContract
{
  private contract

  constructor({ provider, address }: { provider: Provider; address: string }) {
    this.contract = new Contract(address, ContractABI.abi, provider)
  }

  public async isRootAvailable(registryRoot: BigNumberish): Promise<boolean> {
    return await this.contract.isRootAvailable(registryRoot)
  }
}

export class AvailableRootsRegistryContractMock
  implements AvailableRootsRegistryContract
{
  private _isRootAvailable: boolean

  constructor(isRootAvailable: boolean) {
    this._isRootAvailable = isRootAvailable
  }

  public async isRootAvailable(registryRoot: BigNumberish): Promise<boolean> {
    return this._isRootAvailable
  }
}

export interface AvailableRootsRegistryContract {
  isRootAvailable(registryRoot: BigNumberish): Promise<boolean>
}

export class AvailableRootsRegistryContractFactory {
  public static connect(options?: {
    provider: SismoConnectProvider
    address: string
  }): AvailableRootsRegistryContract {
    if (options === undefined) {
      return new AvailableRootsRegistryContractMock(true)
    } else {
      const providerObject = options.provider.getProvider()
      if (providerObject === undefined) {
        return new AvailableRootsRegistryContractMock(true)
      } else {
        return new AvailableRootsRegistryContractProd({
          provider: providerObject,
          address: options.address,
        })
      }
    }
  }
}
