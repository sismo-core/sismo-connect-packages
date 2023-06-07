import { BigNumber } from "@ethersproject/bignumber";
import { HydraS3Verifier, HydraVerifierOpts } from "../src/verifier/hydra-verifiers";
import { JsonRpcProviderMock } from "../src/verifier/libs/onchain-provider";
import { AvailableRootsRegistryContractMock } from "../src/verifier/libs/contracts";

type VerifierMockedParams = {
  commitmentMapperPubKey: [BigNumber, BigNumber];
};

export class HydraS3VerifierMocked extends HydraS3Verifier {

  constructor(mockedParams: VerifierMockedParams, opts?: HydraVerifierOpts) {
    const provider = new JsonRpcProviderMock()
    const availableRootsRegistry = new AvailableRootsRegistryContractMock(true)
    opts = opts || {}
    const pubKeysAsStrings = mockedParams.commitmentMapperPubKey.map((x) =>
      x.toHexString()
    )
    opts.commitmentMapperPubKeys = [pubKeysAsStrings[0], pubKeysAsStrings[1]]
    super(provider, availableRootsRegistry, opts)
  }
}
