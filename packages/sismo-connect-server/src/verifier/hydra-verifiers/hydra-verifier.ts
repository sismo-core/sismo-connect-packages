import { CommitmentMapperRegistryContractDev } from '../libs/contracts/commitment-mapper-registry/dev'
import {
  IMPERSONATION_COMMITMENT_MAPPER_PUB_KEY,
  GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS,
} from '../../constants'
import { BigNumber } from '@ethersproject/bignumber'

import { ethers } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'
import { ProofDecoded, decodeProofData } from '../utils/proofData'
import {
  AvailableRootsRegistryContract,
  CommitmentMapperRegistryContract,
  CommitmentMapperRegistryContractProd,
} from '../libs/contracts'
import { isHexlify } from '../utils/isHexlify'
import { encodeRequestIdentifier } from '../utils/encodeRequestIdentifier'
import { encodeAccountsTreeValue } from '../utils/encodeAccountsTreeValue'
import { SismoConnectProvider } from '../libs/onchain-provider'
import {
  AuthType,
  ClaimType,
  SismoConnectProof,
  VerifiedAuth,
  VerifiedClaim,
  resolveSismoIdentifier,
} from '../../common-types'
import { SNARK_FIELD } from '@sismo-core/hydra-s3'

export type SnarkProof = {
  a: string[]
  b: string[][]
  c: string[]
  input: string[]
}

export type ProofPublicInputs = {
  destinationIdentifier: string
  extraData: string
  commitmentMapperPubKeyX: string
  commitmentMapperPubKeyY: string
  registryTreeRoot: string
  requestIdentifier: string
  proofIdentifier: string
  claimValue: string
  accountsTreeValue: string
  claimType: string
  vaultIdentifier: string
  vaultNamespace: string
  sourceVerificationEnabled: string
  destinationVerificationEnabled: string
}

export type VerifyParams = {
  appId: string
  namespace: string
  proof: SismoConnectProof
}

export type HydraVerifierParams = {
  availableRootsRegistry: AvailableRootsRegistryContract
  provider: SismoConnectProvider
  commitmentMapperRegistryAddress?: string
  isImpersonationMode?: boolean
  registryRoot?: string
  commitmentMapperPubKeys?: [string, string]
}

export abstract class HydraVerifier {
  private _commitmentMapperRegistry: CommitmentMapperRegistryContract
  private _availableRootsRegistry: AvailableRootsRegistryContract
  private _registryRoot: string

  constructor({
    provider,
    isImpersonationMode,
    availableRootsRegistry,
    registryRoot,
    commitmentMapperRegistryAddress,
    commitmentMapperPubKeys,
  }: HydraVerifierParams) {
    if (registryRoot) {
      this._registryRoot = BigNumber.from(registryRoot).toHexString()
    }
    if (commitmentMapperPubKeys) {
      this._commitmentMapperRegistry = new CommitmentMapperRegistryContractDev(
        commitmentMapperPubKeys[0],
        commitmentMapperPubKeys[1]
      )
    } else {
      if (isImpersonationMode) {
        this._commitmentMapperRegistry =
          new CommitmentMapperRegistryContractDev(
            IMPERSONATION_COMMITMENT_MAPPER_PUB_KEY[0],
            IMPERSONATION_COMMITMENT_MAPPER_PUB_KEY[1]
          )
      } else {
        const address =
          commitmentMapperRegistryAddress ??
          GNOSIS_COMMITMENT_MAPPER_REGISTRY_ADDRESS
        this._commitmentMapperRegistry =
          new CommitmentMapperRegistryContractProd({
            address: address,
            provider: provider.getProvider(),
          })
      }
    }

    this._availableRootsRegistry = availableRootsRegistry
  }

  protected abstract _verifyProof(snarkProof: ProofDecoded)

