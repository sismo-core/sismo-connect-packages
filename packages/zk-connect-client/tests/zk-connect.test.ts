import { DataRequest, DataRequestType, ZkConnect, ZkConnectClient, ZkConnectClientConfig } from "../src";
  
describe("ZkConnect", () => {
  let appId: string;
  let groupId: string;
  let namespace: string;
  let dataRequest: DataRequestType;

  let zkConnect: ZkConnectClient;
   
  beforeAll(() => {
    appId = "0xf68985adfc209fafebfb1a956913e7fa";
    groupId = "0x682544d549b8a461d7fe3e589846bb7b"
    namespace = "main";

    const config: ZkConnectClientConfig = {
      appId
    }

    dataRequest = DataRequest({ groupId });
    zkConnect = ZkConnect(config);
  });
  
  it("should generate a request link", async () => {
    const link = zkConnect.getRequestLink({
      dataRequest,
      namespace
    })
    expect(
      link
    ).toEqual(`https://vault-beta.sismo.io/connect?version=zk-connect-v1&appId=0xf68985adfc209fafebfb1a956913e7fa&dataRequest={"statementRequests":[{"groupId":"0x682544d549b8a461d7fe3e589846bb7b","groupTimestamp":"latest","requestedValue":1,"comparator":"GTE","provingScheme":"hydra-s2.1","extraData":null}],"operator":null}&namespace=main`)
  });
});
  