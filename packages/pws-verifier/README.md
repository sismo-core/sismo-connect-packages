<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-secondary.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    Prove with Sismo (PwS) Verifier
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

[Prove with Sismo presentation]

## Usage

```javascript
import { PwSVerifier } from "@sismo-core/pws-verifier";

const pws = new PwSVerifier({ appId: "[Your app id]" });
const { nullifier, value, groupName, timestamp, isStrict } = await pws.verify({ proof: proof });
```

## Documentation

You can find [here]() the full documentation of the Prove with Sismo from how to get your appId to how to manage and verify your nullifiers.

### PwSVerifier

**Initialization** 
```javascript
const pws = new PwSVerifier({ appId: "[Your app id]" });
```

[TODO]

**verify** 
```javascript
const { nullifier, value, groupName, timestamp, isStrict } = await pws.verify({ proof: proof });
```

[TODO]

**verify optional params** 

```javascript
const { nullifier, value, groupName, timestamp, isStrict } = await pws.verify({ proof: proof, serviceName: "[Your service name]" });
```

[TODO]

## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Prefer [Discord](https://discord.gg/sismo) or [Twitter](https://twitter.com/sismo_eth)

<br/>
<img src="https://static.sismo.io/readme/bottom-secondary.png" alt="bottom" width="100%" >
