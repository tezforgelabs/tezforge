import { describe, expect, it } from "vitest";
import { getPresaleAllowanceState } from "./presale-approval";

describe("getPresaleAllowanceState", () => {
  it("does not require approval for native payments", () => {
    expect(getPresaleAllowanceState(true, undefined, 1n)).toBe("approved");
  });

  it("blocks ERC20 contributions until allowance is known", () => {
    expect(getPresaleAllowanceState(false, undefined, 1n)).toBe("unknown");
  });

  it("requires approval when ERC20 allowance is too small", () => {
    expect(getPresaleAllowanceState(false, 0n, 1n)).toBe("needs-approval");
  });

  it("allows contribution after sufficient allowance is confirmed", () => {
    expect(getPresaleAllowanceState(false, 1n, 1n)).toBe("approved");
  });
});
