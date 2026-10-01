import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPresalePaymentAmount } from "@/lib/utils/presale-amount";
import type { PresaleWithStatus } from "@/lib/hooks/useLaunchpadPresales";
import type { PresaleCategory } from "@/lib/store/launchpad-presale-store";
import { getPresaleMetadata } from "@/config/presale-metadata";
import { ArrowUpRight, Globe, MessageCircle, Send, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const amountFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 4,
});

function getCategoryLabel(category?: PresaleCategory) {
  switch (category) {
    case "defi": return "DeFi";
    case "ai": return "AI";
    case "gaming": return "Gaming";
    case "infrastructure": return "Infrastructure";
    case "meme": return "Meme";
    default: return "Project";
  }
}

function externalUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function PresaleCard({ presale }: { presale: PresaleWithStatus }) {
  const metadata = getPresaleMetadata(presale.address);
  const socials = {
    twitter: externalUrl(presale.socials?.twitter ?? metadata?.socials?.twitter),
    telegram: externalUrl(presale.socials?.telegram ?? metadata?.socials?.telegram),
    discord: externalUrl(presale.socials?.discord ?? metadata?.socials?.discord),
    website: externalUrl(presale.socials?.website ?? metadata?.socials?.website),
  };
  const socialLinks = [
    { label: "Twitter", href: socials.twitter, Icon: Twitter },
    { label: "Telegram", href: socials.telegram, Icon: Send },
    { label: "Discord", href: socials.discord, Icon: MessageCircle },
    { label: "Website", href: socials.website, Icon: Globe },
  ].filter((social) => social.href);

  const name = presale.saleTokenName || presale.saleTokenSymbol || "Unknown token";
  const description =
    presale.description ||
    metadata?.description ||
    `Presale for ${name}.`;
  const logo =
    presale.logo ||
    metadata?.logo ||
    `https://api.dicebear.com/7.x/rings/svg?seed=${encodeURIComponent(presale.saleToken)}`;
  const currency = presale.isPaymentETH
    ? "XTZ"
    : (presale.paymentTokenSymbol ?? "Token");
  const paymentDecimals = presale.isPaymentETH ? 18 : presale.paymentTokenDecimals;
  const raised = formatPresalePaymentAmount(presale.totalRaised || 0n, paymentDecimals);
  const goal = formatPresalePaymentAmount(presale.hardCap || 0n, paymentDecimals);
  const progress = Number.isFinite(presale.progress)
    ? Math.max(0, Math.min(100, presale.progress))
    : 0;

  const isLive = presale.status === "live";
  const isUpcoming = presale.status === "upcoming";
  const statusLabel = isLive
    ? "Live now"
    : isUpcoming
      ? "Upcoming"
      : presale.status === "cancelled"
        ? "Cancelled"
        : presale.status === "finalized"
          ? "Finalized"
          : "Ended";
  const deadline = new Date(Number(isUpcoming ? presale.startTime : presale.endTime) * 1000);
  const deadlineLabel = isUpcoming
    ? "Starts"
    : isLive
      ? "Ends"
      : presale.status === "cancelled"
        ? "Scheduled end"
        : "Ended";
  const readableDeadline = Number.isNaN(deadline.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(deadline);

  return (
    <article className="flex h-full flex-col border-2 border-tezforge-ink bg-white p-5 shadow-[5px_5px_0_0_#1A1A2E] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[7px_7px_0_0_#1A1A2E] sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-2 border-2 border-tezforge-ink px-3 py-1 text-xs font-black uppercase tracking-wider ${
          isLive ? "bg-tezforge-green" : isUpcoming ? "bg-tezforge-blue text-white" : "bg-tezforge-cream-dark"
        }`}>
          <span aria-hidden="true" className={`size-2 rounded-full ${isLive ? "bg-tezforge-ink" : isUpcoming ? "bg-white" : "bg-tezforge-ink/50"}`} />
          {statusLabel}
        </span>
        <span className="text-xs font-black uppercase tracking-[0.14em] text-tezforge-ink/65">
          {getCategoryLabel(presale.category || metadata?.category)}
        </span>
      </div>

      <div className="mb-4 flex min-w-0 items-center gap-4">
        <Avatar className="size-14 shrink-0 border-2 border-tezforge-ink bg-tezforge-cream">
          <AvatarImage src={logo} alt={`${name} logo`} />
          <AvatarFallback className="font-black uppercase">{name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="break-words font-display text-2xl font-black uppercase leading-tight tracking-tight">{name}</h3>
          {presale.saleTokenSymbol && <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-tezforge-ink/70">{presale.saleTokenSymbol}</p>}
        </div>
      </div>

      <p className="mb-5 line-clamp-2 text-sm font-medium leading-relaxed text-tezforge-ink/70">{description}</p>
      {presale.requiresWhitelist && (
        <span className="mb-5 self-start border border-tezforge-ink bg-tezforge-cream px-2 py-1 text-[11px] font-black uppercase tracking-wider">
          Whitelist only
        </span>
      )}

      <div className="mt-auto border-t-2 border-tezforge-ink pt-5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-[0.14em]">Funding progress</span>
          <span className="text-lg font-black tabular-nums">{progress.toFixed(1)}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`${name} funding progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-3 overflow-hidden border border-tezforge-ink bg-tezforge-cream"
        >
          <div className="h-full bg-tezforge-blue" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs font-bold tabular-nums text-tezforge-ink/70">
          {raised === null ? "—" : amountFormatter.format(raised)} {currency}
          <span aria-hidden="true" className="mx-1 text-tezforge-ink/40">/</span>
          {goal === null ? "—" : amountFormatter.format(goal)} {currency} goal
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-tezforge-ink/20 pt-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-tezforge-ink/70">{deadlineLabel}</p>
            <p className="mt-0.5 text-sm font-bold">{readableDeadline}</p>
          </div>
          {socialLinks.length > 0 && (
            <div className="flex shrink-0 items-center gap-1">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} on ${label}`}
                  className="flex size-8 items-center justify-center text-tezforge-ink/65 transition-colors hover:text-tezforge-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-tezforge-blue"
                >
                  <Icon aria-hidden="true" className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <Link
          to={`/projects/${presale.address}`}
          className="mt-5 flex min-h-12 items-center justify-between border-2 border-tezforge-ink bg-tezforge-blue px-4 text-sm font-black uppercase tracking-wider text-white shadow-[4px_4px_0_0_#1A1A2E] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#1A1A2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tezforge-blue"
        >
          View project <ArrowUpRight aria-hidden="true" className="size-5" />
        </Link>
      </div>
    </article>
  );
}
