import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStakingContractAddress, StakingContract } from "@/config";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  BarChart3,
  Coins,
  Gift,
  Loader2,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  erc20Abi,
  formatUnits,
  parseUnits,
  type Abi,
  type Address,
} from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

export default function StakingPage() {
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const stakingContractAddress = getStakingContractAddress(chainId);

  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [stakingHash, setStakingHash] = useState<`0x${string}`>();
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [unstakingHash, setUnstakingHash] = useState<`0x${string}`>();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimHash, setClaimHash] = useState<`0x${string}`>();

  const processedStakingHash = useRef<string | null>(null);
  const processedUnstakingHash = useRef<string | null>(null);
  const processedClaimHash = useRef<string | null>(null);
  const rewardsAnimationFrameRef = useRef<number | null>(null);
  const animatedPendingRewardsRef = useRef(0);

  const [animatedPendingRewards, setAnimatedPendingRewards] = useState(0);
  const [isPendingRewardsAnimating, setIsPendingRewardsAnimating] = useState(false);

  // Read staking token address
  const { data: stakingTokenAddress } = useReadContract({
    address: stakingContractAddress,
    abi: StakingContract.abi as Abi,
    functionName: "stakingToken",
  });

  // Read rewards token address
  const { data: rewardsTokenAddress } = useReadContract({
    address: stakingContractAddress,
    abi: StakingContract.abi as Abi,
    functionName: "rewardsToken",
  });

  // Read staking token info
  const { data: stakingTokenSymbol } = useReadContract({
    abi: erc20Abi,
    address: stakingTokenAddress as Address,
    functionName: "symbol",
    query: { enabled: !!stakingTokenAddress },
  });

  const { data: stakingTokenDecimals } = useReadContract({
    abi: erc20Abi,
    address: stakingTokenAddress as Address,
    functionName: "decimals",
    query: { enabled: !!stakingTokenAddress },
  });

  // Read rewards token info
  const { data: rewardsTokenSymbol } = useReadContract({
    abi: erc20Abi,
    address: rewardsTokenAddress as Address,
    functionName: "symbol",
    query: { enabled: !!rewardsTokenAddress },
  });

  const { data: rewardsTokenDecimals } = useReadContract({
    abi: erc20Abi,
    address: rewardsTokenAddress as Address,
    functionName: "decimals",
    query: { enabled: !!rewardsTokenAddress },
  });

  // Read user's wallet balance of staking token
  const { data: walletBalance, refetch: refetchWalletBalance } = useReadContract({
    abi: erc20Abi,
    address: stakingTokenAddress as Address,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!stakingTokenAddress },
  });

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: stakingTokenAddress as Address,
    functionName: "allowance",
    args: address ? [address, stakingContractAddress] : undefined,
    query: { enabled: !!address && !!stakingTokenAddress },
  });

  // Read user's staked balance
  const { data: stakedBalance, refetch: refetchStakedBalance } = useReadContract({
    address: stakingContractAddress,
    abi: StakingContract.abi as Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read total amount staked in contract
  const { data: totalStaked, refetch: refetchTotalStaked } = useReadContract({
    address: stakingContractAddress,
    abi: StakingContract.abi as Abi,
    functionName: "totalSupply",
    query: {
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  });

  // Read pending rewards
  const { data: pendingRewards, refetch: refetchPendingRewards } = useReadContract({
    address: stakingContractAddress,
    abi: StakingContract.abi as Abi,
    functionName: "pendingRewards",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  });

  // Transaction receipts
  const { isSuccess: isStakingSuccess, isError: isStakingError } =
    useWaitForTransactionReceipt({ hash: stakingHash });

  const { isSuccess: isUnstakingSuccess, isError: isUnstakingError } =
    useWaitForTransactionReceipt({ hash: unstakingHash });

  const { isSuccess: isClaimSuccess, isError: isClaimError } =
    useWaitForTransactionReceipt({ hash: claimHash });

  // Format values
  const decimals = stakingTokenDecimals ?? 18;
  const rewardDecimals = rewardsTokenDecimals ?? 18;

  const formattedWalletBalance = useMemo(() => {
    if (walletBalance === undefined || walletBalance === null) return "0";
    try {
      return Number(formatUnits(walletBalance as bigint, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });
    } catch { return "0"; }
  }, [walletBalance, decimals]);

  const formattedStakedBalance = useMemo(() => {
    if (stakedBalance === undefined || stakedBalance === null) return "0";
    try {
      return Number(formatUnits(stakedBalance as bigint, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });
    } catch { return "0"; }
  }, [stakedBalance, decimals]);

  const formattedTotalStaked = useMemo(() => {
    if (totalStaked === undefined || totalStaked === null) return "0";
    try {
      return Number(formatUnits(totalStaked as bigint, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });
    } catch { return "0"; }
  }, [totalStaked, decimals]);

  const pendingRewardsValue = useMemo(() => {
    if (pendingRewards === undefined || pendingRewards === null) return 0;
    try {
      const value = Number(formatUnits(pendingRewards as bigint, rewardDecimals));
      return Number.isFinite(value) ? value : 0;
    } catch { return 0; }
  }, [pendingRewards, rewardDecimals]);

  useEffect(() => {
    const targetValue = pendingRewardsValue;
    const startValue = animatedPendingRewardsRef.current;

    if (Math.abs(targetValue - startValue) < Number.EPSILON) {
      animatedPendingRewardsRef.current = targetValue;
      setAnimatedPendingRewards(targetValue);
      setIsPendingRewardsAnimating(false);
      return;
    }

    if (rewardsAnimationFrameRef.current) {
      cancelAnimationFrame(rewardsAnimationFrameRef.current);
    }

    setIsPendingRewardsAnimating(true);

    const duration = 1800;
    let startTime: number | null = null;

    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const nextValue = startValue + (targetValue - startValue) * easedProgress;

      animatedPendingRewardsRef.current = nextValue;
      setAnimatedPendingRewards(nextValue);

      if (progress < 1) {
        rewardsAnimationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      animatedPendingRewardsRef.current = targetValue;
      setAnimatedPendingRewards(targetValue);
      setIsPendingRewardsAnimating(false);
      rewardsAnimationFrameRef.current = null;
    };

    rewardsAnimationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (rewardsAnimationFrameRef.current) {
        cancelAnimationFrame(rewardsAnimationFrameRef.current);
      }
    };
  }, [pendingRewardsValue]);

  const formattedPendingRewards = useMemo(
    () => animatedPendingRewards.toLocaleString(undefined, { maximumFractionDigits: 6 }),
    [animatedPendingRewards]
  );

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!stakeAmount || allowance === undefined || allowance === null) return false;
    try {
      const amount = parseUnits(stakeAmount, decimals);
      return (allowance as bigint) < amount;
    } catch { return false; }
  }, [stakeAmount, allowance, decimals]);

  // Has claimable rewards
  const hasClaimableRewards = useMemo(() => {
    if (pendingRewards === undefined || pendingRewards === null) return false;
    return (pendingRewards as bigint) > 0n;
  }, [pendingRewards]);

  // Insufficient balance checks
  const hasInsufficientStakeBalance = useMemo(() => {
    if (!stakeAmount || walletBalance === undefined || walletBalance === null) return false;
    try {
      const amount = parseUnits(stakeAmount, decimals);
      return amount > (walletBalance as bigint);
    } catch { return false; }
  }, [stakeAmount, walletBalance, decimals]);

  const hasInsufficientUnstakeBalance = useMemo(() => {
    if (!unstakeAmount || stakedBalance === undefined || stakedBalance === null) return false;
    try {
      const amount = parseUnits(unstakeAmount, decimals);
      return amount > (stakedBalance as bigint);
    } catch { return false; }
  }, [unstakeAmount, stakedBalance, decimals]);

  // Handle staking success/error
  useEffect(() => {
    if (isStakingSuccess && stakingHash && processedStakingHash.current !== stakingHash) {
      processedStakingHash.current = stakingHash;
      setIsStaking(false);
      setStakingHash(undefined);
      setStakeAmount("");
      refetchWalletBalance();
      refetchStakedBalance();
      refetchTotalStaked();
      refetchPendingRewards();
      toast.success("Staking successful!");
    }
  }, [isStakingSuccess, stakingHash, refetchWalletBalance, refetchStakedBalance, refetchTotalStaked, refetchPendingRewards]);

  useEffect(() => {
    if (isStakingError && stakingHash && processedStakingHash.current !== stakingHash) {
      processedStakingHash.current = stakingHash;
      setIsStaking(false);
      setStakingHash(undefined);
      toast.error("Staking failed.");
    }
  }, [isStakingError, stakingHash]);

  // Handle unstaking success/error
  useEffect(() => {
    if (isUnstakingSuccess && unstakingHash && processedUnstakingHash.current !== unstakingHash) {
      processedUnstakingHash.current = unstakingHash;
      setIsUnstaking(false);
      setUnstakingHash(undefined);
      setUnstakeAmount("");
      refetchWalletBalance();
      refetchStakedBalance();
      refetchTotalStaked();
      refetchPendingRewards();
      toast.success("Withdrawal successful!");
    }
  }, [isUnstakingSuccess, unstakingHash, refetchWalletBalance, refetchStakedBalance, refetchTotalStaked, refetchPendingRewards]);

  useEffect(() => {
    if (isUnstakingError && unstakingHash && processedUnstakingHash.current !== unstakingHash) {
      processedUnstakingHash.current = unstakingHash;
      setIsUnstaking(false);
      setUnstakingHash(undefined);
      toast.error("Withdrawal failed.");
    }
  }, [isUnstakingError, unstakingHash]);

  // Handle claim success/error
  useEffect(() => {
    if (isClaimSuccess && claimHash && processedClaimHash.current !== claimHash) {
      processedClaimHash.current = claimHash;
      setIsClaiming(false);
      setClaimHash(undefined);
      refetchPendingRewards();
      refetchWalletBalance();
      toast.success("Rewards claimed!");
    }
  }, [isClaimSuccess, claimHash, refetchPendingRewards, refetchWalletBalance]);

  useEffect(() => {
    if (isClaimError && claimHash && processedClaimHash.current !== claimHash) {
      processedClaimHash.current = claimHash;
      setIsClaiming(false);
      setClaimHash(undefined);
      toast.error("Claim failed.");
    }
  }, [isClaimError, claimHash]);

  const handleStake = async () => {
    if (!address || !stakingTokenAddress || !stakeAmount) return;

    try {
      const amount = parseUnits(stakeAmount, decimals);

      if (amount <= 0n) {
        toast.error("Enter an amount greater than 0.");
        return;
      }

      if (!publicClient) {
        toast.error("Could not access network client. Please retry.");
        return;
      }

      const currentAllowance = (allowance as bigint | undefined) ?? 0n;

      if (currentAllowance < amount) {
        setIsApproving(true);
        toast.info(`Approving ${stakingTokenSymbol || "tokens"}...`);

        const approvalTxHash = await writeContractAsync({
          address: stakingTokenAddress as Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [stakingContractAddress, amount],
        });

        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          hash: approvalTxHash,
        });

        if (approvalReceipt.status !== "success") {
          throw new Error("Approval transaction failed.");
        }

        await refetchAllowance();
        setIsApproving(false);
        toast.success("Approval confirmed. Confirm staking to continue.");
      }

      setIsStaking(true);

      const hash = await writeContractAsync({
        address: stakingContractAddress,
        abi: StakingContract.abi as Abi,
        functionName: "stake",
        args: [amount],
      });

      setStakingHash(hash);
      toast.info("Staking tokens...");
    } catch (err: unknown) {
      setIsApproving(false);
      setIsStaking(false);
      const message = (err as { shortMessage?: string })?.shortMessage || "Staking failed";
      toast.error(message);
    }
  };

  const handleUnstake = async () => {
    if (!address || !unstakeAmount) return;

    try {
      setIsUnstaking(true);
      const amount = parseUnits(unstakeAmount, decimals);

      const hash = await writeContractAsync({
        address: stakingContractAddress,
        abi: StakingContract.abi as Abi,
        functionName: "withdraw",
        args: [amount],
      });

      setUnstakingHash(hash);
      toast.info("Withdrawing tokens...");
    } catch (err: unknown) {
      setIsUnstaking(false);
      const message = (err as { shortMessage?: string })?.shortMessage || "Withdrawal failed";
      toast.error(message);
    }
  };

  const handleClaim = async () => {
    if (!address) return;

    try {
      setIsClaiming(true);

      const hash = await writeContractAsync({
        address: stakingContractAddress,
        abi: StakingContract.abi as Abi,
        functionName: "getReward",
        args: [],
      });

      setClaimHash(hash);
      toast.info("Claiming rewards...");
    } catch (err: unknown) {
      setIsClaiming(false);
      const message = (err as { shortMessage?: string })?.shortMessage || "Claim failed";
      toast.error(message);
    }
  };

  const handleMaxStake = () => {
    if (walletBalance && decimals) {
      setStakeAmount(formatUnits(walletBalance as bigint, decimals));
    }
  };

  const handleMaxUnstake = () => {
    if (stakedBalance && decimals) {
      setUnstakeAmount(formatUnits(stakedBalance as bigint, decimals));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 text-black">
      {/* Header Banner */}
      <div className="mb-6 sm:mb-8">
        <div className="border-4 border-black p-4 sm:p-6 md:p-8 shadow-[6px_6px_0_rgba(0,0,0,1)] bg-[#7DF9FF]">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider flex items-center gap-3 flex-wrap">
              <Coins className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              Staking
            </h1>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              Stake {stakingTokenSymbol || "tokens"} and earn {rewardsTokenSymbol || "rewards"} without leaving the ReactPad dashboard.
            </p>
          </div>
        </div>
      </div>


      {!isConnected ? (
        <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] max-w-2xl mx-auto">
          <CardContent className="p-8 sm:p-12 text-center space-y-6">
            <Wallet className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <h2 className="text-2xl font-black uppercase mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600">Connect your wallet to start staking and earning rewards.</p>
            </div>
            <Button
              onClick={openConnectModal}
              className="bg-[#7DF9FF] text-black font-black uppercase tracking-wider border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-[#5DD5F5] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-8 py-6 text-lg"
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Stats */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] p-0 gap-0">
              <CardHeader className="border-b-2 border-black bg-[#7DF9FF] p-4">
                <CardTitle className="font-black uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Your Position
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="p-4 border border-gray-200 bg-white">
                  <p className="text-xs uppercase font-bold text-gray-500">Wallet Balance</p>
                  <p className="text-2xl font-black text-gray-900">{formattedWalletBalance}</p>
                  <p className="text-sm text-gray-500">{stakingTokenSymbol || "Tokens"}</p>
                </div>
                <div className="p-4 border border-gray-200 bg-white">
                  <p className="text-xs uppercase font-bold text-gray-500">Staked Balance</p>
                  <p className="text-2xl font-black text-gray-900">{formattedStakedBalance}</p>
                  <p className="text-sm text-gray-500">{stakingTokenSymbol || "Tokens"}</p>
                </div>
                <div className="p-4 border border-gray-200 bg-white">
                  <p className="text-xs uppercase font-bold text-gray-500">Pending Rewards</p>
                  <p
                    className={`text-2xl font-black transition-all duration-700 ${isPendingRewardsAnimating
                      ? "text-emerald-700 scale-[1.03] animate-pulse"
                      : "text-gray-900 scale-100"
                      }`}
                  >
                    {formattedPendingRewards}
                  </p>
                  <p className="text-sm text-gray-500">{rewardsTokenSymbol || "Tokens"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Claim Rewards */}
            {hasClaimableRewards && (
              <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] p-0 gap-0 overflow-hidden">
                <CardContent className="p-0">
                  <Button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="w-full h-full py-6 rounded-none border-0 bg-[#90EE90] text-black font-black uppercase tracking-wider text-lg hover:bg-[#7ED87E] disabled:opacity-50"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5 mr-2" />
                        Claim {formattedPendingRewards} {rewardsTokenSymbol}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stake/Unstake Form */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] p-0 gap-0">
              <CardContent className="p-4 sm:p-6 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase font-bold text-gray-500">Total RPAD Staked</p>
                    <p className="text-3xl sm:text-4xl font-black text-gray-900">{formattedTotalStaked}</p>
                    <p className="text-sm text-gray-500">{stakingTokenSymbol || "Tokens"}</p>
                  </div>
                  <BarChart3 className="w-7 h-7 text-gray-400 shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] p-0 gap-0">
              <CardHeader className="border-b-2 border-black bg-white p-0">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("stake")}
                    className={`flex-1 py-4 font-black uppercase tracking-wider text-sm transition-colors ${activeTab === "stake"
                      ? "bg-[#7DF9FF] text-black"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    Stake
                  </button>
                  <button
                    onClick={() => setActiveTab("unstake")}
                    className={`flex-1 py-4 font-black uppercase tracking-wider text-sm transition-colors border-l-2 border-black ${activeTab === "unstake"
                      ? "bg-[#7DF9FF] text-black"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    Unstake
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {activeTab === "stake" ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold uppercase">Amount to Stake</label>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Balance:</span>
                          <span className="font-bold">{formattedWalletBalance}</span>
                          <button
                            onClick={handleMaxStake}
                            className="text-gray-900 font-bold hover:underline"
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 border-4 border-black bg-white">
                        <Input
                          type="text"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 text-xl font-bold border-0 shadow-none focus-visible:ring-0 p-0"
                        />
                        <span className="font-black text-gray-600">{stakingTokenSymbol || "TOKEN"}</span>
                      </div>
                      {hasInsufficientStakeBalance && (
                        <p className="text-red-500 text-sm mt-2 font-bold">Insufficient balance</p>
                      )}
                    </div>

                    <Button
                      onClick={handleStake}
                      disabled={isApproving || isStaking || !stakeAmount || hasInsufficientStakeBalance}
                      className={`w-full py-6 text-black font-black uppercase tracking-wider border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 ${needsApproval ? "bg-[#FFFB8F] hover:bg-[#FFF570]" : "bg-[#7DF9FF] hover:bg-[#5DD5F5]"
                        }`}
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : isStaking ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Staking...
                        </>
                      ) : needsApproval ? (
                        `Approve + Stake ${stakingTokenSymbol || "Token"}`
                      ) : (
                        "Stake"
                      )}
                    </Button>
                    {needsApproval && (
                      <p className="text-xs text-gray-600 font-bold text-center">
                        This action requires 2 wallet confirmations.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold uppercase">Amount to Unstake</label>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Staked:</span>
                          <span className="font-bold">{formattedStakedBalance}</span>
                          <button
                            onClick={handleMaxUnstake}
                            className="text-gray-900 font-bold hover:underline"
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 border-4 border-black bg-white">
                        <Input
                          type="text"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 text-xl font-bold border-0 shadow-none focus-visible:ring-0 p-0"
                        />
                        <span className="font-black text-gray-600">{stakingTokenSymbol || "TOKEN"}</span>
                      </div>
                      {hasInsufficientUnstakeBalance && (
                        <p className="text-red-500 text-sm mt-2 font-bold">Insufficient staked balance</p>
                      )}
                    </div>

                    <Button
                      onClick={handleUnstake}
                      disabled={isUnstaking || !unstakeAmount || hasInsufficientUnstakeBalance}
                      className="w-full py-6 bg-[#7DF9FF] text-black font-black uppercase tracking-wider border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-[#5DD5F5] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50"
                    >
                      {isUnstaking ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Withdrawing...
                        </>
                      ) : (
                        "Unstake"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