  async verifyClaimProof({
    appId,
    namespace,
    signedMessage,
    proof,
  }: {
    appId: string
    signedMessage?: string
    namespace: string
    proof: SismoConnectProof
  }): Promise<VerifiedClaim> {
    const snarkProof = decodeProofData(proof.proofData)

    await this._matchPublicInputWithClaim({ appId, namespace, proof })

    if (signedMessage) {
      await this._matchPublicInputWithSignedMessage({ proof, signedMessage })
    }

    if (!(await this._verifyProof(snarkProof))) {
      throw new Error('Snark Proof Invalid!')
    }

    return {
      ...proof.claims[0],
      proofId: BigNumber.from(snarkProof.input[6]).toHexString(),
      proofData: proof.proofData,
    }
  }

  async verifySignedMessageProof({
    proof,
    signedMessage,
  }: {
    proof: SismoConnectProof
    signedMessage: string
  }): Promise<void> {
    const snarkProof = decodeProofData(proof.proofData)
    await this._matchPublicInputWithSignedMessage({ proof, signedMessage })
    if (!(await this._verifyProof(snarkProof))) {
      throw new Error('Snark Proof Invalid!')
    }
  }

  async verifyAuthProof({
    proof,
    signedMessage,
  }: {
    proof: SismoConnectProof
    signedMessage?: string
  }): Promise<VerifiedAuth> {
    const snarkProof = decodeProofData(proof.proofData)

    await this._matchPublicInputWithAuth({ proof })

    if (signedMessage) {
      await this._matchPublicInputWithSignedMessage({ proof, signedMessage })
    }

    if (!(await this._verifyProof(snarkProof))) {
      throw new Error('Snark Proof Invalid!')
    }

    //Multiple auths in of proof not supported yet
    const auth = proof.auths[0]

    let userId
    if (auth.authType === AuthType.VAULT) {
      //userId is the vaultIdentifier
      userId = snarkProof.input[10]
      userId = BigNumber.from(userId).toHexString()
    } else {
      //userId is the destination
      userId = snarkProof.input[0]
      userId = BigNumber.from(userId).toHexString()
      userId = resolveSismoIdentifier(userId, auth.authType)
    }

    return {
      ...auth,
      userId: userId,
      proofData: proof.proofData,
    }
  }

