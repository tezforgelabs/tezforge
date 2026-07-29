"use client"
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { PresaleCard } from "@/components/ui/presale-card";
import { useLaunchpadPresales } from "@/lib/hooks/useLaunchpadPresales";
import type { LaunchpadPresaleFilter } from "@/lib/hooks/useLaunchpadPresales";

const filterOptions: Array<{ label: string; value: LaunchpadPresaleFilter }> = [
  { label: "All", value: "all" },
  { label: "Live", value: "live" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Ended", value: "ended" },
];

export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState<LaunchpadPresaleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { presales, isLoading } = useLaunchpadPresales(activeFilter);

  const filteredPresales = presales.filter(presale => {
    if (!presale) return false;
    const matchesSearch =
      presale.saleTokenName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      presale.saleTokenSymbol?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="bg-[#FFF9F0] min-h-screen text-black">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-20 max-w-7xl">
        <div className="mb-12 sm:mb-20 text-center sm:text-left">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none mb-6 tracking-tight">
            Launchpad<br />Projects
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto sm:mx-0">
            Participate in token presales and support new projects on the Reactive network.
          </p>
        </div>

        <div className="mb-12 sm:mb-16 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-black w-5 h-5 sm:w-6 sm:h-6" />
            <Input
              placeholder="SEARCH PROJECTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 sm:pl-16 w-full h-14 sm:h-16 text-base sm:text-lg border-2 border-black focus:ring-0 focus:border-black font-medium uppercase placeholder:text-gray-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {filterOptions.map(filter => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-4 py-2 sm:px-6 sm:py-3 text-sm font-bold uppercase tracking-wider border-2 border-black transition-all ${activeFilter === filter.value
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-black hover:text-white"
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-lg font-medium">Loading projects...</div>
        ) : filteredPresales.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-bold uppercase mb-2">No Projects Found</p>
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search query"
                : activeFilter === "all"
                  ? "No presales available yet"
                  : `No ${activeFilter} presales at the moment`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPresales.map((presale) => (
              <PresaleCard presale={presale} key={presale.address} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}