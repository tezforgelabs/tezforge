import { beforeEach, expect, test } from "vitest";
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  decodeEventLog,
  defineChain,
  encodeFunctionData,
  http,
  parseEther,
  type Abi,
  type Address,
} from "viem";
import { TokenFactory } from "../../src/config/abis/token-factory";
import { PresaleFactory } from "../../src/config/abis/presale-factory";
import { LaunchpadPresaleContract } from "../../src/config/abis/launchpad-presale";

// The runner starts Anvil. Every write goes to loopback; Anvil alone reads
// the Previewnet fork upstream. See README.md in this directory.
const url = "http://127.0.0.1:8547";
const forkChain = defineChain({
  id: 128064,
  name: "Local Previewnet fork",
  nativeCurrency: { name: "XTZ", symbol: "XTZ", decimals: 18 },
  rpcUrls: { default: { http: [url] } },
});
const transport = http(url);
const publicClient = createPublicClient({ chain: forkChain, transport });
const testClient = createTestClient({
  chain: forkChain,
  mode: "anvil",
  transport,
});
const walletClient = createWalletClient({ chain: forkChain, transport });
const creator = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as Address;
const buyer = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address;
const factory = PresaleFactory.address;
const tokenFactory = TokenFactory.address;
const saleAbi = LaunchpadPresaleContract.abi as Abi;
const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

async function write(
  account: Address,
  address: Address,
  abi: Abi,
  functionName: string,
  args: unknown[] = [],
  value?: bigint,
) {
  const data = encodeFunctionData({ abi, functionName, args });
  const hash = await walletClient.sendTransaction({
    account,
    to: address,
    data,
    value,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  expect(receipt.status, `${functionName} reverted`).toBe("success");
  return receipt;
}

function eventAddress(
  logs: readonly { data: `0x${string}`; topics: readonly `0x${string}`[] }[],
  abi: Abi,
  eventName: string,
  key: string,
): Address {
  for (const log of logs) {
    try {
      const event = decodeEventLog({
        abi,
        data: log.data,
        topics: [...log.topics],
      });
      if (event.eventName === eventName) {
        const value = (event.args as Record<string, unknown>)[key];
        if (typeof value === "string") return value as Address;
      }
    } catch {
      /* unrelated event */
    }
  }
  throw new Error(`${eventName}.${key} missing from receipt`);
}

async function createSale(softCap: bigint, hardCap: bigint) {
  const tokenReceipt = await write(
    creator,
    tokenFactory,
    TokenFactory.abi as Abi,
    "createPlainToken",
    [
      {
        name: "Fork Lifecycle Token",
        symbol: "FLCT",
        initialSupply: parseEther("1000"),
        initialRecipient: creator,
      },
    ],
  );
  const token = eventAddress(
    tokenReceipt.logs,
    TokenFactory.abi as Abi,
    "TokenCreated",
    "token",
  );
  const now = (await publicClient.getBlock()).timestamp;
  const config = {
    startTime: now + 60n,
    endTime: now + 3600n,
    rate: 100_000n,
    softCap,
    hardCap,
    minContribution: parseEther("0.1"),
    maxContribution: parseEther("2"),
  };
  const receipt = await write(
    creator,
    factory,
    PresaleFactory.abi as Abi,
    "createPresale",
    [
      {
        saleToken: token,
        paymentToken: "0x0000000000000000000000000000000000000000",
        config,
        owner: creator,
      },
    ],
  );
  const presale = eventAddress(
    receipt.logs,
    PresaleFactory.abi as Abi,
    "PresaleCreated",
    "presale",
  );
  await write(creator, token, erc20Abi as Abi, "approve", [
    presale,
    parseEther("1000"),
  ]);
  await write(creator, presale, saleAbi, "depositSaleTokens", [
    parseEther("1000"),
  ]);
  expect(
    await publicClient.readContract({
      address: presale,
      abi: saleAbi,
      functionName: "totalTokensDeposited",
    }),
  ).toBe(parseEther("1000"));
  await testClient.setNextBlockTimestamp({
    timestamp: Number(config.startTime) + 1,
  });
  await testClient.mine({ blocks: 1 });
  await write(buyer, presale, saleAbi, "contribute", [0n], parseEther("1"));
  expect(
    await publicClient.readContract({
      address: presale,
      abi: saleAbi,
      functionName: "contributions",
      args: [buyer],
    }),
  ).toBe(parseEther("1"));
  return { presale, token, config };
}

beforeEach(async () => {
  expect(await publicClient.getChainId()).toBe(128064);
  expect(await publicClient.getBytecode({ address: factory })).toMatch(
    /^0x[0-9a-f]{10}/i,
  );
  expect(await publicClient.getBytecode({ address: tokenFactory })).toMatch(
    /^0x[0-9a-f]{10}/i,
  );
  await testClient.setBalance({ address: creator, value: parseEther("100") });
  await testClient.setBalance({ address: buyer, value: parseEther("100") });
  const owner = await publicClient.readContract({
    address: factory,
    abi: PresaleFactory.abi,
    functionName: "owner",
  });
  await testClient.impersonateAccount({ address: owner });
  await testClient.setBalance({ address: owner, value: parseEther("10") });
  await write(
    owner,
    factory,
    PresaleFactory.abi as Abi,
    "setWhitelistedCreator",
    [creator, true],
  );
  expect(
    await publicClient.readContract({
      address: factory,
      abi: PresaleFactory.abi,
      functionName: "isWhitelistedCreator",
      args: [creator],
    }),
  ).toBe(true);
});

test("deployed Previewnet factory supports create, deposit, contribute, finalize, and claim on a local fork", async () => {
  const { presale, token, config } = await createSale(
    parseEther("0.5"),
    parseEther("2"),
  );
  await testClient.setNextBlockTimestamp({
    timestamp: Number(config.endTime) + 1,
  });
  await testClient.mine({ blocks: 1 });
  await write(creator, presale, saleAbi, "finalize");
  expect(
    await publicClient.readContract({
      address: presale,
      abi: saleAbi,
      functionName: "claimEnabled",
    }),
  ).toBe(true);
  const before = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [buyer],
  });
  await write(buyer, presale, saleAbi, "claimTokens");
  const after = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [buyer],
  });
  expect(after).toBeGreaterThan(before);
});

test("deployed Previewnet presale refunds a contribution after cancellation on a local fork", async () => {
  const { presale } = await createSale(parseEther("1.5"), parseEther("2"));
  await write(creator, presale, saleAbi, "cancelPresale");
  expect(
    await publicClient.readContract({
      address: presale,
      abi: saleAbi,
      functionName: "refundsEnabled",
    }),
  ).toBe(true);
  await write(buyer, presale, saleAbi, "claimRefund");
  expect(
    await publicClient.readContract({
      address: presale,
      abi: saleAbi,
      functionName: "contributions",
      args: [buyer],
    }),
  ).toBe(0n);
});
