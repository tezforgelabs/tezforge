import { describe, expect, it } from "vitest";
import { buildBetaTokenParams } from "./beta-token";

const input = {
  name: "Example",
  symbol: "EXM",
  initialSupply: "1000000",
  initialRecipient: "0x1111111111111111111111111111111111111111",
};

describe("buildBetaTokenParams", () => {
  it("uses the 18 decimals required by beta presales", () => {
    expect(buildBetaTokenParams(input)).toEqual({
      name: "Example",
      symbol: "EXM",
      decimals: 18,
      initialSupply: 1_000_000_000_000_000_000_000_000n,
      initialRecipient: input.initialRecipient,
    });
  });

  it("rejects empty or invalid parameters before a wallet prompt", () => {
    expect(() => buildBetaTokenParams({ ...input, name: "" })).toThrow(/name/i);
    expect(() => buildBetaTokenParams({ ...input, initialSupply: "-1" })).toThrow(
      /supply/i,
    );
    expect(() =>
      buildBetaTokenParams({ ...input, initialRecipient: "bad-address" }),
    ).toThrow(/recipient/i);
  });
});
