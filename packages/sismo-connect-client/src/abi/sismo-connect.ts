// ABI of all the errors that can be thrown by the contract inheriting Sismo Connect
export const sismoConnectErrorsABI = [
  {
    // SismoConnectVerifier errors

    inputs: [
      {
        internalType: 'bytes16',
        name: 'receivedAppId',
        type: 'bytes16',
      },
      {
        internalType: 'bytes16',
        name: 'expectedAppId',
        type: 'bytes16',
      },
    ],
    name: 'AppIdMismatch',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes16',
        name: 'receivedNamespace',
        type: 'bytes16',
      },
      {
        internalType: 'bytes16',
        name: 'expectedNamespace',
        type: 'bytes16',
      },
    ],
    name: 'NamespaceMismatch',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'requestVersion',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'responseVersion',
        type: 'bytes32',
      },
    ],
    name: 'VersionMismatch',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'requestMessageSignature',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'responseMessageSignature',
        type: 'bytes',
      },
    ],
    type: 'error',
    name: 'SignatureMessageMismatch',
  },

  // HydraS2Verifier errors

  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'claimTypeFromProof',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expectedClaimType',
        type: 'uint256',
      },
    ],
    name: 'ClaimTypeMismatch',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'claimTypeFromProof',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expectedClaimType',
        type: 'uint256',
      },
    ],
    name: 'ClaimTypeMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ClaimValueMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OnlyOneAuthAndOneClaimIsSupported',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'version',
        type: 'bytes32',
      },
    ],
    name: 'InvalidVersion',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'userIdFromProof',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expectedUserId',
        type: 'uint256',
      },
    ],
    name: 'UserIdMismatch',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'inputRoot',
        type: 'uint256',
      },
    ],
    name: 'RegistryRootNotAvailable',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'vaultNamespaceFromProof',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expectedVaultNamespace',
        type: 'uint256',
      },
    ],
    name: 'VaultNamespaceMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'DestinationVerificationNotEnabled',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'extraDataFromProof',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expectedExtraData',
        type: 'uint256',
      },
    ],
    name: 'InvalidExtraData',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'requestIdentifierFromProof',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expectedRequestIdentifier',
        type: 'uint256',
      },
    ],
    name: 'RequestIdentifierMismatch',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'expectedX',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'expectedY',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'inputX',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'inputY',
        type: 'bytes32',
      },
    ],
    name: 'CommitmentMapperPubKeyMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'SourceVerificationNotEnabled',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'destinationFromProof',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'expectedDestination',
        type: 'address',
      },
    ],
    name: 'DestinationMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidProof',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'accountsTreeValueFromProof',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expectedAccountsTreeValue',
        type: 'uint256',
      },
    ],
    name: 'AccountsTreeValueMismatch',
    type: 'error',
  },

  // ClaimMatching errors

  {
    inputs: [
      {
        internalType: 'bytes16',
        name: 'requestClaimGroupId',
        type: 'bytes16',
      },
      {
        internalType: 'bytes16',
        name: 'requestClaimGroupTimestamp',
        type: 'bytes16',
      },
    ],
    name: 'ClaimGroupIdAndGroupTimestampNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes16',
        name: 'requestClaimGroupId',
        type: 'bytes16',
      },
    ],
    name: 'ClaimGroupIdNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes16',
        name: 'requestClaimGroupTimestamp',
        type: 'bytes16',
      },
    ],
    name: 'ClaimGroupTimestampNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'responseClaimType',
        type: 'uint8',
      },
      {
        internalType: 'bytes16',
        name: 'responseClaimGroupId',
        type: 'bytes16',
      },
      {
        internalType: 'bytes16',
        name: 'responseClaimGroupTimestamp',
        type: 'bytes16',
      },
      {
        internalType: 'uint256',
        name: 'responseClaimValue',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'responseExtraData',
        type: 'bytes',
      },
    ],
    name: 'ClaimInRequestNotFoundInResponse',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'requestClaimType',
        type: 'uint8',
      },
      {
        internalType: 'bytes16',
        name: 'requestClaimGroupId',
        type: 'bytes16',
      },
    ],
    name: 'ClaimTypeAndGroupIdNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'requestClaimType',
        type: 'uint8',
      },
      {
        internalType: 'bytes16',
        name: 'requestClaimGroupTimestamp',
        type: 'bytes16',
      },
    ],
    name: 'ClaimTypeAndGroupTimestampNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'requestClaimType',
        type: 'uint8',
      },
    ],
    name: 'ClaimTypeNotFound',
    type: 'error',
  },

  // AuthMatchingLib errors

  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'requestAuthType',
        type: 'uint8',
      },
      {
        internalType: 'bool',
        name: 'requestIsAnon',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'requestUserId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'requestExtraData',
        type: 'bytes',
      },
    ],
    name: 'AuthInRequestNotFoundInResponse',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: 'requestIsAnon',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'requestUserId',
        type: 'uint256',
      },
    ],
    name: 'AuthIsAnonAndUserIdNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: 'requestIsAnon',
        type: 'bool',
      },
    ],
    name: 'AuthIsAnonNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'requestAuthType',
        type: 'uint8',
      },
      {
        internalType: 'bool',
        name: 'requestIsAnon',
        type: 'bool',
      },
    ],
    name: 'AuthTypeAndIsAnonNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'requestAuthType',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'requestUserId',
        type: 'uint256',
      },
    ],
    name: 'AuthTypeAndUserIdNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'requestAuthType',
        type: 'uint8',
      },
    ],
    name: 'AuthTypeNotFound',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'requestUserId',
        type: 'uint256',
      },
    ],
    name: 'AuthUserIdNotFound',
    type: 'error',
  },
]
