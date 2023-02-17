import { Claim, Proof, Request, VERSION } from "../src";
import { proofMock1 } from "./mocks";
import { BigNumber } from "@ethersproject/bignumber";
import { PwsVerifierMocked } from "./pws-verifier-mocked";

describe("PwsVerifier", () => {
  let pwsVerifier: PwsVerifierMocked;
  let appId: string;
  let serviceName: string;
  let groupId: string;
  let timestamp: number;
  let isStrict: boolean;

  let claim: Claim;
  let proof: Proof;
  let request: Request;

  beforeAll(() => {
    appId = "123-456-789";
    serviceName = "main";
    groupId = "group-id";
    timestamp = 0;
    isStrict = true;

    pwsVerifier = new PwsVerifierMocked({
      commitmentMapperPubKey: [
        BigNumber.from(proofMock1.commitmentMapperPubKey[0]), 
        BigNumber.from(proofMock1.commitmentMapperPubKey[1])
      ]
    }, { 
      appId 
    });

    claim = {
      appId,
      serviceName,
      value: 1,
      groupId,
      timestamp,
      isStrict,
    }

    proof = {
      snarkProof: proofMock1.snarkProof,
      version: VERSION
    }

    request = {
      groupId,
      timestamp,
      value: "MAX"
    }
  })

  describe('Check externalNullifier + accounts tree value encode functions', () => {
    it("Should encode the right external nullifier", async () => {
      const appId = 'c6acc12e-813a-48e6-a815-1ce405551123';
      const groupId = 'c4c12da4-39e8-4326-8db1-39408f1d5573';
      const timestamp = 'latest';
      const serviceName = 'main';
      const externalNullifier = pwsVerifier.encodeExternalNullifier(appId, groupId, timestamp, serviceName);
      expect(externalNullifier).toEqual("0x2798e8c3d3c84c7fdd18e9c3d22773a2b9a9e97c1c8a3bd999c96516685e555e");
    });

    it("Should encode the right Accounts Tree value", async () => {
      const groupId = 'c4c12da4-39e8-4326-8db1-39408f1d5573';
      const timestamp = 'latest';
      const accountsTreeValue = pwsVerifier.encodeTreeValue(groupId, timestamp);
      expect(accountsTreeValue).toEqual("0x02d736340d55f9b8e06b75c021badf5103c68b44d0f1bd272ac5f5a0c6164bd8");
    });
  })

  /********************************************************************************************************/
  /******************************************* VERSION + APPID ********************************************/
  /********************************************************************************************************/

  describe('Check version and appId', () => {
    it("Should throw with incorrect appId", async () => {
      const invalidClaim = {...claim};
      invalidClaim.appId = invalidClaim.appId + "-invalid";
      await expect(
        pwsVerifier.verify(request, { proofs: [proof], claims: [invalidClaim] })
      ).rejects.toThrow(`claim appId "${invalidClaim.appId}" mismatch with verifier appId "${appId}"`)    
    });

    it("Should throw with invalid version of the proof", async () => {
      const invalidProof = {...proof};
      invalidProof.version = invalidProof.version + "-invalid";
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`version of the proof "${invalidProof.version}" not compatible with this verifier "${VERSION}"`)    
    });

    it("Should throw with more than one claim", async () => {
      await expect(
        pwsVerifier.verify(request, { proofs: [proof], claims: [claim, claim] })
      ).rejects.toThrow(`current version of the package does not support more than one claim`)    
    });

    it("Should throw with more than one proof", async () => {
      await expect(
        pwsVerifier.verify(request, { proofs: [proof, proof], claims: [claim] })
      ).rejects.toThrow(`current version of the package does not support more than one proof`)    
    });
  })

  /********************************************************************************************************/
  /******************************************** VALIDATE INPUT ********************************************/
  /********************************************************************************************************/

  describe('validateInput', () => {
    it("Should throw with incorrect input isStrict", async () => {
      const invalidClaim = {...claim};
      const proofInputIsStrict = invalidClaim.isStrict;
      invalidClaim.isStrict = false;
      await expect(
        pwsVerifier.verify(request, { proofs: [proof], claims: [invalidClaim] })
      ).rejects.toThrow(`claim isStrict "${invalidClaim.isStrict}" mismatch with proof input isStrict "${proofInputIsStrict}"`)    
    });

    it("Should throw with incorrect input claimedValue", async () => {
      const invalidClaim = {...claim};
      const proofInputClaimedValue = invalidClaim.value;
      invalidClaim.value = invalidClaim.value + 1;
      await expect(
        pwsVerifier.verify(request, { proofs: [proof], claims: [invalidClaim] })
      ).rejects.toThrow(`claim value "${invalidClaim.value}" mismatch with proof input claimedValue "${proofInputClaimedValue}"`)    
    });

    //TODO Test externalNullifier

    it("Should throw with incorrect input commitmentMapperPubKeyX", async () => {
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[2] = invalidProof.snarkProof.input[2] + "1";
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`commitmentMapperPubKeyX "${proofMock1.commitmentMapperPubKey[0]}" mismatch with proof input commitmentMapperPubKeyX "${invalidProof.snarkProof.input[2]}"`)    
    });

    it("Should throw with incorrect input commitmentMapperPubKeyY", async () => {
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[3] = invalidProof.snarkProof.input[3] + "1";
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`commitmentMapperPubKeyY "${proofMock1.commitmentMapperPubKey[1]}" mismatch with proof input commitmentMapperPubKeyY "${invalidProof.snarkProof.input[3]}"`)    
    });

    it("Should throw with incorrect input chainId", async () => {
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[1] = "1";
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`proof input chainId must be 0`)    
    });

    it("Should throw with incorrect input destination", async () => {
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[0] = "0x123456789";
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`proof input destination must be 0x0000000000000000000000000000000000515110`)    
    });
  });

  /********************************************************************************************************/
  /****************************************** VALIDATE REQUEST ********************************************/
  /********************************************************************************************************/

  describe('validateRequest', () => {
    it("Should throw with incorrect request groupId", async () => {
      const invalidRequest = JSON.parse(JSON.stringify(request));
      invalidRequest.groupId = "1";
      await expect(
        pwsVerifier.verify(invalidRequest, { proofs: [proof], claims: [claim] })
      ).rejects.toThrow(`request groupId "${invalidRequest.groupId}" mismatch with claim groupId "${claim.groupId}"`)    
    });

    it("Should throw with value max and claim isStrict false", async () => {
      const invalidClaim = JSON.parse(JSON.stringify(claim));
      invalidClaim.isStrict = false;
      const invalidProof= JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[9] = "0";
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [invalidClaim] })
      ).rejects.toThrow(`request value "MAX" mismatch with claim isStrict "false"`)    
    });


    it("Should throw with acceptHigherValue false and request.value !== claim.value", async () => {
      const invalidRequest = JSON.parse(JSON.stringify(request));
      invalidRequest.acceptHigherValue = false;
      invalidRequest.value = "2";
      const invalidProof= JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[7] = "3";
      const invalidClaim= JSON.parse(JSON.stringify(claim));
      invalidClaim.value = "3";
      await expect(
        pwsVerifier.verify(invalidRequest, { proofs: [invalidProof], claims: [invalidClaim] })
      ).rejects.toThrow(`with acceptHigherValue "false" request value ${invalidRequest.value} must be equal to claim value ${invalidClaim.value}`)    
    });
  })

  /********************************************************************************************************/
  /****************************************** PROOF VALIDITY **********************************************/
  /********************************************************************************************************/

  describe('proof validity', () => {
    //TODO Check proof validity
  })
});
