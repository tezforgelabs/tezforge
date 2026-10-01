import { AdminRoute } from "@/components/admin/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "wagmi";
import { useFactoryOwner, useFeeRecipient } from "@/lib/utils/admin";
import { useSetFeeRecipient } from "@/lib/hooks/useAdminActions";
import { useLaunchpadPresales } from "@/lib/hooks/useLaunchpadPresales";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { isAddress, type Address } from "viem";
import { ArrowRight, Coins, Users } from "lucide-react";
import { getFriendlyTxErrorMessage } from "@/lib/utils/tx-errors";

const addressClasses =
  "break-all font-mono text-sm text-tezforge-ink/80";

function AdminDashboardContent() {
  const { address } = useAccount();
  const { factoryOwner, isLoading: isLoadingOwner } = useFactoryOwner();
  const {
    feeRecipient,
    isLoading: isLoadingFeeRecipient,
    refetch: refetchFeeRecipient,
  } = useFeeRecipient();
  const { presales, isLoading: isLoadingPresales } =
    useLaunchpadPresales("all");

  const [newFeeRecipient, setNewFeeRecipient] = useState("");
  const {
    setFeeRecipient,
    isBusy: isSettingFeeRecipient,
    isSuccess: isFeeRecipientSuccess,
    isError: isFeeRecipientError,
    error: feeRecipientError,
    reset: resetFeeRecipient,
  } = useSetFeeRecipient();

  useEffect(() => {
    if (isFeeRecipientSuccess) {
      toast.success("Fee recipient updated");
      setNewFeeRecipient("");
      resetFeeRecipient();
      void refetchFeeRecipient();
    }
  }, [isFeeRecipientSuccess, resetFeeRecipient, refetchFeeRecipient]);

  useEffect(() => {
    if (isFeeRecipientError && feeRecipientError) {
      toast.error(
        getFriendlyTxErrorMessage(feeRecipientError, "Update fee recipient"),
      );
      resetFeeRecipient();
    }
  }, [isFeeRecipientError, feeRecipientError, resetFeeRecipient]);

  const handleSetFeeRecipient = () => {
    if (!newFeeRecipient || !isAddress(newFeeRecipient)) {
      toast.error("Please enter a valid address");
      return;
    }
    setFeeRecipient(newFeeRecipient as Address);
  };

  // Stats
  const totalPresales = presales?.length ?? 0;
  const livePresales = presales?.filter((p) => p.status === "live").length ?? 0;
  const upcomingPresales =
    presales?.filter((p) => p.status === "upcoming").length ?? 0;
  const endedPresales =
    presales?.filter(
      (p) =>
        p.status === "ended" ||
        p.status === "finalized" ||
        p.status === "cancelled",
    ).length ?? 0;

  const isOwner =
    address && factoryOwner
      ? address.toLowerCase() === factoryOwner.toLowerCase()
      : false;
  const isFeeRecipientUser =
    address && feeRecipient
      ? address.toLowerCase() === feeRecipient.toLowerCase()
      : false;

  const stats = [
    { label: "Total", value: totalPresales, dot: "bg-tezforge-ink" },
    { label: "Live", value: livePresales, dot: "bg-tezforge-green" },
    { label: "Upcoming", value: upcomingPresales, dot: "bg-tezforge-blue" },
    { label: "Ended", value: endedPresales, dot: "bg-tezforge-cream-dark" },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 text-tezforge-ink sm:py-12">
      {/* Header */}
      <header className="mb-8">
        <span className="mb-3 inline-block border-2 border-tezforge-ink bg-tezforge-green px-3 py-1 text-xs font-black uppercase tracking-widest">
          Admin
        </span>
        <h1 className="text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
          Admin Dashboard
        </h1>
        <p className="mt-3 text-sm font-medium text-tezforge-ink/70 sm:text-base">
          Manage presales, whitelisted creators, and platform settings.
        </p>
      </header>

      {/* Platform card */}
      <section
        aria-labelledby="platform-heading"
        className="mb-6 border-2 border-tezforge-ink bg-white shadow-[3px_3px_0_0_rgba(26,26,46,1)]"
      >
        <div className="border-b-2 border-tezforge-ink px-4 py-3 sm:px-5">
          <h2
            id="platform-heading"
            className="text-base font-black uppercase tracking-wider"
          >
            Platform
          </h2>
        </div>
        <div className="divide-y-2 divide-tezforge-ink">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
            <span className="text-xs font-black uppercase tracking-wider text-tezforge-ink/70">
              Factory owner
            </span>
            <span className={addressClasses}>
              {isLoadingOwner ? (
                <span aria-hidden="true" className="animate-pulse">
                  Loading…
                </span>
              ) : (
                <>
                  {factoryOwner}
                  {isOwner && (
                    <span className="ml-2 inline-flex items-center border-2 border-tezforge-ink bg-tezforge-green px-1.5 py-0.5 align-middle text-[9px] font-black uppercase tracking-wider">
                      You
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
            <span className="text-xs font-black uppercase tracking-wider text-tezforge-ink/70">
              Fee recipient
            </span>
            <span className={addressClasses}>
              {isLoadingFeeRecipient ? (
                <span aria-hidden="true" className="animate-pulse">
                  Loading…
                </span>
              ) : (
                <>
                  {feeRecipient}
                  {isFeeRecipientUser && (
                    <span className="ml-2 inline-flex items-center border-2 border-tezforge-ink bg-tezforge-green px-1.5 py-0.5 align-middle text-[9px] font-black uppercase tracking-wider">
                      You
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
          <div className="px-4 py-3 sm:px-5">
            <Label
              htmlFor="fee-recipient"
              className="text-[11px] font-black uppercase tracking-wider text-tezforge-ink/70"
            >
              Update fee recipient — receives all platform fees
            </Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="fee-recipient"
                placeholder="0x…"
                value={newFeeRecipient}
                onChange={(e) => setNewFeeRecipient(e.target.value)}
                className="border-2 border-tezforge-ink font-mono text-xs"
              />
              <Button
                onClick={handleSetFeeRecipient}
                disabled={isSettingFeeRecipient || !newFeeRecipient}
                className="shrink-0 border-2 border-tezforge-ink bg-tezforge-blue text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none"
              >
                {isSettingFeeRecipient ? "Updating…" : "Update"}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-tezforge-ink/60">
              Only the factory owner can update this.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section
        aria-label="Presale stats"
        className="mb-6 border-2 border-tezforge-ink bg-white p-4 shadow-[3px_3px_0_0_rgba(26,26,46,1)]"
      >
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ label, value, dot }) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-tezforge-ink/70">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${dot}`}
                />
                {label}
              </dt>
              <dd className="text-3xl font-black tabular-nums leading-none">
                {isLoadingPresales ? (
                  <span aria-hidden="true" className="animate-pulse">
                    ···
                  </span>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Quick actions */}
      <section aria-label="Admin actions" className="grid gap-3 sm:grid-cols-2">
        {[
          {
            to: "/admin/presales",
            Icon: Coins,
            iconBg: "bg-tezforge-blue",
            iconText: "text-white",
            title: "Manage Presales",
            desc: "View all presales, update fees",
          },
          {
            to: "/admin/whitelist",
            Icon: Users,
            iconBg: "bg-tezforge-green",
            iconText: "text-tezforge-ink",
            title: "Whitelist Creators",
            desc: "Add or remove whitelisted creators",
          },
        ].map(({ to, Icon, iconBg, iconText, title, desc }) => (
          <Link
            key={to}
            to={to}
            aria-label={title}
            className="group flex items-center justify-between gap-3 border-2 border-tezforge-ink bg-white p-4 shadow-[3px_3px_0_0_rgba(26,26,46,1)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-tezforge-cream/60 hover:shadow-[5px_5px_0_0_rgba(26,26,46,1)] motion-reduce:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tezforge-blue"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className={`flex size-10 shrink-0 items-center justify-center border-2 border-tezforge-ink ${iconBg} ${iconText}`}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase tracking-wider">
                  {title}
                </p>
                <p className="truncate text-xs text-tezforge-ink/70">{desc}</p>
              </div>
            </div>
            <ArrowRight
              aria-hidden="true"
              className="size-5 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
            />
          </Link>
        ))}
      </section>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}
