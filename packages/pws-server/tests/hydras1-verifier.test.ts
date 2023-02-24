import { proofMock1 } from "./mocks";
import { BigNumber } from "@ethersproject/bignumber";
import { PwsVerifierMocked } from "./hydras1-verifier-mocked";
import { encodeRequestIdentifier } from "../src/verifier/utils/encodeRequestIdentifier";
import { encodeAccountsTreeValue } from "../src/verifier/utils/encodeAccountsTreeValue";
import { Membership, TargetGroup } from "../src";
import { HYDRAS1_VERIFIER_VERSION, ProofPublicInputs } from "../src/verifier/hydras1-verifier";

describe("PwsVerifier", () => {
  let pwsVerifier: PwsVerifierMocked;
  let appId: string;
  let serviceName: string;
  let groupId: string;
  let timestamp: number | "latest";
  let acceptHigherValue: boolean;

  let membership: Membership;
  let targetGroup: TargetGroup;
  let proofPublicInputs: ProofPublicInputs;

  beforeAll(() => {
    appId = '0xc6acc12e813a48e6a8151ce405551123';
    serviceName = "main";
    groupId = "0xc4c12da439e843268db139408f1d5573";
    timestamp = "latest";
    acceptHigherValue = false;
    proofPublicInputs = {
      destination: proofMock1.snarkProof.input[0],
      chainId: proofMock1.snarkProof.input[1],
      commitmentMapperPubKeyX: proofMock1.snarkProof.input[2],
      commitmentMapperPubKeyY: proofMock1.snarkProof.input[3],
      registryTreeRoot: proofMock1.snarkProof.input[4],
      externalNullifier: proofMock1.snarkProof.input[5],
      nullifier: proofMock1.snarkProof.input[6],
      claimedValue: proofMock1.snarkProof.input[7],
      accountsTreeValue: proofMock1.snarkProof.input[8],
      isStrict: proofMock1.snarkProof.input[9],
    }

    pwsVerifier = new PwsVerifierMocked({
      commitmentMapperPubKey: [
        BigNumber.from(proofMock1.commitmentMapperPubKey[0]), 
        BigNumber.from(proofMock1.commitmentMapperPubKey[1])
      ]
    });

    membership = {
      proofId: proofPublicInputs.nullifier,
      value: 1,
      groupId,
      timestamp,
      provingScheme: "hydraS1",
      proof: proofMock1.snarkProof,
      version: HYDRAS1_VERIFIER_VERSION
    }

    targetGroup = {
      groupId, 
      timestamp,
      value: 'MAX',
      additionalProperties: {
        acceptHigherValue
      }
    }
  })

  describe('check externalNullifier + accounts tree value encode functions', () => {
    it("Should encode the right external nullifier", async () => {
      const externalNullifier = encodeRequestIdentifier(appId, groupId, timestamp, serviceName);
      expect(externalNullifier).toEqual("0x227084ef4e9392373c0f4108ff309cd1b16c94a7a7ba065d9e73b809d9159f50");
    });
    
    it("Should encode the right Accounts Tree value", async () => {
      const accountsTreeValue = encodeAccountsTreeValue(groupId, timestamp);
      expect(accountsTreeValue).toEqual("0x032ff3d8b521c27fac7022668917f3fecb91d3438c8e3dbaf07829b03ffffffc");
    });
  })

  /********************************************************************************************************/
  /******************************************* VERSION + APPID ********************************************/
  /********************************************************************************************************/

  describe('check version of the proof', () => {
    it("Should throw with invalid version of the proof", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.version = invalidMembership.version + ".0";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" proving scheme version "${invalidMembership.version}" must be "${HYDRAS1_VERIFIER_VERSION}"`)    
    });
  })

  /********************************************************************************************************/
  /******************************************** VALIDATE INPUT ********************************************/
  /********************************************************************************************************/

  describe('validateInput', () => {
    it("Should throw with incorrect input isStrict", async () => {
      const invalidTargetGroup = JSON.parse(JSON.stringify(targetGroup));
      invalidTargetGroup.additionalProperties.acceptHigherValue = true;
      const proofAcceptHigherValue = (proofPublicInputs.isStrict === "0");
      await expect(
        pwsVerifier.verify({
          membership, 
          appId, 
          serviceName, 
          targetGroup: invalidTargetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" acceptHigherValue "${invalidTargetGroup.additionalProperties.acceptHigherValue}" mismatch with proof input acceptHigherValue "${proofAcceptHigherValue}"`)    
    });

    it("Should throw with incorrect proof value", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.value = 2;
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" value "${invalidMembership.value}" mismatch with proof input claimedValue "${proofPublicInputs.claimedValue}"`)    
    });

    it("Should throw with incorrect input nullifier", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proofId = invalidMembership.proofId + "0";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup
        })
      ).rejects.toThrow(`on proofId "${invalidMembership.proofId}" invalid proof input nullifier "${proofPublicInputs.nullifier}"`)    
    });

    it("Should throw with incorrect input external nullifier", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.input[5] = invalidMembership.proof.input[5] + "1";
      const externalNullifier = encodeRequestIdentifier(appId, groupId, timestamp, serviceName);
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" requestIdentifier "${BigNumber.from(externalNullifier).toHexString()}" mismatch with proof input externalNullifier "${BigNumber.from(invalidMembership.proof.input[5]).toHexString()}"`)    
    });

    it("Should throw with incorrect input commitmentMapperPubKeyX", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.input[2] = invalidMembership.proof.input[2] + "1";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" commitmentMapperPubKeyX "${BigNumber.from(proofMock1.commitmentMapperPubKey[0]).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(invalidMembership.proof.input[2]).toHexString()}"`)    
    });

    it("Should throw with incorrect input commitmentMapperPubKeyY", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.input[3] = invalidMembership.proof.input[3] + "1";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" commitmentMapperPubKeyY "${BigNumber.from(proofMock1.commitmentMapperPubKey[1]).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(invalidMembership.proof.input[3]).toHexString()}"`)    
    });

    it("Should throw with incorrect input chainId", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.input[1] = "1";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" proof input chainId must be 0`)    
    });

    it("Should throw with incorrect input destination", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.input[0] = "0x123456789";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" proof input destination must be 0x0000000000000000000000000000000000515110`)    
    });

    it("Should throw with incorrect accountsTreeValue", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.input[8] = "0x123456789";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" groupId "${invalidMembership.groupId}" or timestamp "${invalidMembership.timestamp}" incorrect`)    
    });
  });

  /********************************************************************************************************/
  /*************************************** VALIDATE TARGET GROUP ******************************************/
  /********************************************************************************************************/

  describe('targetGroup', () => {
    it("Should throw with incorrect targetGroup groupId", async () => {
      const invalidTargetGroup = JSON.parse(JSON.stringify(targetGroup));
      invalidTargetGroup.groupId = "1";
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.input[5] = "0x2c22fb131056c3f27dc64de632312bd63eb08244ff51b8c8f394bb8bee20ac89";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup: invalidTargetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" groupId "${membership.groupId}" mismatch with targetGroup groupId "${invalidTargetGroup.groupId}"`)    
    });

    it("Should throw with incorrect targetGroup timestamp", async () => {
      const invalidTargetGroup = JSON.parse(JSON.stringify(targetGroup));
      invalidTargetGroup.timestamp = 0;
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.input[5] = "0x1706c37c2b8f34951e1a244b37a5948d40a6f2f17604a3eae4e96c0ab86c68b7";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup: invalidTargetGroup
        })
      ).rejects.toThrow(`on proofId "${membership.proofId}" timestamp "${invalidMembership.timestamp}" mismatch with targetGroup timestamp "${invalidTargetGroup.timestamp}"`)    
    });

    it("Should throw with incorrect targetGroup value", async () => {
      const invalidTargetGroup = JSON.parse(JSON.stringify(targetGroup));
      invalidTargetGroup.value = 10;
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.input[5] = "0x227084ef4e9392373c0f4108ff309cd1b16c94a7a7ba065d9e73b809d9159f50";
      await expect(
        pwsVerifier.verify({
          membership: invalidMembership, 
          appId, 
          serviceName, 
          targetGroup: invalidTargetGroup
        })
      ).rejects.toThrow(`on proofId "${invalidMembership.proofId}" value "${invalidMembership.value}" is not equal to targetGroup value "${invalidTargetGroup.value}"`)    
    });
  });

  /********************************************************************************************************/
  /****************************************** PROOF VALIDITY **********************************************/
  /********************************************************************************************************/

  describe('proof validity', () => {
    it("Should return false", async () => {
      const invalidMembership = JSON.parse(JSON.stringify(membership));
      invalidMembership.proof.a[0] = invalidMembership.proof.a[0] + "1";
      const isVerified = await pwsVerifier.verify({
        membership: invalidMembership, 
        appId, 
        serviceName, 
        targetGroup
      });
      expect(isVerified).toEqual(false);
    });

    it("Should return a verified claim with correct proof", async () => {
      const isVerified = await pwsVerifier.verify({
        membership, 
        appId, 
        serviceName, 
        targetGroup
      });
      expect(isVerified).toEqual(true)
    })
  })
})
