import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useLaunchpadPresales,
  type PresaleWithStatus,
} from "@/lib/hooks/useLaunchpadPresales";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

function statusBadge(status: string) {
  switch (status) {
    case "live":
      return { label: "Live", classes: "bg-tezforge-green", dot: "bg-tezforge-ink" };
    case "upcoming":
      return { label: "Upcoming", classes: "bg-tezforge-blue text-white", dot: "bg-white" };
    case "cancelled":
      return { label: "Cancelled", classes: "bg-tezforge-red text-white", dot: "bg-white" };
    case "finalized":
      return { label: "Finalized", classes: "bg-tezforge-blue text-white", dot: "bg-white" };
    default:
      return { label: "Ended", classes: "bg-tezforge-cream-dark", dot: "bg-tezforge-ink/50" };
  }
}

function PresaleRow({ presale }: { presale: PresaleWithStatus }) {
  const progress =
    presale.hardCap > 0n
      ? Math.min(
          100,
          Math.round(Number((presale.totalRaised * 100n) / presale.hardCap)),
        )
      : 0;
  const isCancelled = presale.status === "cancelled";
  const name = presale.saleTokenName || presale.saleTokenSymbol || "Token";
  const symbol = presale.saleTokenSymbol;
  const badge = statusBadge(presale.status);

  return (
    <li>
      <Link
        to={`/dashboard/presales/manage/${presale.address}`}
        aria-label={`Manage ${name} presale — ${progress}% funded`}
        className="block border-2 border-tezforge-ink bg-white p-3 shadow-[3px_3px_0_0_rgba(26,26,46,1)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-tezforge-cream/60 hover:shadow-[5px_5px_0_0_rgba(26,26,46,1)] motion-reduce:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tezforge-blue sm:p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center border-2 border-tezforge-ink bg-tezforge-cream text-xs font-black uppercase"
            >
              {(symbol || name).slice(0, 2)}
            </span>
            <h3 className="truncate text-base font-black uppercase tracking-tight">
              {symbol ? `${symbol} Presale` : "Presale"}
            </h3>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 border-2 border-tezforge-ink px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${badge.classes}`}
          >
            <span aria-hidden="true" className={`size-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        </div>

        {presale.hardCap > 0n && (
          <div className="mt-3 flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label={`${name} presale funding progress`}
              className="h-2.5 flex-1 overflow-hidden border border-tezforge-ink bg-tezforge-cream"
            >
              <div
                className={`h-full ${isCancelled ? "bg-tezforge-red" : "bg-tezforge-blue"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-sm font-black tabular-nums">
              {progress}%
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-bold tabular-nums text-tezforge-ink/70">
            {Math.round(Number(formatUnits(presale.totalRaised, 18))).toLocaleString()} /{" "}
            {Math.round(Number(formatUnits(presale.hardCap, 18))).toLocaleString()} XTZ
          </span>
          <span className="inline-flex items-center gap-1 font-black uppercase tracking-wider">
            Manage <ExternalLink className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}

export default function PresalesListPage() {
  const { address, isConnected } = useAccount();
  const { presales, isLoading } = useLaunchpadPresales("all", false);

  const myPresales =
    presales?.filter(
      (presale) =>
        address && presale.owner?.toLowerCase() === address.toLowerCase(),
    ) || [];

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 text-tezforge-ink">
        <Card className="mx-auto max-w-2xl border-2 border-tezforge-ink shadow-[4px_4px_0_rgba(26,26,46,1)]">
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-lg font-medium text-tezforge-ink/70">
              Please connect your wallet to view your presales.
            </p>
            <Link to="/dashboard/user">
              <Button
                variant="outline"
                className="border-2 border-tezforge-ink font-black uppercase tracking-wider shadow-[3px_3px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_rgba(26,26,46,1)] motion-reduce:transform-none"
              >
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 text-tezforge-ink sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
          My Presales
        </h1>
        <Link to="/dashboard/create/presale">
          <Button className="border-2 border-tezforge-ink bg-tezforge-blue font-black uppercase tracking-wider text-white shadow-[3px_3px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_rgba(26,26,46,1)] motion-reduce:transform-none">
            Create Presale
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div aria-hidden="true" className="space-y-3">
          <div className="h-28 animate-pulse border-2 border-tezforge-ink/20 bg-tezforge-cream-dark/50" />
          <div className="h-28 animate-pulse border-2 border-tezforge-ink/20 bg-tezforge-cream-dark/50" />
          <div className="h-28 animate-pulse border-2 border-tezforge-ink/20 bg-tezforge-cream-dark/50" />
          <span className="sr-only">Loading presales…</span>
        </div>
      ) : myPresales.length > 0 ? (
        <ul className="space-y-3">
          {myPresales.map((presale) => (
            <PresaleRow key={presale.address} presale={presale} />
          ))}
        </ul>
      ) : (
        <div className="border-2 border-dashed border-tezforge-ink bg-white px-6 py-14 text-center">
          <p className="mb-4 text-base font-medium text-tezforge-ink/70 sm:text-lg">
            You do not have any presales yet.
          </p>
          <Link to="/dashboard/create/presale">
            <Button className="border-2 border-tezforge-ink bg-tezforge-blue font-black uppercase tracking-wider text-white shadow-[3px_3px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_rgba(26,26,46,1)] motion-reduce:transform-none">
              Create Your First Presale <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
