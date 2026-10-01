import { describe, expect, it } from "vitest";
import { buildBetaPresaleConfig, ZERO_ADDRESS } from "./beta-presale";

const validInput = {
  saleToken: "0x1111111111111111111111111111111111111111",
  owner: "0x2222222222222222222222222222222222222222",
  paymentToken: ZERO_ADDRESS,
  startTime: "2026-10-01T10:00",
  endTime: "2026-10-02T10:00",
  saleAmount: "1000000",
  softCap: "10",
  hardCap: "100",
  minContribution: "0.1",
  maxContribution: "10",
};
const beforeSale = new Date("2026-09-28T00:00:00Z").getTime();

describe("buildBetaPresaleConfig", () => {
  it("encodes a native XTZ presale using 18-decimal units", () => {
    const config = buildBetaPresaleConfig(validInput, 18, beforeSale);
    expect(config.rate).toBe(1_000_000n);
    expect(config.hardCap).toBe(100_000_000_000_000_000_000n);
    expect(config.minContribution).toBe(100_000_000_000_000_000n);
  });

  it("rejects ERC20 payment tokens in the beta", () => {
    expect(() =>
      buildBetaPresaleConfig(
        { ...validInput, paymentToken: "0x0000000000000000000000000000000000000001" },
        18,
        beforeSale,
      ),
    ).toThrow(/XTZ/);
  });

  it("rejects unsupported or unknown sale-token decimals", () => {
    expect(() => buildBetaPresaleConfig(validInput, 6, beforeSale)).toThrow(/18 decimals/);
    expect(() => buildBetaPresaleConfig(validInput, undefined, beforeSale)).toThrow(
      /18 decimals/,
    );
  });

  it("rejects invalid dates and caps before a wallet prompt", () => {
    expect(() =>
      buildBetaPresaleConfig({ ...validInput, endTime: validInput.startTime }, 18, beforeSale),
    ).toThrow(/after/);
    expect(() =>
      buildBetaPresaleConfig({ ...validInput, softCap: "101" }, 18, beforeSale),
    ).toThrow(/Soft cap/);
    expect(() =>
      buildBetaPresaleConfig({ ...validInput, minContribution: "" }, 18, beforeSale),
    ).toThrow(/required/);
  });

  it("rejects malformed sale token and owner addresses", () => {
    expect(() =>
      buildBetaPresaleConfig({ ...validInput, owner: "bad-owner" }, 18, beforeSale),
    ).toThrow(/owner/);
    expect(() =>
      buildBetaPresaleConfig({ ...validInput, saleToken: "bad-token" }, 18, beforeSale),
    ).toThrow(/sale token/);
  });

  it("rejects a sale window that has already started", () => {
    const afterStart = new Date("2026-10-01T12:00:00Z").getTime();
    expect(() => buildBetaPresaleConfig(validInput, 18, afterStart)).toThrow(/future/);
  });

  it("rejects a minimum contribution above the hard cap", () => {
    expect(() =>
      buildBetaPresaleConfig(
        { ...validInput, minContribution: "101", maxContribution: "101" },
        18,
        beforeSale,
      ),
    ).toThrow(/hard cap/);
  });
});
