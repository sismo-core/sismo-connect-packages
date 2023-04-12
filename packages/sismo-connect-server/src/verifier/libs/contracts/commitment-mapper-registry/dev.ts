import { BigNumber } from "ethers";
import { CommitmentMapperRegistryContract }  from "./index";

export class CommitmentMapperRegistryContractDev implements CommitmentMapperRegistryContract {
  private _pubKeyX: string;
  private _pubKeyY: string;

  constructor(pubKeyX, pubKeyY) {
    this._pubKeyX = pubKeyX;
    this._pubKeyY = pubKeyY;
  }

  public async getCommitmentMapperPubKey(): Promise<[BigNumber, BigNumber]> {
    return [
      BigNumber.from(this._pubKeyX),
      BigNumber.from(this._pubKeyY),
    ];
  }
}