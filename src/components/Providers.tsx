import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { defineChain } from "viem";
import { WagmiProvider, http } from "wagmi";

export const tezosX = defineChain({
  id: 128_064,
  name: "Tezos X Previewnet",
  nativeCurrency: { name: "XTZ", symbol: "XTZ", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://evm.previewnet.tezosx.nomadic-labs.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout.previewnet.tezosx.nomadic-labs.com",
    },
  },
});

const config = getDefaultConfig({
  appName: "Tezforge",
  projectId: "9ef8a1835f8d9515949514f77259f972",
  chains: [tezosX],
  transports: {
    [tezosX.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
