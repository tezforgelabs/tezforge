"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useAllLocks } from "@/lib/hooks/useAllLocks";
import { useChainContracts } from "@/lib/hooks/useChainContracts";
import { useLaunchpadPresales } from "@/lib/hooks/useLaunchpadPresales";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Coins,
  ExternalLink,
  FileText,
  Lock,
  Send,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  erc20Abi,
  formatUnits,
  parseAbiItem,
  type AbiEvent,
  type Address,
  type PublicClient,
} from "viem";
import {
  useChainId,
  useConfig,
  usePublicClient,
  useReadContracts,
} from "wagmi";

// ── Event signatures ───────────────────────────────────────────────────────
const TOKEN_CREATED_EVENT = parseAbiItem(
  "event TokenCreated(address indexed creator, address indexed token, uint8 indexed tokenType)",
) as unknown as AbiEvent;

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
) as unknown as AbiEvent;

// ── Log query helpers (RPC-limited to 1000 blocks per request) ─────────────
const LOG_CHUNK_SIZE = 1000n;

// Binary-search for the block where a contract was first deployed (code non-empty)
async function findContractDeploymentBlock(
  client: PublicClient,
  address: Address,
): Promise<bigint> {
  const head = await client.getBlockNumber();

  // Quick check: if no code at head, address isn't a contract
  const headCode = await client.getCode({ address });
  if (!headCode || headCode === "0x") {
    return head;
  }

  let lo = 0n;
  let hi = head;
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    const code = await client.getCode({ address, blockNumber: mid });
    if (code && code !== "0x") {
      hi = mid;
    } else {
      lo = mid + 1n;
    }
  }
  return lo;
}

// Scan logs from `fromBlock` forward to the head block in safe chunk sizes.
async function fetchLogsChunked(
  client: PublicClient,
  params: { address: Address; event: AbiEvent; args?: Record<string, unknown> },
  fromBlock: bigint,
  onLogs: (logs: Awaited<ReturnType<typeof client.getLogs>>) => boolean,
): Promise<void> {
  const head = await client.getBlockNumber();
  let current = fromBlock;

  while (current <= head) {
    const toBlock =
      current + LOG_CHUNK_SIZE - 1n < head
        ? current + LOG_CHUNK_SIZE - 1n
        : head;

    const logs = await client.getLogs({
      address: params.address,
      event: params.event,
      args: params.args as any,
      fromBlock: current,
      toBlock,
    });

    if (logs.length > 0) {
      const shouldStop = onLogs(logs);
      if (shouldStop) return;
    }

    if (toBlock >= head) break;
    current = toBlock + 1n;
  }
}

// ── Token type display ──────────────────────────────────────────────────────
const TOKEN_TYPE_LABELS: Record<number, string> = {
  0: "Plain",
  1: "Burnable",
  2: "Mintable",
  3: "Non-Mintable",
  4: "Taxable",
};

function getTokenTypeLabel(tokenType: number): string {
  return TOKEN_TYPE_LABELS[tokenType] ?? `Type ${tokenType}`;
}

// ── Hooks: token data (single fetch, shared across sections) ────────────────

type CreationData = {
  creator: Address;
  blockNumber: bigint;
  timestamp: Date;
  tokenType: number;
};

function useTokenInfo(tokenAddress: Address | undefined) {
  const enabled = Boolean(tokenAddress);

  // Single multicall: name, symbol, decimals, totalSupply in one RPC request
  const { data, isLoading } = useReadContracts({
    contracts: tokenAddress
      ? [
          { abi: erc20Abi, address: tokenAddress, functionName: "name" },
          { abi: erc20Abi, address: tokenAddress, functionName: "symbol" },
          { abi: erc20Abi, address: tokenAddress, functionName: "decimals" },
          { abi: erc20Abi, address: tokenAddress, functionName: "totalSupply" },
        ]
      : [],
    query: { enabled },
  });

  const name = data?.[0]?.result as string | undefined;
  const symbol = data?.[1]?.result as string | undefined;
  const decimals = data?.[2]?.result as number | undefined;
  const totalSupply = data?.[3]?.result as bigint | undefined;

  const formattedSupply = useMemo(() => {
    if (totalSupply === undefined || decimals === undefined) return null;
    try {
      return Number(formatUnits(totalSupply, decimals)).toLocaleString(
        undefined,
        {
          maximumFractionDigits: 2,
        },
      );
    } catch {
      return totalSupply.toString();
    }
  }, [totalSupply, decimals]);

  return { name, symbol, decimals, totalSupply, formattedSupply, isLoading };
}

