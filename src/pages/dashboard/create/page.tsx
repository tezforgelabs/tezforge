import { useWhitelistedCreator } from "@/lib/hooks/useWhitelistedCreator";
import { ArrowRight, Box, CircleDollarSign, Factory, ImageIcon, Lock, Send, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const getCreationOptions = (isWhitelisted: boolean | undefined) => [
  {
    to: "/dashboard/create/token",
    title: "Create a Token",
    description: "Deploy a standard, mintable, or taxable ERC20 token.",
    icon: CircleDollarSign,
  },
  {
    to: isWhitelisted ? "/dashboard/create/presale" : "/dashboard/create/project",
    title: "Create a Presale",
    description: "Launch a token presale to raise funds from the community.",
    icon: Factory,
  },
  {
    to: "/dashboard/create/nft",
    title: "Create an NFT Collection",
    description: "Deploy an NFT collection with configurable public or whitelist mints.",
    icon: ImageIcon,
  },
  {
    to: "/dashboard/create/project",
    title: "Submit a Project",
    description: "Submit your project for the Tezforge launchpad.",
    icon: Box,
  },
];

const toolOptions = [
  {
    to: "/dashboard/tools/token-locker",
    title: "Lock Tokens",
    description: "Lock your tokens in a time-locked vault to build trust.",
    icon: Lock,
  },
  {
    to: "/dashboard/tools/airdrop",
    title: "Airdrop Tokens",
    description: "Send tokens to multiple addresses in a single transaction.",
    icon: Send,
  },
  {
    to: "/dashboard/user",
    title: "Manage Presales",
    description: "View, manage, and finalize your presales.",
    icon: Settings,
  },
];

export default function CreateHubPage() {
  const { address } = useAccount();
  const { isWhitelisted } = useWhitelistedCreator(
    address as Address | undefined
  );
  const creationOptions = getCreationOptions(isWhitelisted);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 text-[#1A1A2E]">
      {/* Header */}
      <section className="mb-8 sm:mb-12">
        <div className="border-2 border-[#1A1A2E] bg-[#1B2838] p-6 shadow-[2px_2px_0_rgba(26,26,46,1)]">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-white">Create</h1>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider mb-6">Assets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creationOptions.map((item) => (
              <Link to={item.to} key={item.to} className="border-2 border-[#1A1A2E] bg-white p-6 hover:bg-[#1B2838] hover:text-white transition-all group shadow-[2px_2px_0_rgba(26,26,46,1)] hover:shadow-[2px_2px_0_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                <item.icon className="w-8 h-8 mb-4 text-[#FF6B35] group-hover:text-[#FF6B35]" />
                <h3 className="font-black text-xl mb-2 uppercase tracking-wider">{item.title}</h3>
                <p className="text-sm opacity-70 mb-4">{item.description}</p>
                <div className="flex justify-end">
                  <ArrowRight className="w-6 h-6 transform transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider mb-6">Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolOptions.map((item) => (
              <Link to={item.to} key={item.to} className="border-2 border-[#1A1A2E] bg-white p-6 hover:bg-[#1B2838] hover:text-white transition-all group shadow-[2px_2px_0_rgba(26,26,46,1)] hover:shadow-[6px_6px_0_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                <item.icon className="w-8 h-8 mb-4 text-[#00B4D8] group-hover:text-[#00B4D8]" />
                <h3 className="font-black text-xl mb-2 uppercase tracking-wider">{item.title}</h3>
                <p className="text-sm opacity-70 mb-4">{item.description}</p>
                <div className="flex justify-end">
                  <ArrowRight className="w-6 h-6 transform transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}