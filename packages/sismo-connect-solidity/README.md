<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-main.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    Sismo Connect Solidity
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


Sismo Connect Solidity is a Solidity library that allows you to verify the zk-proofs of your Sismo Connect Application onchain and simplify the use of the [sismo-connect-onchain-verifier](https://github.com/sismo-core/sismo-connect-onchain-verifier).

Here is the link to the full documentation of the library: [Sismo Connect Solidity Library](https://docs.sismo.io/build-with-sismo-connect/technical-documentation/solidity)

You can learn more on Sismo Connect [here](https://docs.sismo.io/discover-sismo-connect/empower-your-app).

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) >= 18.15.0 (Latest LTS version)
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [Foundry](https://book.getfoundry.sh/)

## Usage

### Installation

```bash
# update foundry
foundryup

# install the package
forge install sismo-core/sismo-connect-packages --no-commit

# add the remapping in remappings.txt
echo $'sismo-connect-solidity/=lib/sismo-connect-packages/packages/sismo-connect-solidity/src/' >> remappings.txt
```

### Import the library
In your solidity file:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "sismo-connect-solidity/SismoLib.sol"; // import the library
```

## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Send us a message in [Telegram](https://builders.sismo.io/) or [Discord](https://discord.gg/sismo)

<br/>
<img src="https://static.sismo.io/readme/bottom-main.png" alt="bottom" width="100%" >