function useTokenCreationInfo(tokenAddress: Address | undefined) {
  const publicClient = usePublicClient();
  const { tokenFactory } = useChainContracts();
  const [creationData, setCreationData] = useState<CreationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient || !tokenFactory || !tokenAddress) return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const factoryDeployBlock = await findContractDeploymentBlock(
          publicClient!,
          tokenFactory,
        );
        if (cancelled) return;

        let found = false;

        await fetchLogsChunked(
          publicClient!,
          {
            address: tokenFactory,
            event: TOKEN_CREATED_EVENT,
            args: { token: tokenAddress },
          },
          factoryDeployBlock,
          (logs) => {
            if (cancelled) return true;
            const latestLog = logs[logs.length - 1];
            processLatestLog(latestLog);
            found = true;
            return true;
          },
        );

        async function processLatestLog(
          latestLog: Awaited<
            ReturnType<NonNullable<typeof publicClient>["getLogs"]>
          >[0],
        ) {
          try {
            const block = await publicClient!.getBlock({
              blockNumber: latestLog.blockNumber!,
            });
            if (cancelled) return;
            const logArgs = (latestLog as any).args as {
              creator: Address;
              tokenType: bigint;
            };
            setCreationData({
              creator: logArgs.creator,
              blockNumber: latestLog.blockNumber!,
              timestamp: new Date(Number(block.timestamp) * 1000),
              tokenType: Number(logArgs.tokenType),
            });
          } catch (e) {
            if (!cancelled) {
              console.error("Failed to fetch block:", e);
              setError("Failed to fetch block data.");
            }
          }
        }

        if (!cancelled && !found) {
          setError("Token creation event not found.");
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch token creation data:", e);
          setError("Failed to fetch creation data.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicClient, tokenFactory, tokenAddress]);

  return { creationData, isLoading, error };
}

function useTokenHolders(tokenAddress: Address | undefined) {
  const publicClient = usePublicClient();
  const [holderCount, setHolderCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicClient || !tokenAddress) return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const uniqueReceivers = new Set<string>();

        const tokenDeployBlock = await findContractDeploymentBlock(
          publicClient,
          tokenAddress,
        );
        if (cancelled) return;

        await fetchLogsChunked(
          publicClient!,
          { address: tokenAddress, event: TRANSFER_EVENT },
          tokenDeployBlock,
          (logs) => {
            for (const log of logs) {
              const logArgs = (log as any).args as { to?: string };
              const to = logArgs.to?.toLowerCase();
              if (to && to !== "0x0000000000000000000000000000000000000000") {
                uniqueReceivers.add(to);
              }
            }
            return false;
          },
        );

        if (cancelled) return;

        const addresses = Array.from(uniqueReceivers);
        const batchSize = 50;
        let count = 0;

        for (let i = 0; i < addresses.length; i += batchSize) {
          if (cancelled) return;
          const batch = addresses.slice(i, i + batchSize);
          const balances = await Promise.allSettled(
            batch.map((addr) =>
              publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [addr as Address],
              }),
            ),
          );
          for (const result of balances) {
            if (result.status === "fulfilled" && result.value > 0n) {
              count++;
            }
          }
        }

        if (!cancelled) {
          setHolderCount(count);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch holders:", e);
          setHolderCount(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicClient, tokenAddress]);

  return { holderCount, isLoading };
}

