import { CONTRACT_ADDRESSES } from "./contracts";

export const AirdropMultiSender = {
  address: CONTRACT_ADDRESSES.airdropMultisender,
  abi: [
    { inputs: [], name: "InvalidAmount", type: "error" },
    { inputs: [], name: "InvalidRecipient", type: "error" },
    { inputs: [], name: "LengthMismatch", type: "error" },
    {
      inputs: [{ internalType: "address", name: "token", type: "address" }],
      name: "SafeERC20FailedOperation",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "totalAmount",
          type: "uint256",
        },
      ],
      name: "EthSent",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "token",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "totalAmount",
          type: "uint256",
        },
      ],
      name: "TokensSent",
      type: "event",
    },
    {
      inputs: [
        { internalType: "contract IERC20", name: "token", type: "address" },
        { internalType: "address[]", name: "recipients", type: "address[]" },
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      name: "sendERC20",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address[]", name: "recipients", type: "address[]" },
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      name: "sendETH",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
  ],
};
