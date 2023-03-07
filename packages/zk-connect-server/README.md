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

[ZK Connect presentation]

## Installation

```
$ yarn add @sismo-core/zk-connect-server
$ npm i @sismo-core/zk-connect-server
```

## Usage

```javascript
import express from 'express';
import { ZkConnect } from "@sismo-core/zk-connect-server-private"

const zkConnect = new ZkConnect({ 
  appId: "your-ap-id"
});

//This target group should not be send by the front, it should be hard coded in the backend
const DATA_REQUEST = new DataRequest({ groupId: "your-group-id" });

const emails = new Map();

const app = express();
app.use(express.json());

app.post('/subscribe-newsletter', async (req, res) => {
  const { zkConnectResponse, email } = req.body;
  try {
    const receipt = await zkConnect.verify({
      proof: zkConnectResponse,
      targetGroup: TARGET_GROUP
    })
    if (emails.has(receipt.proofId)) {
      res.send({
        status: "success"
      });
    } else {
      emails.set(receipt.proofId, email);
      res.send({
        status: "error",
        message: "proof already used to register another email"
      });
    }
  } catch (e) {
    res.send({
        status: "error",
        message: "proof not valid"
    });
  }
})

app.listen(8080)
```

## Documentation

### verify

```javascript
export type PwsReceipt = {
    proofId?: string;
    provedMembership?: Membership;
    proofIds: string[];
    provedMemberships: Membership[];
};

async function verify({ proof, targetGroup, serviceName }: VerifyParams): Promise<PwsReceipt[]>
```

| Params | Type | Description |
|---|---|---|
| proof |  | |
| targetGroup |  |  |
| serviceName |  |  |

If the proof is valid, the function should return a `PwsReceipt`, otherwise, it should return an error.

In a `PwsReceipt`, you can find a proofId, which is a unique number that identifies a proof.

The proofId is deterministically generated based on the following elements:
- The source account used to generate the proof
- The group your user is proving membership in
- The appId
- An optional serviceName, which represents the specific service of the app that requested the proof

By storing the proofId, you can determine if a source account has already been used in your app for a specific source account and group.


## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Prefer [Discord](https://discord.gg/sismo) or [Twitter](https://twitter.com/sismo_eth)

<br/>
<img src="https://static.sismo.io/readme/bottom-main.png" alt="bottom" width="100%" >
