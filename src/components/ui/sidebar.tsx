import { useIsAdmin } from "@/lib/utils/admin";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useReactPriceUsd } from "@/lib/hooks/useReactPriceUsd";
import {
  LayoutDashboard,
  Layers,
  Menu,
  Network,
  Plus,
  Rocket,
  Shield,
  WalletMinimal
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Address } from "viem";
import {
  CHAIN_LABELS,
  REACTIVE_MAINNET_CHAIN_ID,
  REACTIVE_TESTNET_CHAIN_ID,
  SUPPORTED_CHAIN_IDS,
} from "@/config";
import { useAccount, useBalance, useChainId, useDisconnect, useSwitchChain } from "wagmi";

const navItems = [
  { name: "Dashboard", href: "/dashboard/user", icon: LayoutDashboard },
  { name: "Launchpad", href: "/projects", icon: Rocket },
  { name: "Staking", href: "/dashboard/staking", icon: Layers },
];

// Re-usable component for sidebar content
const SidebarContent = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const reactPriceUsd = useReactPriceUsd();
  const { isAdmin } = useIsAdmin(address as Address | undefined);

  const isConnected = !!address;
  const isSupportedNetwork = SUPPORTED_CHAIN_IDS.includes(chainId);
  const isWrongNetwork = isConnected && !isSupportedNetwork;
  const targetChainId = isSupportedNetwork
    ? chainId === REACTIVE_MAINNET_CHAIN_ID
      ? REACTIVE_TESTNET_CHAIN_ID
      : REACTIVE_MAINNET_CHAIN_ID
    : REACTIVE_MAINNET_CHAIN_ID;
  const targetChainLabel = CHAIN_LABELS[targetChainId] ?? "Reactive Mainnet";
  const networkButtonLabel = isWrongNetwork
    ? `Wrong network - Switch to ${targetChainLabel}`
    : `Switch to ${targetChainLabel}`;

  const { data: balanceData } = useBalance({ address });
  const balance = balanceData ? parseFloat(balanceData.formatted) : 0;

  const valueUsd = balance * (reactPriceUsd ?? 0);

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="p-1 border-b-4 border-black bg-[#7DF9FF] flex items-center justify-center">
        <Link to="/" className="flex items-center justify-center">
          <img
            src="https://res.cloudinary.com/dma1c8i6n/image/upload/v1764289640/reactpad_swlsov.png"
            alt="ReactPad Logo"
            width={60}
            height={60}
            className="object-contain"
          />
        </Link>
      </div>

      {isConnected && (
        <div className="mx-6 my-3 p-4 border-4 border-black bg-[#2FFF2F] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-black uppercase">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button className="hover:scale-110 transition-transform">
              <WalletMinimal size={18} strokeWidth={3} />
            </button>
          </div>
          <div>
            <div className="text-3xl font-black">
              {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </div>
            <div className="text-sm font-black uppercase mt-1">
              {'REACT'}
            </div>
            {(reactPriceUsd ?? 0) > 0 && (
              <div className="text-xs font-bold mt-1">
                ~${valueUsd < 0.01 && valueUsd > 0
                  ? valueUsd.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
                  : valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => switchChain?.({ chainId: targetChainId })}
              type="button"
              className="w-full bg-[#7DF9FF] text-black font-black uppercase text-xs tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-2 flex items-center justify-center gap-2 leading-tight"
            >
              <Network size={16} strokeWidth={3} />
              <span>{networkButtonLabel}</span>
            </button>
            <button
              onClick={() => disconnect()}
              type="button"
              className="w-full bg-red-500 text-white font-black uppercase text-xs tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-2"
            >
              DISCONNECT
            </button>
          </div>
        </div>
      )}

      <nav className="flex-1 flex flex-col px-6 mt-6">
        <ul className="space-y-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center px-4 py-3 transition-all font-black uppercase text-xs tracking-wider border-2 border-black ${isActive
                    ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                    : "text-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                    }`}
                >
                  <item.icon className="w-5 h-5 mr-3" strokeWidth={2.5} />
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
                className={`flex items-center px-4 py-3 transition-all font-black uppercase text-xs tracking-wider border-2 border-black ${pathname.startsWith("/admin")
                  ? "bg-[#FFFB8F] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                  : "text-black bg-[#FFFB8F] hover:bg-[#FFE033] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  }`}
              >
                <Shield className="w-5 h-5 mr-3" strokeWidth={2.5} />
                <span>Admin</span>
              </Link>
            </li>
          )}
        </ul>

        <div className="mt-8 mb-3">
          <Link
            to="/dashboard/create"
            className={`flex items-center justify-center w-full px-4 py-4 transition-all font-black uppercase text-xs tracking-wider border-4 border-black ${pathname === "/dashboard/create"
              ? "bg-[#FF4911] text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
              : "bg-[#FF00F5] text-black hover:bg-[#FF4911] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
              }`}
          >
            <Plus className="w-5 h-5 mr-2" />
            CREATE
          </Link>
        </div>

        {!isConnected && (
          <div className="mt-auto mb-6">
            <button
              onClick={openConnectModal}
              type="button"
              className="w-full bg-[#7DF9FF] text-black font-black uppercase text-xs tracking-wider border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-4 py-4"
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

  // Close sidebar on route change without using setState in effect
  if (prevPathname !== null && prevPathname !== location.pathname && sidebarOpen) {
    setSidebarOpen(false);
  }
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-30 lg:hidden transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Mobile sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white text-black border-r-4 border-black z-40 transform transition-transform ease-in-out duration-300 lg:hidden overflow-y-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <SidebarContent />
      </div>

      <div className="flex h-screen bg-[#FFF9F0] text-black">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-72">
            <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r-4 border-black">
              <SidebarContent />
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          {/* Mobile header */}
          <div className="lg:hidden relative z-10 flex-shrink-0 h-16 bg-white border-b-4 border-black flex items-center justify-between px-4">
            <Link to="/">
              <img
                src="https://res.cloudinary.com/dma1c8i6n/image/upload/v1764289640/reactpad_swlsov.png"
                alt="ReactPad Logo"
                className="h-8 w-auto"
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900"
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
