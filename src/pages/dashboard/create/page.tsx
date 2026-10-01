import { useWhitelistedCreator } from "@/lib/hooks/useWhitelistedCreator";
import {
  ArrowRight,
  Box,
  CircleDollarSign,
  Factory,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const getCreationOptions = (isWhitelisted: boolean | undefined) => [
  {
    to: "/dashboard/create/token",
    title: "Create a Token",
    description: "Deploy an ERC-20 token.",
    icon: CircleDollarSign,
  },
  {
    to: isWhitelisted
      ? "/dashboard/create/presale"
      : "/dashboard/create/project",
    title: "Create a Presale",
    description: "Launch a token presale.",
    icon: Factory,
  },
  {
    to: "/dashboard/create/project",
    title: "Submit a Project",
    description: "List your project.",
    icon: Box,
  },
];

const toolOptions = [
  {
    to: "/dashboard/user",
    title: "Manage Presales",
    description: "Track and manage your presales.",
    icon: Settings,
  },
];

export default function CreateHubPage() {
  const { address } = useAccount();
  const { isWhitelisted } = useWhitelistedCreator(
    address as Address | undefined,
  );
  const creationOptions = getCreationOptions(isWhitelisted);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 text-tezforge-ink sm:px-6 sm:py-12">
      {/* Header */}
      <section className="mb-10 border-b-2 border-tezforge-ink pb-8 sm:mb-12">
        <span className="mb-4 inline-block border-2 border-tezforge-ink bg-tezforge-green px-3 py-1 text-xs font-black uppercase tracking-widest">Builder workspace</span>
        <h1 className="text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">What will you create?</h1>
        <p className="mt-4 max-w-2xl text-base font-medium sm:text-lg">Create a token, launch a presale, or list a project.</p>
      </section>

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
            Launch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creationOptions.map((item) => (
              <Link
                to={item.to}
                key={item.title}
                className="group flex h-full min-h-56 flex-col border-2 border-tezforge-ink bg-white p-6 shadow-[4px_4px_0_rgba(26,26,46,1)] transition-[transform,shadow,colors] hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(26,26,46,1)]"
              >
                <item.icon className="mb-6 size-9 text-tezforge-blue" aria-hidden="true" />
                <h3 className="font-black text-xl mb-2 uppercase tracking-wider">
                  {item.title}
                </h3>
                <p className="mb-6 text-sm font-medium text-tezforge-ink/75">{item.description}</p>
                <div className="mt-auto flex items-center justify-between border-t-2 border-tezforge-ink pt-4 text-xs font-black uppercase tracking-wider">
                  Get started <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
            Manage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolOptions.map((item) => (
              <Link
                to={item.to}
                key={item.to}
                className="group flex h-full min-h-52 flex-col border-2 border-tezforge-ink bg-white p-6 shadow-[4px_4px_0_rgba(26,26,46,1)] transition-[transform,shadow,colors] hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(26,26,46,1)]"
              >
                <item.icon className="mb-6 size-9 text-tezforge-blue" aria-hidden="true" />
                <h3 className="font-black text-xl mb-2 uppercase tracking-wider">
                  {item.title}
                </h3>
                <p className="mb-6 text-sm font-medium text-tezforge-ink/75">{item.description}</p>
                <div className="mt-auto flex items-center justify-between border-t-2 border-tezforge-ink pt-4 text-xs font-black uppercase tracking-wider">
                  Open dashboard <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
