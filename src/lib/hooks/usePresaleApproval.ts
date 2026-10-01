import { useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { erc20Abi } from "viem";
import { type Address } from "viem";
import { toast } from "sonner";
import { getPresaleAllowanceState } from "@/lib/utils/presale-approval";

export function usePresaleApproval({
  presaleAddress,
  paymentToken,
  amount,
  isPaymentETH,
}: {
  presaleAddress: Address;
  paymentToken: { address: Address };
  amount: bigint;
  isPaymentETH: boolean;
}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isApprovalConfirming, setIsApprovalConfirming] = useState(false);

  const {
    data: allowance,
    refetch,
    isLoading: isAllowanceLoading,
    isError: isAllowanceError,
  } = useReadContract({
    address: paymentToken.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, presaleAddress] : undefined,
    query: {
      enabled: Boolean(address && !isPaymentETH),
    },
  });

  const { isPending: isApproveLoading, writeContractAsync: approveAsync } =
    useWriteContract();

  const allowanceState = getPresaleAllowanceState(
    isPaymentETH,
    allowance,
    amount,
  );
  const needsApproval = allowanceState === "needs-approval";
  const isAllowanceReady = allowanceState !== "unknown";

  const approve = async () => {
    if (!paymentToken.address || !publicClient || !needsApproval || amount <= 0n)
      return;

    try {
      setIsApprovalConfirming(true);
      const hash = await approveAsync({
        address: paymentToken.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [presaleAddress, amount],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error("Token approval was reverted");
      }
      await refetch();
    } catch (error) {
      console.error("Approval failed", error);
      toast.error("Token approval failed. Please try again.");
    } finally {
      setIsApprovalConfirming(false);
    }
  };

  return {
    needsApproval,
    isAllowanceReady,
    isAllowanceError,
    approve,
    isApproving: isApproveLoading || isApprovalConfirming,
    isAllowanceLoading,
    refetchAllowance: refetch,
  };
}
