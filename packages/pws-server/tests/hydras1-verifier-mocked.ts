import { BigNumber } from "@ethersproject/bignumber";
import { HydraS1Verifier, VerifierOpts } from "../src/verifier/hydras1-verifier";


type VerifierMockedParams = {
    commitmentMapperPubKey: [BigNumber, BigNumber]
}

export class PwsVerifierMocked extends HydraS1Verifier {
    private commitmentMapperPubKey: [BigNumber, BigNumber];

    constructor(mockedParams: VerifierMockedParams, opts?: VerifierOpts) {
        super(opts);
        this.commitmentMapperPubKey = mockedParams.commitmentMapperPubKey;
    }

    protected getCommitmentMapperPubKey = async () => {
        return this.commitmentMapperPubKey;
    }

    protected isRootAvailableForAttester = async (attesterAddress: string, registryTreeRoot: string) => {
        return true;
    }
}