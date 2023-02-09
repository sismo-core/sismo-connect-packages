<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-secondary.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    Prove with Sismo groups (PwS)
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

[Prove with Sismo]

We advise you to use directly [@sismo-core/pws](../pws) rather than this package.

## Installation

```
$ yarn add @sismo-core/pws-groups
$ npm i @sismo-core/pws-groups
```

## Usage

```javascript
import { getGroup } from "@sismo-core/pws-groups";

const group = await getGroup({ groupId: "[Group id]" })
```

## Documentation

You can find [here](https://www.notion.so/sismo/PwS-docs-819e88670d1c4d4e830d391d946a7858) the full documentation of the Prove with Sismo from how to get your appId to how to verify your proof.

### getGroup

```javascript
const group = await getGroup({ groupId: "[Group id]", groupName: "[Group name]", timestamp: "" })
```

| Params | Type | Description |
|---|---|---|
| groupId | String | Group Identifier |
| groupName | String | Group Name |
| timestamp | String | Timestamp of the snapshot you want to fetch | 

## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Prefer [Discord](https://discord.gg/sismo) or [Twitter](https://twitter.com/sismo_eth)

<br/>
<img src="https://static.sismo.io/readme/bottom-secondary.png" alt="bottom" width="100%" >