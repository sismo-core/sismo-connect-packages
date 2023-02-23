<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-main.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    Prove with Sismo (PwS) Client
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

## Installation

Instal pws-client with npm:
```
$ npm install @sismo-core/pws-client
```

Or with yarn:
```
$ yarn add @sismo-core/pws-client
```

## Usage

```javascript
import { prove, getResponse } from '@sismo-core/pws-client';

//Redirect to Sismo vault app
prove({ 
    appId: 'your-app-id', 
    request: {
        groupId: 'your-group-id'
    }
});

// Wait for the response
const response = getResponse();
console.log(response.proofs);
console.log(response.claims);
```

## Documentation

### prove

```javascript
type Request = {
    groupId: string;
    timestamp?: number | "latest";
    value?: number | "MAX";
    acceptHigherValue?: boolean;
}

type ProveParams = {
    appId: string;
    request: Request;
    serviceId?: string;
    callbackPath?: string;
    acceptHigherValues?: boolean;
}

type ProveOpts = {
    url?: string;
}

function prove(params: ProveParams, opts?: ProveOpts): void
```

The `prove` function redirect your user to the Sismo vault app to generate the proof.

### Parameters

`params` - an object containing the following properties:
-  `appId` - the identifier of your app
- `request` - an object containing the parameters for the proof request
- `serviceId` - (optional) the identifier of the service by default "main"
- `callbackPath` - (optional) the callback path by default "null"
- `acceptHigherValues` - (optional) a flag indicating whether to accept higher values by default "false"

`opts` - (optional) an object containing the following properties:
- `url` - (optional) the URL for the Proof Web API, defaults to the value of BASE_URL from constants.js

### getResponse()

```javascript
function getResponse(): Response | null
```

The `getResponse` function returns the response of the Sismo vault app after the redirection.

### Return value

Returns an object with the following properties:

- `proofs` - an array of proofs
- `claims` - an array of claims

If there is no response available, getResponse returns null.

## Types

```javascript
type Request = {
    groupId: string;
    timestamp?: number | "latest";
    value?: number | "MAX";
    acceptHigherValue?: boolean;
}

type Proof = {
    snarkProof: {
        a: string[], 
        b: string[][], 
        c: string[], 
        input: string[]
    },
    version: string;
}

type Claim = {
    appId: string;
    serviceName: string;
    value: number;
    groupId: string;
    timestamp: number;
    isStrict: boolean;
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
