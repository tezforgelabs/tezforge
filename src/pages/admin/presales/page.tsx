import { AdminRoute } from "@/components/admin/AdminRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LaunchpadPresaleContract, PresaleFactory } from "@/config";
import {
  useAdminCreatePresale,
  useUpdatePresaleFees,
} from "@/lib/hooks/useAdminActions";
import {
  useLaunchpadPresales,
  type PresaleWithStatus,
} from "@/lib/hooks/useLaunchpadPresales";
import { useFeeRecipient } from "@/lib/utils/admin";
import { getFriendlyTxErrorMessage } from "@/lib/utils/tx-errors";
import { ArrowLeft, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  decodeEventLog,
  erc20Abi,
  formatEther,
  parseEther,
  parseUnits,
  type Abi,
  type Address,
} from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";

function PresaleCard({
  presale,
  isFeeRecipient,
}: {
  presale: PresaleWithStatus;
  isFeeRecipient: boolean;
}) {
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [newTokenFeeBps, setNewTokenFeeBps] = useState("");
  const [newProceedsFeeBps, setNewProceedsFeeBps] = useState("");

  const { updateFees, isBusy, isSuccess, isError, error, reset } =
    useUpdatePresaleFees();

  // Fetch current fees
  const { data: currentTokenFeeBps } = useReadContract({
    address: presale.address as Address,
    abi: LaunchpadPresaleContract.abi,
    functionName: "tokenFeeBps",
  });

  const { data: currentProceedsFeeBps } = useReadContract({
    address: presale.address as Address,
    abi: LaunchpadPresaleContract.abi,
    functionName: "proceedsFeeBps",
  });

  // Fetch token symbol
  const { data: tokenSymbol } = useReadContract({
    address: presale.saleToken as Address,
    abi: erc20Abi,
    functionName: "symbol",
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Fees updated successfully");
      setShowFeeForm(false);
      setNewTokenFeeBps("");
      setNewProceedsFeeBps("");
      reset();
    }
  }, [isSuccess, reset]);

  useEffect(() => {
    if (isError && error) {
      toast.error(getFriendlyTxErrorMessage(error, "Update fees"));
      reset();
    }
  }, [isError, error, reset]);

  const handleUpdateFees = () => {
    const tokenFee = parseInt(newTokenFeeBps);
    const proceedsFee = parseInt(newProceedsFeeBps);

    if (isNaN(tokenFee) || tokenFee < 0 || tokenFee > 10000) {
      toast.error("Token fee must be between 0 and 10000 bps");
      return;
    }
    if (isNaN(proceedsFee) || proceedsFee < 0 || proceedsFee > 10000) {
      toast.error("Proceeds fee must be between 0 and 10000 bps");
      return;
    }

    updateFees(presale.address as Address, tokenFee, proceedsFee);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-500";
      case "upcoming":
        return "bg-yellow-500";
      case "finalized":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)]">
      <CardHeader className="border-b-2 border-[#1A1A2E] bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="font-black uppercase tracking-wider text-lg">
              {tokenSymbol ?? "Loading..."} Presale
            </CardTitle>
            <Badge
              className={`${getStatusColor(presale.status)} text-white font-bold uppercase text-xs`}
            >
              {presale.status}
            </Badge>
          </div>
          <Link
            to={`/projects/${presale.address}`}
            className="text-gray-600 hover:text-[#1A1A2E]"
          >
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Presale Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">
              Hard Cap
            </p>
            <p className="font-bold">{formatEther(presale.hardCap)} XTZ</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">
              Total Raised
            </p>
            <p className="font-bold">
              {Math.round(
                Number(formatEther(presale.totalRaised)),
              ).toLocaleString()}{" "}
              XTZ
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">
              Progress
            </p>
            <p className="font-bold">{presale.progress.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">Owner</p>
            <p className="font-mono text-xs truncate">{presale.owner}</p>
          </div>
        </div>

        {/* Address */}
        <div>
          <p className="text-gray-500 text-xs uppercase font-bold mb-1">
            Presale Address
          </p>
          <p className="font-mono text-xs break-all bg-gray-100 p-2 border border-gray-300">
            {presale.address}
          </p>
        </div>

        {/* Current Fees */}
        <div className="flex items-center gap-4 p-3 bg-[#F7F3EE] border-2 border-[#1A1A2E]">
          <div>
            <p className="text-xs text-gray-600 uppercase font-bold">
              Token Fee
            </p>
            <p className="font-bold">
              {currentTokenFeeBps !== undefined
                ? `${Number(currentTokenFeeBps) / 100}%`
                : "..."}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase font-bold">
              Proceeds Fee
            </p>
            <p className="font-bold">
              {currentProceedsFeeBps !== undefined
                ? `${Number(currentProceedsFeeBps) / 100}%`
                : "..."}
            </p>
          </div>
          {isFeeRecipient && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeeForm(!showFeeForm)}
              className="ml-auto border-2 border-[#1A1A2E] font-bold uppercase text-xs"
            >
              {showFeeForm ? "Cancel" : "Update Fees"}
            </Button>
          )}
        </div>

        {/* Update Fees Form */}
        {showFeeForm && isFeeRecipient && (
          <div className="p-4 bg-white border-2 border-[#1A1A2E] space-y-3">
            <p className="text-sm font-bold">
              Update fees (in basis points, 100 = 1%)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 uppercase font-bold">
                  Token Fee (bps)
                </label>
                <Input
                  type="number"
                  placeholder={currentTokenFeeBps?.toString() ?? "200"}
                  value={newTokenFeeBps}
                  onChange={(e) => setNewTokenFeeBps(e.target.value)}
                  className="border-2 border-[#1A1A2E]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 uppercase font-bold">
                  Proceeds Fee (bps)
                </label>
                <Input
                  type="number"
                  placeholder={currentProceedsFeeBps?.toString() ?? "300"}
                  value={newProceedsFeeBps}
                  onChange={(e) => setNewProceedsFeeBps(e.target.value)}
                  className="border-2 border-[#1A1A2E]"
                />
              </div>
            </div>
            <Button
              onClick={handleUpdateFees}
              disabled={isBusy || !newTokenFeeBps || !newProceedsFeeBps}
              className="w-full border-4 border-[#1A1A2E] bg-[#0F59FF] text-[#1A1A2E] font-black uppercase tracking-wider shadow-[3px_3px_0_rgba(26,26,46,1)]"
            >
              {isBusy ? "Updating..." : "Confirm Update"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickCreatePresale({ onCreated }: { onCreated: () => void }) {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [saleToken, setSaleToken] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [hardCap, setHardCap] = useState("");
  const [softCap, setSoftCap] = useState("10");
  const [minContribution, setMinContribution] = useState("0.1");
  const [maxContribution, setMaxContribution] = useState("10");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [showForm, setShowForm] = useState(false);

  // Fetch token decimals
  const { data: tokenDecimals } = useReadContract({
    address: saleToken as Address | undefined,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: Boolean(saleToken && saleToken.startsWith("0x")) },
  });

  const decimals = (tokenDecimals as number) ?? 18;

  const {
    createPresale,
    hash,
    isError,
    error,
    reset: resetCreate,
    isBusy,
  } = useAdminCreatePresale();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  // Derive presale address from receipt
  const newPresaleAddress = useMemo(() => {
    if (!receipt) return null;
    for (const log of receipt.logs) {
      try {
        const event = decodeEventLog({
          abi: PresaleFactory.abi as Abi,
          data: log.data,
          topics: log.topics,
        });
        if (
          event.eventName === "PresaleCreated" &&
          event.args &&
          "presale" in event.args
        ) {
          return event.args.presale as `0x${string}`;
        }
      } catch {
        // not the event we're looking for
      }
    }
    return null;
  }, [receipt]);

  useEffect(() => {
    if (isConfirmed && newPresaleAddress && hash) {
      toast.success(
        `Presale created! Tx: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
      );
      onCreated();
      setShowForm(false);
      resetCreate();
      setSaleToken("");
      setSaleAmount("");
      setHardCap("");
      setSoftCap("10");
      setMinContribution("0.1");
      setMaxContribution("10");
      setStartTime("");
      setEndTime("");
      navigate(`/dashboard/presales/manage/${newPresaleAddress}`);
    }
  }, [isConfirmed, newPresaleAddress, hash, navigate, onCreated, resetCreate]);

  useEffect(() => {
    if (isError && error) {
      toast.error(getFriendlyTxErrorMessage(error, "Quick create presale"));
      resetCreate();
    }
  }, [isError, error, resetCreate]);

  // Set default start/end times when form opens
  useEffect(() => {
    if (showForm) {
      if (!startTime) {
        const now = new Date();
        now.setDate(now.getDate() + 1);
        setStartTime(now.toISOString().slice(0, 16));
      }
      if (!endTime) {
        const later = new Date();
        later.setDate(later.getDate() + 14);
        setEndTime(later.toISOString().slice(0, 16));
      }
    }
  }, [showForm, startTime, endTime]);

  const handleCreate = () => {
    if (!saleToken || !saleToken.startsWith("0x")) {
      toast.error("Enter a valid sale token address");
      return;
    }
    if (!saleAmount || Number(saleAmount) <= 0) {
      toast.error("Enter total tokens for sale");
      return;
    }
    if (!hardCap || Number(hardCap) <= 0) {
      toast.error("Enter a hard cap");
      return;
    }

    const saleAmountWei = parseUnits(saleAmount, decimals);
    const hardCapWei = parseEther(hardCap);
    const rate = (saleAmountWei * 100n) / hardCapWei;

    if (rate === 0n) {
      toast.error("Calculated rate is 0. Check sale amount and hard cap.");
      return;
    }

    const presaleConfig = {
      startTime: BigInt(new Date(startTime || Date.now()).getTime() / 1000),
      endTime: BigInt(
        new Date(endTime || Date.now() + 14 * 86400000).getTime() / 1000,
      ),
      rate,
      softCap: parseEther(softCap || "10"),
      hardCap: hardCapWei,
      minContribution: parseEther(minContribution || "0.1"),
      maxContribution: parseEther(maxContribution || "10"),
    };

    createPresale({
      saleToken: saleToken as Address,
      paymentToken: "0x0000000000000000000000000000000000000000" as Address,
      config: presaleConfig,
      owner: address as Address,
    });
  };

  const calculatedRate =
    saleAmount && hardCap && Number(saleAmount) > 0 && Number(hardCap) > 0
      ? (Number(saleAmount) / Number(hardCap)).toFixed(2)
      : null;

  if (!showForm) {
    return (
      <Card className="border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)] mb-6 bg-[#64FE3E]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black uppercase tracking-wider text-lg">
                Quick Create Presale
              </p>
              <p className="text-sm text-gray-700">
                Create a presale with minimal input — no form required.
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="border-4 border-[#1A1A2E] bg-white text-[#1A1A2E] font-black uppercase tracking-wider shadow-[3px_3px_0_rgba(26,26,46,1)] hover:bg-gray-100"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Presale
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)] mb-6">
      <CardHeader className="border-b-2 border-[#1A1A2E] bg-[#64FE3E] p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-black uppercase tracking-wider">
            Quick Create Presale
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(false)}
            className="border-2 border-[#1A1A2E] font-bold uppercase text-xs"
          >
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sale Token */}
          <div className="space-y-1.5">
            <Label
              htmlFor="qt-saleToken"
              className="text-xs font-bold uppercase"
            >
              Sale Token Address *
            </Label>
            <Input
              id="qt-saleToken"
              placeholder="0x..."
              value={saleToken}
              onChange={(e) => setSaleToken(e.target.value)}
              className="border-2 border-[#1A1A2E] font-mono text-sm"
            />
          </div>

          {/* Hard Cap */}
          <div className="space-y-1.5">
            <Label htmlFor="qt-hardCap" className="text-xs font-bold uppercase">
              Hard Cap (XTZ) *
            </Label>
            <Input
              id="qt-hardCap"
              type="number"
              placeholder="e.g. 100"
              value={hardCap}
              onChange={(e) => setHardCap(e.target.value)}
              className="border-2 border-[#1A1A2E]"
            />
          </div>

          {/* Total Tokens for Sale */}
          <div className="space-y-1.5">
            <Label
              htmlFor="qt-saleAmount"
              className="text-xs font-bold uppercase"
            >
              Total Tokens for Sale *
            </Label>
            <Input
              id="qt-saleAmount"
              type="number"
              placeholder="e.g. 1000000"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              className="border-2 border-[#1A1A2E]"
            />
          </div>

          {/* Soft Cap */}
          <div className="space-y-1.5">
            <Label htmlFor="qt-softCap" className="text-xs font-bold uppercase">
              Soft Cap (XTZ)
            </Label>
            <Input
              id="qt-softCap"
              type="number"
              placeholder="10"
              value={softCap}
              onChange={(e) => setSoftCap(e.target.value)}
              className="border-2 border-[#1A1A2E]"
            />
          </div>

          {/* Start Time */}
          <div className="space-y-1.5">
            <Label
              htmlFor="qt-startTime"
              className="text-xs font-bold uppercase"
            >
              Start Time
            </Label>
            <Input
              id="qt-startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border-2 border-[#1A1A2E]"
            />
          </div>

          {/* End Time */}
          <div className="space-y-1.5">
            <Label htmlFor="qt-endTime" className="text-xs font-bold uppercase">
              End Time
            </Label>
            <Input
              id="qt-endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border-2 border-[#1A1A2E]"
            />
          </div>

          {/* Min Contribution */}
          <div className="space-y-1.5">
            <Label
              htmlFor="qt-minContribution"
              className="text-xs font-bold uppercase"
            >
              Min Contribution (XTZ)
            </Label>
            <Input
              id="qt-minContribution"
              type="number"
              placeholder="0.1"
              value={minContribution}
              onChange={(e) => setMinContribution(e.target.value)}
              className="border-2 border-[#1A1A2E]"
            />
          </div>

          {/* Max Contribution */}
          <div className="space-y-1.5">
            <Label
              htmlFor="qt-maxContribution"
              className="text-xs font-bold uppercase"
            >
              Max Contribution (XTZ)
            </Label>
            <Input
              id="qt-maxContribution"
              type="number"
              placeholder="10"
              value={maxContribution}
              onChange={(e) => setMaxContribution(e.target.value)}
              className="border-2 border-[#1A1A2E]"
            />
          </div>
        </div>

        {/* Calculated rate display */}
        {calculatedRate && (
          <div className="p-3 bg-[#F7F3EE] border-2 border-[#1A1A2E] text-sm">
            <span className="font-bold uppercase">Rate: </span>
            <span>{calculatedRate} tokens per XTZ</span>
          </div>
        )}

        <Button
          onClick={handleCreate}
          disabled={isBusy || !saleToken || !saleAmount || !hardCap}
          className="w-full border-4 border-[#1A1A2E] bg-[#64FE3E] text-[#1A1A2E] font-black uppercase tracking-wider shadow-[3px_3px_0_rgba(26,26,46,1)] hover:bg-[#7ADF7A] py-5"
        >
          {isBusy
            ? isConfirming
              ? "Confirming transaction..."
              : "Creating Presale..."
            : "Create Presale"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminPresalesContent() {
  const { address } = useAccount();
  const { feeRecipient } = useFeeRecipient();
  const { presales, isLoading, refetch } = useLaunchpadPresales("all", true);
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "ended">(
    "all",
  );

  const isFeeRecipient = Boolean(
    address &&
    feeRecipient &&
    address.toLowerCase() === feeRecipient.toLowerCase(),
  );

  const filteredPresales = presales?.filter((p) => {
    if (filter === "all") return true;
    if (filter === "live") return p.status === "live";
    if (filter === "upcoming") return p.status === "upcoming";
    if (filter === "ended")
      return ["ended", "finalized", "cancelled"].includes(p.status);
    return true;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#1A1A2E] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-bold">Back to Admin</span>
        </Link>
        <div className="border-b-4 border-[#1A1A2E] bg-[#0F59FF] p-6 shadow-[4px_4px_0_rgba(26,26,46,1)]">
          <h1 className="text-4xl font-black uppercase tracking-wider">
            Manage Presales
          </h1>
          <p className="text-sm text-gray-700 mt-2">
            View all presales and update fees.
            {isFeeRecipient && (
              <span className="text-green-700 font-bold ml-2">
                ✓ You can update fees on presales
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Quick Create */}
      <QuickCreatePresale onCreated={refetch} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={`border-2 border-[#1A1A2E] font-bold uppercase text-xs ${
            filter === "all" ? "bg-black text-white" : ""
          }`}
        >
          All ({presales?.length ?? 0})
        </Button>
        <Button
          variant={filter === "live" ? "default" : "outline"}
          onClick={() => setFilter("live")}
          className={`border-2 border-[#1A1A2E] font-bold uppercase text-xs ${
            filter === "live" ? "bg-green-500 text-white" : ""
          }`}
        >
          Live ({presales?.filter((p) => p.status === "live").length ?? 0})
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          onClick={() => setFilter("upcoming")}
          className={`border-2 border-[#1A1A2E] font-bold uppercase text-xs ${
            filter === "upcoming" ? "bg-yellow-500 text-white" : ""
          }`}
        >
          Upcoming (
          {presales?.filter((p) => p.status === "upcoming").length ?? 0})
        </Button>
        <Button
          variant={filter === "ended" ? "default" : "outline"}
          onClick={() => setFilter("ended")}
          className={`border-2 border-[#1A1A2E] font-bold uppercase text-xs ${
            filter === "ended" ? "bg-gray-500 text-white" : ""
          }`}
        >
          Ended (
          {presales?.filter((p) =>
            ["ended", "finalized", "cancelled"].includes(p.status),
          ).length ?? 0}
          )
        </Button>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="border-2 border-[#1A1A2E] font-bold uppercase text-xs ml-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Presales List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1A2E] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading presales...</p>
        </div>
      ) : filteredPresales && filteredPresales.length > 0 ? (
        <div className="space-y-6">
          {filteredPresales.map((presale) => (
            <PresaleCard
              key={presale.address}
              presale={presale}
              isFeeRecipient={isFeeRecipient}
            />
          ))}
        </div>
      ) : (
        <Card className="border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)]">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No presales found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminPresales() {
  return (
    <AdminRoute>
      <AdminPresalesContent />
    </AdminRoute>
  );
}
