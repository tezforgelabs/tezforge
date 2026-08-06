import { useCallback } from "react";
import { toast } from "sonner";
import { useChainId } from "wagmi";
import {
  submitVerification,
  type VerificationPayload,
} from "@/lib/api/verification-client";
import { tezosX } from "@/config/wagmi";

/**
 * Maps the internal token type number to the contract type string expected by the verification server.
 */
const TOKEN_TYPE_MAP: Record<number, string> = {
  0: "LaunchpadERC20Plain",
  1: "LaunchpadERC20Mintable",
  2: "LaunchpadERC20Burnable",
  3: "LaunchpadERC20Taxable",
  4: "LaunchpadERC20NonMintable",
};

/**
 * Hook that returns a function to fire-and-forget a token verification request
 * for the Tezos X Previewnet chain.
 */
export function useTokenVerification() {
  const chainId = useChainId();

  const verifyToken = useCallback(
    async (params: { address: string; tokenType: number }) => {
      // Only verify on Tezos X Previewnet
      if (chainId !== tezosX.id) {
        return;
      }

      const contractType = TOKEN_TYPE_MAP[params.tokenType];
      if (!contractType) {
        console.warn(
          "Unknown token type, skipping verification:",
          params.tokenType,
        );
        return;
      }

      const payload: VerificationPayload = {
        blockscout_url: tezosX.blockExplorers.default.url,
        chain: tezosX.name.toLowerCase().replace(/\s+/g, "-"),
        address: params.address,
        contract_type: contractType,
        license_type: "mit",
        autodetect_constructor_args: true,
      };

      try {
        const response = await submitVerification(payload);
        if (response.success) {
          toast.success("Token submitted for verification on Blockscout!");
        } else {
          toast.error(response.message ?? "Verification submission failed.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Verification request failed: ${message}`);
      }
    },
    [chainId],
  );

  return { verifyToken };
}
