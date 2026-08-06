import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TokenFactory } from "@/config";
import { useChainContracts } from "@/lib/hooks/useChainContracts";
import { getFriendlyTxErrorMessage } from "@/lib/utils/tx-errors";
import { CheckCircle2, Coins, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { decodeEventLog, parseUnits } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { useChainId, useConfig } from "wagmi";
import { useTokenVerification } from "@/lib/hooks/useTokenVerification";

const TokenType = {
  Plain: 0,
  Mintable: 1,
  Burnable: 2,
  Taxable: 3,
  NonMintable: 4,
} as const;

type TokenType = (typeof TokenType)[keyof typeof TokenType];

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

  const [tokenType, setTokenType] = useState<TokenType>(TokenType.Plain);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("18");
  const [initialSupply, setInitialSupply] = useState("1000000");
  const [initialRecipient, setInitialRecipient] = useState("");
  const [taxWallet, setTaxWallet] = useState("");
  const [taxBps, setTaxBps] = useState("0");

  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(
    null,
  );
  const { verifyToken } = useTokenVerification();

  const processedHash = useRef<string | null>(null);

  useEffect(() => {
    if (address) {
      setInitialRecipient(address);
    }
  }, [address]);

  const handleCreateToken = async () => {
    setCreatedTokenAddress(null);
    processedHash.current = null;

    const tokenParams = {
      name,
      symbol,
      decimals: parseInt(decimals),
      initialSupply: parseUnits(initialSupply, parseInt(decimals)),
      initialRecipient: initialRecipient as `0x${string}`,
    };

    let functionName:
      | "createPlainToken"
      | "createMintableToken"
      | "createBurnableToken"
      | "createTaxableToken"
      | "createNonMintableToken";
    const args: unknown[] = [tokenParams];

    switch (tokenType) {
      case TokenType.Plain:
        functionName = "createPlainToken";
        break;
      case TokenType.Mintable:
        functionName = "createMintableToken";
        break;
      case TokenType.Burnable:
        functionName = "createBurnableToken";
        break;
      case TokenType.Taxable: {
        functionName = "createTaxableToken";
        const taxParams = {
          taxWallet: taxWallet as `0x${string}`,
          taxBps: parseInt(taxBps),
        };
        args.push(taxParams);
        break;
      }
      case TokenType.NonMintable:
        functionName = "createNonMintableToken";
        break;
      default:
        toast.error("Invalid token type selected");
        return;
    }

    writeContract({
      address: tokenFactory,
      abi: TokenFactory.abi,
      functionName,
      args: args as never,
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
        setCreatedTokenAddress(tokenAddress);
        toast.success("Token created successfully!");
        setName("");
        setSymbol("");
        setDecimals("18");
        setInitialSupply("1000000");
        setTaxWallet("");
        setTaxBps("0");
        reset();

        // Fire-and-forget verification on Blockscout
        verifyToken({
          address: tokenAddress,
          tokenType,
        });
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
            Deploy your own ERC-20 token on Tezos X.
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
                to={`/dashboard/tools/token-locker?token=${createdTokenAddress}`}
                className="flex-1"
              >
                <Button className="w-full border-2 border-[#1A1A2E] bg-[#64FE3E] text-black font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(26,26,46,1)] hover:bg-[#E0B800]">
                  Lock Tokens
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
            <div className="space-y-2">
              <Label
                htmlFor="token-type"
                className="font-semibold uppercase text-xs"
              >
                Token Type
              </Label>
              <Select
                onValueChange={(value) =>
                  setTokenType(parseInt(value) as TokenType)
                }
                defaultValue={TokenType.Plain.toString()}
              >
                <SelectTrigger
                  id="token-type"
                  className="border-2 border-[#1A1A2E]"
                >
                  <SelectValue placeholder="Select token type" />
                </SelectTrigger>
                <SelectContent className="border-2 border-[#1A1A2E]">
                  <SelectItem value={TokenType.Plain.toString()}>
                    Plain
                  </SelectItem>
                  <SelectItem value={TokenType.Mintable.toString()}>
                    Mintable
                  </SelectItem>
                  <SelectItem value={TokenType.Burnable.toString()}>
                    Burnable
                  </SelectItem>
                  <SelectItem value={TokenType.Taxable.toString()}>
                    Taxable
                  </SelectItem>
                  <SelectItem value={TokenType.NonMintable.toString()}>
                    Non-Mintable
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {tokenType === TokenType.Plain &&
                  "A standard ERC-20 token with basic transfer functionality."}
                {tokenType === TokenType.Mintable &&
                  "Allows the owner to mint new tokens after deployment."}
                {tokenType === TokenType.Burnable &&
                  "Allows holders to burn (destroy) their tokens."}
                {tokenType === TokenType.Taxable &&
                  "Applies a tax on transfers, sent to a designated wallet."}
                {tokenType === TokenType.NonMintable &&
                  "Fixed supply token that cannot be minted after creation."}
              </p>
            </div>

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
                  placeholder="18"
                  value={decimals}
                  onChange={(e) => setDecimals(e.target.value)}
                  className="border-2 border-[#1A1A2E]"
                />
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
                onChange={(e) => setInitialRecipient(e.target.value)}
                className="border-2 border-[#1A1A2E] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Defaults to your connected wallet address.
              </p>
            </div>

            {tokenType === TokenType.Taxable && (
              <div className="space-y-4 pt-4 border-t-2 border-[#1A1A2E]">
                <h3 className="font-black uppercase text-sm">
                  Taxable Token Configuration
                </h3>
                <div className="space-y-2">
                  <Label
                    htmlFor="tax-wallet"
                    className="font-bold uppercase text-xs"
                  >
                    Tax Wallet
                  </Label>
                  <Input
                    id="tax-wallet"
                    placeholder="e.g. 0x..."
                    value={taxWallet}
                    onChange={(e) => setTaxWallet(e.target.value)}
                    className="border-2 border-[#1A1A2E] font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="tax-bps"
                    className="font-bold uppercase text-xs"
                  >
                    Tax (in BPS, 1% = 100)
                  </Label>
                  <Input
                    id="tax-bps"
                    type="number"
                    placeholder="100"
                    value={taxBps}
                    onChange={(e) => setTaxBps(e.target.value)}
                    className="border-2 border-[#1A1A2E]"
                  />
                </div>
              </div>
            )}

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
