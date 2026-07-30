import { useEffect, useState } from "react";

const XTZ_PRICE_ENDPOINT =
  "https://api.coingecko.com/api/v3/simple/price?ids=tezos&vs_currencies=usd";
const DEFAULT_REFRESH_INTERVAL_MS = 60_000;

interface UseReactPriceUsdOptions {
  refreshIntervalMs?: number;
}

interface XtzPriceResponse {
  tezos?: {
    usd?: number;
  };
}

export function useReactPriceUsd(
  options: UseReactPriceUsdOptions = {},
): number | null {
  const { refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS } = options;
  const [priceUsd, setPriceUsd] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchXtzPrice = async () => {
      try {
        const response = await fetch(XTZ_PRICE_ENDPOINT);
        if (!response.ok) return;

        const data = (await response.json()) as XtzPriceResponse;
        const nextPrice = data?.tezos?.usd;

        if (
          !cancelled &&
          typeof nextPrice === "number" &&
          Number.isFinite(nextPrice)
        ) {
          setPriceUsd(nextPrice);
        }
      } catch (error) {
        console.error("Failed to fetch XTZ price:", error);
      }
    };

    fetchXtzPrice();
    const intervalId = window.setInterval(fetchXtzPrice, refreshIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshIntervalMs]);

  return priceUsd;
}