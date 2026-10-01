import { describe, expect, it } from "vitest";
import {
  formatPresalePaymentAmount,
  sumNativePresaleRaised,
} from "./presale-amount";

describe("formatPresalePaymentAmount", () => {
  it("uses the payment token's six decimals", () => {
    expect(formatPresalePaymentAmount(1_250_000n, 6)).toBe(1.25);
  });

  it("uses 18 decimals for native XTZ", () => {
    expect(formatPresalePaymentAmount(1_250_000_000_000_000_000n, 18)).toBe(
      1.25,
    );
  });

  it("supports payment tokens with zero decimals", () => {
    expect(formatPresalePaymentAmount(125n, 0)).toBe(125);
  });

  it("does not invent an amount when token decimals are unavailable", () => {
    expect(formatPresalePaymentAmount(1_250_000n, undefined)).toBeNull();
  });
});

describe("sumNativePresaleRaised", () => {
  it("excludes ERC20 payment amounts from the homepage XTZ total", () => {
    expect(
      sumNativePresaleRaised([
        { isPaymentETH: true, totalRaised: 2_000_000_000_000_000_000n },
        { isPaymentETH: false, totalRaised: 5_000_000n },
      ]),
    ).toBe(2_000_000_000_000_000_000n);
  });
});
