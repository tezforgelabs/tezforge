import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenFactory } from "@/config";
import { useChainContracts } from "@/lib/hooks/useChainContracts";
import { getFriendlyTxErrorMessage } from "@/lib/utils/tx-errors";
import { buildBetaTokenParams } from "@/lib/utils/beta-token";
import { CheckCircle2, Coins, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { decodeEventLog } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { useChainId, useConfig } from "wagmi";

export default function CreateTokenPage() {
  const { address } = useAccount();
  const { tokenFactory } = useChainContracts();
  const {
    data: hash,
    writeContract,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const chainId = useChainId();
  const config = useConfig();

  const explorerUrl = config.chains.find((chain) => chain.id === chainId)
    ?.blockExplorers?.default.url;

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [initialSupply, setInitialSupply] = useState("1000000");
  const [initialRecipientInput, setInitialRecipientInput] = useState<string | null>(null);
  const initialRecipient = initialRecipientInput ?? address ?? "";

  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(
    null,
  );
  const processedHash = useRef<string | null>(null);

  const handleCreateToken = async () => {
    setCreatedTokenAddress(null);
    processedHash.current = null;

    let tokenParams: ReturnType<typeof buildBetaTokenParams>;
    try {
      tokenParams = buildBetaTokenParams({
        name,
        symbol,
        initialSupply,
        initialRecipient,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid token details.");
      return;
    }

    writeContract({
      address: tokenFactory,
      abi: TokenFactory.abi,
      functionName: "createPlainToken",
      args: [tokenParams],
    });
  };

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: createTokenReceipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (error) {
      toast.error(getFriendlyTxErrorMessage(error, "Token creation"));
      reset();
    }
  }, [error, reset]);

  useEffect(() => {
    if (isConfirmed && createTokenReceipt && processedHash.current !== hash) {
      processedHash.current = hash ?? null;

      const event = createTokenReceipt.logs
        .map((log) => {
          try {
            return decodeEventLog({
              abi: TokenFactory.abi,
              data: log.data,
              topics: log.topics,
            });
          } catch {
            return null;
          }
        })
        .find((decoded) => decoded?.eventName === "TokenCreated");

      if (event) {
        const tokenAddress = (event.args as unknown as { token: `0x${string}` })
          .token;
        // The confirmed transaction is an external event that updates the form.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCreatedTokenAddress(tokenAddress);
        toast.success("Token created successfully!");
        setName("");
        setSymbol("");
        setInitialSupply("1000000");
        reset();
      } else {
        toast.error("Could not find TokenCreated event in transaction logs.");
      }
    }
  }, [isConfirmed, createTokenReceipt, hash, reset]);

  return (
    <div className="container mx-auto px-4 py-8 text-[#1A1A2E]">
      {/* Header */}
      <div className="mb-8">
        <div className="border-2 border-[#1A1A2E] bg-[#0F59FF] p-6 shadow-[0px_0px_0_rgba(26,26,46,1)]">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider flex items-center gap-3 text-white">
            <Coins className="w-8 h-8" /> Create Token
          </h1>
          <p className="text-sm text-white/80 mt-2">
            Deploy an ERC-20 token.
          </p>
        </div>
      </div>

      {/* Success Message */}
      {createdTokenAddress && (
        <Card className="max-w-2xl mx-auto mb-8 border-2 border-[#1A1A2E] shadow-[2px_2px_0_rgba(26,26,46,1)] p-0 gap-0">
          <CardHeader className="border-b-2 border-[#1A1A2E] bg-[#64FE3E] p-6">
            <CardTitle className="font-bold uppercase tracking-wider flex items-center gap-2 text-white">
              <CheckCircle2 className="w-5 h-5" />
              Token Created Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                Token Address
              </p>
              <code className="block bg-gray-100 p-3 border-2 border-[#1A1A2E] font-mono text-sm break-all">
                {createdTokenAddress}
              </code>
            </div>
            <p className="text-sm text-gray-600">
              Source verification is unavailable. Blockscout will show this contract as unverified.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`${explorerUrl}/address/${createdTokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full border-2 border-[#1A1A2E] bg-white text-[#1A1A2E] font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(26,26,46,1)] hover:bg-gray-100">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </a>
              <Link
                to={`/dashboard/create/presale?token=${createdTokenAddress}`}
                className="flex-1"
              >
                <Button className="w-full border-2 border-[#1A1A2E] bg-[#64FE3E] text-black font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(26,26,46,1)] hover:bg-[#E0B800]">
                  Create Presale
                </Button>
              </Link>
            </div>
            <Button
              onClick={() => setCreatedTokenAddress(null)}
              variant="outline"
              className="w-full border-2 border-[#1A1A2E]"
            >
              Create Another Token
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Token Form */}
      {!createdTokenAddress && (
        <Card className="max-w-2xl mx-auto border-2 border-[#1A1A2E] shadow-[2px_2px_0_rgba(26,26,46,1)] p-0 gap-0">
          <CardHeader className="border-b-2 border-[#1A1A2E] bg-white p-6">
            <CardTitle className="font-bold uppercase tracking-wider">
              Token Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-sm text-gray-600">
              Standard ERC-20 · 18 decimals
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold uppercase text-xs">
                  Token Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. My Token"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-2 border-[#1A1A2E]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol" className="font-bold uppercase text-xs">
                  Symbol
                </Label>
                <Input
                  id="symbol"
                  placeholder="e.g. MTK"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="border-2 border-[#1A1A2E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="decimals"
                  className="font-bold uppercase text-xs"
                >
                  Decimals
                </Label>
                <Input
                  id="decimals"
                  type="number"
                  value="18"
                  readOnly
                  className="border-2 border-[#1A1A2E]"
                />
                <p className="text-xs text-gray-600">
                  Fixed at 18 decimals for presales.
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="initial-supply"
                  className="font-bold uppercase text-xs"
                >
                  Initial Supply
                </Label>
                <Input
                  id="initial-supply"
                  type="number"
                  placeholder="1000000"
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(e.target.value)}
                  className="border-2 border-[#1A1A2E]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="initial-recipient"
                className="font-bold uppercase text-xs"
              >
                Initial Recipient
              </Label>
              <Input
                id="initial-recipient"
                placeholder="e.g. 0x..."
                value={initialRecipient}
                onChange={(e) => setInitialRecipientInput(e.target.value)}
                className="border-2 border-[#1A1A2E] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Defaults to your connected wallet address.
              </p>
            </div>

            <Button
              onClick={handleCreateToken}
              disabled={isPending || isConfirming || !name || !symbol}
              className="w-full border-2 border-[#1A1A2E] bg-[#0F59FF] text-white font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(26,26,46,1)] hover:bg-[#0F59FF] hover:shadow-[6px_6px_0_rgba(26,26,46,1)] transition-[transform,shadow,opacity,colors]"
            >
              {isPending
                ? "Confirm in Wallet..."
                : isConfirming
                  ? "Creating Token..."
                  : "Create Token"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
