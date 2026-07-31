import { getContractAddresses } from "@/config";
import { useChainId } from "wagmi";

export function useChainContracts() {
  const chainId = useChainId();
  const contractAddresses = getContractAddresses(chainId);

  return {
    chainId,
    ...contractAddresses,
  };
}
