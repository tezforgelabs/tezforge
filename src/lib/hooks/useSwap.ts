import { RouterContract } from "@/config";
import { Token, CurrencyAmount, Percent, TradeType } from "@uniswap/sdk-core";
import { Pair, Route, Trade } from "@uniswap/v2-sdk";
import { useCallback, useMemo } from "react";
import { erc20Abi, maxUint256 } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";

export interface SwapQuote {
  trade: Trade<Token, Token, TradeType>;
  executionPrice: string;
  priceImpact: Percent;
  minimumOutput: string;
  route: string;
}

interface UseSwapOptions {
  tokenIn: Token | null;
  tokenOut: Token | null;
  amountIn: string;
  pairs: Pair[];
  slippageTolerance: number; // e.g. 0.5 for 0.5%
}

export function useSwap({ tokenIn, tokenOut, amountIn, pairs, slippageTolerance }: UseSwapOptions) {
  const { address } = useAccount();

  // ── Find the best route (single-hop for now) ────────────────────────────
  const trade = useMemo<Trade<Token, Token, TradeType> | null>(() => {
    if (!tokenIn || !tokenOut || !amountIn || !pairs.length) return null;

    const parsedAmount = parseFloat(amountIn);
    if (parsedAmount <= 0) return null;

    const amount = CurrencyAmount.fromRawAmount(
      tokenIn,
      BigInt(Math.floor(parsedAmount * 10 ** tokenIn.decimals)).toString()
    );

    // Find a pair that contains both tokens
    const relevantPair = pairs.find(
      (p) =>
        (p.token0.equals(tokenIn) && p.token1.equals(tokenOut)) ||
        (p.token0.equals(tokenOut) && p.token1.equals(tokenIn))
    );

    if (!relevantPair) return null;

    const route = new Route([relevantPair], tokenIn, tokenOut);

    try {
      const trade = new Trade(
        route,
        amount,
        TradeType.EXACT_INPUT
      );
      return trade;
    } catch {
      return null;
    }
  }, [tokenIn, tokenOut, amountIn, pairs]);

  // ── Quote: minimum output after slippage ────────────────────────────────
  const quote = useMemo<SwapQuote | null>(() => {
    if (!trade) return null;

    const slippage = new Percent(Math.floor(slippageTolerance * 100), 10000);
    const minimumOutput = trade.minimumAmountOut(slippage);

    return {
      trade,
      executionPrice: trade.executionPrice.toSignificant(8),
      priceImpact: trade.priceImpact,
      minimumOutput: minimumOutput.toSignificant(8),
      route: trade.route.pairs.map((p) => `${p.token0.symbol}-${p.token1.symbol}`).join(" → "),
    };
  }, [trade, slippageTolerance]);

  // ── Approval: check if router is approved to spend tokenIn ─────────────
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn?.address as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, RouterContract.address] : undefined,
    query: {
      enabled: Boolean(address && tokenIn),
    },
  });

  const needsApproval = useMemo(() => {
    if (!allowance || !tokenIn || !amountIn) return false;
    const parsedAmount = parseFloat(amountIn);
    if (parsedAmount <= 0) return false;
    const requiredAmount = BigInt(Math.floor(parsedAmount * 10 ** tokenIn.decimals));
    return (allowance as bigint) < requiredAmount;
  }, [allowance, tokenIn, amountIn]);

  // ── Write: approve ────────────────────────────────────────────────────
  const { writeContract: writeApprove, isPending: isApproving } = useWriteContract();

  const handleApprove = useCallback(() => {
    if (!tokenIn) return;
    writeApprove({
      address: tokenIn.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [RouterContract.address, maxUint256],
    });
  }, [tokenIn, writeApprove]);

  // ── Write: swap ────────────────────────────────────────────────────────
  const { writeContract: writeSwap, isPending: isSwapping, data: swapHash, error: swapError } = useWriteContract();

  const handleSwap = useCallback(() => {
    if (!trade || !address) return;

    const slippage = new Percent(Math.floor(slippageTolerance * 100), 10000);
    const minimumOutput = trade.minimumAmountOut(slippage);
    const path = trade.route.pairs.map((p) => p.token0.address as `0x${string}`);

    // Router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)
    writeSwap({
      address: RouterContract.address,
      abi: RouterContract.abi,
      functionName: "swapExactTokensForTokens",
      args: [
        BigInt(trade.inputAmount.quotient.toString()),
        BigInt(minimumOutput.quotient.toString()),
        path,
        address,
        BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // 20 min deadline
      ],
    } as const);
  }, [trade, address, slippageTolerance, writeSwap]);

  return {
    quote,
    trade,
    needsApproval,
    isApproving,
    isSwapping,
    swapHash,
    swapError,
    handleApprove,
    handleSwap,
    refetchAllowance,
  } as const;
}