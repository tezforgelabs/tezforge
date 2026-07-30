import { CONTRACT_ADDRESSES } from "./contracts";

export const TokenFactory = {
  address: CONTRACT_ADDRESSES.tokenFactory,
  abi: [
    {
      inputs: [
        {
          components: [
            {
              internalType: "string",
              name: "name",
              type: "string",
            },
            {
              internalType: "string",
              name: "symbol",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "initialSupply",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "initialRecipient",
              type: "address",
            },
          ],
          internalType: "struct TokenFactory.TokenParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "createBurnableToken",
      outputs: [
        {
          internalType: "address",
          name: "token",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: "string",
              name: "name",
              type: "string",
            },
            {
              internalType: "string",
              name: "symbol",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "initialSupply",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "initialRecipient",
              type: "address",
            },
          ],
          internalType: "struct TokenFactory.TokenParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "createMintableToken",
      outputs: [
        {
          internalType: "address",
          name: "token",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: "string",
              name: "name",
              type: "string",
            },
            {
              internalType: "string",
              name: "symbol",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "initialSupply",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "initialRecipient",
              type: "address",
            },
          ],
          internalType: "struct TokenFactory.TokenParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "createNonMintableToken",
      outputs: [
        {
          internalType: "address",
          name: "token",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: "string",
              name: "name",
              type: "string",
            },
            {
              internalType: "string",
              name: "symbol",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "initialSupply",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "initialRecipient",
              type: "address",
            },
          ],
          internalType: "struct TokenFactory.TokenParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "createPlainToken",
      outputs: [
        {
          internalType: "address",
          name: "token",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: "string",
              name: "name",
              type: "string",
            },
            {
              internalType: "string",
              name: "symbol",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "initialSupply",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "initialRecipient",
              type: "address",
            },
          ],
          internalType: "struct TokenFactory.TokenParams",
          name: "params",
          type: "tuple",
        },
        {
          components: [
            {
              internalType: "address",
              name: "taxWallet",
              type: "address",
            },
            {
              internalType: "uint96",
              name: "taxBps",
              type: "uint96",
            },
          ],
          internalType: "struct TokenFactory.TaxParams",
          name: "tax",
          type: "tuple",
        },
      ],
      name: "createTaxableToken",
      outputs: [
        {
          internalType: "address",
          name: "token",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
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
          name: "token",
          type: "address",
        },
        {
          indexed: true,
          internalType: "enum TokenFactory.TokenType",
          name: "tokenType",
          type: "uint8",
        },
      ],
      name: "TokenCreated",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "deployments",
      outputs: [
        {
          internalType: "address",
          name: "token",
          type: "address",
        },
        {
          internalType: "enum TokenFactory.TokenType",
          name: "tokenType",
          type: "uint8",
        },
        {
          internalType: "address",
          name: "creator",
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
          name: "creator",
          type: "address",
        },
      ],
      name: "tokensCreatedBy",
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
      name: "totalDeployments",
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
};
