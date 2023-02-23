import { ethers } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";

let provider;

export const getWeb3Provider = (): Provider => {
  if (provider) {
    return provider;
  } else {
    let _provider = null;
    _provider = new ethers.providers.JsonRpcProvider(
      "https://rpc.gnosis.gateway.fm",
      100
    );
    provider = _provider;
    return _provider;
  }
};
