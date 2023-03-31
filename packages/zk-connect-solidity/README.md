<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-main.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    zkConnect Solidity
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


zkConnect solidity is a Solidity library that allows you to verify the zk-proofs of your zkConnect Application onchain and simplify the use of the [zk-connect-onchain-verifier](https://github.com/sismo-core/zk-connect-onchain-verifier).

Here is the link to the full documentation of the library: [zkConnect onchain verifier](https://docs.sismo.io/sismo-docs/technical-documentation/zkconnect/zkconnect-solidity-library-verify-on-chain-soon)

You can learn more on zkConnect [here](https://docs.sismo.io/sismo-docs/readme/zkconnect).

# Use with Forge

## Installation

Install the library
```bash
forge install sismo-core/zk-connect-packages
```

Configure [remappings.txt](https://book.getfoundry.sh/projects/dependencies?highlight=remapping#remapping-dependencies) file:

```
zk-connect-solidity/=lib/zk-connect-packages/packages/zk-connect-solidity/src/
```

Import in your contract
```solidity
import "zk-connect-solidity/SismoLib.sol";
```

## Usage
Inherit ZkConnect library in your contract

```sol
contract ZKApp is ZkConnect  {
  constructor(
      bytes16 appId, // the appId of your zkConnect app (you need to register your zkConnect app on https://factory.sismo.io)
  )  ZkConnect(appId) {

    ... 
  }
}
```


## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Prefer [Discord](https://discord.gg/sismo) or [Twitter](https://twitter.com/sismo_eth)

<br/>
<img src="https://static.sismo.io/readme/bottom-main.png" alt="bottom" width="100%" >
