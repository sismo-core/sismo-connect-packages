import { BigNumber } from "@ethersproject/bignumber";
import { HydraS1Verifier, HydraS1VerifierOpts } from "../src/verifier/hydras1-verifier";
import { ethers } from "ethers";

type VerifierMockedParams = {
  commitmentMapperPubKey: [BigNumber, BigNumber];
};

export class HydraS1VerifierMocked extends HydraS1Verifier {
  private commitmentMapperPubKey: [BigNumber, BigNumber];

  constructor(mockedParams: VerifierMockedParams, opts?: HydraS1VerifierOpts) {
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
