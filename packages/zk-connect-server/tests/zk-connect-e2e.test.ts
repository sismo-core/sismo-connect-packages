import {
  DataRequest,
  DataRequestType,
  ZkConnect,
  ZkConnectResponse,
  ZkConnectServer,
  ZkConnectVerifiedResult,
  ZK_CONNECT_VERSION,
} from "../src";
import { zkConnectResponseMock } from "./mocks";
import { ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";

describe("ZkConnect", () => {
  let zkConnect: ZkConnectServer;
  let zkConnectResponse: ZkConnectResponse;
  let appId: string;
  let groupId: string;
  let namespace: string;
  let dataRequest: DataRequestType;

  beforeAll(() => {
    appId = "0x112a692a2005259c25f6094161007967";
    groupId = "0xe9ed316946d3d98dfcd829a53ec9822e"
    namespace = "main";
    zkConnectResponse = zkConnectResponseMock;
    const _provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth_goerli", 5);

    dataRequest = DataRequest({ groupId });
    zkConnect = ZkConnect({
      appId,
      options: {
        provider: _provider,
        verifier: {
          hydraS1: {
            commitmentMapperRegistryAddress: "0x0844662f25817B735BC9B6d9D11995F1A6c4dCB1",
            availableRootsRegistryAddress: "0xdDa4c8d2933dAA21Aac75B88fF59725725ba813F",
          },
        },
      },
    });

    // Mocking the IsRootAvailable method to return true even if the root is no longer available
    const isRootAvailableMock = jest.spyOn(
      zkConnect["_verifier"]["hydraS1Verifier"] as any,
      "IsRootAvailable"
    );
    isRootAvailableMock.mockImplementation(async () => {
      return true;
    });
  });

  describe("zkConnect server", () => {
    describe("verify with statements", () => {
      it("should throw with an invalid version", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.version = "off-chain-2";
        await expect(
          zkConnect.verify(invalidZkConnectResponse, { dataRequest, namespace })
        ).rejects.toThrow(
          `version of the zkConnectResponse "${invalidZkConnectResponse.version}" not compatible with this version "${ZK_CONNECT_VERSION}"`
        );
      });

      it("should throw with an invalid appId", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.appId = "0x123";
        await expect(
          zkConnect.verify(invalidZkConnectResponse, { dataRequest, namespace })
        ).rejects.toThrow(
          `zkConnectResponse appId "${invalidZkConnectResponse.appId}" does not match with server appId "${appId}"`
        );
      });

      it("should throw with an invalid namespace", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.namespace = "main2";
        await expect(
          zkConnect.verify(invalidZkConnectResponse, { dataRequest, namespace })
        ).rejects.toThrow(
          `zkConnectResponse namespace "${invalidZkConnectResponse.namespace}" does not match with server namespace "${namespace}"`
        );
      });

      it("should throw with an invalid groupId", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.verifiableStatements[0].groupId = "0x123";
        await expect(
          zkConnect.verify(invalidZkConnectResponse, { dataRequest, namespace })
        ).rejects.toThrow(
          `No statementRequest found for verifiableStatement groupId ${invalidZkConnectResponse.verifiableStatements[0].groupId} and groupTimestamp ${invalidZkConnectResponse.verifiableStatements[0].groupTimestamp}`
        );
      });

      it("should throw with an invalid groupTimestamp", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.verifiableStatements[0].groupTimestamp = 123456;
        await expect(
          zkConnect.verify(invalidZkConnectResponse, { dataRequest, namespace })
        ).rejects.toThrow(
          `No statementRequest found for verifiableStatement groupId ${invalidZkConnectResponse.verifiableStatements[0].groupId} and groupTimestamp ${invalidZkConnectResponse.verifiableStatements[0].groupTimestamp}`
        );
      });

      it("should throw with an invalid comparator", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.verifiableStatements[0].comparator = "EQ";
        await expect(
          zkConnect.verify(invalidZkConnectResponse, { dataRequest, namespace })
        ).rejects.toThrow(
          `The verifiableStatement comparator ${invalidZkConnectResponse.verifiableStatements[0].comparator} does not match the statementRequest comparator ${dataRequest.statementRequests[0].comparator}`
        );
      });

      it("should throw with an invalid value", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.verifiableStatements[0].value = 2;
        await expect(
          zkConnect.verify(invalidZkConnectResponse, { dataRequest, namespace })
        ).rejects.toThrow(
          `The verifiableStatement value ${invalidZkConnectResponse.verifiableStatements[0].value} does not match the statementRequest requestedValue ${dataRequest.statementRequests[0].requestedValue}`
        );
      });

      it("should throw with two verifiableStatements", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.verifiableStatements.push(
          invalidZkConnectResponse.verifiableStatements[0]
        );
        await expect(
          zkConnect.verify(invalidZkConnectResponse, { dataRequest, namespace })
        ).rejects.toThrow(
          `The zkConnectResponse contains more than one verifiableStatement, this is not supported yet.`
        );
      });

      it("should throw with no verifiable statement and one statement request", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.verifiableStatements = [];
        await expect(
          zkConnect.verify(invalidZkConnectResponse, { dataRequest, namespace })
        ).rejects.toThrow(
          `The zkConnectResponse contains less verifiableStatements than requested statements.`
        );
      });

      it("Should verify", async () => {
        const isVerified = await zkConnect.verify(zkConnectResponse, {
          dataRequest,
          namespace: "main",
        });
        expect(isVerified).toEqual({
          appId,
          namespace: "main",
          verifiableStatements: [
            {
              groupId,
              value: 1,
              groupTimestamp: "latest",
              comparator: "GTE",
              provingScheme: "hydra-s1.2",
              proof: zkConnectResponseMock.verifiableStatements[0].proof,
            },
          ],
          version: "off-chain-1",
          vaultId: "0x0be05f26254c541fb4f0d48db44cd17a5fb108d10faa7915625d37f8af46da45",
          verifiedStatements: [
            {
              groupId,
              value: 1,
              groupTimestamp: "latest",
              comparator: "GTE",
              provingScheme: "hydra-s1.2",
              proofId: "0x2267c2a2b36ab22fd6348e41d513b16cae9732e3422ffe37e432c1aa2e9e7e94",
              proof: zkConnectResponseMock.verifiableStatements[0].proof,
            },
          ],
        } as ZkConnectVerifiedResult);
      });
    });

    describe("verify without statements", () => {
      it("should throw with no verifiable statement, no statement request and no authProof", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.verifiableStatements = [];
        const invalidDataRequest = JSON.parse(JSON.stringify(dataRequest));
        invalidDataRequest.statementRequests = [];
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            dataRequest: invalidDataRequest,
            namespace,
          })
        ).rejects.toThrow(`The authProof is required when no verifiableStatements are provided`);
      });

      it("should throw with no verifiable statement, no statement request and invalid authProof proving Scheme", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.authProof = {
          proof: JSON.parse(JSON.stringify(zkConnectResponseMock.verifiableStatements[0].proof)),
          provingScheme: "invalid",
        };
        invalidZkConnectResponse.verifiableStatements = [];

        const invalidDataRequest = JSON.parse(JSON.stringify(dataRequest));
        invalidDataRequest.statementRequests = [];
        
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            dataRequest: invalidDataRequest,
            namespace,
          })
        ).rejects.toThrow(
          `authProof proving scheme "${invalidZkConnectResponse.authProof.provingScheme}" not supported in this version`
        );
      });

      it("should throw with no verifiable statement, no statement request and invalid authProof proof (vaultNamespace is incorrect)", async () => {
        const invalidZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        invalidZkConnectResponse.authProof = {
          proof: JSON.parse(JSON.stringify(zkConnectResponseMock.verifiableStatements[0].proof)),
          provingScheme: zkConnectResponseMock.verifiableStatements[0].provingScheme,
        };
        invalidZkConnectResponse.verifiableStatements = [];

        const newDataRequest = JSON.parse(JSON.stringify(dataRequest));
        newDataRequest.statementRequests = [];
        
        invalidZkConnectResponse.authProof.proof.input[11] = "1"; // vaultNamespace
        await expect(
          zkConnect.verify(invalidZkConnectResponse, {
            dataRequest: newDataRequest,
            namespace,
          })
        ).rejects.toThrow(
          `vaultNamespace "${invalidZkConnectResponse.authProof.proof.input[11]}" mismatch with appId "${BigNumber.from(appId).toString()}"`
        );
      });

      it("should verify with no verifiable statement, no statement request and valid authProof", async () => {
        const newZkConnectResponse = JSON.parse(JSON.stringify(zkConnectResponse));
        newZkConnectResponse.authProof = {
          proof: zkConnectResponseMock.verifiableStatements[0].proof,
          provingScheme: zkConnectResponseMock.verifiableStatements[0].provingScheme,
        };
        newZkConnectResponse.verifiableStatements = [];

        const newDataRequest = JSON.parse(JSON.stringify(dataRequest));
        newDataRequest.statementRequests = [];

        const isVerified = await zkConnect.verify(newZkConnectResponse, {
          dataRequest: newDataRequest,
          namespace: "main",
        });
        expect(isVerified).toEqual({
          appId,
          namespace: "main",
          verifiableStatements: [],
          authProof: {
            provingScheme: 'hydra-s1.2',
            proof: zkConnectResponseMock.verifiableStatements[0].proof,
          },
          version: "off-chain-1",
          vaultId: "0x0be05f26254c541fb4f0d48db44cd17a5fb108d10faa7915625d37f8af46da45",
          verifiedStatements: [],
        } as ZkConnectVerifiedResult);
      });
    });
  });
});
