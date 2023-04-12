<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-main.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    sismoConnect React
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

The sismoConnect React package is a wrapper of the sismoConnect client package which is a package build on top of the Sismo Data Vault app (the prover) to easily request proofs from your users.

You can see the documentation of the sismoConnect React package [here](https://docs.sismo.io/sismo-docs/technical-documentation/sismo-connect/react).

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
  SismoConnectButton,
  SismoConnectClientConfig,
  SismoConnectResponse,
} from "@sismo-core/sismo-connect-react";

const sismoConnectConfig: SismoConnectClientConfig = {
  appId: "0x8f347ca31790557391cec39b06f02dc2", 
}

export default function fullSismoConnectFlow() {
  let verifying = false;

  const verify = async (response: SismoConnectResponse) => {
    verifying = true;
    // verify the proof on a server using sismo-connect-server
    ...
  }

  return(
    <SismoConnectButton
      config={sismoConnectConfig}
      signature={{ message: "0x1234568" }}
      claims={[{ groupId: "0x42c768bb8ae79e4c5c05d3b51a4ec74a" }]}
      onResponse={(response: SismoConnectResponse) => verify(response)}
      verifying={verifying}
    />
  );
}
```

## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Send us a message in [Telegram](https://builders.sismo.io/) or [Discord](https://discord.gg/sismo)

<br/>
<img src="https://static.sismo.io/readme/bottom-main.png" alt="bottom" width="100%" >