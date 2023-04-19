import { Hex, encodeAbiParameters, pad, sliceHex, toHex, keccak256, isHex, toBytes as toBytesViem } from 'viem';
import { SismoConnectResponse } from '../common-types';

const toBytes16 = (data) => {
    if (isHex(data)) return pad(data, { size: 16 });
    else return sliceHex(keccak256(hexlify(data)), 0, 16);
}

const toBytes32 = (data) => {
    return pad(hexlify(data), { size: 32, dir: 'right' })
}

const toBytes = (data) => {
    return toHex(toBytesViem(data));
}

export const hexlify = (data) => {
    return isHex(data) ? data as Hex : toHex(data);
} 

const formatResponseToEncode = (sismoConnectResponse: SismoConnectResponse) => {
    return {
        appId: toBytes16(sismoConnectResponse.appId),
        namespace: toBytes16(sismoConnectResponse?.namespace ?? "main"),
        version: toBytes32(sismoConnectResponse.version),
        signedMessage: sismoConnectResponse.signedMessage as `0x${string}` ?? toBytes("0x0000000000000000000000000000000000000000000000000000000000000000"),
        proofs: sismoConnectResponse.proofs?.map(proof => {
            return {
                claims: proof.claims?.map(claim => {
                    return {
                        groupId: toBytes16(claim.groupId ?? "0x00"),
                        groupTimestamp: !proof?.claims[0]?.groupTimestamp || proof?.claims[0]?.groupTimestamp === "latest" ? pad(hexlify("latest"), { size: 16, dir: "right" }) : toBytes(proof?.claims[0]?.groupTimestamp),
                        claimType: claim.claimType,
                        isSelectableByUser: claim?.isSelectableByUser ?? false,
                        value: BigInt(claim.value ?? 1),
                        extraData: toBytes(claim.extraData ?? "")
                    }
                }) ?? [],
                auths: proof.auths?.map(auth => {
                    return {
                        authType: auth?.authType,
                        isAnon: auth?.isAnon ?? false,
                        isSelectableByUser: auth?.isSelectableByUser ?? false,
                        userId: BigInt(auth?.userId ?? 0),
                        extraData: toBytes(auth.extraData ?? ""),
                    }
                }) ?? [],
                proofData: proof.proofData as Hex,
                provingScheme: toBytes32(proof?.provingScheme ?? "hydra-s2.1"),
                extraData: toBytes(proof.extraData ?? "")
            }
        }),
      }
}

export const toSismoConnectResponseBytes = (
  sismoConnectResponse: SismoConnectResponse
) => {
  if (!sismoConnectResponse) return null;
  return encodeAbiParameters(
    [
      {
        "components": [
          {
            "internalType": "bytes16",
            "name": "appId",
            "type": "bytes16"
          },
          {
            "internalType": "bytes16",
            "name": "namespace",
            "type": "bytes16"
          },
          {
            "internalType": "bytes32",
            "name": "version",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "signedMessage",
            "type": "bytes"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "enum AuthType",
                    "name": "authType",
                    "type": "uint8"
                  },
                  {
                    "internalType": "bool",
                    "name": "isAnon",
                    "type": "bool"
                  },
                  {
                    "internalType": "bool",
                    "name": "isSelectableByUser",
                    "type": "bool"
                  },
                  {
                    "internalType": "uint256",
                    "name": "userId",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bytes",
                    "name": "extraData",
                    "type": "bytes"
                  }
                ],
                "internalType": "struct Auth[]",
                "name": "auths",
                "type": "tuple[]"
              },
              {
                "components": [
                  {
                    "internalType": "enum ClaimType",
                    "name": "claimType",
                    "type": "uint8"
                  },
                  {
                    "internalType": "bytes16",
                    "name": "groupId",
                    "type": "bytes16"
                  },
                  {
                    "internalType": "bytes16",
                    "name": "groupTimestamp",
                    "type": "bytes16"
                  },
                  {
                    "internalType": "bool",
                    "name": "isSelectableByUser",
                    "type": "bool"
                  },
                  {
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bytes",
                    "name": "extraData",
                    "type": "bytes"
                  }
                ],
                "internalType": "struct Claim[]",
                "name": "claims",
                "type": "tuple[]"
              },
              {
                "internalType": "bytes32",
                "name": "provingScheme",
                "type": "bytes32"
              },
              {
                "internalType": "bytes",
                "name": "proofData",
                "type": "bytes"
              },
              {
                "internalType": "bytes",
                "name": "extraData",
                "type": "bytes"
              }
            ],
            "internalType": "struct SismoConnectProof[]",
            "name": "proofs",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct SismoConnectResponse",
        "name": "response",
        "type": "tuple"
      }
    ],
    [
        formatResponseToEncode(sismoConnectResponse)
    ]
  )
};