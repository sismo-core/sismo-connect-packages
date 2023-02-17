import { BigNumber } from "@ethersproject/bignumber";
import { PwsVerifier, VerifierOpts, VerifierParams } from "../src";


type VerifierMockedParams = {
    commitmentMapperPubKey: [BigNumber, BigNumber]
}

export class PwsVerifierMocked extends PwsVerifier {
    private commitmentMapperPubKey: [BigNumber, BigNumber];

    constructor(mockedParams: VerifierMockedParams, params: VerifierParams, opts?: VerifierOpts) {
        super(params, opts);
        this.commitmentMapperPubKey = mockedParams.commitmentMapperPubKey;
    }

    protected getCommitmentMapperPubKey = async () => {
        return this.commitmentMapperPubKey;
    }

    protected isRootAvailableForAttester = async (attesterAddress: string, registryTreeRoot: string) => {
        return true;
    }
}