import { CONTRACT_ADDRESSES } from "./contracts";

export const TokenLocker = {
  address: CONTRACT_ADDRESSES.tokenLocker,
  abi: [
    {
      type: "function",
      name: "extendLock",
      inputs: [
        { name: "lockId", type: "uint256", internalType: "uint256" },
        { name: "additionalTime", type: "uint64", internalType: "uint64" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "getLock",
      inputs: [{ name: "lockId", type: "uint256", internalType: "uint256" }],
      outputs: [
        {
          name: "",
          type: "tuple",
          internalType: "struct TokenLocker.LockInfo",
          components: [
            { name: "token", type: "address", internalType: "address" },
            { name: "owner", type: "address", internalType: "address" },
            { name: "amount", type: "uint256", internalType: "uint256" },
            { name: "lockDate", type: "uint64", internalType: "uint64" },
            {
              name: "unlockDate",
              type: "uint64",
              internalType: "uint64",
            },
            { name: "withdrawn", type: "bool", internalType: "bool" },
            { name: "name", type: "string", internalType: "string" },
            {
              name: "description",
              type: "string",
              internalType: "string",
            },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "lockTokens",
      inputs: [
        { name: "token", type: "address", internalType: "address" },
        { name: "amount", type: "uint256", internalType: "uint256" },
        { name: "lockDuration", type: "uint64", internalType: "uint64" },
        { name: "name", type: "string", internalType: "string" },
        { name: "description", type: "string", internalType: "string" },
      ],
      outputs: [{ name: "lockId", type: "uint256", internalType: "uint256" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "locksOfOwner",
      inputs: [{ name: "owner", type: "address", internalType: "address" }],
      outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "totalLocks",
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "transferLockOwnership",
      inputs: [
        { name: "lockId", type: "uint256", internalType: "uint256" },
        { name: "newOwner", type: "address", internalType: "address" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "unlock",
      inputs: [{ name: "lockId", type: "uint256", internalType: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "event",
      name: "LockCreated",
      inputs: [
        {
          name: "lockId",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "token",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "owner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "amount",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "unlockDate",
          type: "uint64",
          indexed: false,
          internalType: "uint64",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "LockExtended",
      inputs: [
        {
          name: "lockId",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "newUnlockDate",
          type: "uint64",
          indexed: false,
          internalType: "uint64",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "LockReleased",
      inputs: [
        {
          name: "lockId",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "amount",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "LockTransferred",
      inputs: [
        {
          name: "lockId",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "newOwner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
    {
      type: "error",
      name: "AddressEmptyCode",
      inputs: [{ name: "target", type: "address", internalType: "address" }],
    },
    {
      type: "error",
      name: "AddressInsufficientBalance",
      inputs: [{ name: "account", type: "address", internalType: "address" }],
    },
    { type: "error", name: "AlreadyUnlocked", inputs: [] },
    { type: "error", name: "FailedInnerCall", inputs: [] },
    { type: "error", name: "InvalidAddress", inputs: [] },
    { type: "error", name: "InvalidAmount", inputs: [] },
    { type: "error", name: "InvalidLockId", inputs: [] },
    { type: "error", name: "InvalidToken", inputs: [] },
    { type: "error", name: "LockNotExpired", inputs: [] },
    { type: "error", name: "NotOwner", inputs: [] },
    {
      type: "error",
      name: "SafeERC20FailedOperation",
      inputs: [{ name: "token", type: "address", internalType: "address" }],
    },
  ],
};
