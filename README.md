<br />
<div align="center">
  <img src="https://static.sismo.io/readme/top-main.png" alt="Logo" width="150" height="150" style="borderRadius: 20px">

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

const REQUEST = { groupId: "YOUR_GROUP_ID" };
  
const Page = () => {
    const { proof, claims } = usePws();
    const [group, setGroup] = useState();

    useEffect(() => {
        if (!proof || !claims) return;
        const verifyProof = async () => {
            const isVerified = await sendToBackend(proof, claims);
            if (isVerified) {
                navigateTo('/gated-service')
            } 
        }
        verifyProof();
    }, [proof])

    useEffect(() => {
      const getData = async () => {
        const res = await getGroup({ groupId: "YOUR_GROUP_ID" })
        setGroup(res);
      }
      getData();
    }, [])

    return <div>
        <DisplayGroup group={group} />
        <PwSButton appId="YOUR_APP_ID" request={REQUEST}/>
    </div>
}
```

**Backend**
```javascript
import { PwSVerifier } from "@sismo-core/pws";
import { isInDatabase, storeInDatabase } from "..";

const REQUEST = { groupId: "YOUR_GROUP_ID" };

const isVerified = (proof: Proof, claims: Claim[]) => {
  const pws = new PwSVerifier({ appId: "YOUR_APP_ID" });
  const verifiedClaims: VerifiedClaim[] = await pws.verify(REQUEST, { proof, claims });
  if (isInDatabase(verifiedClaims[0].proofId)) return false;
  storeInDatabase(verifiedClaims[0].proofId);
  return true;
}
```

## Types

```javascript

type Request = {
  groupId: string;
  timestamp: number | "latest"; //latest by default
  value: number | "MAX"; //MAX by default
}

type Proof = {
  claims: Claim[];
  content: string[];
  version: string;
}

type Claim = {
  appId: string;
  serviceId: string;
  request: Request;
  isStrict: boolean;
}

type Error = {
  message: string
}

type VerifiedClaim = { 
  appId: string;
  serviceId: string;
  request: Request;
  isStrict: boolean;
  proofId: string;
  __provingSchemeData: any;
}

```

## Documentation

### getGroup()

```javascript
const group = await getGroup({ groupId: "YOUR_GROUP_ID", timestamp: 1676289837 })
```

| Params | Type | Description |
|---|---|---|
| groupId | String | Group Identifier |
| timestamp | number | The timestamp of the snapshot that you want to retrieve | 

### prove()

```javascript
import { prove } from "@sismo-core/pws";

const REQUEST = { groupId: "YOUR_GROUP_ID" };
  
const Page = () => {
    const submit = () => {
      prove({
        appId: "YOUR_APP_ID",
        request: REQUEST
      })
    }

    return <div>
        <button onClick={() => submit()}/>
    </div>
}
```

### PwSButton (React.js)

```javascript
const REQUEST = { groupId: "YOUR_GROUP_ID" };

<div>
    <PwSButton appId="YOUR_APP_ID" request={REQUEST}/>
</div>
```

| Params | Type | Description |
|---|---|---|
| appId | String | Identifier of your app |
| request | Request | Request sent to Prove with Sismo | 


**Optional params**

```javascript
const REQUEST = { groupId: "YOUR_GROUP_ID" };

<div>
    <PwSButton 
      appId="YOUR_APP_ID" 
      request={REQUEST}
      callbackPath="/success" 
      serviceId="YOUR_SERVICE_ID" 
      acceptHigherValues={false}
    />
</div>  
```

| Params | Default | Type | Description |
|---|---|---|---|
| callbackPath | null | String | Path of the page where you want to redirect your user after the proof has been generated |
| serviceId | main | string | Service ID of the proof |
| acceptHigherValues | true | boolean | Define whether or not your user can decrease their value |

### usePws() (React.js)

Include the usePws in your success page to retrieve the proof generated by your user.

```javascript
const { claims, proof, error } = usePws();
```

| | Type | Description |
|---|---|---|
| proof | Proof | Proof generated by your user |
| claims | Claim[] | Corresponding Proof claims |
| error | Error | Error returned by the Sismo app if your user fails to generate their proof |

### PwSVerifier

```javascript
const pws = new PwSVerifier({ appId: "YOUR_APP_ID" });
```

| Params | Type | Description |
|---|---|---|
| appId | Identifier of your app |

```javascript
const REQUEST = { groupId: "YOUR_GROUP_ID" };

const verifiedClaims: VerifiedClaim[] = await pws.verify(REQUEST, { proof, claims });
```

| Params | Type | Description |
|---|---|---|
| REQUEST | Request | Claims sent back from Prove with Sismo |
| proof | Proof | Proof generated by your user |
| claims | Claim[] | Claims sent back from Prove with Sismo |

If the proof is valid, the function should return a VerifiedClaim[], otherwise, it should return an error.

In a VerifiedClaim, you can find a proofId, which is a unique number that identifies a proof.

The proofId is deterministically generated based on the following elements:
- The source account used to generate the proof
- The group your user is proving membership in
- The appId
- An optional serviceId, which represents the specific service of the app that requested the proof

By storing the proofId, you can determine if a source account has already been used in your app for a specific source account and group.

**Optional params** 

```javascript
const verifiedClaims: VerifiedClaims[] = await pws.verify(REQUEST, { proof, claims, serviceId });
```

| Params | Type | Description |
|---|---|---|
| serviceId | String | Service ID of the proof.The serviceId must match the serviceId sent to Prove with Sismo|


## License

Distributed under the MIT License.

## Contribute

Please, feel free to open issues, PRs or simply provide feedback!

## Contact

Prefer [Discord](https://discord.gg/sismo) or [Twitter](https://twitter.com/sismo_eth)

<br/>
<img src="https://static.sismo.io/readme/bottom-main.png" alt="bottom" width="100%" >
