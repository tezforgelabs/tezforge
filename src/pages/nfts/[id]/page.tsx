import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LaunchpadNFTContract } from "@/config";
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatEther } from "viem";
import {
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

export default function NFTDetailPage() {
  const { id: nftAddress } = useParams<{ id: `0x${string}` }>();

  const nftContract = {
    address: nftAddress as `0x${string}`,
    abi: LaunchpadNFTContract.abi,
  } as const;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...nftContract, functionName: "name" },
      { ...nftContract, functionName: "symbol" },
      { ...nftContract, functionName: "maxSupply" },
      { ...nftContract, functionName: "totalMinted" },
      { ...nftContract, functionName: "mintPrice" },
    ],
  });

  const [name, symbol, maxSupply, totalMinted, mintPrice] = data || [];

  const [mintAmount, setMintAmount] = useState("1");
  const parsedAmount = useMemo(() => BigInt(mintAmount), [mintAmount]);

  const { data: mintHash, writeContract: mint } = useWriteContract();

  const handleMint = () => {
    mint({
      ...nftContract,
      functionName: "mint",
      args: [parsedAmount],
      value: ((mintPrice?.result as bigint) ?? BigInt(0)) * parsedAmount,
    });
  };

  const { isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  useEffect(() => {
    if (isMintSuccess) {
      toast.success("Mint successful!");
      refetch();
    }
  }, [isMintSuccess, refetch]);

  if (isLoading || !data) {
    return (
      <div className="text-center py-20 text-[#1A1A2E]">
        Loading collection...
      </div>
    );
  }

  const progress = maxSupply?.result
    ? (Number(totalMinted?.result as bigint) /
        Number(maxSupply.result as bigint)) *
      100
    : 0;

  return (
    <div className="container mx-auto px-4 py-12 text-[#1A1A2E]">
      <section className="mb-12 text-right lg:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2">
          {name?.result as string}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600">
          Mint your {symbol?.result as string} now!
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)]">
            <CardHeader className="border-b-2 border-[#1A1A2E] bg-white">
              <CardTitle className="font-black uppercase tracking-wider">
                Mint
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Input
                  type="number"
                  placeholder="Amount"
                  className="flex-grow border-2 border-[#1A1A2E]"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                />
                <Button
                  onClick={handleMint}
                  className="w-full sm:w-auto border-4 border-[#1A1A2E] bg-[#0F59FF] text-white font-black uppercase tracking-wider shadow-[3px_3px_0_rgba(26,26,46,1)] hover:bg-[#0F59FF]"
                >
                  Mint
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)]">
            <CardHeader className="border-b-2 border-[#1A1A2E] bg-white">
              <CardTitle className="font-black uppercase tracking-wider">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex justify-between">
                <span className="font-bold">Max Supply</span>
                <span className="font-black">
                  {maxSupply?.result?.toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Total Minted</span>
                <span className="font-black">
                  {totalMinted?.result?.toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Price</span>
                <span className="font-black">
                  {formatEther((mintPrice?.result as bigint) ?? BigInt(0))} XTZ
                </span>
              </div>
              <div className="w-full bg-gray-200 border-2 border-[#1A1A2E] h-4 mt-4">
                <div
                  className="bg-[#0F59FF] h-full transition-[width]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
