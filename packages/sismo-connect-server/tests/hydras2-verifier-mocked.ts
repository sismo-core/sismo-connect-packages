import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProviderMock } from '../src/verifier/libs/onchain-provider'
import { AvailableRootsRegistryContractMock } from '../src/verifier/libs/contracts'
import { HydraS2Verifier, HydraVerifierOpts } from "../src/verifier/hydra-verifiers"

type VerifierMockedParams = {
  commitmentMapperPubKey: [BigNumber, BigNumber]
}

export class HydraS2VerifierMocked extends HydraS2Verifier {
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
