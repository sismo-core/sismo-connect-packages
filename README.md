<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-secondary.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

  <h3 align="center">
    Prove with Sismo (PwS)
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
$ yarn add @sismo-core/pws
$ npm i @sismo-core/pws
```

## Usage

**Frontend**
```javascript
import { PwSButton, usePws } from "@sismo-core/pws";
import { DisplayGroup } from "..";

const Page = () => {
    const { proof } = usePws();
    const [group, setGroup] = useState();

    useEffect(() => {
        if (!proof) return;
        const verifyProof = async () => {
            const isVerified = await sendToBackend(proof);
            if (isVerified) {
                navigateTo('/gated-service')
            } 
        }
        verifyProof();
    }, [proof])

    useEffect(() => {
      const getData = async () => {
        const res = await getGroup({ groupId: "[Group id]" })
        setGroup(res);
      }
      getData();
    }, [])

    return <div>
        <DisplayGroup group={group} />
        <PwSButton appId="[Your app id]" groupId="[Group id]"/>
    </div>
}
```

**Backend**
```javascript
import { PwSVerifier } from "@sismo-core/pws";
import { isInDatabase, storeInDatabase } from "..";

const isVerified = (proof) => {
  const pws = new PwSVerifier({ appId: "[Your app id]" });
  const verifiedClaim = await pws.verify({ proof: proof });

  if (verifiedClaim.groupId !== "[Group id]") return false;
  if (verifiedClaim.value < 3) return false;
  if (isInDatabase(verifiedClaim.nullifier)) return false;

  storeInDatabase(verifiedClaim.nullifier);

  return true;
}
```

## Documentation

You can find [here](https://www.notion.so/sismo/PwS-docs-819e88670d1c4d4e830d391d946a7858) the full documentation of the Prove with Sismo from how to get your appId to how to verify your proof.

### PwSButton (React.js)

```javascript
<div>
    <PwSButton appId="[Your app id]" groupId="[Group id]"/>
</div>
```

| Params | Type | Description |
|---|---|---|
| appId | String | Identifier of your app ([learn more](https://www.notion.so/sismo/PwS-docs-819e88670d1c4d4e830d391d946a7858)) |
| groupId | String | Identifier of the group you choose ([learn more](https://www.notion.so/sismo/PwS-docs-819e88670d1c4d4e830d391d946a7858))  | 

**Optional params**

```javascript
<div>
    <PwSButton 
      appId="[Your app id]" 
      callbackPath="/success" 
      serviceId="" 
      groupId="[Group id]" 
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
| serviceId | main | string | Service id of the proof. Its define the scope of the user nullifier [learn more](https://www.notion.so/sismo/PwS-docs-819e88670d1c4d4e830d391d946a7858) |
| acceptHigherValues | true | boolean | Define if the user can downgrade his value or not |

### usePws (React.js)

Add the usePws in your success page to get the proof generated from the user.

```javascript
const { request, proof, error } = usePws();
```

| | Type | Description |
|---|---|---|
| proof | Proof | Proof generated by your user |
| request | Request | Corresponding Proof request |
| error | Error | Error returned by the Sismo app if the user don't generate his proof |

```javascript
type Proof = {
  request: Request;
  content: string;
}

type Request = {
  appId: string;
  serviceName: string;
  groupId: string;
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
import { prove } from "@sismo-core/pws";

const Page = () => {
    const submit = () => {
      prove({
        appId="[Your app id]" 
        groupId="[Group id]"
      })
    }

    return <div>
        <button onClick={() => submit()}/>
    </div>
}
```

### PwSVerifier

**Initialization** 
```javascript
const pws = new PwSVerifier({ appId: "[Your app id]" });
```

| Params | Type | Description |
|---|---|---|
| appId | Identifier of your app ([learn more](https://www.notion.so/sismo/PwS-docs-819e88670d1c4d4e830d391d946a7858)) |

**verify** 
```javascript
const verifiedClaim = await pws.verify({ proof: proof });
```

| Params | Type | Description |
|---|---|---|
| proof | Proof | Proof generated by the user |

If the proof is valid the function return a VerifiedClaim if not return an error

```javascript
type Proof = {
  request: Request;
  content: string;
}

type Request = {
  appId: string;
  serviceName: string;
  groupId: string;
  timestamp: "latest" | number;
  acceptHigherValues: boolean;
  value: "MAX" | number;
}

type VerifiedClaim = { 
  isValid: true;
  nullifier: string;
  value: number;
  groupName: string;
  timestamp: number;
  isStrict: boolean;
}

type Error = { 
  isValid: false;
  message: string;
}
```

**Optional params** 

```javascript
const verifiedClaim = await pws.verify({ proof: proof, serviceId: "[Your service name]" });
```

| Params | Type | Description |
|---|---|---|
| serviceId | String | Service id of the proof, define the scope of the user nullifier. This serviceId must match with the serviceId used during the proof generation|

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
