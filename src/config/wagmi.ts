import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
import { http } from "wagmi";

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

export const wagmiConfig = getDefaultConfig({
  appName: "Tezforge",
  projectId: "9ef8a1835f8d9515949514f77259f972",
  chains: [tezosX],
  transports: {
    [tezosX.id]: http(),
  },
});
