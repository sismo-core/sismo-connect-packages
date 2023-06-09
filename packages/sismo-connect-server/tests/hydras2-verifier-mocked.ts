import { BigNumber } from '@ethersproject/bignumber'
import {
  HydraS2Verifier,
  HydraS2VerifierOpts,
} from '../src/verifier/hydras2-verifier'
import { JsonRpcProviderMock } from '../src/verifier/libs/onchain-provider'
import { AvailableRootsRegistryContractMock } from '../src/verifier/libs/contracts'

type VerifierMockedParams = {
  commitmentMapperPubKey: [BigNumber, BigNumber]
}

export class HydraS2VerifierMocked extends HydraS2Verifier {
  constructor(mockedParams: VerifierMockedParams, opts?: HydraS2VerifierOpts) {
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
