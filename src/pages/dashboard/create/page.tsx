import { ArrowRight, Box, CircleDollarSign, Factory, ImageIcon, Lock, Send, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useWhitelistedCreator } from "@/lib/hooks/useWhitelistedCreator";
import type { Address } from "viem";

const getCreationOptions = (isWhitelisted: boolean | undefined) => [
  {
    to: "/dashboard/create/token",
    title: "Create a new Token",
    description: "Deploy a standard, mintable, or taxable ERC20 token.",
    icon: CircleDollarSign,
  },
  {
    to: isWhitelisted ? "/dashboard/create/presale" : "/dashboard/create/project",
    title: "Create a Presale",
    description: "Launch a presale for your token to raise funds.",
    icon: Factory,
  },
  {
    to: "/dashboard/create/nft",
    title: "Create an NFT Collection",
    description: "Deploy an NFT collection with a configurable public sale.",
    icon: ImageIcon,
  },
  {
    to: "/dashboard/create/project",
    title: "Submit a Project",
    description: "Submit your project for the launchpad.",
    icon: Box,
  },
];

const toolOptions = [
  {
    to: "/dashboard/tools/token-locker",
    title: "Lock Tokens",
    description: "Lock your tokens in a time-locked vault.",
    icon: Lock,
  },
  {
    to: "/dashboard/tools/airdrop",
    title: "Airdrop Tokens",
    description: "Airdrop tokens to multiple addresses at once.",
    icon: Send,
  },
  {
    to: "/dashboard/user",
    title: "Manage Presales",
    description: "View and manage your presales.",
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
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 text-black">
      <section className="mb-8 sm:mb-12 text-right lg:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Create</h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl ml-auto lg:ml-0">
          Create new assets and utilities for the Reactive ecosystem.
        </p>
      </section>

      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-bold mb-6">Assets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creationOptions.map((item) => (
              <Link to={item.to} key={item.to} className="border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all group">
                <item.icon className="w-8 h-8 mb-4 text-black group-hover:text-white" />
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-sm opacity-70 mb-4">{item.description}</p>
                <div className="flex justify-end">
                  <ArrowRight className="w-6 h-6 transform transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolOptions.map((item) => (
              <Link to={item.to} key={item.to} className="border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all group">
                <item.icon className="w-8 h-8 mb-4 text-black group-hover:text-white" />
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
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
