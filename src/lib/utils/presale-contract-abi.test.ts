import { describe, expect, it } from "vitest";
import {
  decodeEventLog,
  decodeFunctionData,
  encodeAbiParameters,
  encodeEventTopics,
  encodeFunctionData,
  type Address,
} from "viem";
import { PresaleFactory } from "@/config/abis/presale-factory";
import { buildBetaPresaleConfig, ZERO_ADDRESS } from "./beta-presale";

const creator = "0x1111111111111111111111111111111111111111" as Address;
const presale = "0x2222222222222222222222222222222222222222" as Address;
const saleToken = "0x3333333333333333333333333333333333333333" as Address;

describe("presale factory ABI boundary", () => {
  it("encodes the beta form config into the deployed createPresale tuple", () => {
    const config = buildBetaPresaleConfig({
      saleToken,
      paymentToken: ZERO_ADDRESS,
      owner: creator,
      startTime: "2026-10-01T10:00",
      endTime: "2026-10-02T10:00",
      saleAmount: "1000000",
      softCap: "10",
      hardCap: "100",
      minContribution: "0.1",
      maxContribution: "10",
    }, 18, new Date("2026-09-28T00:00:00Z").getTime());

    const encoded = encodeFunctionData({
      abi: PresaleFactory.abi,
      functionName: "createPresale",
      args: [{ saleToken, paymentToken: ZERO_ADDRESS, config, owner: creator }],
    });
    const decoded = decodeFunctionData({ abi: PresaleFactory.abi, data: encoded });
    expect(decoded.functionName).toBe("createPresale");
    expect(decoded.args?.[0]).toEqual({ saleToken, paymentToken: ZERO_ADDRESS, config, owner: creator });
    expect(decoded.args?.[0]).not.toHaveProperty("requiresWhitelist");
  });

  it("decodes the factory event used to discover the created presale", () => {
    const topics = encodeEventTopics({
      abi: PresaleFactory.abi,
      eventName: "PresaleCreated",
      args: { creator, presale, saleToken },
    });
    const data = encodeAbiParameters([
      { type: "address", name: "paymentToken" },
      { type: "address", name: "presaleOwner" },
    ], [ZERO_ADDRESS, creator]);
    const decoded = decodeEventLog({
      abi: PresaleFactory.abi,
      data,
      topics: topics as [`0x${string}`, ...`0x${string}`[]],
    });
    expect(decoded.eventName).toBe("PresaleCreated");
    expect(decoded.args).toEqual({ creator, presale, saleToken, paymentToken: ZERO_ADDRESS, presaleOwner: creator });
  });
});
