import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSwap } from "@/lib/hooks/useSwap";
import { type Market } from "@/lib/hooks/useMarkets";
import { Token, CurrencyAmount } from "@uniswap/sdk-core";
import { Pair } from "@uniswap/v2-sdk";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";

interface SwapFormProps {
  market: Market;
}

export function SwapForm({ market }: SwapFormProps) {
  const { address } = useAccount();
  const [amountIn, setAmountIn] = useState("");
  const [slippageTolerance] = useState(0.5);

  // Build SDK Token instances from the market data
  const tokenIn = useMemo(
    () =>
      new Token(
        0,
        market.token0.address,
        market.token0.decimals,
        market.token0.symbol,
        market.token0.name,
      ),
    [market],
  );

  const tokenOut = useMemo(
    () =>
      new Token(
        0,
        market.token1.address,
        market.token1.decimals,
        market.token1.symbol,
        market.token1.name,
      ),
    [market],
  );

  // Build a single Pair from the market reserves
  const pairs = useMemo(() => {
    const reserve0 = CurrencyAmount.fromRawAmount(
      tokenIn,
      market.reserves[0].toString(),
    );
    const reserve1 = CurrencyAmount.fromRawAmount(
      tokenOut,
      market.reserves[1].toString(),
    );
    return [new Pair(reserve0, reserve1)];
  }, [tokenIn, tokenOut, market.reserves]);

  const {
    quote,
    needsApproval,
    isApproving,
    isSwapping,
    swapHash,
    swapError,
    handleApprove,
    handleSwap,
  } = useSwap({
    tokenIn,
    tokenOut,
    amountIn,
    pairs,
    slippageTolerance,
  });

  const handleMaxClick = () => {
    // Placeholder — in production you'd fetch the user's balance
    setAmountIn("1000");
  };

  return (
    <Card className="border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)]">
      <CardHeader className="border-b-2 border-[#1A1A2E] bg-white">
        <CardTitle className="text-lg font-black uppercase tracking-wider">
          Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* You Pay */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
            You Pay
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaxClick}
              className="border-2 border-[#1A1A2E] text-xs font-bold uppercase"
            >
              Max
            </Button>
          </div>
          <p className="text-xs font-medium text-gray-500">
            {market.token0.symbol}
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1A1A2E] bg-white text-lg">
            ↓
          </div>
        </div>

        {/* You Receive */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
            You Receive
          </label>
          <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-3">
            <p className="text-xl font-bold">
              {quote ? quote.minimumOutput : "0.0"}
            </p>
            <p className="text-xs font-medium text-gray-500">
              {market.token1.symbol}
            </p>
          </div>
          {quote && (
            <div className="space-y-1 text-xs text-gray-500">
              <p>
                Rate: 1 {market.token0.symbol} ≈ {quote.executionPrice}{" "}
                {market.token1.symbol}
              </p>
              <p>Route: {quote.route}</p>
              <p>Slippage: {slippageTolerance}%</p>
            </div>
          )}
        </div>

        {/* Error state */}
        {swapError && (
          <p className="text-xs text-red-500">
            Swap failed: {swapError.message.slice(0, 80)}
          </p>
        )}

        {/* Success state */}
        {swapHash && (
          <p className="text-xs text-green-600 break-all">
            Tx: {swapHash.slice(0, 10)}...{swapHash.slice(-8)}
          </p>
        )}

        {/* Action Button */}
        {!address ? (
          <Button
            disabled
            className="w-full py-6 text-base font-bold uppercase tracking-wide"
          >
            Connect Wallet
          </Button>
        ) : needsApproval ? (
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full py-6 text-base font-bold uppercase tracking-wide bg-yellow-500 hover:bg-yellow-600"
          >
            {isApproving ? "Approving..." : `Approve ${market.token0.symbol}`}
          </Button>
        ) : (
          <Button
            onClick={handleSwap}
            disabled={isSwapping || !amountIn || parseFloat(amountIn) <= 0}
            className="w-full py-6 text-base font-bold uppercase tracking-wide"
          >
            {isSwapping
              ? "Swapping..."
              : `Swap ${market.token0.symbol} for ${market.token1.symbol}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
