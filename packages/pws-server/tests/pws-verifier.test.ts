import { Claim, Proof, Request, VERSION } from "../src";
import { proofMock1 } from "./mocks";
import { BigNumber } from "@ethersproject/bignumber";
import { PwsVerifierMocked } from "./pws-verifier-mocked";
import { encodeRequestIdentifier } from "../src/utils/encodeRequestIdentifier";
import { encodeAccountsTreeValue } from "../src/utils/encodeAccountsTreeValue";

describe("PwsVerifier", () => {
  let pwsVerifier: PwsVerifierMocked;
  let appId: string;
  let serviceName: string;
  let groupId: string;
  let timestamp: number | "latest";
  let acceptHigherValue: boolean;

  let claim: Claim;
  let proof: Proof;
  let request: Request;

  beforeAll(() => {
    appId = '0xc6acc12e813a48e6a8151ce405551123';
    serviceName = "main";
    groupId = "0xc4c12da439e843268db139408f1d5573";
    timestamp = "latest";
    acceptHigherValue = false;

    pwsVerifier = new PwsVerifierMocked({
      commitmentMapperPubKey: [
        BigNumber.from(proofMock1.commitmentMapperPubKey[0]), 
        BigNumber.from(proofMock1.commitmentMapperPubKey[1])
      ]
    });

    claim = {
      appId,
      serviceName,
      value: 1,
      groupId,
      timestamp,
      acceptHigherValue,
    }

    proof = {
      snarkProof: proofMock1.snarkProof,
      version: VERSION
    }

    request = {
      appId,
      serviceName,
      groupId,
      timestamp,
      value: "MAX",
      acceptHigherValue
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
      const invalidProof = JSON.parse(JSON.stringify(proof));
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
      const invalidClaim = JSON.parse(JSON.stringify(claim));
      invalidClaim.acceptHigherValue = true;
      await expect(
        pwsVerifier.verify(request, { proofs: [proof], claims: [invalidClaim] })
      ).rejects.toThrow(`claim acceptHigherValue "${invalidClaim.acceptHigherValue}" mismatch with proof input acceptHigherValue "${!invalidClaim.acceptHigherValue}"`)    
    });

    it("Should throw with incorrect input claimedValue", async () => {
      const invalidClaim = JSON.parse(JSON.stringify(claim));
      const proofInputClaimedValue = invalidClaim.value;
      invalidClaim.value = invalidClaim.value + 1;
      await expect(
        pwsVerifier.verify(request, { proofs: [proof], claims: [invalidClaim] })
      ).rejects.toThrow(`claim value "${invalidClaim.value}" mismatch with proof input claimedValue "${proofInputClaimedValue}"`)    
    });

    it("Should throw with incorrect input external nullifier", async () => {
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[5] = invalidProof.snarkProof.input[5] + "1";
      const externalNullifier = encodeRequestIdentifier(appId, groupId, timestamp, serviceName);
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`requestIdentifier "${BigNumber.from(externalNullifier).toHexString()}" mismatch with proof input externalNullifier "${BigNumber.from(invalidProof.snarkProof.input[5]).toHexString()}"`)    
    });

    it("Should throw with incorrect input commitmentMapperPubKeyX", async () => {
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[2] = invalidProof.snarkProof.input[2] + "1";
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`commitmentMapperPubKeyX "${BigNumber.from(proofMock1.commitmentMapperPubKey[0]).toHexString()}" mismatch with proof input commitmentMapperPubKeyX "${BigNumber.from(invalidProof.snarkProof.input[2]).toHexString()}"`)    
    });

    it("Should throw with incorrect input commitmentMapperPubKeyY", async () => {
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[3] = invalidProof.snarkProof.input[3] + "1";
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`commitmentMapperPubKeyY "${BigNumber.from(proofMock1.commitmentMapperPubKey[1]).toHexString()}" mismatch with proof input commitmentMapperPubKeyY "${BigNumber.from(invalidProof.snarkProof.input[3]).toHexString()}"`)    
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

    it("Should throw with incorrect accountsTreeValue", async () => {
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[8] = "0x123456789";

      const accountsTreeValue = encodeAccountsTreeValue(groupId, timestamp);
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`claim accountsTreeValue "${accountsTreeValue}" mismatch with proof input accountsTreeValue "${invalidProof.snarkProof.input[8]}"`)    
    });
  });

  /********************************************************************************************************/
  /****************************************** VALIDATE REQUEST ********************************************/
  /********************************************************************************************************/

  describe('validateRequest', () => {
    it("Should throw with incorrect request groupId", async () => {
      const invalidRequest = JSON.parse(JSON.stringify(request));
      invalidRequest.groupId = "1";
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[5] = "0x2c22fb131056c3f27dc64de632312bd63eb08244ff51b8c8f394bb8bee20ac89";
      await expect(
        pwsVerifier.verify(invalidRequest, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`request groupId "${invalidRequest.groupId}" mismatch with claim groupId "${claim.groupId}"`)    
    });

    it("Should throw with incorrect request timestamp", async () => {
      const invalidRequest = JSON.parse(JSON.stringify(request));
      invalidRequest.timestamp = 0;
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[5] = "0x1706c37c2b8f34951e1a244b37a5948d40a6f2f17604a3eae4e96c0ab86c68b7";
      await expect(
        pwsVerifier.verify(invalidRequest, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`request timestamp "${invalidRequest.timestamp}" mismatch with claim timestamp "${claim.timestamp}"`)    
    });

    it("Should throw with incorrect request value", async () => {
      const invalidRequest = JSON.parse(JSON.stringify(request));
      invalidRequest.value = 10;
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[5] = "0x227084ef4e9392373c0f4108ff309cd1b16c94a7a7ba065d9e73b809d9159f50";
      await expect(
        pwsVerifier.verify(invalidRequest, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`request value "${invalidRequest.value}" is higher than claim value "${claim.value}"`)    
    });

    it("Should throw with incorrect acceptHigherValue", async () => {
      const invalidRequest = JSON.parse(JSON.stringify(request));
      invalidRequest.acceptHigherValue = true;
      const invalidProof= JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[9] = "1";
      await expect(
        pwsVerifier.verify(invalidRequest, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`request acceptHigherValue "${invalidRequest.acceptHigherValue}" mismatch with claim acceptHigherValue "${claim.acceptHigherValue}"`)    
    });
    
    it("Should throw with acceptHigherValue false and claim.value > request.value", async () => {
      const invalidClaim= JSON.parse(JSON.stringify(claim));
      invalidClaim.value = 2;
      const invalidProof= JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[7] = "2";
      const invalidRequest= JSON.parse(JSON.stringify(request));
      invalidRequest.value = 1;
      await expect(
        pwsVerifier.verify(invalidRequest, { proofs: [invalidProof], claims: [invalidClaim] })
      ).rejects.toThrow(`with acceptHigherValue "false" request value "${invalidRequest.value}" can't be lower than claim value "${invalidClaim.value}"`)    
    });

    it("Should throw with incorrect appId", async () => {
      const invalidRequest = JSON.parse(JSON.stringify(request));
      invalidRequest.appId = "1230";
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.input[5] = "0x0b7994dcd861d5517a3975efa64e4341285c5c56c5af3d801b79f04ec3f88758";
      await expect(
        pwsVerifier.verify(invalidRequest, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow(`request appId "${invalidRequest.appId}" mismatch with claim appId "${claim.appId}"`)    
    });
  });

  /********************************************************************************************************/
  /****************************************** PROOF VALIDITY **********************************************/
  /********************************************************************************************************/

  describe('proof validity', () => {
    it("Should throw with incorrect proof", async () => {
      const invalidProof = JSON.parse(JSON.stringify(proof));
      invalidProof.snarkProof.a[0] = invalidProof.snarkProof.a[0] + "1";
      await expect(
        pwsVerifier.verify(request, { proofs: [invalidProof], claims: [claim] })
      ).rejects.toThrow("proof not valid")  
    });

    it("Should return a verified claim with correct proof", async () => {
      const verifiedClaim = await pwsVerifier.verify(request, { proofs: [proof], claims: [claim] });
      expect(verifiedClaim).toEqual([{
        appId: '0xc6acc12e813a48e6a8151ce405551123',
        serviceName: 'main',
        serviceId: "0xc6acc12e813a48e6a8151ce405551123b8e2054f8a912367e38a22ce773328ff",
        groupSnapshotId: "0x032ff3d8b521c27fac7022668917f3fecb91d3438c8e3dbaf07829b03ffffffc",
        value: 1,
        acceptHigherValue: false,
        groupId: '0xc4c12da439e843268db139408f1d5573',
        timestamp: 'latest',
        proofId: '8972282394841268138633080018831883405423777974665648640910556154949929529300',
        requestIdentifier: "0x227084ef4e9392373c0f4108ff309cd1b16c94a7a7ba065d9e73b809d9159f50",
        __snarkProof: {
          input: [
            '5329168',
            '0',
            '3268380547641047729088085784617708493474401130426516096643943726492544573596',
            '15390691699624678165709040191639591743681460873292995904381058558679154201615',
            '18842723479429738246940957542769420419574146477922407789765830653118305296077',
            '15577441205306332055325931989411418517707301098017345995017221025629465845584',
            '8972282394841268138633080018831883405423777974665648640910556154949929529300',
            '1',
            '1441663324580546192156355205263195961988190260857585525130097835837963108348',
            '1'
          ],
          a: [
            '4196736981696408709086117209472386403791660536026706959200452407795010156604',
            '10580236049154242771546166284584401854611591853679777784963153391363424691954'
          ],
          b: [
            [
              '21830407776151870670024118581447977151357859514884184106141072711593241127597',
              '9176031632615948628380541651774655423474358409175566600161655728696414402014'
            ],
            [
              '5681414268806358182066702054377689227486911090254536963556758484068123421602',
              '20696263251728531998359123510072866687967761505540730550489315318398013516015'
            ]
          ],
          c: [
            '16981187939803963895177873437103091261521867024828554602853151345947339905502',
            '5791640696146075943241392388778281863220982357101564680314775332054029456965'
          ]
        },
      }]);
    })
  })
})
