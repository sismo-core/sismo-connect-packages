import { proofMock1 } from "./mocks";
import { BigNumber } from "@ethersproject/bignumber";
import { HydraS1VerifierMocked } from "./hydras1-verifier-mocked";
import { encodeRequestIdentifier } from "../src/verifier/utils/encodeRequestIdentifier";
import { encodeAccountsTreeValue } from "../src/verifier/utils/encodeAccountsTreeValue";
import { ProofPublicInputs } from "../src/verifier/hydras1-verifier";
import { VerifiableStatement, ZkConnectVerifier } from "../src";
import { DataRequest, ProvingScheme } from "../src/types";

describe("ZkConnect Verifier", () => {
  let hydraS1VerifierMocked: HydraS1VerifierMocked;
  let zkConnectVerifier: ZkConnectVerifier;
  let appId: string;
  let namespace: string;

  let proofPublicInputs: ProofPublicInputs;
  let verifiableStatement: VerifiableStatement;
  let dataRequest: DataRequest;

  let groupId: string;
  let groupTimestamp: number | "latest";
  let proofIdentifier: string;
  let vaultIdentifier: string;

  let expectVerifyToThrow: (
    verifiableStatement: VerifiableStatement,
    expectedError: string
  ) => Promise<void>;

  beforeAll(() => {
    appId = "0xf68985adfc209fafebfb1a956913e7fa";
    namespace = "main";

    dataRequest = new DataRequest({
      groupId: "0x682544d549b8a461d7fe3e589846bb7b",
      groupTimestamp: "latest",
      requestedValue: 1,
      comparator: "GTE",
      provingScheme: ProvingScheme.HYDRA_S1,
    });

    proofPublicInputs = {
      destinationIdentifier: proofMock1.snarkProof.input[0],
      extraData: proofMock1.snarkProof.input[1],
      commitmentMapperPubKeyX: proofMock1.snarkProof.input[2],
      commitmentMapperPubKeyY: proofMock1.snarkProof.input[3],
      registryTreeRoot: proofMock1.snarkProof.input[4],
      requestIdentifier: proofMock1.snarkProof.input[5],
      proofIdentifier: proofMock1.snarkProof.input[6],
      statementValue: proofMock1.snarkProof.input[7],
      accountsTreeValue: proofMock1.snarkProof.input[8],
      statementComparator: proofMock1.snarkProof.input[9],
      vaultIdentifier: proofMock1.snarkProof.input[10],
      vaultNamespace: proofMock1.snarkProof.input[11],
      sourceVerificationEnabled: proofMock1.snarkProof.input[12],
      destinationVerificationEnabled: proofMock1.snarkProof.input[13],
    };

    hydraS1VerifierMocked = new HydraS1VerifierMocked({
      commitmentMapperPubKey: [
        BigNumber.from(proofMock1.snarkProof.input[2]),
        BigNumber.from(proofMock1.snarkProof.input[3]),
      ],
    });

    verifiableStatement = {
      value: dataRequest.statementRequests[0].requestedValue as number,
      comparator: dataRequest.statementRequests[0].comparator,
      groupId: dataRequest.statementRequests[0].groupId,
      groupTimestamp: dataRequest.statementRequests[0].groupTimestamp,
      provingScheme: dataRequest.statementRequests[0].provingScheme,
      proof: proofMock1.snarkProof,
    };

    groupId = dataRequest.statementRequests[0].groupId;
    groupTimestamp = dataRequest.statementRequests[0].groupTimestamp as
      | number
      | "latest";
    proofIdentifier = proofPublicInputs.proofIdentifier;
    vaultIdentifier = proofPublicInputs.vaultIdentifier;

    expectVerifyToThrow = async (
      verifiableStatement: VerifiableStatement,
      errorMessage: string
    ) => {
      await expect(
        hydraS1VerifierMocked.verify({
          namespace,
          appId,
          verifiableStatement,
        })
      ).rejects.toThrow(errorMessage);
    };
  });

  describe("check externalNullifier + accounts tree value encode functions", () => {
    it("Should encode the right external nullifier", async () => {
      const externalNullifier = encodeRequestIdentifier(
        appId,
        groupId,
        groupTimestamp,
        namespace
      );
      expect(BigNumber.from(externalNullifier).toString()).toEqual(
        proofPublicInputs.requestIdentifier
      );
    });

    it("Should encode the right Accounts Tree value", async () => {
      const accountsTreeValue = encodeAccountsTreeValue(
        groupId,
        groupTimestamp
      );
      expect(BigNumber.from(accountsTreeValue).toString()).toEqual(
        proofPublicInputs.accountsTreeValue
      );
    });
  });

  /********************************************************************************************************/
  /******************************************** VALIDATE INPUT ********************************************/
  /********************************************************************************************************/

  describe("validateInput", () => {
    it("Should throw with incorrect input comparator", async () => {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.comparator = "EQ";
      const statementComparatorFromInput =
        proofPublicInputs.statementComparator === "0";
      await expectVerifyToThrow(
        invalidStatement,
        `on proofId "${proofIdentifier}" statement comparator "${invalidStatement.comparator}" mismatch with proof input statementComparator "${!statementComparatorFromInput}"`
      );
    });

    it("Should throw with incorrect proof value", async () => {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.value = 2;
      await expectVerifyToThrow(
        invalidStatement,
        `on proofId "${proofIdentifier}" value "${invalidStatement.value}" mismatch with proof input statementValue "${proofPublicInputs.statementValue}"`
      );
    });

    it("Should throw with incorrect input requestIdentifier", async () => {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.proof.input[5] = invalidStatement.proof.input[5] + "1";
      const requestIdentifier = encodeRequestIdentifier(
        appId,
        groupId,
        groupTimestamp,
        namespace
      );
      await expectVerifyToThrow(
        invalidStatement,
        `on proofId "${proofIdentifier}" requestIdentifier "${BigNumber.from(
          requestIdentifier
        ).toHexString()}" mismatch with proof input requestIdentifier "${BigNumber.from(
          invalidStatement.proof.input[5]
        ).toHexString()}"`
      );
    });

    it("Should throw with incorrect input commitmentMapperPubKeyX", async () => {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.proof.input[2] = invalidStatement.proof.input[2] + "1";
      await expectVerifyToThrow(
        invalidStatement,
        `on proofId "${proofIdentifier}" commitmentMapperPubKeyX "${BigNumber.from(
          proofMock1.commitmentMapperPubKey[0]
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(
          invalidStatement.proof.input[2]
        ).toHexString()}"`
      );
    });

    it("Should throw with incorrect input commitmentMapperPubKeyX", async () => {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.proof.input[3] = invalidStatement.proof.input[3] + "1";
      await expectVerifyToThrow(
        invalidStatement,

        `on proofId "${proofIdentifier}" commitmentMapperPubKeyY "${BigNumber.from(
          proofMock1.commitmentMapperPubKey[1]
        ).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(
          invalidStatement.proof.input[3]
        ).toHexString()}"`
      );
    });

    it("Should throw with incorrect input destination", async () => {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.proof.input[0] = "0x123456789";
      await expectVerifyToThrow(
        invalidStatement,

        `on proofId "${proofIdentifier}" proof input destination must be 0`
      );
    });

    it("should throw with incorrect input destinationVerificationEnabled", async ()=> {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.proof.input[13] = "0x123456789";
      await expectVerifyToThrow(
        invalidStatement,
        `on proofId "${proofIdentifier}" proof input destinationVerificationEnabled must be 0`
      );
    })

    it("should throw with incorrect input sourceVerificationEnabled", async ()=> {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.proof.input[12] = "0x123456789";
      await expectVerifyToThrow(
        invalidStatement,
        `on proofId "${proofIdentifier}" proof input sourceVerificationEnabled must be 1`
      );
    })

    it("Should throw with incorrect accountsTreeValue", async () => {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.proof.input[8] = "0x123456789";
      await expectVerifyToThrow(
        invalidStatement,

        `on proofId "${proofIdentifier}" groupId "${invalidStatement.groupId}" or timestamp "${invalidStatement.groupTimestamp}" incorrect`
      );
    });
  });

  /********************************************************************************************************/
  /****************************************** PROOF VALIDITY **********************************************/
  /********************************************************************************************************/

  describe("proof validity", () => {
    it("Should return false", async () => {
      const invalidStatement = JSON.parse(JSON.stringify(verifiableStatement));
      invalidStatement.proof.a[0] = invalidStatement.proof.a[0] + "1";
      const isVerified = await hydraS1VerifierMocked.verify({
        appId,
        namespace,
        verifiableStatement: invalidStatement,
      });
      expect(isVerified).toEqual(false);
    });

    it("Should return true", async () => {
      const isVerified = await hydraS1VerifierMocked.verify({
        appId,
        namespace,
        verifiableStatement,
      });
      expect(isVerified).toEqual(true);
    });
  });
});
