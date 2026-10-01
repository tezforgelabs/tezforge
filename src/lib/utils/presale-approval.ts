export type PresaleAllowanceState = "unknown" | "needs-approval" | "approved";

export function getPresaleAllowanceState(
  isNativePayment: boolean,
  allowance: bigint | undefined,
  amount: bigint,
): PresaleAllowanceState {
  if (isNativePayment) return "approved";
  if (allowance === undefined) return "unknown";
  return allowance < amount ? "needs-approval" : "approved";
}
