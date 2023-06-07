import { Provider } from '@ethersproject/abstract-provider'
import { ethers } from 'ethers'

export interface OnChainProvider {
  getProvider(): Provider | undefined
}

export class OnchainProviderProd implements OnChainProvider {
  private _provider: Provider

  constructor({ url }: { url: string }) {
    this._provider = new ethers.providers.JsonRpcProvider({
      url,
      skipFetchSetup: true,
    })
  }

  public getProvider(): Provider {
    return this._provider
  }
}

export class OnchainProviderMock implements OnChainProvider {
  constructor() {}

  public getProvider(): undefined {
    return undefined
  }
}
