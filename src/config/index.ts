export * from "./abis/launchpad-presale";
export * from "./abis/nft-factory";
export * from "./abis/presale-factory";
export * from "./abis/staking";
export * from "./abis/token-factory";
export * from "./abis/token-locker";
export * from "./abis/contracts";
export * from "./abis/airdrop";

// Re-export with "Contract" suffix aliases for backwards compatibility
import { AirdropMultiSender } from "./abis/airdrop";
import { NFTFactory } from "./abis/nft-factory";
import { getContractAddresses, getExplorerUrl, getStakingContractAddress } from "./abis/contracts";

export const AirdropMultisenderContract = AirdropMultiSender;
export const NFTFactoryContract = NFTFactory;
export { getContractAddresses, getExplorerUrl, getStakingContractAddress };

// Re-export the shared wagmi config
import { wagmiConfig } from "./wagmi";
export const config = wagmiConfig;