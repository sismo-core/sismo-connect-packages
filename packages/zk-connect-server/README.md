<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-main.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    ZK Connect Server
  </h3>

  <p align="center">
    Made by <a href="https://docs.sismo.io/" target="_blank">Sismo</a>
  </p>
  
  <p align="center">
    <a href="https://discord.gg/sismo" target="_blank">
        <img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white"/>
    </a>
    <a href="https://twitter.com/sismo_eth" target="_blank">
        <img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white"/>
    </a>
  </p>
</div>

ZK Connect is a privacy-preserving single sign-on method for applications. Once integrated, applications can request private, granular data from users, while users can authenticate and selectively reveal their data thanks to zero-knowledge proofs (ZKPs). 

The ZK Connect Server is a backend package to easily verify ZKPs from users of Sismo.

You can see the GitHub repository [here](https://github.com/sismo-core/zk-connect-packages) and the frontend package [here](https://github.com/sismo-core/zk-connect-packages/tree/main/packages/zk-connect-client).

In order to use ZK Connect, you will need to have an `appId` registered in the Sismo Factory. You can register your appId [here](https://factory.sismo.io/apps-explorer).

You can see this guide for a full example of how to integrate ZK Connect in your application: [ZK Connect Guide](https://docs.sismo.io/docs/zk-connect-guide).

## Installation

```
# with npm
npm i @sismo-core/zk-connect-server
# with yarn
yarn add @sismo-core/zk-connect-server
```

## Usage

```typescript
import { ZkConnect } from "@sismo-core/zk-connect-server"

const zkConnect = new ZkConnect({ 
  appId: "your-app-id"
});

const DATA_REQUEST = new DataRequest({ groupId: "your-group-id" });

const emails = new Map();

const app = express();
app.use(express.json());

app.post('/subscribe-newsletter', async (req, res) => {
  const { zkConnectResponse, email } = req.body;
  try {
    const { vaultId } = await zkConnect.verify({
      zkConnectResponse,
      dataRequest: DATA_REQUEST,
    })
    if (emails.has(vaultId)) {
      res.send({ status: "error", message: "proof already used" });
    } else {
      emails.set(vaultId, email);
      res.send({ status: "subscribed" });
    }
  } catch (e) {
    res.send({ status: "error", message: "proof not valid" });
  }
})

app.listen(8080)
```

## Documentation

### verify

```typescript
export type ZkConnectVerifiedResult = ZkConnectResponse & {
  vaultId: string;
  verifiedStatements: VerifiedStatement[];
};

async function verify({ zkConnectResponse, dataRequest, namespace }: VerifyParamsZkConnect): Promise<ZkConnectVerifiedResult>
```

| Params | Type | Required | Default | Description |
|---|---|---|---|---|
| zkConnectResponse | ZKConnectResponse | true | - | Object sent from the front containing the verifiable statements and their ZKPs |
| dataRequest | DataRequest | false | undefined | Contains the statements from which proofs are created |
| namespace | string | false | "main" | service from which the proof is ask |

If the proof contained in the zkConnectResponse is valid, the function should return a `ZkConnectVerifiedResult`, otherwise, it should return an error.

In a `ZkConnectVerifiedResult`, you can find a vaultId, which is a unique identifier that identifies a Data Vault from Sismo. 

It is worth noting that the vaultIt is deterministically generated based on the user vault secret and the appId with a poseidon hash. This means that if a user has already used your app, the vaultId will be the same but the vaultId is different for each app. This is useful if you want to store the vaultId in your database to link it to a user while preserving the privacy of this same user between apps.

You can also find a proofId in the `verifiedStatements` of the `ZkConnectVerifiedResult`. This proofId is a unique identifier that identifies a proof from Sismo. 
This proofId is also deterministically generated based on the appId, the namespace, the groupId and the groupTimestamp. This proofId will allow to know if a user already proved something to your app for a specific namespace and group.

## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Prefer [Discord](https://discord.gg/sismo) or [Twitter](https://twitter.com/sismo_eth)

<br/>
<img src="https://static.sismo.io/readme/bottom-main.png" alt="bottom" width="100%" >
