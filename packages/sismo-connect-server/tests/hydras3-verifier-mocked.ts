import { BigNumber } from "@ethersproject/bignumber";
import { HydraS3Verifier } from "../src/verifier/hydra-verifiers";
import { JsonRpcProviderMock } from "../src/verifier/libs/onchain-provider";
import { AvailableRootsRegistryContractMock } from "../src/verifier/libs/contracts";

type VerifierMockedParams = {
  commitmentMapperPubKey: [BigNumber, BigNumber];
};

export class HydraS3VerifierMocked extends HydraS3Verifier {
  constructor(mockedParams: VerifierMockedParams) {
    const provider = new JsonRpcProviderMock()
    const availableRootsRegistry = new AvailableRootsRegistryContractMock(true)
    const pubKeysAsStrings = mockedParams.commitmentMapperPubKey.map((x) =>
      x.toHexString()
    )
    super({
      provider,
      availableRootsRegistry,
      commitmentMapperPubKeys: [pubKeysAsStrings[0], pubKeysAsStrings[1]]
    })
  }
}
