<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-secondary.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    Prove with Sismo (PwS) React.js
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

```
$ yarn add @sismo-core/pws-react
$ npm i @sismo-core/pws-react
```

## Usage

```javascript
import { PwSButton, usePws } from "@sismo-core/pws-react";

const Page = () => {
    const { proof } = usePws();

    useEffect(() => {
        if (!proof) return;
        const verifyProof = async () => {
            const isVerify = await sendToServer(proof);
            if (isVerify) {
                navigateTo('/gated-service')
            } 
        }
    }, [proof])

    return <div>
        <PwSButton appId="[Your app id]" groupName="[Group name]"/>
    </div>
}
```

## Documentation

You can find [here]() the full documentation of the Prove with Sismo from how to get your appId to how to verify your proof.

### PwSButton

```javascript
<div>
    <PwSButton appId="[Your app id]" groupName="[Group name]"/>
</div>
```

| Params | Type | Description |
|---|---|---|
| appId | String | Identifier of your app created on factory, to learn more about this appId go [here]() |
| groupName | String | Name of the groupe you want to  | 

**Optional params**

```javascript
<div>
    <PwSButton 
      appId="[Your app id]" 
      callbackPath="/success" 
      serviceName="" 
      groupName="[Group name]" 
      timestamp={1675390857} 
      value={5} 
      acceptHigherValues={false}
    />
</div>  
```

| Params | Default | Type | Description |
|---|---|---|---|
| callbackPath | null | String | Path of the page where you want to redirect your user after the proof generation |
| value | MAX | "MAX" \| Number | Minimum value asked to the user to generate the proof |
| timestamp | latest | "latest" \| Number  | Timestamp of the group snapshot you want to verify your user is part of |
| serviceName | main | string | Sub identifier of the appId to allow user proving multiple proof for one groupName |
| acceptHigherValues | true | boolean | Define if the user can downgrade his value or not |

### usePws

Add the usePws in your success page to get the proof generated from the user.

```javascript
const { request, proof, error } = usePws();
```

| | Type | Description |
|---|---|---|
| proof | String | Membership proof of asked groups |
| request | Request | Minimum value asked to the user to generate the proof |
| error | Error | Error returned by the Sismo app if the user don't generate his proof |

```javascript
type Request = {
  appId: string;
  serviceName: string;
  groupName: string;
  timestamp: "latest" | number;
  acceptHigherValues: boolean;
  value: "MAX" | number;
}

type Error = {
  message: string
}
```

### prove (prefer using PwSButton)

```javascript
import { prove } from "@sismo-core/pws-react";

const Page = () => {
    const submit = () => {
      prove({
        appId="[Your app id]" 
        groupName="[Group name]"
      })
    }

    return <div>
        <button onClick={() => submit()}/>
    </div>
}
```

The prove function have the same params than the PwSButton.

## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Prefer [Discord](https://discord.gg/sismo) or [Twitter](https://twitter.com/sismo_eth)

<br/>
<img src="https://static.sismo.io/readme/bottom-secondary.png" alt="bottom" width="100%" >
