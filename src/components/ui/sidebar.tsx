import { useIsAdmin } from "@/lib/utils/admin";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  LayoutGrid,
  Menu,
  Plus,
  Shield,
  AlertTriangle,
  WalletMinimal,
  Rocket,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Address } from "viem";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const navItems = [
  { name: "Dashboard", href: "/dashboard/user", icon: LayoutGrid },
  { name: "Launchpad", href: "/projects", icon: Rocket },
];

// Re-usable component for sidebar content
const SidebarContent = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { isAdmin } = useIsAdmin(address as Address | undefined);

  const isConnected = !!address;

  const { data: balanceData } = useBalance({ address });
  const balance = balanceData ? parseFloat(balanceData.formatted) : 0;


  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="p-3 border-b-2 border-tezforge-ink bg-tezforge-ink flex items-center">
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="size-11 flex items-center justify-center">
            <img
              src="https://res.cloudinary.com/dma1c8i6n/image/upload/v1785418522/tezforge_mmgibf.png"
              alt="Tezforge"
              className="w-17 h-17 object-contain"
            />
          </div>
          <span className="flex flex-col text-white font-semibold text-md uppercase tracking-wider">
            <span>Tezforge</span>
            <span className="text-[10px] font-bold normal-case tracking-wide text-tezforge-green">Demo · no real funds</span>
          </span>
        </Link>
      </div>

      {isConnected && (
        <div className="mx-5 mt-6 border-2 border-tezforge-ink bg-tezforge-cream-dark p-4 shadow-[3px_3px_0px_0px_rgba(26,26,46,1)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-medium uppercase text-[#1A1A2E]">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <WalletMinimal size={18} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#1A1A2E] tabular-nums">
              {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
              <span className="text-sm uppercase text-[#1A1A2E]">{"XTZ"}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="min-h-11 w-full border-2 border-tezforge-ink bg-white px-2 py-2 text-xs font-bold uppercase tracking-wider text-tezforge-ink shadow-[2px_2px_0px_0px_rgba(26,26,46,1)] transition-colors hover:bg-tezforge-cream"
                >
                  DISCONNECT
                </button>
              </DialogTrigger>
              <DialogContent className="border-4 border-[#1A1A2E] shadow-[4px_4px_0px_0px_rgba(26,26,46,1)]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Disconnect Wallet
                  </DialogTitle>
                  <DialogDescription className="text-base font-medium">
                    Are you sure you want to disconnect your wallet? You will
                    need to reconnect to interact with the platform.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="flex-1 bg-white text-[#1A1A2E] font-bold uppercase text-xs tracking-wider border-2 border-[#1A1A2E] shadow-[2px_2px_0px_0px_rgba(26,26,46,1)] hover:shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-[transform,shadow,opacity,colors] px-4 py-3"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                  <button
                    onClick={() => disconnect()}
                    type="button"
                    className="flex-1 bg-red-500 text-white font-bold uppercase text-xs tracking-wider border-0 border-[#1A1A2E] shadow-[2px_2px_0px_0px_rgba(26,26,46,1)] hover:shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-[transform,shadow,opacity,colors] px-4 py-3"
                  >
                    Disconnect
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      <nav className="flex-1 flex flex-col px-6 mt-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex min-h-11 items-center border-2 border-tezforge-ink px-4 py-3 text-xs font-bold uppercase tracking-wider transition-[transform,shadow,opacity,colors] ${
                    isActive
                      ? "bg-[#1A1A2E] text-white shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] translate-x-[-2px] translate-y-[-2px]"
                      : "text-[#1A1A2E] bg-white hover:bg-[#0F59FF] hover:text-white shadow-[2px_2px_0px_0px_rgba(26,26,46,1)] hover:shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  }`}
                >
                  <item.icon className="size-5 mr-3" strokeWidth={1.5} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
          {/* Admin Link - Only visible to factory owner */}
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                className={`flex items-center px-4 py-3 transition-[transform,shadow,opacity,colors] font-bold uppercase text-xs tracking-wider border-2 border-[#1A1A2E] ${
                  pathname.startsWith("/admin")
                    ? "bg-[#0F59FF] text-white shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] translate-x-[-2px] translate-y-[-2px]"
                    : "text-white bg-[#0F59FF] hover:bg-[#0A3DBF] hover:text-white shadow-[2px_2px_0px_0px_rgba(26,26,46,1)] hover:shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                }`}
              >
                <Shield className="size-5 mr-3" strokeWidth={2.5} />
                <span>Admin</span>
              </Link>
            </li>
          )}
        </ul>

        <div className="mt-8 mb-3">
          <Link
            to="/dashboard/create"
            className={`flex min-h-11 items-center justify-center w-full px-4 py-4 transition-[transform,shadow,opacity,colors] font-bold uppercase text-xs tracking-wider border-2 border-tezforge-ink ${
              pathname === "/dashboard/create"
                ? "bg-[#0F59FF] text-white shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-[#0F59FF] text-white hover:bg-[#0A3DBF] shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            }`}
          >
            <Plus className="size-5 mr-2" />
            CREATE
          </Link>
        </div>

        {!isConnected && (
          <div className="mt-auto mb-6">
            <button
              onClick={openConnectModal}
              type="button"
              className="w-full bg-[#0F59FF] text-white font-bold uppercase text-xs tracking-wider border-4 border-[#1A1A2E] shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-[transform,shadow,opacity,colors] px-4 py-4"
            >
              CONNECT WALLET
            </button>
          </div>
        )}
      </nav>
    </div>
  );
};

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState<string | null>(null);
  const location = useLocation();

  // Close sidebar on route change
  if (
    prevPathname !== null &&
    prevPathname !== location.pathname &&
    sidebarOpen
  ) {
    setSidebarOpen(false);
  }
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-30 lg:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Mobile sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-[#F7F3EE] text-[#1A1A2E] border-r-2 border-[#1A1A2E] z-40 transform transition-transform ease-in-out duration-300 lg:hidden overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </div>

      <div className="flex h-dvh bg-[#F7F3EE] text-[#1A1A2E]">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-72">
            <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r-2 border-[#1A1A2E]">
              <SidebarContent />
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          {/* Mobile header */}
          <div className="lg:hidden relative z-10 flex-shrink-0 h-16 bg-white border-b-4 border-[#1A1A2E] flex items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-14 flex items-center justify-center">
                <img
                  src="https://res.cloudinary.com/dma1c8i6n/image/upload/v1785418522/tezforge_mmgibf.png"
                  alt="Tezforge"
                  className="size-14 object-contain"
                />
              </div>
              <span className="flex flex-col font-bold text-sm uppercase tracking-wider">
                <span>Tezforge</span>
                <span className="text-[10px] font-bold normal-case tracking-wide text-tezforge-blue">Demo · no real funds</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="min-h-11 min-w-11 border-2 border-tezforge-ink bg-tezforge-cream p-2 text-tezforge-ink hover:bg-tezforge-cream-dark"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
