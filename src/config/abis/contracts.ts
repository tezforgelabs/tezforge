import { erc20Abi } from "viem";
import { type Address } from "viem";
import { etherlink } from "viem/chains";

export const CONTRACT_ADDRESSES = {
  tokenLocker: "0x3b1bCdA99Df192448137e6b592b95979bA0AC8fe" as Address,
  airdropMultisender: "0xe47485b89419Ae3b591046d74baca815c5A46Cc4" as Address,
  tokenFactory: "0xF74196387346F2083391f54E9011Dc87fbdF1277" as Address,
  presaleFactory: "0xB22DF375fC125D54C123438af9D4a91Ac56891Fb" as Address,
  stakeToken: "0x72d4db19e3ae6f8ed47b5337ab00d69685277cf4" as Address,
  rewardToken: "0x72d4db19e3ae6f8ed47b5337ab00d69685277cf4" as Address,
  nftFactory: "0xaA19CB732D3FD2F60914DF7A0C5a7c91175c9C6c" as Address,
  staking: "0x11C3d68b9B9Cc09531BEcFb7dFc65d64b9a96bD9" as Address,
  registry: "" as Address,
  resolver: "" as Address,
  registrar: "" as Address,
  nativeUSDC: "0xA0b86a33E6441b8C9545f9CDf7Cb3eE2D45A3E5A" as Address,
  weth9: "0x0000000000000000000000000000000000000000" as Address,
  factory: "0x0000000000000000000000000000000000000000" as Address,
  router: "0x0000000000000000000000000000000000000000" as Address,
};

const CHAIN_CONFIGS: Record<number, { explorerUrl: string; contractAddresses: typeof CONTRACT_ADDRESSES }> = {
  [etherlink.id]: {
    explorerUrl: "https://explorer.etherlink.com",
    contractAddresses: CONTRACT_ADDRESSES,
  },
};

export function getContractAddresses(chainId: number) {
  return CHAIN_CONFIGS[chainId]?.contractAddresses ?? CONTRACT_ADDRESSES;
}

export function getExplorerUrl(chainId: number): string {
  return CHAIN_CONFIGS[chainId]?.explorerUrl ?? "https://explorer.etherlink.com";
}

export function getStakingContractAddress(chainId: number): Address {
  return CHAIN_CONFIGS[chainId]?.contractAddresses.staking ?? CONTRACT_ADDRESSES.staking;
}

// Re-export erc20Abi for convenience
export { erc20Abi };

// Chain constants
export const CHAIN_LABELS: Record<number, string> = {
  [etherlink.id]: "Etherlink",
};

export const DEFAULT_CHAIN_ID = etherlink.id;
export const SUPPORTED_CHAIN_IDS: number[] = [DEFAULT_CHAIN_ID as number];

// Router & WETH contracts for DEX
export const Weth9Contract = {
  address: CONTRACT_ADDRESSES.weth9,
  abi: erc20Abi,
};

export const RouterContract = {
  address: CONTRACT_ADDRESSES.router,
  abi: [
    {
      type: "function" as const,
      name: "swapExactTokensForTokens",
      inputs: [
        { name: "amountIn", type: "uint256" },
        { name: "amountOutMin", type: "uint256" },
        { name: "path", type: "address[]" },
        { name: "to", type: "address" },
        { name: "deadline", type: "uint256" },
      ],
      outputs: [{ name: "amounts", type: "uint256[]" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function" as const,
      name: "swapExactETHForTokens",
      inputs: [
        { name: "amountOutMin", type: "uint256" },
        { name: "path", type: "address[]" },
        { name: "to", type: "address" },
        { name: "deadline", type: "uint256" },
      ],
      outputs: [{ name: "amounts", type: "uint256[]" }],
      stateMutability: "payable",
    },
    {
      type: "function" as const,
      name: "swapExactTokensForETH",
      inputs: [
        { name: "amountIn", type: "uint256" },
        { name: "amountOutMin", type: "uint256" },
        { name: "path", type: "address[]" },
        { name: "to", type: "address" },
        { name: "deadline", type: "uint256" },
      ],
      outputs: [{ name: "amounts", type: "uint256[]" }],
      stateMutability: "nonpayable",
    },
  ],
} as const;

export const FactoryContract = {
  address: CONTRACT_ADDRESSES.factory,
  abi: [
    {
      type: "function" as const,
      name: "allPairsLength",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function" as const,
      name: "allPairs",
      inputs: [{ name: "", type: "uint256" }],
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
    },
  ],
} as const;

export const PairContract = {
  address: CONTRACT_ADDRESSES.factory, // placeholder
  abi: [
    {
      type: "function" as const,
      name: "token0",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
    },
    {
      type: "function" as const,
      name: "token1",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
    },
    {
      type: "function" as const,
      name: "getReserves",
      inputs: [],
      outputs: [
        { name: "_reserve0", type: "uint112" },
        { name: "_reserve1", type: "uint112" },
        { name: "_blockTimestampLast", type: "uint32" },
      ],
      stateMutability: "view",
    },
  ],
} as const;

// Re-export etherlink chain for use by wagmi config
export const ETHERLINK_CHAIN = etherlink;
