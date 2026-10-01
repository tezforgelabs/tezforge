import { isAddress, parseUnits } from "viem";

interface BetaTokenInput {
  name: string;
  symbol: string;
  initialSupply: string;
  initialRecipient: string;
}

export function buildBetaTokenParams(input: BetaTokenInput) {
  const name = input.name.trim();
  const symbol = input.symbol.trim();
  if (!name || !symbol) {
    throw new Error("Token name and symbol are required.");
  }
  if (!isAddress(input.initialRecipient)) {
    throw new Error("Enter a valid initial recipient address.");
  }

  let initialSupply: bigint;
  try {
    initialSupply = parseUnits(input.initialSupply, 18);
  } catch {
    throw new Error("Enter a valid initial supply.");
  }
  if (initialSupply <= 0n) {
    throw new Error("Initial supply must be greater than zero.");
  }

  return {
    name,
    symbol,
    decimals: 18,
    initialSupply,
    initialRecipient: input.initialRecipient as `0x${string}`,
  };
}