function KeyMetricsRow({
  tokenInfo,
  creationInfo,
  holdersInfo,
}: {
  tokenInfo: ReturnType<typeof useTokenInfo>;
  creationInfo: ReturnType<typeof useTokenCreationInfo>;
  holdersInfo: ReturnType<typeof useTokenHolders>;
}) {
  const { formattedSupply, symbol } = tokenInfo;
  const { creationData } = creationInfo;
  const { holderCount, isLoading: holdersLoading } = holdersInfo;

  const age = creationData
    ? formatDistanceToNow(creationData.timestamp, { addSuffix: true })
    : null;

  const metrics = [
    {
      icon: Coins,
      label: "Total Supply",
      value: formattedSupply ? `${formattedSupply} ${symbol ?? ""}` : "…",
    },
    {
      icon: Users,
      label: "Holders",
      value: holdersLoading ? "…" : (holderCount?.toLocaleString() ?? "—"),
      sub: "Non-zero balances",
    },
    {
      icon: ShieldCheck,
      label: "Token Type",
      value: creationData ? getTokenTypeLabel(creationData.tokenType) : "…",
    },
    {
      icon: Calendar,
      label: "Age",
      value: age ?? "…",
    },
  ];

  return (
    <div className="mb-6 border border-[#1A1A2E] bg-[#F7F3EE] shadow-[0px_0px_0_rgba(26,26,46,1)] p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ icon: Icon, label, value, sub }) => (
          <div key={label}>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#0F59FF] text-white p-1.5">
                <Icon className="w-4 h-4" />
              </span>
              <p className="text-[11px] uppercase font-black tracking-wider text-gray-500">
                {label}
              </p>
            </div>
            <p className="text-xl font-black truncate">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  sub,
}: {
  label: string;
  value: string;
  mono?: boolean;
  sub?: string;
}) {
  return (
    <div>
      <dt className="text-xs uppercase font-black text-gray-500 tracking-wider">
        {label}
      </dt>
      <dd
        className={`font-bold text-sm mt-0.5 ${mono ? "font-mono text-xs break-all" : "break-all"}`}
      >
        {value}
      </dd>
      {sub && <dd className="text-xs text-gray-500">{sub}</dd>}
    </div>
  );
}

