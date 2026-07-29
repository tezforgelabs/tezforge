
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { WagmiProvider, useChainId } from "wagmi";
import { useBlockchainStore } from "@/lib/store/blockchain-store";
import { useLaunchpadPresaleStore } from "@/lib/store/launchpad-presale-store";
import { config, reactiveMainnet } from "../config"

function ChainCacheReset() {
  const chainId = useChainId();
  const clearCache = useBlockchainStore((state) => state.clearCache);
  const clearLaunchpadCache = useLaunchpadPresaleStore((state) => state.clearCache);

  useEffect(() => {
    clearCache();
    clearLaunchpadCache();
  }, [chainId, clearCache, clearLaunchpadCache]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WagmiProvider config={config}>
        <ChainCacheReset />
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider initialChain={reactiveMainnet}>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
