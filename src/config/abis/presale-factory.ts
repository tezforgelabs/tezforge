import { CONTRACT_ADDRESSES } from "./contracts";

export const PresaleFactory = {
  address: CONTRACT_ADDRESSES.presaleFactory,
  abi: [
    {
      inputs: [],
      name: "acceptOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "feeRecipient",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newRecipient",
          type: "address",
        },
      ],
      name: "setFeeRecipient",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: "address",
              name: "saleToken",
              type: "address",
            },
            {
              internalType: "address",
              name: "paymentToken",
              type: "address",
            },
            {
              components: [
                {
                  internalType: "uint64",
                  name: "startTime",
                  type: "uint64",
                },
                {
                  internalType: "uint64",
                  name: "endTime",
                  type: "uint64",
                },
                {
                  internalType: "uint256",
                  name: "rate",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "softCap",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "hardCap",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "minContribution",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "maxContribution",
                  type: "uint256",
                },
              ],
              internalType: "struct PresaleConfig",
              name: "config",
              type: "tuple",
            },
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
          ],
          internalType: "struct PresaleFactory.CreateParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "createPresale",
      outputs: [
        {
          internalType: "address",
          name: "presale",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "initialOwner",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      name: "OwnableInvalidOwner",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "OwnableUnauthorizedAccount",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "creator",
          type: "address",
        },
        {
          indexed: false,
          internalType: "bool",
          name: "status",
          type: "bool",
        },
      ],
      name: "CreatorWhitelisted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferStarted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "creator",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "presale",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "saleToken",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "paymentToken",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "presaleOwner",
          type: "address",
        },
      ],
      name: "PresaleCreated",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "creator",
          type: "address",
        },
        {
          internalType: "bool",
          name: "status",
          type: "bool",
        },
      ],
      name: "setWhitelistedCreator",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address[]",
          name: "creators",
          type: "address[]",
        },
        {
          internalType: "bool",
          name: "status",
          type: "bool",
        },
      ],
      name: "setWhitelistedCreators",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "allPresales",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getWhitelistedCreators",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "creator",
          type: "address",
        },
      ],
      name: "isWhitelistedCreator",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "pendingOwner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "presaleOwner",
          type: "address",
        },
      ],
      name: "presalesByOwner",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalPresales",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "whitelistedCreatorsCount",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ] as const,
} as const;

export const PresaleFactoryContract = PresaleFactory;
