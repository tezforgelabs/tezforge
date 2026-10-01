import { isAddress, parseEther, parseUnits } from "viem";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

interface BetaPresaleInput {
  saleToken: string;
  owner: string;
  paymentToken: string;
  startTime: string;
  endTime: string;
  saleAmount: string;
  softCap: string;
  hardCap: string;
  minContribution: string;
  maxContribution: string;
}

export function buildBetaPresaleConfig(
  input: BetaPresaleInput,
  saleTokenDecimals: number | undefined,
  nowMs = Date.now(),
) {
  if (!isAddress(input.saleToken)) {
    throw new Error("Enter a valid sale token address.");
  }
  if (!isAddress(input.owner)) {
    throw new Error("Enter a valid presale owner address.");
  }
  if (input.paymentToken.toLowerCase() !== ZERO_ADDRESS) {
    throw new Error("XTZ payments only.");
  }
  if (saleTokenDecimals !== 18) {
    throw new Error("Presales require a token with 18 decimals.");
  }
  if (
    !input.startTime ||
    !input.endTime ||
    !input.saleAmount.trim() ||
    !input.softCap.trim() ||
    !input.hardCap.trim() ||
    !input.minContribution.trim() ||
    !input.maxContribution.trim()
  ) {
    throw new Error("All presale dates and amounts are required.");
  }

  const startMs = new Date(input.startTime).getTime();
  const endMs = new Date(input.endTime).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("The end time must be after a valid start time.");
  }
  if (startMs <= nowMs) {
    throw new Error("The start time must be in the future.");
  }

  let saleAmount: bigint;
  let softCap: bigint;
  let hardCap: bigint;
  let minContribution: bigint;
  let maxContribution: bigint;
  try {
    saleAmount = parseUnits(input.saleAmount, 18);
    softCap = parseEther(input.softCap);
    hardCap = parseEther(input.hardCap);
    minContribution = parseEther(input.minContribution);
    maxContribution = parseEther(input.maxContribution);
  } catch {
    throw new Error("Enter valid numeric amounts for the presale.");
  }

  if (saleAmount <= 0n || hardCap <= 0n) {
    throw new Error("Sale amount and hard cap must be greater than zero.");
  }
  if (softCap <= 0n || softCap > hardCap) {
    throw new Error("Soft cap must be greater than zero and no more than hard cap.");
  }
  if (minContribution <= 0n || maxContribution < minContribution) {
    throw new Error("Contribution limits must be positive and max must be at least min.");
  }
  if (minContribution > hardCap) {
    throw new Error("Minimum contribution cannot exceed the hard cap.");
  }

  const rate = (saleAmount * 100n) / hardCap;
  if (rate <= 0n) {
    throw new Error("The calculated sale rate is zero. Check sale amount and hard cap.");
  }

  return {
    startTime: BigInt(Math.floor(startMs / 1000)),
    endTime: BigInt(Math.floor(endMs / 1000)),
    rate,
    softCap,
    hardCap,
    minContribution,
    maxContribution,
  };
}
