// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PresaleWithStatus } from "@/lib/hooks/useLaunchpadPresales";
import { PresaleParticipationForm } from "./presale-participation-form";

const mock = vi.hoisted(() => ({
  allowanceReady: false,
  needsApproval: false,
  claimEnabled: false,
  refundsEnabled: false,
  contribution: 0n,
  purchasedTokens: 0n,
  contribute: vi.fn(),
  approve: vi.fn(),
  claimTokens: vi.fn(),
  claimRefund: vi.fn(),
  refetchContribution: vi.fn(),
  refetchPresale: vi.fn(),
  simulateContract: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x1111111111111111111111111111111111111111" }),
  usePublicClient: () => ({ readContract: vi.fn(), simulateContract: mock.simulateContract }),
}));
vi.mock("sonner", () => ({ toast: { error: mock.toastError, success: vi.fn() } }));
vi.mock("@/lib/hooks/useLaunchpadPresales", () => ({
  useLaunchpadPresale: () => ({ presale: null, refetch: mock.refetchPresale }),
  useUserPresaleContribution: () => ({ contribution: mock.contribution, purchasedTokens: mock.purchasedTokens, refetch: mock.refetchContribution }),
}));
vi.mock("@/lib/hooks/usePresaleApproval", () => ({
  usePresaleApproval: () => ({ needsApproval: mock.needsApproval, isAllowanceReady: mock.allowanceReady, isAllowanceError: false, isAllowanceLoading: false, approve: mock.approve, isApproving: false, refetchAllowance: vi.fn() }),
}));
vi.mock("@/lib/hooks/usePresaleActions", () => ({
  usePresaleContribute: () => ({ contribute: mock.contribute, isPending: false, isConfirming: false, isSuccess: false, error: null }),
  usePresaleClaimTokens: () => ({ claimTokens: mock.claimTokens, isPending: false, isConfirming: false, isSuccess: false, error: null }),
  usePresaleClaimRefund: () => ({ claimRefund: mock.claimRefund, isPending: false, isConfirming: false, isSuccess: false, error: null }),
  usePresaleCalculation: () => ({ calculateTokenAmount: (amount: bigint, rate: bigint) => amount * rate / 100n }),
}));

const basePresale = {
  address: "0x2222222222222222222222222222222222222222",
  saleToken: "0x3333333333333333333333333333333333333333",
  paymentToken: "0x0000000000000000000000000000000000000000",
  isPaymentETH: true,
  requiresWhitelist: false,
  startTime: 1n,
  endTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
  rate: 100n,
  softCap: 1n,
  hardCap: 100000000000000000000n,
  minContribution: 1000000000000000000n,
  maxContribution: 10000000000000000000n,
  totalRaised: 0n,
  committedTokens: 0n,
  totalTokensDeposited: 0n,
  claimEnabled: false,
  refundsEnabled: false,
  owner: "0x1111111111111111111111111111111111111111",
  paymentTokenSymbol: "XTZ",
  saleTokenSymbol: "SALE",
  saleTokenDecimals: 18,
  status: "live",
  progress: 0,
} satisfies PresaleWithStatus;

beforeEach(() => {
  vi.clearAllMocks();
  mock.allowanceReady = false;
  mock.needsApproval = false;
  mock.contribution = 0n;
  mock.purchasedTokens = 0n;
  mock.simulateContract.mockResolvedValue({ request: {} });
});
afterEach(cleanup);

describe("presale participation gates", () => {
  it("blocks contribution while allowance state is unknown", () => {
    render(<PresaleParticipationForm presale={basePresale} />);
    fireEvent.change(screen.getByLabelText(/Amount to Contribute/), { target: { value: "2" } });
    const button = screen.getByRole("button", { name: "Checking token allowance..." });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(mock.contribute).not.toHaveBeenCalled();
  });

  it("requests approval rather than contribution when allowance is short", async () => {
    mock.allowanceReady = true;
    mock.needsApproval = true;
    render(<PresaleParticipationForm presale={{
      ...basePresale,
      isPaymentETH: false,
      paymentToken: "0x4444444444444444444444444444444444444444",
      paymentTokenSymbol: "PAY",
      paymentTokenDecimals: 18,
    }} />);
    fireEvent.change(screen.getByLabelText(/Amount to Contribute/), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Approve PAY" }));
    await waitFor(() => expect(mock.approve).toHaveBeenCalledOnce());
    expect(mock.contribute).not.toHaveBeenCalled();
  });

  it("contributes the parsed amount once the gate opens", async () => {
    mock.allowanceReady = true;
    render(<PresaleParticipationForm presale={basePresale} />);
    fireEvent.change(screen.getByLabelText(/Amount to Contribute/), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Contribute" }));
    await waitFor(() => expect(mock.simulateContract).toHaveBeenCalledWith(expect.objectContaining({
      address: basePresale.address,
      functionName: "contribute",
      args: [0n],
      value: 2000000000000000000n,
    })));
    await waitFor(() => expect(mock.contribute).toHaveBeenCalledWith(expect.objectContaining({ presaleAddress: basePresale.address, amount: 2000000000000000000n, isPaymentETH: true })));
  });

  it("does not open a wallet write when on-chain simulation rejects contribution", async () => {
    mock.allowanceReady = true;
    mock.simulateContract.mockRejectedValue(new Error("Not eligible"));
    render(<PresaleParticipationForm presale={basePresale} />);
    fireEvent.change(screen.getByLabelText(/Amount to Contribute/), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Contribute" }));
    await waitFor(() => expect(mock.toastError).toHaveBeenCalledOnce());
    expect(mock.contribute).not.toHaveBeenCalled();
  });

  it("shows refund action only for a cancelled presale with a contribution", () => {
    mock.allowanceReady = true;
    mock.contribution = 2000000000000000000n;
    render(<PresaleParticipationForm presale={{ ...basePresale, status: "cancelled", refundsEnabled: true }} />);
    fireEvent.click(screen.getByRole("button", { name: /Claim Refund:/ }));
    expect(mock.claimRefund).toHaveBeenCalledWith(basePresale.address);
    expect(mock.claimTokens).not.toHaveBeenCalled();
  });

  it("shows token claim only after finalization with purchased tokens", () => {
    mock.allowanceReady = true;
    mock.purchasedTokens = 3000000000000000000n;
    render(<PresaleParticipationForm presale={{ ...basePresale, status: "finalized", claimEnabled: true }} />);
    fireEvent.click(screen.getByRole("button", { name: /Claim 3 SALE/ }));
    expect(mock.claimTokens).toHaveBeenCalledWith(basePresale.address);
    expect(mock.claimRefund).not.toHaveBeenCalled();
  });
});
