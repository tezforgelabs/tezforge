import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NFTFactoryContract } from "@/config";
import { useChainContracts } from "@/lib/hooks/useChainContracts";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getFriendlyTxErrorMessage } from "@/lib/utils/tx-errors";
import { ImageIcon } from "lucide-react";

export default function CreateNftPage() {
    const { address } = useAccount();
    const { nftFactory } = useChainContracts();
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [baseURI, setBaseURI] = useState("");
    const [maxSupply, setMaxSupply] = useState("");
    const [payoutWallet, setPayoutWallet] = useState(address ?? "");
    const [saleStart, setSaleStart] = useState("");
    const [saleEnd, setSaleEnd] = useState("");
    const [walletLimit, setWalletLimit] = useState("");
    const [price, setPrice] = useState("");
    const [paymentToken, setPaymentToken] = useState("");

    useEffect(() => {
        if (address) {
            setPayoutWallet(address);
        }
    }, [address])

    const handleCreateNFT = () => {
        const mintConfig = {
            saleStart: BigInt(new Date(saleStart).getTime() / 1000),
            saleEnd: BigInt(new Date(saleEnd).getTime() / 1000),
            walletLimit: parseInt(walletLimit),
            price: parseEther(price),
        };

        const params = {
            name,
            symbol,
            baseURI,
            maxSupply: BigInt(maxSupply),
            payoutWallet: payoutWallet as `0x${string}`,
            mintConfig,
        }

        const isETH = paymentToken.trim() === "" || paymentToken.trim() === "0x0000000000000000000000000000000000000000";

        const functionName = isETH ? "createETHNFT" : "createUSDCNFT";
        const args: unknown[] = isETH ? [params] : [params, paymentToken as `0x${string}`];

        writeContract({
            address: nftFactory,
            abi: NFTFactoryContract.abi,
            functionName,
            args: args as never
        });
    };

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isConfirmed) {
            toast.success("NFT Collection created successfully!");
        }
        if (error) {
            toast.error(getFriendlyTxErrorMessage(error, "NFT creation"));
        }
    }, [isConfirmed, error])

    return (
        <div className="container mx-auto px-4 py-8 text-[#1A1A2E]">
            {/* Header */}
            <div className="mb-8">
                <div className="border-4 border-[#1A1A2E] bg-[#0F59FF] p-6 shadow-[4px_4px_0_rgba(26,26,46,1)]">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider flex items-center gap-3 text-white">
                        <ImageIcon className="w-8 h-8" /> Create NFT Collection
                    </h1>
                    <p className="text-sm text-white/80 mt-2">
                        Deploy an ERC-721 or ERC-721A NFT collection on Etherlink.
                    </p>
                </div>
            </div>

            <Card className="max-w-2xl mx-auto border-4 border-[#1A1A2E] shadow-[4px_4px_0_rgba(26,26,46,1)] p-0 gap-0">
                <CardHeader className="border-b-2 border-[#1A1A2E] bg-white p-6">
                    <CardTitle className="font-black uppercase tracking-wider">Collection Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-bold uppercase text-xs">Name</Label>
                            <Input id="name" placeholder="e.g. My NFT" value={name} onChange={e => setName(e.target.value)} className="border-2 border-[#1A1A2E]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="symbol" className="font-bold uppercase text-xs">Symbol</Label>
                            <Input id="symbol" placeholder="e.g. MNFT" value={symbol} onChange={e => setSymbol(e.target.value)} className="border-2 border-[#1A1A2E]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="base-uri" className="font-bold uppercase text-xs">Base URI</Label>
                        <Input id="base-uri" placeholder="ipfs://..." value={baseURI} onChange={e => setBaseURI(e.target.value)} className="border-2 border-[#1A1A2E]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="max-supply" className="font-bold uppercase text-xs">Max Supply</Label>
                            <Input id="max-supply" type="number" placeholder="10000" value={maxSupply} onChange={e => setMaxSupply(e.target.value)} className="border-2 border-[#1A1A2E]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price" className="font-bold uppercase text-xs">Price</Label>
                            <Input id="price" type="number" placeholder="0.05" value={price} onChange={e => setPrice(e.target.value)} className="border-2 border-[#1A1A2E]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payment-token" className="font-bold uppercase text-xs">Payment Token Address</Label>
                        <Input id="payment-token" placeholder="0x... (or leave empty for XTZ)" value={paymentToken} onChange={e => setPaymentToken(e.target.value)} className="border-2 border-[#1A1A2E] font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sale-start" className="font-bold uppercase text-xs">Sale Start</Label>
                            <Input id="sale-start" type="datetime-local" value={saleStart} onChange={e => setSaleStart(e.target.value)} className="border-2 border-[#1A1A2E]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sale-end" className="font-bold uppercase text-xs">Sale End</Label>
                            <Input id="sale-end" type="datetime-local" value={saleEnd} onChange={e => setSaleEnd(e.target.value)} className="border-2 border-[#1A1A2E]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wallet-limit" className="font-bold uppercase text-xs">Wallet Limit</Label>
                        <Input id="wallet-limit" type="number" placeholder="10" value={walletLimit} onChange={e => setWalletLimit(e.target.value)} className="border-2 border-[#1A1A2E]" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payout-wallet" className="font-bold uppercase text-xs">Payout Wallet</Label>
                        <Input id="payout-wallet" placeholder="0x..." value={payoutWallet} onChange={e => setPayoutWallet(e.target.value)} className="border-2 border-[#1A1A2E] font-mono" />
                    </div>

                    <Button onClick={handleCreateNFT} disabled={isPending || isConfirming} className="w-full border-4 border-[#1A1A2E] bg-[#0F59FF] text-white font-black uppercase tracking-wider shadow-[4px_4px_0_rgba(26,26,46,1)] hover:bg-[#0F59FF] hover:shadow-[6px_6px_0_rgba(26,26,46,1)] transition-[transform,shadow,opacity,colors] py-6">
                        {isPending || isConfirming ? "Creating Collection..." : "Create Collection"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}