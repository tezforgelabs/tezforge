import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LaunchpadPresaleContract } from "@/config";
import {
  useLaunchpadPresale,
  type PresaleWithStatus,
} from "@/lib/hooks/useLaunchpadPresales";
import { getFriendlyTxErrorMessage } from "@/lib/utils/tx-errors";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { erc20Abi, formatUnits, isAddress, type Address } from "viem";
import {
  useAccount,
  useChainId,
  useConfig,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

export default function ManagePresalePage() {
  const { address: presaleAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();

  if (!presaleAddress || !isAddress(presaleAddress)) {
    return (
      <div className="container mx-auto px-4 py-12 text-[#1A1A2E]">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <p className="text-center text-red-600">Invalid presale address</p>
            <Button
              onClick={() => navigate("/dashboard/create/presale")}
              className="mt-4 w-full"
            >
              Create New Presale
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ManagePresaleData presaleAddress={presaleAddress} />;
}

function ManagePresaleData({ presaleAddress }: { presaleAddress: Address }) {
  const navigate = useNavigate();
  const { address: userAddress } = useAccount();
  const {
    presale,
    isLoading: isLoadingPresale,
    refetch: refetchPresale,
  } = useLaunchpadPresale(presaleAddress, false);

  if (isLoadingPresale) {
    return (
      <div className="container mx-auto px-4 py-12 text-[#1A1A2E]">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <p className="text-center">Loading presale data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!presale) {
    return (
      <div className="container mx-auto px-4 py-12 text-[#1A1A2E]">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <p className="text-center text-red-600">
              Presale not found at address {presaleAddress}
            </p>
            <Button
              onClick={() => navigate("/dashboard/create/presale")}
              className="mt-4 w-full"
            >
              Create New Presale
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is the owner
  if (
    userAddress &&
    presale.owner.toLowerCase() !== userAddress.toLowerCase()
  ) {
    return (
      <div className="container mx-auto px-4 py-12 text-[#1A1A2E]">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <p className="text-center text-red-600">
              You are not the owner of this presale
            </p>
            <Button
              onClick={() => navigate("/dashboard/create/presale")}
              className="mt-4 w-full"
            >
              Create New Presale
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure we have required presale data before rendering
  if (!presale.saleToken || !presale.hardCap || !presale.rate) {
    return (
      <div className="container mx-auto px-4 py-12 text-[#1A1A2E]">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <p className="text-center text-red-600">
              Presale data is incomplete. Please try again.
            </p>
            <Button
              onClick={() => navigate("/dashboard/user")}
              className="mt-4 w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 text-[#1A1A2E]">
      <Card className="max-w-2xl mx-auto p-0 gap-0">
        <CardHeader className="border-b-4 border-[#1A1A2E] bg-[#64FE3E] p-6">
          <CardTitle className="text-3xl text-center font-black uppercase tracking-wider">
            Manage Your Presale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <ManagePresaleView
            presaleAddress={presaleAddress}
            presale={presale}
            refetchPresale={refetchPresale}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ManagePresaleView({
  presaleAddress,
  presale,
  refetchPresale,
}: {
  presaleAddress: Address;
  presale: PresaleWithStatus;
  refetchPresale: () => Promise<unknown>;
}) {
  const chainId = useChainId();
  const config = useConfig();
  const explorerUrl = config.chains.find((chain) => chain.id === chainId)
    ?.blockExplorers?.default.url;
  const [singleWhitelist, setSingleWhitelist] = useState("");
  const [bulkWhitelist, setBulkWhitelist] = useState("");
  const [removeAddress, setRemoveAddress] = useState("");
  const [activeOwnerAction, setActiveOwnerAction] = useState<string | null>(
    null,
  );
  const [activeWhitelistAction, setActiveWhitelistAction] = useState<
    string | null
  >(null);

  const { data: saleTokenInfo } = useReadContracts({
    contracts: [
      {
        address: presale.saleToken,
        abi: erc20Abi,
        functionName: "symbol" as const,
      },
      {
        address: presale.saleToken,
        abi: erc20Abi,
        functionName: "decimals" as const,
      },
    ],
    query: {
      enabled: Boolean(presale.saleToken),
    },
  });

  const { address: userAddress } = useAccount();

  const saleTokenSymbol =
    (saleTokenInfo?.[0]?.result as string) ||
    presale.saleTokenSymbol ||
    "TOKEN";
  const saleTokenDecimals =
    (saleTokenInfo?.[1]?.result as number) || presale.saleTokenDecimals || 18;

  // Check token allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: presale.saleToken,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      userAddress && presaleAddress ? [userAddress, presaleAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && presaleAddress && presale.saleToken),
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Check contract token balance (to detect if deposit has been made)
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: presale.saleToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [presaleAddress],
    query: {
      enabled: Boolean(presaleAddress && presale.saleToken),
      refetchInterval: 5000, // Refetch every 5 seconds to detect deposits
    },
  });

  // Fetch total token supply for fee calculation
  const { data: totalSupply } = useReadContract({
    address: presale.saleToken,
    abi: erc20Abi,
    functionName: "totalSupply",
    query: {
      enabled: Boolean(presale.saleToken),
    },
  });

  const saleAmount = useMemo(() => {
    if (!presale?.hardCap || !presale?.rate) return 0n;
    try {
      // Rate is stored as scaled by 100 (e.g., 20000 = 200 tokens per XTZ)
      return (presale.hardCap * presale.rate) / 100n;
    } catch (error) {
      console.error("Error calculating sale amount:", error);
      return 0n;
    }
  }, [presale?.hardCap, presale?.rate]);

  // Fee is now 2% of total token supply, not 2% of sale amount
  const launchpadFee = useMemo(() => {
    if (!totalSupply) return 0n;
    return totalSupply / 50n; // 2% of total supply
  }, [totalSupply]);

  const totalRequiredAmount = saleAmount + launchpadFee;

  const formatTokenDisplay = useCallback(
    (value: bigint, maximumFractionDigits = 4) => {
      const numeric = Number(formatUnits(value, saleTokenDecimals));
      if (!Number.isFinite(numeric)) return "0";
      return numeric.toLocaleString(undefined, { maximumFractionDigits });
    },
    [saleTokenDecimals],
  );

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError,
    reset: resetDeposit,
  } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({ hash: depositHash });

  const {
    writeContract: writeOwnerAction,
    data: ownerActionHash,
    isPending: isOwnerActionPending,
    error: ownerActionError,
    reset: resetOwnerAction,
  } = useWriteContract();
  const {
    isLoading: isOwnerActionConfirming,
    isSuccess: isOwnerActionSuccess,
  } = useWaitForTransactionReceipt({ hash: ownerActionHash });

  const {
    writeContract: writeWhitelist,
    data: whitelistHash,
    isPending: isWhitelistPending,
    error: whitelistError,
    reset: resetWhitelist,
  } = useWriteContract();
  const { isLoading: isWhitelistConfirming, isSuccess: isWhitelistSuccess } =
    useWaitForTransactionReceipt({ hash: whitelistHash });

  useEffect(() => {
    if (approveError) {
      toast.error(getFriendlyTxErrorMessage(approveError, "Approval"));
    }
  }, [approveError]);

  useEffect(() => {
    if (depositError) {
      toast.error(getFriendlyTxErrorMessage(depositError, "Deposit"));
    }
  }, [depositError]);

  useEffect(() => {
    if (ownerActionError) {
      toast.error(getFriendlyTxErrorMessage(ownerActionError, "Action"));
    }
  }, [ownerActionError]);

  useEffect(() => {
    if (whitelistError) {
      toast.error(
        getFriendlyTxErrorMessage(whitelistError, "Whitelist update"),
      );
    }
  }, [whitelistError]);

  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("Token allowance approved");
      resetApprove();
      // Refetch allowance after approval
      refetchAllowance();
      refetchPresale();
    }
  }, [isApproveSuccess, resetApprove, refetchAllowance, refetchPresale]);

  useEffect(() => {
    if (isDepositSuccess) {
      toast.success("Sale tokens deposited and fee forwarded 🎉");
      resetDeposit();
      // Refetch balance after deposit
      refetchBalance();
      refetchPresale();
    }
  }, [isDepositSuccess, resetDeposit, refetchBalance, refetchPresale]);

  useEffect(() => {
    if (isOwnerActionSuccess && activeOwnerAction) {
      const labels: Record<string, string> = {
        finalize: "Presale finalized",
        cancel: "Presale cancelled",
        withdrawProceeds: "Proceeds withdrawn",
        withdrawTokens: "Unsold tokens withdrawn",
      };
      toast.success(labels[activeOwnerAction] || "Transaction confirmed");
      const completedAction = activeOwnerAction;
      resetOwnerAction();
      queueMicrotask(() => {
        setActiveOwnerAction((current) =>
          current === completedAction ? null : current,
        );
      });
      void refetchPresale();
    }
  }, [
    isOwnerActionSuccess,
    activeOwnerAction,
    resetOwnerAction,
    refetchPresale,
  ]);

  useEffect(() => {
    if (isWhitelistSuccess && activeWhitelistAction) {
      const messages: Record<string, string> = {
        addOne: "Wallet added to whitelist",
        bulkAdd: "Wallet list uploaded",
        remove: "Wallet removed from whitelist",
      };
      toast.success(messages[activeWhitelistAction] || "Whitelist updated");
      const completedAction = activeWhitelistAction;
      resetWhitelist();
      queueMicrotask(() => {
        setActiveWhitelistAction((current) =>
          current === completedAction ? null : current,
        );
        if (completedAction === "addOne") setSingleWhitelist("");
        if (completedAction === "bulkAdd") setBulkWhitelist("");
        if (completedAction === "remove") setRemoveAddress("");
      });
      void refetchPresale();
    }
  }, [
    isWhitelistSuccess,
    activeWhitelistAction,
    resetWhitelist,
    refetchPresale,
  ]);

  const handleApproveTokens = () => {
    if (totalRequiredAmount === 0n) {
      toast.error(
        "Unable to determine the token amount. Double-check your hard cap and rate.",
      );
      return;
    }
    writeApprove({
      abi: erc20Abi,
      address: presale.saleToken,
      functionName: "approve",
      args: [presaleAddress, totalRequiredAmount],
    });
  };

  const handleDepositTokens = () => {
    if (saleAmount === 0n) {
      toast.error(
        "Unable to determine the token amount. Double-check your hard cap and rate.",
      );
      return;
    }
    // The contract calculates the fee internally (2% of total token supply)
    // So we only deposit the saleAmount, but we need to approve totalRequiredAmount
    // (saleAmount + fee) so the contract can take the fee from total supply
    writeDeposit({
      abi: LaunchpadPresaleContract.abi,
      address: presaleAddress,
      functionName: "depositSaleTokens",
      args: [saleAmount],
    });
  };

  const runOwnerAction = (
    action: string,
    config: Parameters<typeof writeOwnerAction>[0],
  ) => {
    setActiveOwnerAction(action);
    writeOwnerAction(config);
  };

  const handleFinalize = () =>
    runOwnerAction("finalize", {
      abi: LaunchpadPresaleContract.abi,
      address: presaleAddress,
      functionName: "finalize",
    });

  const handleCancel = () =>
    runOwnerAction("cancel", {
      abi: LaunchpadPresaleContract.abi,
      address: presaleAddress,
      functionName: "cancelPresale",
    });

  const handleWithdrawProceeds = () => {
    if (!presale.claimEnabled) {
      toast.error("Please finalize the presale before withdrawing proceeds.");
      return;
    }
    runOwnerAction("withdrawProceeds", {
      abi: LaunchpadPresaleContract.abi,
      address: presaleAddress,
      functionName: "withdrawProceeds",
      args: [0n],
    });
  };

  const handleWithdrawTokens = () => {
    if (!presale.claimEnabled) {
      toast.error(
        "Please finalize the presale before withdrawing unsold tokens.",
      );
      return;
    }
    runOwnerAction("withdrawTokens", {
      abi: LaunchpadPresaleContract.abi,
      address: presaleAddress,
      functionName: "withdrawUnusedTokens",
      args: [0n],
    });
  };

  const runWhitelistAction = (
    action: string,
    config: Parameters<typeof writeWhitelist>[0],
  ) => {
    setActiveWhitelistAction(action);
    writeWhitelist(config);
  };

  const handleAddSingleWhitelist = () => {
    if (!singleWhitelist) {
      toast.error("Enter a wallet address to whitelist.");
      return;
    }
    if (!isAddress(singleWhitelist)) {
      toast.error("Invalid wallet address.");
      return;
    }
    runWhitelistAction("addOne", {
      abi: LaunchpadPresaleContract.abi,
      address: presaleAddress,
      functionName: "addToWhitelist",
      args: [singleWhitelist as Address],
    });
  };

  const handleBulkWhitelist = () => {
    const entries = bulkWhitelist
      .split(/[\s,]+/)
      .map((addr) => addr.trim())
      .filter(Boolean);
    if (entries.length === 0) {
      toast.error(
        "Paste one or more wallet addresses separated by commas or line breaks.",
      );
      return;
    }
    const invalid = entries.find((addr) => !isAddress(addr));
    if (invalid) {
      toast.error(`Invalid wallet: ${invalid}`);
      return;
    }
    runWhitelistAction("bulkAdd", {
      abi: LaunchpadPresaleContract.abi,
      address: presaleAddress,
      functionName: "addManyToWhitelist",
      args: [entries as Address[]],
    });
  };

  const handleRemoveWhitelist = () => {
    if (!removeAddress) {
      toast.error("Enter a wallet address to remove.");
      return;
    }
    if (!isAddress(removeAddress)) {
      toast.error("Invalid wallet address.");
      return;
    }
    runWhitelistAction("remove", {
      abi: LaunchpadPresaleContract.abi,
      address: presaleAddress,
      functionName: "removeFromWhitelist",
      args: [removeAddress as Address],
    });
  };

  const ownerActionBusy = isOwnerActionPending || isOwnerActionConfirming;
  const whitelistBusy = isWhitelistPending || isWhitelistConfirming;
  const depositBusy = isDepositPending || isDepositConfirming;
  const approveBusy = isApprovePending || isApproveConfirming;

  // Check if approval is sufficient
  const hasSufficientAllowance = useMemo(() => {
    if (!allowance || !totalRequiredAmount) return false;
    return allowance >= totalRequiredAmount;
  }, [allowance, totalRequiredAmount]);

  // Check if deposit has been made (contract has tokens)
  const hasDeposited = useMemo(() => {
    if (!contractBalance || !saleAmount) return false;
    // Consider deposit made if contract has at least the sale amount
    // (it might have more due to the fee)
    return contractBalance >= saleAmount;
  }, [contractBalance, saleAmount]);

  // Check if presale has ended (finalized or cancelled)
  const presaleHasEnded = presale.claimEnabled || presale.refundsEnabled;
  const explorerHref = `${explorerUrl}/address/${presaleAddress}`;

  const [cancelConfirming, setCancelConfirming] = useState(false);
  useEffect(() => {
    if (!cancelConfirming) return;
    const timer = setTimeout(() => setCancelConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [cancelConfirming]);

  const depositStepDone = hasDeposited;
  const finalizeStepDone = presale.claimEnabled || presale.refundsEnabled;
  const withdrawStepDone = false;
  const currentStep = !depositStepDone
    ? 1
    : !finalizeStepDone
      ? 2
      : 3;

  const stepBadge = (step: number, done: boolean) => {
    if (done)
      return "border-2 border-tezforge-ink bg-tezforge-green text-tezforge-ink";
    if (step === currentStep)
      return "border-2 border-tezforge-ink bg-tezforge-ink text-white";
    return "border-2 border-tezforge-ink bg-white text-tezforge-ink/50";
  };

  const statusBadge = (() => {
    switch (presale.status) {
      case "live":
        return { label: "Live", classes: "bg-tezforge-green" };
      case "upcoming":
        return { label: "Upcoming", classes: "bg-tezforge-blue text-white" };
      case "cancelled":
        return { label: "Cancelled", classes: "bg-tezforge-red text-white" };
      case "finalized":
        return { label: "Finalized", classes: "bg-tezforge-blue text-white" };
      default:
        return { label: "Ended", classes: "bg-tezforge-cream-dark" };
    }
  })();

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="border-2 border-tezforge-ink bg-white p-4 shadow-[3px_3px_0_0_rgba(26,26,46,1)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center border-2 border-tezforge-ink bg-tezforge-cream text-xs font-black uppercase"
            >
              {saleTokenSymbol.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-black uppercase tracking-tight">
                {saleTokenSymbol} Presale
              </h3>
              <a
                href={explorerHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-tezforge-ink/60 underline underline-offset-2 hover:text-tezforge-blue"
              >
                {presaleAddress.slice(0, 6)}…{presaleAddress.slice(-4)} ↗
              </a>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 border-2 border-tezforge-ink px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusBadge.classes}`}
          >
            {statusBadge.label}
          </span>
        </div>
        {presale.hardCap > 0n && (
          <div className="mt-3 flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={presale.progress}
              aria-label={`${saleTokenSymbol} presale funding progress`}
              className="h-2.5 flex-1 overflow-hidden border border-tezforge-ink bg-tezforge-cream"
            >
              <div
                className="h-full bg-tezforge-blue"
                style={{ width: `${presale.progress}%` }}
              />
            </div>
            <span className="shrink-0 text-sm font-black tabular-nums">
              {presale.progress}%
            </span>
          </div>
        )}
      </div>

      {/* Task stepper */}
      <ol className="grid grid-cols-3 gap-2" aria-label="Setup progress">
        {[
          { step: 1, label: "Deposit tokens", done: depositStepDone },
          { step: 2, label: "Finalize", done: finalizeStepDone },
          { step: 3, label: "Withdraw", done: withdrawStepDone },
        ].map(({ step, label, done }) => (
          <li
            key={step}
            aria-current={step === currentStep ? "step" : undefined}
            className={`flex items-center gap-2 border-2 border-tezforge-ink px-2.5 py-2 text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_rgba(26,26,46,1)] sm:text-xs ${
              step === currentStep
                ? "bg-white"
                : done
                  ? "bg-tezforge-cream"
                  : "bg-tezforge-cream/50 text-tezforge-ink/50"
            }`}
          >
            <span
              className={`flex size-5 shrink-0 items-center justify-center text-[10px] ${stepBadge(step, done)}`}
            >
              {done ? "✓" : step}
            </span>
            <span className="truncate">{label}</span>
          </li>
        ))}
      </ol>

      {/* Step 1 · Deposit */}
      <section
        aria-labelledby="step-deposit"
        className={`border-2 border-tezforge-ink p-4 shadow-[3px_3px_0_0_rgba(26,26,46,1)] sm:p-5 ${
          depositStepDone ? "bg-tezforge-cream/60" : "bg-tezforge-cream"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="step-deposit"
            className="flex items-center gap-2 text-base font-black uppercase tracking-wider"
          >
            Deposit Sale Tokens
            {depositStepDone && (
              <span className="border-2 border-tezforge-ink bg-tezforge-green px-1.5 py-0.5 text-[10px]">
                ✓ Done
              </span>
            )}
          </h2>
          <span className="text-[11px] font-bold text-tezforge-ink/60">
            Fee: 2% of total token supply
          </span>
        </div>

        {depositStepDone ? (
          <p className="mt-3 text-sm font-medium text-tezforge-ink/70">
            ✓ {formatTokenDisplay(saleAmount)} {saleTokenSymbol} deposited —
            contributors are ready to buy.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-tezforge-ink/80">
              Contributors receive{" "}
              <span className="font-bold">
                {formatTokenDisplay(saleAmount)} {saleTokenSymbol}
              </span>
              . Deposit that amount plus the{" "}
              <span className="font-bold">
                {formatTokenDisplay(launchpadFee)} {saleTokenSymbol}
              </span>{" "}
              fee.
            </p>

            <ol className="mt-4 space-y-3">
              <li className="flex flex-col gap-2 border-2 border-tezforge-ink bg-white p-3 shadow-[2px_2px_0_0_rgba(26,26,46,1)] sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-wider">
                    1. Approve
                  </p>
                  <p className="text-xs text-tezforge-ink/60">
                    Allow the contract to take{" "}
                    {formatTokenDisplay(totalRequiredAmount)} {saleTokenSymbol}
                  </p>
                </div>
                {hasSufficientAllowance ? (
                  <span className="shrink-0 border-2 border-tezforge-ink bg-tezforge-green px-2 py-1 text-[11px] font-black uppercase">
                    ✓ Approved
                  </span>
                ) : (
                  <Button
                    onClick={handleApproveTokens}
                    disabled={approveBusy || totalRequiredAmount === 0n}
                    className="shrink-0 border-2 border-tezforge-ink bg-white text-xs font-black uppercase tracking-wider text-tezforge-ink shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none"
                  >
                    {approveBusy ? "Approving…" : `Approve`}
                  </Button>
                )}
              </li>
              <li className="flex flex-col gap-2 border-2 border-tezforge-ink bg-white p-3 shadow-[2px_2px_0_0_rgba(26,26,46,1)] sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-wider">
                    2. Deposit
                  </p>
                  <p className="text-xs text-tezforge-ink/60">
                    Send {formatTokenDisplay(saleAmount)} {saleTokenSymbol} to
                    the contract
                  </p>
                </div>
                {hasDeposited ? (
                  <span className="shrink-0 border-2 border-tezforge-ink bg-tezforge-green px-2 py-1 text-[11px] font-black uppercase">
                    ✓ Deposited
                  </span>
                ) : (
                  <Button
                    onClick={handleDepositTokens}
                    disabled={depositBusy || saleAmount === 0n || !hasSufficientAllowance}
                    className="shrink-0 border-2 border-tezforge-ink bg-tezforge-blue text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {depositBusy ? "Depositing…" : "Deposit"}
                  </Button>
                )}
              </li>
            </ol>
          </>
        )}
      </section>

      {presale.requiresWhitelist ? (
        <section
          aria-labelledby="step-whitelist"
          className="border-2 border-tezforge-ink bg-white p-4 shadow-[3px_3px_0_0_rgba(26,26,46,1)] sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="step-whitelist"
              className="text-base font-black uppercase tracking-wider"
            >
              Whitelist
            </h2>
            <span className="text-[11px] font-bold text-tezforge-ink/60">
              Only these wallets can contribute
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wl-add" className="text-[11px] font-black uppercase tracking-wider">
                Add a wallet
              </Label>
              <div className="flex gap-2">
                <Input
                  id="wl-add"
                  placeholder="0x…"
                  value={singleWhitelist}
                  onChange={(e) => setSingleWhitelist(e.target.value)}
                  className="border-2 border-tezforge-ink font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={handleAddSingleWhitelist}
                  disabled={whitelistBusy || !singleWhitelist}
                  className="shrink-0 border-2 border-tezforge-ink bg-tezforge-green text-xs font-black uppercase tracking-wider text-tezforge-ink shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none"
                >
                  {whitelistBusy && activeWhitelistAction === "addOne"
                    ? "Adding…"
                    : "Add"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-remove" className="text-[11px] font-black uppercase tracking-wider">
                Remove a wallet
              </Label>
              <div className="flex gap-2">
                <Input
                  id="wl-remove"
                  placeholder="0x…"
                  value={removeAddress}
                  onChange={(e) => setRemoveAddress(e.target.value)}
                  className="border-2 border-tezforge-ink font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={handleRemoveWhitelist}
                  disabled={whitelistBusy || !removeAddress}
                  className="shrink-0 border-2 border-tezforge-ink bg-tezforge-cream-dark text-xs font-black uppercase tracking-wider text-tezforge-ink shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none"
                >
                  {whitelistBusy && activeWhitelistAction === "remove"
                    ? "Removing…"
                    : "Remove"}
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="wl-bulk" className="text-[11px] font-black uppercase tracking-wider">
              Bulk upload — comma or line separated
            </Label>
            <Textarea
              id="wl-bulk"
              rows={3}
              placeholder="0xabc…
0xdef…"
              value={bulkWhitelist}
              onChange={(e) => setBulkWhitelist(e.target.value)}
              className="border-2 border-tezforge-ink font-mono text-xs"
            />
            <Button
              type="button"
              onClick={handleBulkWhitelist}
              disabled={whitelistBusy || !bulkWhitelist}
              className="border-2 border-tezforge-ink bg-tezforge-green text-xs font-black uppercase tracking-wider text-tezforge-ink shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none"
            >
              {whitelistBusy && activeWhitelistAction === "bulkAdd"
                ? "Uploading…"
                : "Add Many"}
            </Button>
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="step-access"
          className="border-2 border-tezforge-ink bg-white p-4 shadow-[3px_3px_0_0_rgba(26,26,46,1)] sm:p-5"
        >
          <h2
            id="step-access"
            className="text-base font-black uppercase tracking-wider"
          >
            Access
          </h2>
          <p className="mt-2 text-sm text-tezforge-ink/70">
            Open sale — anyone can contribute. Eligibility is checked on-chain
            when a wallet submits a transaction.
          </p>
        </section>
      )}

      {/* Step 3 · Finalize / Cancel + Withdraw */}
      <section
        aria-labelledby="step-finalize"
        className="border-2 border-tezforge-ink bg-white p-4 shadow-[3px_3px_0_0_rgba(26,26,46,1)] sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="step-finalize"
            className="text-base font-black uppercase tracking-wider"
          >
            After the Sale
          </h2>
          <span className="text-[11px] font-bold text-tezforge-ink/60">
            3% fee on withdrawn proceeds
          </span>
        </div>

        {presaleHasEnded ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-tezforge-ink/70">
              {presale.claimEnabled
                ? "Sale finalized — contributors can claim, and you can withdraw."
                : "Sale cancelled — contributors can claim refunds."}
            </p>
            {presale.claimEnabled && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleWithdrawProceeds}
                  disabled={ownerActionBusy}
                  className="border-2 border-tezforge-ink bg-tezforge-green text-xs font-black uppercase tracking-wider text-tezforge-ink shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none"
                >
                  {ownerActionBusy && activeOwnerAction === "withdrawProceeds"
                    ? "Withdrawing…"
                    : "Withdraw Proceeds"}
                </Button>
                <Button
                  onClick={handleWithdrawTokens}
                  disabled={ownerActionBusy}
                  className="border-2 border-tezforge-ink bg-tezforge-green text-xs font-black uppercase tracking-wider text-tezforge-ink shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none"
                >
                  {ownerActionBusy && activeOwnerAction === "withdrawTokens"
                    ? "Withdrawing…"
                    : "Withdraw Unsold Tokens"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-tezforge-ink/70">
              When the sale ends, finalize it to enable claiming. Cancelling
              instead refunds every contributor.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button
                onClick={handleFinalize}
                disabled={ownerActionBusy}
                className="border-2 border-tezforge-ink bg-tezforge-blue text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none"
              >
                {ownerActionBusy && activeOwnerAction === "finalize"
                  ? "Finalizing…"
                  : "Finalize Presale"}
              </Button>
              <Button
                onClick={
                  cancelConfirming ? handleCancel : () => setCancelConfirming(true)
                }
                disabled={ownerActionBusy}
                aria-live="polite"
                className={`border-2 border-tezforge-ink text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none ${
                  cancelConfirming
                    ? "bg-tezforge-red text-white"
                    : "bg-tezforge-cream-dark text-tezforge-ink"
                }`}
              >
                {ownerActionBusy && activeOwnerAction === "cancel"
                  ? "Cancelling…"
                  : cancelConfirming
                    ? "Tap again to confirm"
                    : "Cancel Presale"}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
