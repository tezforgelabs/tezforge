"use client";

import { Input } from "@/components/ui/input";
import { PresaleCard } from "@/components/ui/presale-card";
import { useLaunchpadPresales } from "@/lib/hooks/useLaunchpadPresales";
import type { LaunchpadPresaleFilter } from "@/lib/hooks/useLaunchpadPresales";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

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
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredPresales = presales.filter(
    (presale) =>
      presale &&
      (presale.saleTokenName?.toLowerCase().includes(normalizedSearch) ||
        presale.saleTokenSymbol?.toLowerCase().includes(normalizedSearch)),
  );

  return (
    <main className="min-h-screen bg-tezforge-cream text-tezforge-ink">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:px-8">
        <header className="mb-10 border-b-4 border-tezforge-ink pb-9 sm:mb-12 sm:pb-12">
          <span className="mb-5 inline-flex items-center gap-2 border-2 border-tezforge-ink bg-tezforge-green px-3 py-1 text-xs font-black uppercase tracking-[0.16em] shadow-[3px_3px_0_0_#1A1A2E]">
            Explore the launchpad <ArrowUpRight aria-hidden="true" className="size-4" />
          </span>
          <h1 className="max-w-4xl font-display text-5xl font-black uppercase leading-[0.94] tracking-[-0.065em] sm:text-7xl lg:text-8xl">
            Find your next <span className="text-tezforge-blue">launch.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed sm:text-lg">
            Browse token presales on Tezos.
          </p>
        </header>

        <section aria-label="Browse projects">
          <div className="mb-6 flex flex-col gap-4 border-2 border-tezforge-ink bg-white p-3 shadow-[5px_5px_0_0_#1A1A2E] lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:p-4">
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-tezforge-ink/60" />
              <Input
                aria-label="Search projects"
                placeholder="Search by token name or symbol"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 border-tezforge-ink bg-tezforge-cream pl-12 text-sm shadow-none placeholder:normal-case placeholder:text-tezforge-ink/70 focus-visible:border-tezforge-blue focus-visible:shadow-[0_0_0_2px_#0F59FF]"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0" aria-label="Filter projects">
              <SlidersHorizontal aria-hidden="true" className="mr-1 hidden size-4 shrink-0 text-tezforge-ink/60 sm:block" />
              {filterOptions.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={activeFilter === filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`shrink-0 border-2 border-tezforge-ink px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tezforge-blue sm:px-4 ${
                    activeFilter === filter.value
                      ? "bg-tezforge-ink text-white"
                      : "bg-white text-tezforge-ink hover:bg-tezforge-cream-dark"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-tezforge-blue">The lineup</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl">Projects</h2>
            </div>
            {!isLoading && <p className="text-sm font-bold tabular-nums" aria-live="polite">{filteredPresales.length} {filteredPresales.length === 1 ? "project" : "projects"}</p>}
          </div>

          {isLoading ? (
            <div role="status" aria-label="Loading projects" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} aria-hidden="true" className="h-96 animate-pulse border-2 border-tezforge-ink/20 bg-white p-6">
                  <div className="mb-8 h-7 w-24 bg-tezforge-cream-dark" />
                  <div className="mb-5 h-12 w-2/3 bg-tezforge-cream-dark" />
                  <div className="h-4 w-full bg-tezforge-cream-dark" />
                </div>
              ))}
              <span className="sr-only">Loading projects…</span>
            </div>
          ) : filteredPresales.length === 0 ? (
            <div className="border-2 border-dashed border-tezforge-ink bg-white px-6 py-16 text-center sm:py-20">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center border-2 border-tezforge-ink bg-tezforge-green shadow-[4px_4px_0_0_#1A1A2E]">
                <Search aria-hidden="true" className="size-6" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">No projects found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-tezforge-ink/70 sm:text-base">
                {normalizedSearch
                  ? "Try a different token name or symbol."
                  : activeFilter === "all"
                    ? "No launches are available yet. Check back soon."
                    : `No ${activeFilter} launches are available right now.`}
              </p>
              {(normalizedSearch || activeFilter !== "all") && (
                <button type="button" onClick={() => { setSearchQuery(""); setActiveFilter("all"); }} className="mt-6 border-2 border-tezforge-ink bg-tezforge-blue px-5 py-2.5 text-sm font-black uppercase text-white shadow-[4px_4px_0_0_#1A1A2E] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tezforge-blue">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredPresales.map((presale) => (
                <PresaleCard presale={presale} key={presale.address} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
