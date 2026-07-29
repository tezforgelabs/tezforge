import { useEffect, useState } from "react";

const REACT_PRICE_ENDPOINT =
  "https://api.coingecko.com/api/v3/simple/price?ids=reactive-network&vs_currencies=usd";
const DEFAULT_REFRESH_INTERVAL_MS = 60_000;

interface UseReactPriceUsdOptions {
  refreshIntervalMs?: number;
}

interface ReactPriceResponse {
  "reactive-network"?: {
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

    const fetchReactPrice = async () => {
      try {
        const response = await fetch(REACT_PRICE_ENDPOINT);
        if (!response.ok) return;

        const data = (await response.json()) as ReactPriceResponse;
        const nextPrice = data?.["reactive-network"]?.usd;

        if (
          !cancelled &&
          typeof nextPrice === "number" &&
          Number.isFinite(nextPrice)
        ) {
          setPriceUsd(nextPrice);
        }
      } catch (error) {
        console.error("Failed to fetch REACT price:", error);
      }
    };

    fetchReactPrice();
    const intervalId = window.setInterval(fetchReactPrice, refreshIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshIntervalMs]);

  return priceUsd;
}
