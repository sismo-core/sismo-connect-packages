import { BigNumber } from "@ethersproject/bignumber";
import { HydraS2Verifier, HydraS2VerifierOpts } from "../src/verifier/hydras2-verifier";
import { ethers } from "ethers";

type VerifierMockedParams = {
  commitmentMapperPubKey: [BigNumber, BigNumber];
};

export class HydraS2VerifierMocked extends HydraS2Verifier {
  private commitmentMapperPubKey: [BigNumber, BigNumber];

  constructor(mockedParams: VerifierMockedParams, opts?: HydraS2VerifierOpts) {
    const provider = new ethers.providers.JsonRpcProvider("https://rpc.gnosis.gateway.fm", 100);
    super(provider, opts);
    this.commitmentMapperPubKey = mockedParams.commitmentMapperPubKey;
  }

  protected getCommitmentMapperPubKey = async () => {
    return this.commitmentMapperPubKey;
  };

  protected IsRootAvailable = async (registryTreeRoot: string) => {
    return true;
  };
}
