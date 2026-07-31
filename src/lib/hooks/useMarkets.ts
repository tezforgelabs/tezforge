import { FactoryContract, PairContract } from "@/config";
import { Token, CurrencyAmount } from "@uniswap/sdk-core";
import { Pair } from "@uniswap/v2-sdk";
import { erc20Abi } from "viem";
import { useMemo } from "react";
import { useReadContracts } from "wagmi";

export interface Market {
  id: string;
  pairAddress: `0x${string}`;
  token0: { address: `0x${string}`; symbol: string; name: string; decimals: number };
  token1: { address: `0x${string}`; symbol: string; name: string; decimals: number };
  reserves: [bigint, bigint, number];
  price: number;
  name: string;
  symbol: string;
  logo: string;
  creator: string;
  marketCap: number;
  createdAt: Date;
  liquidity: number;
  volume24h: number;
}

export function useMarkets() {
  // ── Step 1: Get total number of pairs ──────────────────────────────────
  const { data: allPairsLengthData } = useReadContracts({
    contracts: [
      {
        ...FactoryContract,
        functionName: "allPairsLength",
      },
    ],
  });

  const allPairsLength = allPairsLengthData?.[0]?.result
    ? Number(allPairsLengthData[0].result)
    : 0;

  // ── Step 2: Get all pair addresses ─────────────────────────────────────
  const { data: allPairsData } = useReadContracts({
    contracts: Array.from({ length: allPairsLength }, (_, i) => ({
      ...FactoryContract,
      functionName: "allPairs",
      args: [BigInt(i)],
    })),
    query: {
      enabled: allPairsLength > 0,
    },
  });

  const pairAddresses = useMemo(
    () => (allPairsData?.map((d) => d.result).filter(Boolean) as `0x${string}`[] | undefined) || [],
    [allPairsData]
  );

  // ── Step 3: Fetch token0, token1, reserves for each pair ───────────────
  const { data: pairTokensData } = useReadContracts({
    contracts: pairAddresses.flatMap((pairAddress) => [
      {
        address: pairAddress,
        abi: PairContract.abi,
        functionName: "token0",
      },
      {
        address: pairAddress,
        abi: PairContract.abi,
        functionName: "token1",
      },
      {
        address: pairAddress,
        abi: PairContract.abi,
        functionName: "getReserves",
      },
    ]),
    query: {
      enabled: pairAddresses.length > 0,
    },
  });

  // ── Step 4: Collect unique token addresses ─────────────────────────────
  const tokenAddresses = useMemo(() => {
    if (!pairTokensData) return [];
    const addresses = new Set<`0x${string}`>();
    for (let i = 0; i < pairTokensData.length; i += 3) {
      if (pairTokensData[i].result) addresses.add(pairTokensData[i].result as `0x${string}`);
      if (pairTokensData[i + 1].result) addresses.add(pairTokensData[i + 1].result as `0x${string}`);
    }
    return Array.from(addresses);
  }, [pairTokensData]);

  // ── Step 5: Fetch token metadata (symbol, name, decimals) ──────────────
  const { data: tokensData } = useReadContracts({
    contracts: tokenAddresses.flatMap((tokenAddress) => [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "name",
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      },
    ]),
    query: {
      enabled: tokenAddresses.length > 0,
    },
  });

  // ── Step 6: Assemble market objects using SDK Pair class ───────────────
  const markets = useMemo(() => {
    if (!pairAddresses.length || !pairTokensData || !tokensData) return [];

    // Build token metadata map
    const tokenMap = new Map<string, { symbol: string; name: string; decimals: number }>();
    for (let i = 0; i < tokenAddresses.length; i++) {
      const address = tokenAddresses[i].toLowerCase();
      const symbol = (tokensData?.[i * 3]?.result as string) ?? "";
      const name = (tokensData?.[i * 3 + 1]?.result as string) ?? "";
      const decimals = (tokensData?.[i * 3 + 2]?.result as number) ?? 18;
      tokenMap.set(address, { symbol, name, decimals });
    }

    return pairAddresses
      .map((pairAddress, index) => {
        const token0Address = pairTokensData[index * 3].result as `0x${string}`;
        const token1Address = pairTokensData[index * 3 + 1].result as `0x${string}`;
        const reserves = pairTokensData[index * 3 + 2].result as [bigint, bigint, number] | undefined;

        const t0 = tokenMap.get(token0Address.toLowerCase());
        const t1 = tokenMap.get(token1Address.toLowerCase());

        if (!t0 || !t1 || !reserves) return null;

        // Build Uniswap SDK Token instances
        const token0 = new Token(0, token0Address, t0.decimals, t0.symbol, t0.name);
        const token1 = new Token(0, token1Address, t1.decimals, t1.symbol, t1.name);

        // Create SDK Pair instance to derive price
        const sdkPair = new Pair(
          CurrencyAmount.fromRawAmount(token0, reserves[0].toString()),
          CurrencyAmount.fromRawAmount(token1, reserves[1].toString())
        );

        // SDK price: priceOf(token0) gives how much token1 per token0
        const token0Price = parseFloat(sdkPair.priceOf(token0).toSignificant(12));

        // Liquidity in USD – approximate via token0 reserve * price
        const totalSupply = Number(reserves[0]) + Number(reserves[1]);
        const liquidity = totalSupply / 10 ** Math.min(t0.decimals, t1.decimals);

        return {
          id: pairAddress,
          pairAddress,
          token0: { address: token0Address, ...t0 },
          token1: { address: token1Address, ...t1 },
          reserves,
          price: token0Price,
          name: `${t0.symbol}-${t1.symbol} Pair`,
          symbol: `${t0.symbol}/${t1.symbol}`,
          logo: `https://placehold.co/60x60/8B5CF6/FFFFFF?text=${t0.symbol}/${t1.symbol}`,
          creator: "reactive-factory",
          marketCap: 0,
          createdAt: new Date(),
          liquidity,
          volume24h: 0,
        } satisfies Market;
      })
      .filter(Boolean) as Market[];
  }, [pairAddresses, pairTokensData, tokensData, tokenAddresses]);

  return { markets, isLoading: !markets && pairAddresses.length > 0 };
}