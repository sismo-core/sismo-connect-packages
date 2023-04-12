<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-main.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    sismoConnect Solidity
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


sismoConnect solidity is a Solidity library that allows you to verify the zk-proofs of your sismoConnect Application onchain and simplify the use of the [sismo-connect-onchain-verifier](https://github.com/sismo-core/sismo-connect-onchain-verifier).

Here is the link to the full documentation of the library: [sismoConnect Solidity Library](https://docs.sismo.io/sismo-docs/technical-documentation/sismo-connect/solidity-library)

You can learn more on sismoConnect [here](https://docs.sismo.io/sismo-docs/readme/sismo-connect).

# Use with Forge

## Installation

Install the library
```bash
forge install sismo-core/sismo-connect-packages
```

Configure [remappings.txt](https://book.getfoundry.sh/projects/dependencies?highlight=remapping#remapping-dependencies) file:

```
sismo-connect-solidity/=lib/sismo-connect-packages/packages/sismo-connect-solidity/src/
```

Import in your contract
```solidity
import "sismo-connect/SismoConnectLib.sol";
```

## Usage
Inherit SismoConnect library in your contract

```solidity
contract ZKApp is SismoConnect  {
  constructor(
    // the appId of your sismoConnect app (you need to register your sismoConnect app on https://factory.sismo.io)
    bytes16 appId,
  ) SismoConnect(appId) {

    ... 
  }
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
