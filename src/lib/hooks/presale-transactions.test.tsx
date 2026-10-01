// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { erc20Abi, type Address } from "viem";
import { usePresaleApproval } from "./usePresaleApproval";
import {
  usePresaleClaimRefund,
  usePresaleClaimTokens,
  usePresaleContribute,
  usePresaleOwnerActions,
} from "./usePresaleActions";

const mock = vi.hoisted(() => ({
  allowance: 0n as bigint | undefined,
  receipt: { status: "success" },
  isSuccess: false,
  approveAsync: vi.fn(),
  waitForReceipt: vi.fn(),
  refetch: vi.fn(),
  writeContract: vi.fn(),
  invalidatePresale: vi.fn(),
  invalidateUserPresaleData: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: USER }),
  usePublicClient: () => ({ waitForTransactionReceipt: mock.waitForReceipt }),
  useReadContract: () => ({ data: mock.allowance, refetch: mock.refetch, isLoading: false, isError: false }),
  useWriteContract: () => ({ writeContract: mock.writeContract, writeContractAsync: mock.approveAsync, isPending: false, error: null, reset: vi.fn(), data: "0x123" }),
  useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: mock.isSuccess, error: null }),
}));
vi.mock("@/lib/store/launchpad-presale-store", () => ({
  useLaunchpadPresaleStore: () => ({ invalidatePresale: mock.invalidatePresale, invalidateUserPresaleData: mock.invalidateUserPresaleData }),
}));
vi.mock("sonner", () => ({ toast: { error: mock.toastError } }));

const USER = "0x1111111111111111111111111111111111111111" as Address;
const PRESALE = "0x2222222222222222222222222222222222222222" as Address;
const TOKEN = "0x3333333333333333333333333333333333333333" as Address;

function Approval({ isPaymentETH = false }: { isPaymentETH?: boolean }) {
  const approval = usePresaleApproval({ presaleAddress: PRESALE, paymentToken: { address: TOKEN }, amount: 5n, isPaymentETH });
  return <button disabled={!approval.needsApproval || approval.isApproving} onClick={() => void approval.approve()}>Approve</button>;
}

function Actions() {
  const { contribute, invalidateOnSuccess: invalidateContribution } = usePresaleContribute();
  const { claimTokens } = usePresaleClaimTokens();
  const { claimRefund } = usePresaleClaimRefund();
  const { depositSaleTokens } = usePresaleOwnerActions();
  return <div>
    <button onClick={() => void contribute({ presaleAddress: PRESALE, amount: 5n, isPaymentETH: true })}>Native</button>
    <button onClick={() => void contribute({ presaleAddress: PRESALE, amount: 7n, isPaymentETH: false })}>Token</button>
    <button onClick={() => claimTokens(PRESALE)}>Claim</button>
    <button onClick={() => claimRefund(PRESALE)}>Refund</button>
    <button onClick={() => depositSaleTokens(PRESALE, 11n)}>Deposit</button>
    <button onClick={() => invalidateContribution(PRESALE)}>Invalidate</button>
  </div>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.allowance = 0n;
  mock.isSuccess = false;
  mock.receipt = { status: "success" };
  mock.approveAsync.mockResolvedValue("0xabc");
  mock.waitForReceipt.mockImplementation(async () => mock.receipt);
  mock.refetch.mockResolvedValue({ data: 5n });
});
afterEach(cleanup);

describe("approval transaction", () => {
  it("waits for a successful receipt before refreshing allowance", async () => {
    render(<Approval />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(mock.refetch).toHaveBeenCalledOnce());
    expect(mock.approveAsync).toHaveBeenCalledWith(expect.objectContaining({ abi: erc20Abi, address: TOKEN, functionName: "approve", args: [PRESALE, 5n] }));
    expect(mock.waitForReceipt).toHaveBeenCalledWith({ hash: "0xabc" });
    expect(mock.waitForReceipt.mock.invocationCallOrder[0]).toBeLessThan(mock.refetch.mock.invocationCallOrder[0]);
  });

  it("never refreshes allowance after a reverted approval", async () => {
    mock.receipt = { status: "reverted" };
    render(<Approval />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(mock.toastError).toHaveBeenCalledOnce());
    expect(mock.refetch).not.toHaveBeenCalled();
  });

  it("does not request ERC20 approval for native payments", () => {
    render(<Approval isPaymentETH />);
    expect(screen.getByRole("button", { name: "Approve" }).hasAttribute("disabled")).toBe(true);
    expect(mock.approveAsync).not.toHaveBeenCalled();
  });
});

describe("presale transaction calls", () => {
  it("routes native value and ERC20 amount to distinct contribute arguments", () => {
    render(<Actions />);
    fireEvent.click(screen.getByRole("button", { name: "Native" }));
    fireEvent.click(screen.getByRole("button", { name: "Token" }));
    expect(mock.writeContract).toHaveBeenNthCalledWith(1, expect.objectContaining({ address: PRESALE, functionName: "contribute", args: [0n], value: 5n }));
    expect(mock.writeContract).toHaveBeenNthCalledWith(2, expect.objectContaining({ address: PRESALE, functionName: "contribute", args: [7n] }));
    expect(mock.writeContract.mock.calls[1][0]).not.toHaveProperty("value");
  });

  it("targets the selected presale for claim, refund and deposit", () => {
    render(<Actions />);
    fireEvent.click(screen.getByRole("button", { name: "Claim" }));
    fireEvent.click(screen.getByRole("button", { name: "Refund" }));
    fireEvent.click(screen.getByRole("button", { name: "Deposit" }));
    expect(mock.writeContract.mock.calls.map(([call]) => [call.address, call.functionName, call.args])).toEqual([
      [PRESALE, "claimTokens", undefined],
      [PRESALE, "claimRefund", undefined],
      [PRESALE, "depositSaleTokens", [11n]],
    ]);
  });

  it("invalidates presale and user caches only after confirmed success", () => {
    const view = render(<Actions />);
    fireEvent.click(screen.getByRole("button", { name: "Invalidate" }));
    expect(mock.invalidatePresale).not.toHaveBeenCalled();
    mock.isSuccess = true;
    view.rerender(<Actions />);
    fireEvent.click(screen.getByRole("button", { name: "Invalidate" }));
    expect(mock.invalidatePresale).toHaveBeenCalledWith(PRESALE);
    expect(mock.invalidateUserPresaleData).toHaveBeenCalledWith(USER, PRESALE);
  });
});
