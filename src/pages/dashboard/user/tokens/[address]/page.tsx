"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useChainContracts } from "@/lib/hooks/useChainContracts";
import { useAllLocks } from "@/lib/hooks/useAllLocks";
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
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { type AbiEvent, type Address, erc20Abi, formatUnits, parseAbiItem, type PublicClient } from "viem";
import { useAccount, useChainId, useConfig, usePublicClient, useReadContract } from "wagmi";

// ── Event signatures ───────────────────────────────────────────────────────
const TOKEN_CREATED_EVENT = parseAbiItem(
  "event TokenCreated(address indexed creator, address indexed token, uint8 indexed tokenType)"
) as unknown as AbiEvent;

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
) as unknown as AbiEvent;

// ── Log query helpers (RPC-limited to 1000 blocks per request) ─────────────
const LOG_CHUNK_SIZE = 1000n;

// Binary-search for the block where a contract was first deployed (code non-empty)
async function findContractDeploymentBlock(
  client: PublicClient,
  address: Address
): Promise<bigint> {
  const head = await client.getBlockNumber();

  // Quick check: if no code at head, address isn't a contract
  const headCode = await client.getCode({ address });
  if (!headCode || headCode === "0x") {
    return head; // not a contract — scan nothing
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
// `onLogs` returns true to stop scanning early.
async function fetchLogsChunked(
  client: PublicClient,
  params: { address: Address; event: AbiEvent; args?: Record<string, unknown> },
  fromBlock: bigint,
  onLogs: (logs: Awaited<ReturnType<typeof client.getLogs>>) => boolean // return true to stop
): Promise<void> {
  const head = await client.getBlockNumber();
  let current = fromBlock;

  while (current <= head) {
    const toBlock = current + LOG_CHUNK_SIZE - 1n < head ? current + LOG_CHUNK_SIZE - 1n : head;

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

// ── Token info section ──────────────────────────────────────────────────────
function TokenOverview({ tokenAddress }: { tokenAddress: Address }) {
  const { data: name } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "name",
  });
  const { data: symbol } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "symbol",
  });
  const { data: decimals } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "decimals",
  });
  const { data: totalSupply } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "totalSupply",
  });

  const formattedSupply = useMemo(() => {
    if (totalSupply === undefined || decimals === undefined) return null;
    try {
      return Number(formatUnits(totalSupply, decimals)).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
    } catch {
      return totalSupply.toString();
    }
  }, [totalSupply, decimals]);

  return (
    <Card className="border-2 border-[#1A1A2E] shadow-[3px_3px_0_rgba(26,26,46,1)] p-0 gap-0">
      <CardHeader className="border-b-2 border-[#1A1A2E] bg-[#0F59FF] p-4">
        <CardTitle className="font-bold uppercase tracking-wider flex items-center gap-2 text-white text-sm">
          <Coins className="w-4 h-4" />
          Token Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase font-bold text-gray-500">Name</p>
            <p className="font-bold text-lg break-all">{name || "..."}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-gray-500">Symbol</p>
            <p className="font-bold text-lg">{symbol || "..."}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-gray-500">Decimals</p>
            <p className="font-bold">{decimals?.toString() ?? "..."}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-gray-500">Total Supply</p>
            <p className="font-bold break-all">
              {formattedSupply ?? "..."} {symbol || ""}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Creation info section ───────────────────────────────────────────────────
function TokenCreationInfo({ tokenAddress }: { tokenAddress: Address }) {
  const publicClient = usePublicClient();
  const { tokenFactory } = useChainContracts();
  const [creationData, setCreationData] = useState<{
    creator: Address;
    blockNumber: bigint;
    timestamp: Date;
    tokenType: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient || !tokenFactory) return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Find when the factory was deployed, then scan forward for our token event
        const factoryDeployBlock = await findContractDeploymentBlock(publicClient!, tokenFactory);
        if (cancelled) return;

        let found = false;

        await fetchLogsChunked(
          publicClient!,
          { address: tokenFactory, event: TOKEN_CREATED_EVENT, args: { token: tokenAddress } },
          factoryDeployBlock,
          (logs) => {
            if (cancelled) return true;
            const latestLog = logs[logs.length - 1];
            processLatestLog(latestLog);
            found = true;
            return true; // stop at first chunk with results
          }
        );

        async function processLatestLog(
          latestLog: Awaited<ReturnType<NonNullable<typeof publicClient>['getLogs']>>[0]
        ) {
          try {
            const block = await publicClient!.getBlock({ blockNumber: latestLog.blockNumber! });
            if (cancelled) return;
            const logArgs = (latestLog as any).args as { creator: Address; tokenType: bigint };
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
          setError("Token creation event not found (may have been deployed outside the factory).");
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

  if (isLoading) {
    return (
      <Card className="border-2 border-[#1A1A2E] shadow-[3px_3px_0_rgba(26,26,46,1)] p-0 gap-0">
        <CardHeader className="border-b-2 border-[#1A1A2E] bg-[#FFB6C1] p-4">
          <CardTitle className="font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            Creation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !creationData) {
    return (
      <Card className="border-2 border-[#1A1A2E] shadow-[3px_3px_0_rgba(26,26,46,1)] p-0 gap-0">
        <CardHeader className="border-b-2 border-[#1A1A2E] bg-[#FFB6C1] p-4">
          <CardTitle className="font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            Creation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">{error || "Unknown"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#1A1A2E] shadow-[3px_3px_0_rgba(26,26,46,1)] p-0 gap-0">
      <CardHeader className="border-b-2 border-[#1A1A2E] bg-[#FFB6C1] p-4">
        <CardTitle className="font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4" />
          Creation Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="text-xs uppercase font-bold text-gray-500">Token Type</p>
          <p className="font-bold">{getTokenTypeLabel(creationData.tokenType)}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-gray-500">Created</p>
          <p className="font-bold">
            {format(creationData.timestamp, "MMM d, yyyy 'at' HH:mm")}
          </p>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(creationData.timestamp, { addSuffix: true })}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-gray-500">Creator</p>
          <p className="font-mono text-xs break-all">{creationData.creator}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-gray-500">Block Number</p>
          <p className="font-mono text-sm">{creationData.blockNumber.toString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Holder count section ────────────────────────────────────────────────────
function TokenHolders({ tokenAddress }: { tokenAddress: Address }) {
  const publicClient = usePublicClient();
  const [holderCount, setHolderCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicClient) return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const uniqueReceivers = new Set<string>();

        // Find when the token was deployed to limit scan range
        const tokenDeployBlock = await findContractDeploymentBlock(publicClient, tokenAddress);
        if (cancelled) return;

        // Fetch Transfer events in chunks from the token's deployment block
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
            return false; // continue scanning all chunks
          }
        );

        if (cancelled) return;

        // Check which addresses still have a balance > 0
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
              })
            )
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

  return (
    <Card className="border-2 border-[#1A1A2E] shadow-[3px_3px_0_rgba(26,26,46,1)] p-0 gap-0">
      <CardHeader className="border-b-2 border-[#1A1A2E] bg-[#64FE3E] p-4">
        <CardTitle className="font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
          <Users className="w-4 h-4" />
          Holders
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ) : (
          <div>
            <p className="text-3xl font-black">{holderCount ?? "?"}</p>
            <p className="text-xs text-gray-500 mt-1">
              Addresses with non-zero balance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Related presales section ────────────────────────────────────────────────
function RelatedPresales({ tokenAddress }: { tokenAddress: Address }) {
  const { presales, isLoading } = useLaunchpadPresales("all", false);

  const relatedPresales = useMemo(() => {
    if (!presales || presales.length === 0) return [];
    const addr = tokenAddress.toLowerCase();
    return presales.filter(
      (p) => p.saleToken?.toLowerCase() === addr
    );
  }, [presales, tokenAddress]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-[#64FE3E]";
      case "upcoming":
        return "bg-[#64FE3E]";
      case "finalized":
        return "bg-[#0F59FF]";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getProgress = (presale: (typeof presales)[0]) => {
    if (!presale.hardCap || presale.hardCap === 0n) return 0;
    return Math.round(Number((presale.totalRaised * 100n) / presale.hardCap));
  };

  return (
    <Card className="border-2 border-[#1A1A2E] shadow-[3px_3px_0_rgba(26,26,46,1)] p-0 gap-0">
      <CardHeader className="border-b-2 border-[#1A1A2E] bg-[#0F59FF] p-4">
        <CardTitle className="font-bold uppercase tracking-wider flex items-center gap-2 text-white text-sm">
          <FileText className="w-4 h-4" />
          Presales ({relatedPresales.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        ) : relatedPresales.length > 0 ? (
          <div className="space-y-3">
            {relatedPresales.map((presale) => {
              const progress = getProgress(presale);
              return (
                <div
                  key={presale.address}
                  className="p-3 border-2 border-[#1A1A2E] bg-white"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-sm uppercase truncate">
                        {presale.saleTokenSymbol || "Token"} Presale
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase text-white ${getStatusColor(presale.status)}`}
                      >
                        {presale.status}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      asChild
                      className="border-2 border-[#1A1A2E] bg-[#64FE3E] text-black font-bold text-xs uppercase flex-shrink-0"
                    >
                      <Link to={`/dashboard/presales/manage/${presale.address}`}>
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
                            Number(formatUnits(presale.totalRaised, 18))
                          ).toLocaleString()}{" "}
                          /{" "}
                          {Math.round(
                            Number(formatUnits(presale.hardCap, 18))
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
            <p className="text-xs text-gray-500 mt-1">
              Create a presale to raise funds for this token.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Related locks section ───────────────────────────────────────────────────
function RelatedLocks({ tokenAddress }: { tokenAddress: Address }) {
  const { locks, isLoading } = useAllLocks();

  const relatedLocks = useMemo(() => {
    if (!locks || locks.length === 0) return [];
    const addr = tokenAddress.toLowerCase();
    return locks.filter((l) => l.token?.toLowerCase() === addr);
  }, [locks, tokenAddress]);

  return (
    <Card className="border-2 border-[#1A1A2E] shadow-[3px_3px_0_rgba(26,26,46,1)] p-0 gap-0">
      <CardHeader className="border-b-2 border-[#1A1A2E] bg-[#0F59FF] p-4">
        <CardTitle className="font-bold uppercase tracking-wider flex items-center gap-2 text-white text-sm">
          <Lock className="w-4 h-4" />
          Token Locks ({relatedLocks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        ) : relatedLocks.length > 0 ? (
          <div className="space-y-3">
            {relatedLocks.slice(0, 5).map((lock) => {
              const lockIdStr = String(lock.id ?? "0");
              const isExpired = lock.unlockDate
                ? Date.now() >= Number(lock.unlockDate) * 1000
                : false;
              return (
                <div
                  key={lockIdStr}
                  className="p-3 border-2 border-[#1A1A2E] bg-white"
                >
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
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase ${
                          lock.withdrawn
                            ? "bg-gray-400 text-white"
                            : isExpired
                              ? "bg-[#64FE3E] text-black"
                              : "bg-[#64FE3E] text-black"
                        }`}
                      >
                        {lock.withdrawn
                          ? "Withdrawn"
                          : isExpired
                            ? "Unlockable"
                            : "Locked"}
                      </span>
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
            <p className="text-xs text-gray-500 mt-1">
              Lock tokens to build trust and show commitment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page component ─────────────────────────────────────────────────────
export default function TokenDetailPage() {
  const { address } = useParams<{ address: string }>();
  const { address: _userAddress } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  const explorerUrl = config.chains.find((c) => c.id === chainId)?.blockExplorers?.default.url;

  const tokenAddress = address as Address | undefined;

  if (!tokenAddress) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)] max-w-2xl mx-auto">
          <CardContent className="p-12 text-center space-y-4">
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
            <p className="text-xl font-black">Invalid Token Address</p>
            <Link to="/dashboard/user">
              <Button className="border-4 border-[#1A1A2E] bg-[#0F59FF] text-white font-black uppercase tracking-wider shadow-[3px_3px_0_rgba(26,26,46,1)]">
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
      {/* Back Link */}
      <Link
        to="/dashboard/user"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-[#1A1A2E] mb-4 font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="border-b-3 border-[#1A1A2E] bg-[#64FE3E] p-4 shadow-[4px_4px_0_rgba(26,26,46,1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold uppercase tracking-wider">Token Details</h1>
              <p className="font-mono text-xs text-gray-600 break-all mt-1">{tokenAddress}</p>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {explorerUrl && (
                <a
                  href={`${explorerUrl}/address/${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-[#1A1A2E] font-bold text-xs uppercase shadow-[2px_2px_0_rgba(26,26,46,1)]"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> Explorer
                  </Button>
                </a>
              )}
              <Button
                size="sm"
                asChild
                variant="outline"
                className="border-2 border-[#1A1A2E] font-bold text-xs uppercase shadow-[2px_2px_0_rgba(26,26,46,1)]"
              >
                <Link to={`/dashboard/tools/token-locker?token=${tokenAddress}`}>
                  <Lock className="w-3 h-3 mr-1" /> Lock
                </Link>
              </Button>
              <Button
                size="sm"
                asChild
                variant="outline"
                className="border-2 border-[#1A1A2E] font-bold text-xs uppercase shadow-[2px_2px_0_rgba(26,26,46,1)]"
              >
                <Link to={`/dashboard/tools/airdrop?token=${tokenAddress}`}>
                  <Send className="w-3 h-3 mr-1" /> Airdrop
                </Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="border-2 border-[#1A1A2E] bg-[#0F59FF] text-white font-bold text-xs uppercase shadow-[2px_2px_0_rgba(26,26,46,1)]"
              >
                <Link to={`/dashboard/create/presale?token=${tokenAddress}`}>
                  <FileText className="w-3 h-3 mr-1" /> Presale
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Top row: Overview + Creation + Holders */}
      <div className="grid gap-4 mb-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TokenOverview tokenAddress={tokenAddress} />
        </div>
        <div className="lg:col-span-1">
          <TokenCreationInfo tokenAddress={tokenAddress} />
        </div>
        <div className="lg:col-span-1">
          <TokenHolders tokenAddress={tokenAddress} />
        </div>
      </div>

      {/* Bottom row: Presales + Locks */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <RelatedPresales tokenAddress={tokenAddress} />
        <RelatedLocks tokenAddress={tokenAddress} />
      </div>
    </div>
  );
}