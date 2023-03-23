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
    console.log("link", link)
  });
});
  