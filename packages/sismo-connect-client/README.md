<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-main.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    Sismo Connect Client
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

Sismo Connect is single sign-on method for applications enabling aggregated data requests to users thanks to privacy. Once integrated, applications can request private, granular data from users, while users can authenticate and selectively reveal their data thanks to zero-knowledge proofs (ZKPs).

The Sismo Connect Client is a frontend package that allows to easily request data from the Sismo Data Vault app.

Here is the link to the full documentation of the package: [Sismo Connect Client package](https://docs.sismo.io/build-with-sismo-connect/technical-documentation/client).

You can learn more on Sismo Connect [here](https://docs.sismo.io/discover-sismo-connect/empower-your-app).

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) >= 18.15.0 (Latest LTS version)

## Usage

### Installation
Install Sismo Connect Client package in your frontend with npm or yarn:
```bash
# with npm
npm install @sismo-core/sismo-connect-client
# with yarn
yarn add @sismo-core/sismo-connect-client
```

### Import
Import the package in your frontend:
```typescript
import { SismoConnect, SismoConnectConfig } from "@sismo-core/sismo-connect-client";

const config: SismoConnectConfig = {
  // you will need to register an appId in the Factory
  appId: "0x8f347ca31790557391cec39b06f02dc2", 
}

// create a new SismoConnect instance with the client configuration
const sismoConnect = SismoConnect({ config });
```
See the full documentation [here](https://docs.sismo.io/build-with-sismo-connect/technical-documentation/client).

## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Send us a message in [Telegram](https://builders.sismo.io/) or [Discord](https://discord.gg/sismo)

<br/>
<img src="https://static.sismo.io/readme/bottom-main.png" alt="bottom" width="100%" >