  private async _matchPublicInputWithSignedMessage({
    proof,
    signedMessage,
  }: {
    proof: SismoConnectProof
    signedMessage: string
  }) {
    const input = decodeProofData(proof.proofData).input
    const proofPublicInputs: ProofPublicInputs = {
      destinationIdentifier: input[0],
      extraData: input[1],
      commitmentMapperPubKeyX: input[2],
      commitmentMapperPubKeyY: input[3],
      registryTreeRoot: input[4],
      requestIdentifier: input[5],
      proofIdentifier: input[6],
      claimValue: input[7],
      accountsTreeValue: input[8],
      claimType: input[9],
      vaultIdentifier: input[10],
      vaultNamespace: input[11],
      sourceVerificationEnabled: input[12],
      destinationVerificationEnabled: input[13],
    }

    const proofIdentifier = proofPublicInputs.proofIdentifier

    let extraData = null
    if (isHexlify(signedMessage)) {
      extraData = ethers.utils.hexlify(signedMessage)
    } else {
      extraData = ethers.utils.toUtf8Bytes(signedMessage)
    }
    const expectedSignedMessage = BigNumber.from(
      ethers.utils.keccak256(extraData)
    ).mod(SNARK_FIELD)

    if (
      !BigNumber.from(proofPublicInputs.extraData).eq(expectedSignedMessage)
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" extraData "${BigNumber.from(
          proofPublicInputs.extraData
        ).toHexString()}" mismatch with signedMessage "${expectedSignedMessage.toHexString()}"`
      )
    }
  }

  private async _matchPublicInputWithAuth({
    proof,
  }: {
    proof: SismoConnectProof
  }) {
    const input = decodeProofData(proof.proofData).input
    const proofPublicInputs: ProofPublicInputs = {
      destinationIdentifier: input[0],
      extraData: input[1],
      commitmentMapperPubKeyX: input[2],
      commitmentMapperPubKeyY: input[3],
      registryTreeRoot: input[4],
      requestIdentifier: input[5],
      proofIdentifier: input[6],
      claimValue: input[7],
      accountsTreeValue: input[8],
      claimType: input[9],
      vaultIdentifier: input[10],
      vaultNamespace: input[11],
      sourceVerificationEnabled: input[12],
      destinationVerificationEnabled: input[13],
    }

    //Multiple auths in of proof not supported yet
    const auth = proof.auths[0]

    if (auth.isAnon) {
      throw new Error(`proof isAnon is not supported yet`)
    }

    if (auth.authType === AuthType.VAULT) {
      if (!BigNumber.from(auth.userId).eq(proofPublicInputs.vaultIdentifier)) {
        throw new Error(
          `userId "${BigNumber.from(
            auth.userId
          ).toHexString()}" mismatch with proof input vaultIdentifier ${BigNumber.from(
            proofPublicInputs.vaultIdentifier
          ).toHexString()}`
        )
      }
      return
    }

    if (
      !BigNumber.from(auth.userId).eq(proofPublicInputs.destinationIdentifier)
    ) {
      throw new Error(
        `userId "${BigNumber.from(
          auth.userId
        ).toHexString()}" mismatch with proof input destinationIdentifier ${BigNumber.from(
          proofPublicInputs.destinationIdentifier
        ).toHexString()}`
      )
    }

    if (
      !BigNumber.from(proofPublicInputs.destinationVerificationEnabled).eq('1')
    ) {
      throw new Error(`proof input destinationVerificationEnabled must be 1`)
    }

    const [commitmentMapperPubKeyX, commitmentMapperPubKeyY] =
      await this.getCommitmentMapperPubKey()

    if (
      !commitmentMapperPubKeyX.eq(proofPublicInputs.commitmentMapperPubKeyX)
    ) {
      throw new Error(
        `commitmentMapperPubKeyX "${BigNumber.from(
          commitmentMapperPubKeyX
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(
          proofPublicInputs.commitmentMapperPubKeyX
        ).toHexString()}"`
      )
    }

    if (
      !commitmentMapperPubKeyY.eq(proofPublicInputs.commitmentMapperPubKeyY)
    ) {
      throw new Error(
        `commitmentMapperPubKeyY "${BigNumber.from(
          commitmentMapperPubKeyY
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(
          proofPublicInputs.commitmentMapperPubKeyY
        ).toHexString()}"`
      )
    }
  }

  private async _matchPublicInputWithClaim({
    proof,
    appId,
    namespace,
  }: VerifyParams) {
    const input = decodeProofData(proof.proofData).input
    const proofPublicInputs: ProofPublicInputs = {
      destinationIdentifier: input[0],
      extraData: input[1],
      commitmentMapperPubKeyX: input[2],
      commitmentMapperPubKeyY: input[3],
      registryTreeRoot: input[4],
      requestIdentifier: input[5],
      proofIdentifier: input[6],
      claimValue: input[7],
      accountsTreeValue: input[8],
      claimType: input[9],
      vaultIdentifier: input[10],
      vaultNamespace: input[11],
      sourceVerificationEnabled: input[12],
      destinationVerificationEnabled: input[13],
    }

    const proofIdentifier = proofPublicInputs.proofIdentifier

    //Multiple claims in of proof not supported yet
    const claim = proof.claims[0]

    // claimType
    const claimTypFromInput = BigNumber.from(proofPublicInputs.claimType).eq(
      '1'
    )
    const claimTypeFromProof = claim.claimType === ClaimType.EQ
    if (claimTypFromInput !== claimTypeFromProof) {
      throw new Error(
        `on proofId "${proofIdentifier}" claimType "${claim.claimType}" mismatch with proof input claimType "${claimTypFromInput}"`
      )
    }

    // claimValue
    if (
      !BigNumber.from(proofPublicInputs.claimValue).eq(
        BigNumber.from(claim.value)
      )
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" value "${claim.value}" mismatch with proof input claimValue "${proofPublicInputs.claimValue}"`
      )
    }

    // requestIdentifier
    const requestIdentifier = encodeRequestIdentifier(
      appId,
      claim.groupId,
      claim.groupTimestamp,
      namespace
    )
    if (
      !BigNumber.from(proofPublicInputs.requestIdentifier).eq(requestIdentifier)
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" requestIdentifier "${BigNumber.from(
          requestIdentifier
        ).toHexString()}" mismatch with proof input requestIdentifier "${BigNumber.from(
          proofPublicInputs.requestIdentifier
        ).toHexString()}"`
      )
    }

    //commitmentMapperPubKey
    const [commitmentMapperPubKeyX, commitmentMapperPubKeyY] =
      await this.getCommitmentMapperPubKey()
    if (
      !commitmentMapperPubKeyX.eq(proofPublicInputs.commitmentMapperPubKeyX)
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" commitmentMapperPubKeyX "${BigNumber.from(
          commitmentMapperPubKeyX
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(
          proofPublicInputs.commitmentMapperPubKeyX
        ).toHexString()}"`
      )
    }
    if (
      !commitmentMapperPubKeyY.eq(proofPublicInputs.commitmentMapperPubKeyY)
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" commitmentMapperPubKeyY "${BigNumber.from(
          commitmentMapperPubKeyY
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(
          proofPublicInputs.commitmentMapperPubKeyY
        ).toHexString()}"`
      )
    }

    // sourceVerificationEnabled
    if (!BigNumber.from(proofPublicInputs.sourceVerificationEnabled).eq('1')) {
      throw new Error(
        `on proofId "${proofIdentifier}" proof input sourceVerificationEnabled must be 1`
      )
    }

    // isRootAvailable
    const isAvailable = await this.isRootAvailable(
      proofPublicInputs.registryTreeRoot
    )

    if (!isAvailable) {
      throw new Error(
        `on proofId "${proofIdentifier}" registry root "${BigNumber.from(
          proofPublicInputs.registryTreeRoot
        ).toHexString()}" not available`
      )
    }

    // accountsTreeValue
    const groupSnapshotId = encodeAccountsTreeValue(
      claim.groupId,
      claim.groupTimestamp
    )
    if (
      !BigNumber.from(proofPublicInputs.accountsTreeValue).eq(groupSnapshotId)
    ) {
      throw new Error(
        `on proofId "${proofIdentifier}" groupId "${claim.groupId}" or timestamp "${claim.groupTimestamp}" incorrect`
      )
    }

    // proofIdentifier
    const expectedVaultNamespace = BigNumber.from(
      keccak256(
        ethers.utils.solidityPack(
          ['uint128', 'uint128'],
          [appId, BigNumber.from(0)]
        )
      )
    ).mod(SNARK_FIELD)
    if (!expectedVaultNamespace.eq(proofPublicInputs.vaultNamespace)) {
      throw new Error(
        `on proofId "${proofIdentifier}" vaultNamespace "${expectedVaultNamespace}" mismatch with input "${proofPublicInputs.vaultNamespace}"`
      )
    }
  }

  protected getCommitmentMapperPubKey = async () => {
    return this._commitmentMapperRegistry.getCommitmentMapperPubKey()
  }

  protected isRootAvailable = async (registryTreeRoot: string) => {
    if (this._registryRoot) {
      registryTreeRoot = BigNumber.from(registryTreeRoot).toHexString()
      return registryTreeRoot === this._registryRoot
    }
    return this._availableRootsRegistry.isRootAvailable(registryTreeRoot)
  }
}
