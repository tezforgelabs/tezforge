import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NFTFactory } from "@/config";
import { useChainContracts } from "@/lib/hooks/useChainContracts";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { parseEther } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { getFriendlyTxErrorMessage } from "@/lib/utils/tx-errors";
import {
  isPinataConfigured,
  uploadImage,
  uploadMetadata,
} from "@/lib/utils/ipfs";
import {
  ImageIcon,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

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

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (address) {
      setPayoutWallet(address);
    }
  }, [address]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Please upload a valid image file (JPEG, PNG, GIF, SVG, WEBP)",
      );
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadError(null);
    setImageUploaded(false);
    setBaseURI("");
  };

  const handleUploadToIPFS = async () => {
    if (!imageFile) {
      toast.error("Select an image first");
      return;
    }

    if (!isPinataConfigured()) {
      toast.error(
        "Pinata is not configured. Set VITE_PINATA_JWT in your .env file.",
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Step 1: Upload image to IPFS
      toast.loading("Uploading image to IPFS...");
      const imageResult = await uploadImage(imageFile, (percent) => {
        setUploadProgress(percent);
      });
      toast.dismiss();
      toast.success("Image uploaded to IPFS!");

      // Step 2: Create and upload metadata JSON
      toast.loading("Creating metadata...");
      const metadata = {
        name: name || "Unnamed Collection",
        description: `NFT Collection: ${name || "Unnamed"}`,
        image: imageResult.gatewayUrl,
      };

      const metadataResult = await uploadMetadata(metadata);
      toast.dismiss();

      // Step 3: Auto-fill baseURI with the metadata CID
      setBaseURI(`ipfs://${metadataResult.ipfsHash}`);
      setImageUploaded(true);
      toast.success("Metadata created! Base URI is set.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

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
    };

    const isETH =
      paymentToken.trim() === "" ||
      paymentToken.trim() === "0x0000000000000000000000000000000000000000";

    const functionName = isETH ? "createETHNFT" : "createUSDCNFT";
    const args: unknown[] = isETH
      ? [params]
      : [params, paymentToken as `0x${string}`];

    writeContract({
      address: nftFactory,
      abi: NFTFactory.abi,
      functionName,
      args: args as never,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("NFT Collection created successfully!");
    }
    if (error) {
      toast.error(getFriendlyTxErrorMessage(error, "NFT creation"));
    }
  }, [isConfirmed, error]);

  return (
    <div className="container mx-auto px-4 py-8 text-[#1A1A2E]">
      {/* Header */}
      <div className="mb-8">
        <div className="border-2 border-[#1A1A2E] bg-[#0F59FF] p-6 shadow-[0px_0px_0_rgba(26,26,46,1)]">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider flex items-center gap-3 text-white">
            <ImageIcon className="w-8 h-8" /> Create NFT Collection
          </h1>
          <p className="text-sm text-white/80 mt-2">
            Deploy an NFT collection on Tezos X.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto border-2 border-[#1A1A2E] shadow-[2px_2px_0_rgba(26,26,46,1)] p-0 gap-0">
        <CardHeader className="border-b-2 border-[#1A1A2E] bg-white p-6">
          <CardTitle className="font-bold uppercase tracking-wider">
            Collection Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium uppercase text-xs">
                Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. My NFT"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-2 border-[#1A1A2E]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol" className="font-medium uppercase text-xs">
                Symbol
              </Label>
              <Input
                id="symbol"
                placeholder="e.g. MNFT"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="border-2 border-[#1A1A2E]"
              />
            </div>
          </div>
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="font-medium uppercase text-xs">
              Collection Image
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed border-[#1A1A2E] p-6 text-center cursor-pointer transition-colors hover:bg-gray-50 ${
                imagePreview ? "bg-gray-50" : ""
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto max-h-48 max-w-full object-contain rounded"
                  />
                  <p className="text-xs text-gray-500">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto w-8 h-8 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-gray-400">
                    JPEG, PNG, GIF, SVG, WEBP (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Upload button */}
            {imageFile && !imageUploaded && !isUploading && (
              <Button
                type="button"
                onClick={handleUploadToIPFS}
                className="w-full border-2 border-[#1A1A2E] bg-[#0F59FF] text-white font-medium uppercase tracking-wider shadow-[2px_2px_0_rgba(26,26,46,1)] hover:bg-[#0F59FF]/90 hover:shadow-[3px_3px_0_rgba(26,26,46,1)] transition-[transform,shadow,opacity,colors]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload to IPFS
              </Button>
            )}

            {/* Upload progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading... {uploadProgress}%
                </div>
                <div className="w-full h-2 bg-gray-200 border border-[#1A1A2E]">
                  <div
                    className="h-full bg-[#0F59FF] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload success */}
            {imageUploaded && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-500 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Image uploaded to IPFS
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-500 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {uploadError}
              </div>
            )}
          </div>

          {imageUploaded && (
            <div className="space-y-2">
              <Label className="font-medium uppercase text-xs">
                Base URI (auto-populated)
              </Label>
              <div className="border-2 border-[#1A1A2E] bg-gray-50 px-3 py-2.5 font-mono text-sm truncate">
                {baseURI}
              </div>
              <p className="text-xs text-green-600">
                ✓ Auto-populated from your uploaded image
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="max-supply"
                className="font-medium uppercase text-xs"
              >
                Max Supply
              </Label>
              <Input
                id="max-supply"
                type="number"
                placeholder="10000"
                value={maxSupply}
                onChange={(e) => setMaxSupply(e.target.value)}
                className="border-2 border-[#1A1A2E]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="font-medium uppercase text-xs">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="0.05"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="border-2 border-[#1A1A2E]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="payment-token"
              className="font-medium uppercase text-xs"
            >
              Payment Token Address
            </Label>
            <Input
              id="payment-token"
              placeholder="0x... (or leave empty for XTZ)"
              value={paymentToken}
              onChange={(e) => setPaymentToken(e.target.value)}
              className="border-2 border-[#1A1A2E] font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="sale-start"
                className="font-medium uppercase text-xs"
              >
                Sale Start
              </Label>
              <Input
                id="sale-start"
                type="datetime-local"
                value={saleStart}
                onChange={(e) => setSaleStart(e.target.value)}
                className="border-2 border-[#1A1A2E]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="sale-end"
                className="font-medium uppercase text-xs"
              >
                Sale End
              </Label>
              <Input
                id="sale-end"
                type="datetime-local"
                value={saleEnd}
                onChange={(e) => setSaleEnd(e.target.value)}
                className="border-2 border-[#1A1A2E]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="wallet-limit"
              className="font-medium uppercase text-xs"
            >
              Wallet Limit
            </Label>
            <Input
              id="wallet-limit"
              type="number"
              placeholder="10"
              value={walletLimit}
              onChange={(e) => setWalletLimit(e.target.value)}
              className="border-2 border-[#1A1A2E]"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="payout-wallet"
              className="font-medium uppercase text-xs"
            >
              Payout Wallet
            </Label>
            <Input
              id="payout-wallet"
              placeholder="0x..."
              value={payoutWallet}
              onChange={(e) => setPayoutWallet(e.target.value)}
              className="border-2 border-[#1A1A2E] font-mono"
            />
          </div>

          <Button
            onClick={handleCreateNFT}
            disabled={isPending || isConfirming}
            className="w-full border-2 border-[#1A1A2E] bg-[#0F59FF] text-white font-medium uppercase tracking-wider shadow-[2px_2px_0_rgba(26,26,46,1)] hover:bg-[#0F59FF] hover:shadow-[3px_3px_0_rgba(26,26,46,1)] transition-[transform,shadow,opacity,colors] py-6"
          >
            {isPending || isConfirming
              ? "Creating Collection..."
              : "Create Collection"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
