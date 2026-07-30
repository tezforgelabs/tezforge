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
import { PresaleFactory } from "./abis/presale-factory";
import { CONTRACT_ADDRESSES, getContractAddresses, getExplorerUrl, getStakingContractAddress } from "./abis/contracts";

export const AirdropMultisenderContract = AirdropMultiSender;
export const NFTFactoryContract = NFTFactory;
export { getContractAddresses, getExplorerUrl, getStakingContractAddress };

// Re-export config from contracts for wagmi
import { http } from "wagmi";
import { ETHERLINK_CHAIN } from "./abis/contracts";

export const config = {
  chains: [ETHERLINK_CHAIN],
  transports: {
    [ETHERLINK_CHAIN.id]: http(),
  },
};