function TokenIdentity({
  tokenInfo,
  creationInfo,
}: {
  tokenAddress: Address;
  tokenInfo: ReturnType<typeof useTokenInfo>;
  creationInfo: ReturnType<typeof useTokenCreationInfo>;
}) {
  const { decimals } = tokenInfo;
  const { creationData, isLoading, error } = creationInfo;

  return (
    <Card className="p-0 gap-0 h-full">
      <CardHeader className="bg-[#0F59FF] p-4">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          Token Identity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <dl className="space-y-3">
          <DetailRow label="Decimals" value={decimals?.toString() ?? "…"} />
          {creationData ? (
            <>
              <DetailRow label="Creator" value={creationData.creator} mono />
              <DetailRow
                label="Created"
                value={format(creationData.timestamp, "MMM d, yyyy 'at' HH:mm")}
                sub={formatDistanceToNow(creationData.timestamp, {
                  addSuffix: true,
                })}
              />
              <DetailRow
                label="Block"
                value={creationData.blockNumber.toString()}
                mono
              />
            </>
          ) : isLoading ? (
            <p className="text-xs text-gray-400">Loading creation details…</p>
          ) : (
            <p className="text-xs text-gray-400">
              {error ?? "Creation details unavailable"}
            </p>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

function RelatedPresales({ tokenAddress }: { tokenAddress: Address }) {
  const { presales, isLoading } = useLaunchpadPresales("all", false);

  const relatedPresales = useMemo(() => {
    if (!presales || presales.length === 0) return [];
    const addr = tokenAddress.toLowerCase();
    return presales.filter((p) => p.saleToken?.toLowerCase() === addr);
  }, [presales, tokenAddress]);

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "live":
        return "secondary" as const;
      case "upcoming":
        return "outline" as const;
      case "finalized":
        return "default" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getProgress = (presale: (typeof relatedPresales)[0]) => {
    if (!presale.hardCap || presale.hardCap === 0n) return 0;
    return Math.round(Number((presale.totalRaised * 100n) / presale.hardCap));
  };

  return (
    <Card className="p-0 gap-0">
      <CardHeader className="bg-[#0F59FF] p-4">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <FileText className="w-4 h-4" />
          Presales ({relatedPresales.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200" />
            <div className="h-16 bg-gray-200" />
          </div>
        ) : relatedPresales.length > 0 ? (
          <div className="space-y-3">
            {relatedPresales.map((presale) => {
              const progress = getProgress(presale);
              return (
                <div
                  key={presale.address}
                  className="p-3 bg-gray-50 rounded-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-sm uppercase truncate">
                        {presale.saleTokenSymbol || "Token"} Presale
                      </span>
                      <Badge variant={getBadgeVariant(presale.status)}>
                        {presale.status}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      asChild
                      className="border-2 border-[#1A1A2E] bg-[#64FE3E] text-black font-bold text-xs uppercase flex-shrink-0"
                    >
                      <Link
                        to={`/dashboard/presales/manage/${presale.address}`}
                      >
                        Manage <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                  {presale.hardCap > 0n && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold">{progress}%</span>
                        <span className="text-gray-500">
                          {Math.round(
                            Number(formatUnits(presale.totalRaised, 18)),
                          ).toLocaleString()}{" "}
                          /{" "}
                          {Math.round(
                            Number(formatUnits(presale.hardCap, 18)),
                          ).toLocaleString()}{" "}
                          XTZ
                        </span>
                      </div>
                      <Progress
                        value={progress}
                        className="h-2 border border-[#1A1A2E]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 font-medium">No presales yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RelatedLocks({ tokenAddress }: { tokenAddress: Address }) {
  const { locks, isLoading } = useAllLocks();

  const relatedLocks = useMemo(() => {
    if (!locks || locks.length === 0) return [];
    const addr = tokenAddress.toLowerCase();
    return locks.filter((l) => l.token?.toLowerCase() === addr);
  }, [locks, tokenAddress]);

  const getLockBadge = (lock: (typeof relatedLocks)[0]) => {
    if (lock.withdrawn) {
      return { label: "Withdrawn", variant: "outline" as const };
    }
    const isExpired = lock.unlockDate
      ? Date.now() >= Number(lock.unlockDate) * 1000
      : false;
    if (isExpired) {
      return { label: "Unlockable", variant: "destructive" as const };
    }
    return { label: "Locked", variant: "secondary" as const };
  };

  return (
    <Card className="shadow-[0px_0px_0_rgba(26,26,46,1)] p-0 gap-0">
      <CardHeader className="bg-[#0F59FF] p-4">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <Lock className="w-4 h-4" />
          Token Locks ({relatedLocks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200" />
            <div className="h-16 bg-gray-200" />
          </div>
        ) : relatedLocks.length > 0 ? (
          <div className="space-y-3">
            {relatedLocks.slice(0, 5).map((lock) => {
              const lockIdStr = String(lock.id ?? "0");
              const badge = getLockBadge(lock);
              return (
                <div key={lockIdStr} className="p-3 bg-gray-50 rounded-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm uppercase truncate">
                        {lock.name || `Lock #${lockIdStr}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lock.formattedAmount || "0"} {lock.tokenSymbol || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="border-2 border-[#1A1A2E] font-bold text-xs uppercase"
                      >
                        <Link to={`/locks/${lockIdStr}`}>
                          View <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {relatedLocks.length > 5 && (
              <p className="text-center text-xs text-gray-500">
                +{relatedLocks.length - 5} more locks
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 font-medium">No locks yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TokenDetailPage() {
  const { address } = useParams<{ address: string }>();
  const chainId = useChainId();
  const config = useConfig();

  const explorerUrl = config.chains.find((c) => c.id === chainId)
    ?.blockExplorers?.default.url;
  const tokenAddress = address as Address | undefined;

  // Single fetch — shared across all sections via props
  const tokenInfo = useTokenInfo(tokenAddress);
  const creationInfo = useTokenCreationInfo(tokenAddress);
  const holdersInfo = useTokenHolders(tokenAddress);

  if (!tokenAddress) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="border-2 border-[#1A1A2E] shadow-[0px_0px_0_rgba(26,26,46,1)] max-w-2xl mx-auto">
          <CardContent className="p-12 text-center space-y-4">
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
            <p className="text-xl font-black">Invalid Token Address</p>
            <Link to="/dashboard/user">
              <Button className="border-2 border-[#1A1A2E] bg-[#0F59FF] text-white font-black uppercase tracking-wider shadow-[0px_0px_0_rgba(26,26,46,1)]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 text-[#1A1A2E]">
      {/* ── Header card ──────────────────────────────────────────────── */}
      <div className="mb-6 bg-[#F7F3EE]">
        {/* top bar: back link + explorer */}
        <div className="flex items-center justify-between gap-3 p-3">
          <Link
            to="/dashboard/user"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#1A1A2E] font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {explorerUrl && (
            <a
              href={`${explorerUrl}/address/${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="border-2 border-[#1A1A2E] font-bold text-xs uppercase shadow-[0px_0px_0_rgba(26,26,46,1)]"
              >
                <ExternalLink className="w-3 h-3 mr-1" /> Explorer
              </Button>
            </a>
          )}
        </div>

        {/* identity */}
        <div className="flex items-center gap-4 p-5">
          <span className="flex-shrink-0 w-14 h-14 bg-[#0F59FF] text-white items-center justify-center hidden sm:flex">
            <Coins className="w-7 h-7" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
                {tokenInfo.name ?? "Token"}
              </h1>
              {tokenInfo.symbol && (
                <span className="px-2 py-0.5 bg-[#1A1A2E] text-[#64FE3E] text-xs font-black uppercase tracking-wider">
                  {tokenInfo.symbol}
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-gray-600 break-all mt-1">
              {tokenAddress}
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-wrap gap-2 p-4 pt-3">
          <Button
            size="sm"
            asChild
            className="border-2 border-[#1A1A2E] bg-[#0F59FF] text-white font-bold text-xs uppercase shadow-[0px_0px_0_rgba(26,26,46,1)]"
          >
            <Link to={`/dashboard/create/presale?token=${tokenAddress}`}>
              <FileText className="w-3 h-3 mr-1" /> Presale
            </Link>
          </Button>
          <Button
            size="sm"
            asChild
            variant="outline"
            className="border-2 border-[#1A1A2E] font-bold text-xs uppercase shadow-[0px_0px_0_rgba(26,26,46,1)]"
          >
            <Link to={`/dashboard/tools/token-locker?token=${tokenAddress}`}>
              <Lock className="w-3 h-3 mr-1" /> Lock Tokens
            </Link>
          </Button>
          <Button
            size="sm"
            asChild
            variant="outline"
            className="border-2 border-[#1A1A2E] font-bold text-xs uppercase shadow-[0px_0px_0_rgba(26,26,46,1)]"
          >
            <Link to={`/dashboard/tools/airdrop?token=${tokenAddress}`}>
              <Send className="w-3 h-3 mr-1" /> Airdrop
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Key metrics row ────────────────────────────────────────────── */}
      <KeyMetricsRow
        tokenInfo={tokenInfo}
        creationInfo={creationInfo}
        holdersInfo={holdersInfo}
      />

      {/* ── Main content: identity + presales + locks ──────────────────── */}
      <div className="grid gap-6 mb-6 grid-cols-1 lg:grid-cols-3">
        <div>
          <TokenIdentity
            tokenAddress={tokenAddress}
            tokenInfo={tokenInfo}
            creationInfo={creationInfo}
          />
        </div>
        <div className="lg:col-span-2 grid gap-6 grid-cols-1 lg:grid-cols-2">
          <RelatedPresales tokenAddress={tokenAddress} />
          <RelatedLocks tokenAddress={tokenAddress} />
        </div>
      </div>
    </div>
  );
}
