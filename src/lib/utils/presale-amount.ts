import { formatUnits } from "viem";

export function formatPresalePaymentAmount(
  amount: bigint,
  decimals: number | undefined,
): number | null {
  if (decimals === undefined) return null;
  return Number(formatUnits(amount, decimals));
}

export function sumNativePresaleRaised(
  presales: ReadonlyArray<{ isPaymentETH: boolean; totalRaised: bigint }>,
): bigint {
  return presales.reduce(
    (total, presale) =>
      presale.isPaymentETH ? total + presale.totalRaised : total,
    0n,
  );
}
