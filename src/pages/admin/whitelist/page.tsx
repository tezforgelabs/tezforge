import { AdminRoute } from "@/components/admin/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReadContract } from "wagmi";
import { useSetWhitelistedCreator } from "@/lib/hooks/useAdminActions";
import { PresaleFactory } from "@/config";
import { useChainContracts } from "@/lib/hooks/useChainContracts";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { isAddress, type Address } from "viem";
import { ArrowLeft, Check, X } from "lucide-react";
import { getFriendlyTxErrorMessage } from "@/lib/utils/tx-errors";

const inputClasses = "border-2 border-tezforge-ink font-mono text-xs";
const buttonBase =
  "border-2 border-tezforge-ink text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_rgba(26,26,46,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(26,26,46,1)] motion-reduce:transform-none";

function WhitelistChecker() {
  const [checkAddress, setCheckAddress] = useState("");
  const [addressToCheck, setAddressToCheck] = useState<Address | null>(null);
  const { presaleFactory } = useChainContracts();

  const {
    setWhitelistedCreator: setCreator,
    isBusy: isSettingBusy,
    isSuccess: isSetSuccess,
    isError: isSetError,
    error: setError,
    reset: resetSet,
  } = useSetWhitelistedCreator();

  const {
    data: isWhitelisted,
    isLoading,
    refetch,
  } = useReadContract({
    address: presaleFactory,
    abi: PresaleFactory.abi,
    functionName: "isWhitelistedCreator",
    args: addressToCheck ? [addressToCheck] : undefined,
    query: {
      enabled: Boolean(addressToCheck),
    },
  });

  const handleCheck = () => {
    if (!checkAddress || !isAddress(checkAddress)) {
      toast.error("Please enter a valid address");
      return;
    }
    setAddressToCheck(checkAddress as Address);
  };

  useEffect(() => {
    if (addressToCheck) {
      refetch();
    }
  }, [addressToCheck, refetch]);

  useEffect(() => {
    if (isSetSuccess) {
      const timer = window.setTimeout(() => {
        toast.success("Whitelist updated");
        resetSet();
        void refetch();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isSetSuccess, resetSet, refetch]);

  useEffect(() => {
    if (isSetError && setError) {
      toast.error(getFriendlyTxErrorMessage(setError, "Whitelist update"));
      resetSet();
    }
  }, [isSetError, setError, resetSet]);



  return (
    <section
      aria-labelledby="check-heading"
      className="border-2 border-tezforge-ink bg-white shadow-[3px_3px_0_0_rgba(26,26,46,1)]"
    >
      <div className="border-b-2 border-tezforge-ink px-4 py-3 sm:px-5">
        <h2
          id="check-heading"
          className="text-base font-black uppercase tracking-wider"
        >
          Check &amp; Manage Creator
        </h2>
      </div>
      <div className="p-4 sm:p-5">
        <Label
          htmlFor="wl-check"
          className="text-[11px] font-black uppercase tracking-wider text-tezforge-ink/70"
        >
          Creator address
        </Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="wl-check"
            placeholder="0x…"
            value={checkAddress}
            onChange={(e) => setCheckAddress(e.target.value)}
            className={inputClasses}
          />
          <Button
            onClick={handleCheck}
            disabled={!checkAddress}
            className={`shrink-0 bg-white text-tezforge-ink ${buttonBase}`}
          >
            Check
          </Button>
        </div>

        {addressToCheck && (
          <div
            role="status"
            aria-atomic="true"
            className="mt-4 border-2 border-tezforge-ink bg-tezforge-cream p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {isLoading ? (
                  <span
                    aria-hidden="true"
                    className="size-6 animate-pulse bg-tezforge-cream-dark"
                  />
                ) : isWhitelisted ? (
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center border-2 border-tezforge-ink bg-tezforge-green"
                  >
                    <Check className="size-4" />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center border-2 border-tezforge-ink bg-tezforge-red text-white"
                  >
                    <X className="size-4" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-wider">
                    {isLoading
                      ? "Checking…"
                      : isWhitelisted
                        ? "Whitelisted"
                        : "Not whitelisted"}
                  </p>
                  <p
                    className="truncate font-mono text-xs text-tezforge-ink/60"
                    title={addressToCheck}
                  >
                    {addressToCheck}
                  </p>
                </div>
              </div>
              {!isLoading &&
                (isWhitelisted ? (
                  <Button
                    onClick={() => setCreator(addressToCheck as Address, false)}
                    disabled={isSettingBusy}
                    className={`shrink-0 bg-tezforge-cream-dark text-tezforge-ink ${buttonBase}`}
                  >
                    {isSettingBusy ? "Updating…" : "Remove"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCreator(addressToCheck as Address, true)}
                    disabled={isSettingBusy}
                    className={`shrink-0 bg-tezforge-green text-tezforge-ink ${buttonBase}`}
                  >
                    {isSettingBusy ? "Updating…" : "Whitelist"}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AdminWhitelistContent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 text-tezforge-ink sm:py-12">
      <header className="mb-8">
        <Link
          to="/admin"
          className="mb-4 inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-tezforge-ink/60 transition-colors hover:text-tezforge-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tezforge-blue"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Admin
        </Link>
        <div className="mb-3">
          <span className="inline-block border-2 border-tezforge-ink bg-tezforge-green px-3 py-1 text-xs font-black uppercase tracking-widest">
            Admin
          </span>
        </div>
        <h1 className="text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
          Whitelist Creators
        </h1>
        <p className="mt-3 text-sm font-medium text-tezforge-ink/70 sm:text-base">
          Manage which addresses can create presales directly.
        </p>
      </header>

      <WhitelistChecker />

      <footer className="mt-6 border-2 border-dashed border-tezforge-ink bg-white/50 px-4 py-3 text-xs text-tezforge-ink/70">
        <p className="font-black uppercase tracking-wider text-tezforge-ink/80">
          How whitelisting works
        </p>
        <p className="mt-1">
          Whitelisted addresses skip the project proposal and create presales
          directly. Status is stored on-chain in the PresaleFactory contract;
          only the factory owner can change it.
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          <span className="flex items-center gap-1.5">
            <span className="border-2 border-tezforge-ink bg-tezforge-green px-1.5 py-0.5 text-[10px] font-black uppercase">
              Whitelisted
            </span>
            can create presales directly
          </span>
          <span className="flex items-center gap-1.5">
            <span className="border-2 border-tezforge-ink bg-tezforge-cream-dark px-1.5 py-0.5 text-[10px] font-black uppercase">
              Not whitelisted
            </span>
            must submit project first
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function AdminWhitelist() {
  return (
    <AdminRoute>
      <AdminWhitelistContent />
    </AdminRoute>
  );
}
