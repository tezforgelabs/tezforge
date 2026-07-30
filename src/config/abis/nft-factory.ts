import { CONTRACT_ADDRESSES } from "./contracts";

export const NFTFactory = {
  address: CONTRACT_ADDRESSES.nftFactory,
  abi: [
    {
      type: "function",
      name: "createETHNFT",
      inputs: [
        {
          name: "params",
          type: "tuple",
          internalType: "struct NFTFactory.NFTParams",
          components: [
            {
              name: "name",
              type: "string",
              internalType: "string",
            },
            {
              name: "symbol",
              type: "string",
              internalType: "string",
            },
            {
              name: "baseURI",
              type: "string",
              internalType: "string",
            },
            {
              name: "maxSupply",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "payoutWallet",
              type: "address",
              internalType: "address",
            },
            {
              name: "mintConfig",
              type: "tuple",
              internalType: "struct MintConfig",
              components: [
                {
                  name: "saleStart",
                  type: "uint64",
                  internalType: "uint64",
                },
                {
                  name: "saleEnd",
                  type: "uint64",
                  internalType: "uint64",
                },
                {
                  name: "walletLimit",
                  type: "uint32",
                  internalType: "uint32",
                },
                {
                  name: "price",
                  type: "uint128",
                  internalType: "uint128",
                },
              ],
            },
          ],
        },
      ],
      outputs: [
        {
          name: "nft",
          type: "address",
          internalType: "address",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "createUSDCNFT",
      inputs: [
        {
          name: "params",
          type: "tuple",
          internalType: "struct NFTFactory.NFTParams",
          components: [
            {
              name: "name",
              type: "string",
              internalType: "string",
            },
            {
              name: "symbol",
              type: "string",
              internalType: "string",
            },
            {
              name: "baseURI",
              type: "string",
              internalType: "string",
            },
            {
              name: "maxSupply",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "payoutWallet",
              type: "address",
              internalType: "address",
            },
            {
              name: "mintConfig",
              type: "tuple",
              internalType: "struct MintConfig",
              components: [
                {
                  name: "saleStart",
                  type: "uint64",
                  internalType: "uint64",
                },
                {
                  name: "saleEnd",
                  type: "uint64",
                  internalType: "uint64",
                },
                {
                  name: "walletLimit",
                  type: "uint32",
                  internalType: "uint32",
                },
                {
                  name: "price",
                  type: "uint128",
                  internalType: "uint128",
                },
              ],
            },
          ],
        },
        {
          name: "paymentToken",
          type: "address",
          internalType: "contract IERC20",
        },
      ],
      outputs: [
        {
          name: "nft",
          type: "address",
          internalType: "address",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "deployments",
      inputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "nft",
          type: "address",
          internalType: "address",
        },
        {
          name: "acceptsEth",
          type: "bool",
          internalType: "bool",
        },
        {
          name: "creator",
          type: "address",
          internalType: "address",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "tokensCreatedBy",
      inputs: [
        {
          name: "creator",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "address[]",
          internalType: "address[]",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "totalDeployments",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "event",
      name: "NFTCreated",
      inputs: [
        {
          name: "creator",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "nft",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "acceptsEth",
          type: "bool",
          indexed: true,
          internalType: "bool",
        },
      ],
      anonymous: false,
    },
  ],
};

export const LaunchpadNFTContract = {
  abi: [
    {
      type: "function",
      name: "name",
      inputs: [],
      outputs: [{ name: "", type: "string", internalType: "string" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "symbol",
      inputs: [],
      outputs: [{ name: "", type: "string", internalType: "string" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "maxSupply",
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "totalMinted",
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "mintPrice",
      inputs: [],
      outputs: [{ name: "", type: "uint128", internalType: "uint128" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "mint",
      inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
      outputs: [],
      stateMutability: "payable",
    },
  ],
};
