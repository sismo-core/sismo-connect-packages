<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-main.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    sismoConnect Server
  </h3>

  <p align="center">
    Made by <a href="https://docs.sismo.io/" target="_blank">Sismo</a>
  </p>
  
  <p align="center">
    <a href="https://twitter.com/sismo_eth" target="_blank">
        <img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white"/>
    </a>
    <a href="https://discord.gg/sismo" target="_blank">
        <img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white"/>
    </a>
    <a href="https://builders.sismo.io" target="_blank">
        <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white"/>
    </a>
  </p>
</div>

sismoConnect is a privacy-preserving single sign-on method for applications. Once integrated, applications can request private, granular data from users, while users can authenticate and selectively reveal their data thanks to zero-knowledge proofs (ZKPs). 

You can see the documentation of the sismoConnect Server package [here](https://docs.sismo.io/sismo-docs/technical-documentation/zkconnect/zkconnect-server-verify-off-chain).

## Installation
```bash
# with npm
npm install @sismo-core/sismo-connect-react
# with yarn
yarn add @sismo-core/sismo-connect-react
```

## Usage
```TypeScript
import {
  sismoConnect,
  SismoConnectServerConfig,
} from "@sismo-core/sismo-connect-react";

const sismoConnectConfig: SismoConnectServerConfig = {
  appId: "0x8f347ca31790557391cec39b06f02dc2", 
}

const sismoConnect = SismoConnect(sismoConnectConfig);

const CLAIM_REQUEST = { groupId: "0x42c768bb8ae79e4c5c05d3b51a4ec74a"};

// verifies the proofs contained in the sismoConnectResponse 
const { verifiedAuths, verifiedClaims } = await sismoConnect.verify(
  // response returned by the Sismo Data Vault and then sent by the frontend
  sismoConnectResponse,
  { 
    claims: {[CLAIM_REQUEST]}
  }
);

const proofId = verifiedClaims[0].proofId;
```

## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Send us a message in [Telegram](https://builders.sismo.io/) or [Discord](https://discord.gg/sismo)

<br/>
<img src="https://static.sismo.io/readme/bottom-main.png" alt="bottom" width="100%" >
