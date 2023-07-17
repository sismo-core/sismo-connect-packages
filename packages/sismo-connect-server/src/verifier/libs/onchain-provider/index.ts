import { Provider } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";

export interface SismoConnectProvider {
  getProvider(): Provider | undefined;
}

export class JsonRpcProvider implements SismoConnectProvider {
  private _provider: Provider;

  constructor({ url }: { url: string }) {
    this._provider = new ethers.providers.JsonRpcProvider({
      url,
      skipFetchSetup: true,
    });
  }

  public getProvider(): Provider {
    return this._provider;
  }
}

export class JsonRpcProviderMock implements SismoConnectProvider {
  constructor() {}

  public getProvider(): undefined {
    return undefined;
  }
}
