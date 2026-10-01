import { TelegramIcon } from "@/components/ui/icons/telegram-icon";
import { XIcon as XSocialIcon } from "@/components/ui/icons/x-icon";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useLaunchpadPresales } from "@/lib/hooks/useLaunchpadPresales";
import { sumNativePresaleRaised } from "@/lib/utils/presale-amount";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpen, Menu, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatEther } from "viem";
import { useAccount } from "wagmi";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const cardStyles = [
  { bg: "bg-tezforge-blue", text: "text-white" },
  { bg: "bg-tezforge-green", text: "text-tezforge-ink" },
  { bg: "bg-tezforge-ink", text: "text-white" },
];

const focusStyles =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-tezforge-blue";
const lightFocusStyles =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-tezforge-green";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  const { allPresales, isLoading: isLoadingPresales } =
    useLaunchpadPresales("all");

  const navLinks = [
    { label: "Projects", href: "/projects" },
    { label: "Create", href: "/dashboard/create" },
  ];

  // Featured: show live and upcoming presales (prioritize live, then upcoming)
  const featuredPresales = useMemo(() => {
    const live = allPresales.filter((p) => p.status === "live");
    const upcoming = allPresales.filter((p) => p.status === "upcoming");
    return [...live, ...upcoming].slice(0, 3);
  }, [allPresales]);

  // Only native payments can be summed as XTZ.
  const totalRaisedValue = useMemo(() => {
    return parseFloat(formatEther(sumNativePresaleRaised(allPresales)));
  }, [allPresales]);

  // Count live presales
  const livePresaleCount = useMemo(() => {
    return allPresales.filter(
      (p) => p.status === "live" || p.status === "upcoming",
    ).length;
  }, [allPresales]);

  const { count: totalProjects, ref: totalProjectsRef } = useCountUp(
    allPresales.length,
  );
  const { count: totalRaised, ref: totalRaisedRef } =
    useCountUp(totalRaisedValue);
  const { count: activePresales, ref: activePresalesRef } =
    useCountUp(livePresaleCount);
  const pageRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap.from(".stat-card", {
        autoAlpha: 0,
        y: 32,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.15,
        immediateRender: true,
        clearProps: "transform",
        scrollTrigger: {
          trigger: ".stats-section",
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      gsap.from(".how-card", {
        autoAlpha: 0,
        y: 32,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.15,
        immediateRender: true,
        clearProps: "transform",
        scrollTrigger: {
          trigger: ".how-section",
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      gsap.from(".featured-card", {
        autoAlpha: 0,
        y: 32,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        immediateRender: true,
        clearProps: "transform",
        scrollTrigger: {
          trigger: ".featured-section",
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      gsap.from(".cta-section", {
        autoAlpha: 0,
        y: 32,
        duration: 0.8,
        ease: "power3.out",
        immediateRender: true,
        scrollTrigger: {
          trigger: ".cta-section",
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: pageRef },
  );

  // Recalculate ScrollTrigger positions after async presales data loads
  useEffect(() => {
    if (!isLoadingPresales && featuredPresales.length > 0) {
      ScrollTrigger.refresh();
    }
  }, [isLoadingPresales, featuredPresales]);

  return (
    <main
      ref={pageRef}
      className="min-h-screen bg-tezforge-cream text-tezforge-ink"
    >
      <div className="container mx-auto max-w-7xl px-4 py-5 text-pretty sm:px-6 sm:py-7">
        {/* ── Header ── */}
        <header className="mb-12 lg:mb-16">
          <div className="border-2 border-tezforge-ink bg-white px-4 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,46,1)] sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-4">
              <Link
                to="/"
                className={`inline-flex items-center gap-3 text-2xl font-black uppercase tracking-wider sm:text-3xl ${focusStyles}`}
              >
                <div className="size-12 flex items-center justify-center">
                  <img
                    src="https://res.cloudinary.com/dma1c8i6n/image/upload/v1785418522/tezforge_mmgibf.png"
                    alt="Tezforge"
                    className="w-17 h-17 object-contain"
                  />
                </div>
                <span className="flex flex-col text-tezforge-ink">
                  <span>Tezforge</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm lg:text-base font-black uppercase tracking-wider">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`transition-colors hover:text-tezforge-blue ${focusStyles}`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!address && (
                  <button
                    type="button"
                    onClick={() => openConnectModal?.()}
                    className={`inline-flex items-center border-2 border-tezforge-ink bg-tezforge-ink px-4 py-2 text-white transition-colors hover:bg-tezforge-blue ${focusStyles}`}
                  >
                    CONNECT WALLET
                  </button>
                )}
              </nav>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-menu"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                className={`inline-flex items-center justify-center border-2 border-tezforge-ink bg-tezforge-blue p-2 text-white md:hidden ${focusStyles}`}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            <div
              id="mobile-nav-menu"
              className={`md:hidden overflow-hidden transition-[transform,shadow,opacity,colors] duration-200 ${
                isMobileMenuOpen
                  ? "max-h-80 mt-4 border-t-2 border-tezforge-ink pt-4"
                  : "max-h-0"
              }`}
            >
              <nav className="flex flex-col gap-3 text-sm font-black uppercase tracking-wider">
                {navLinks.map((link) => (
                  <Link
                    key={`${link.href}-mobile`}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`border-2 border-tezforge-ink bg-tezforge-cream px-4 py-3 ${focusStyles}`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!address && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openConnectModal?.();
                    }}
                    className={`inline-flex items-center justify-center border-2 border-tezforge-ink bg-tezforge-ink px-4 py-3 text-white ${focusStyles}`}
                  >
                    CONNECT WALLET
                  </button>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="mb-20 grid items-stretch gap-8 lg:mb-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:gap-10">
          <div className="flex flex-col items-start justify-center py-4 lg:py-8">
            <div className="mb-6 inline-flex items-center gap-3 border-2 border-tezforge-ink bg-tezforge-ink px-4 py-2 text-white">
              <span className="size-2 bg-tezforge-green" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-widest">
                Built on Tezos
              </span>
            </div>
            <h1 className="mb-6 max-w-4xl text-balance text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl animate-fade-in-up motion-reduce:animate-none">
              LAUNCH ON <span className="text-tezforge-blue">TEZOS.</span>
            </h1>
            <p className="mb-8 max-w-2xl text-pretty text-lg font-bold leading-relaxed sm:text-xl animate-fade-in-up animation-delay-200 motion-reduce:animate-none">
              Create tokens, run presales, and discover projects.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row animate-fade-in-up animation-delay-400 motion-reduce:animate-none">
              <Link
                to="/projects"
                className={`inline-flex items-center justify-center border-2 border-tezforge-ink bg-tezforge-blue px-7 py-4 text-center text-sm font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_0px_rgba(26,26,46,1)] transition-[transform,shadow] hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_0px_rgba(26,26,46,1)] motion-reduce:transform-none ${focusStyles}`}
              >
                Explore projects{" "}
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </Link>
              <Link
                to="/dashboard/create"
                className={`inline-flex items-center justify-center border-2 border-tezforge-ink bg-white px-7 py-4 text-center text-sm font-black uppercase tracking-wider text-tezforge-ink shadow-[3px_3px_0px_0px_rgba(26,26,46,1)] transition-[transform,shadow] hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_0px_rgba(26,26,46,1)] motion-reduce:transform-none ${focusStyles}`}
              >
                Launch a project
              </Link>
            </div>
          </div>
          <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden border-2 border-tezforge-ink bg-tezforge-blue p-6 text-white shadow-[6px_6px_0px_0px_rgba(26,26,46,1)] sm:p-8 lg:min-h-[470px]">
            <div className="flex items-start justify-between gap-4 border-b-2 border-white/40 pb-5 text-xs font-black uppercase tracking-widest">
              <span>Tezforge</span>
              <span>01 / 03</span>
            </div>
            <div className="py-8">
              <p className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-tezforge-green">
                Token launches
              </p>
              <p className="max-w-md text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl lg:text-6xl">
                Create a token. Start a presale.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t-2 border-white/40 pt-5 text-xs font-black uppercase tracking-wider sm:text-sm">
              <span>Discover</span>
              <span>Back</span>
              <span>Launch</span>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section
          aria-label="Platform activity"
          className="mb-24 grid grid-cols-1 gap-4 stats-section md:grid-cols-3 lg:mb-28"
        >
          <div className="stat-card flex min-h-48 flex-col justify-between border-2 border-tezforge-ink bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] sm:p-7">
            <p className="mb-4 border-b border-tezforge-ink/25 pb-4 text-xs font-black uppercase tracking-widest">
              Total Projects
            </p>
            <p
              ref={totalProjectsRef}
              className="text-5xl font-black tabular-nums text-tezforge-blue sm:text-6xl"
            >
              {Math.floor(totalProjects).toLocaleString()}
            </p>
          </div>
          <div className="stat-card flex min-h-48 flex-col justify-between border-2 border-tezforge-ink bg-tezforge-green p-6 text-tezforge-ink shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] sm:p-7">
            <p className="mb-4 border-b border-tezforge-ink/25 pb-4 text-xs font-black uppercase tracking-widest">
              XTZ Raised
            </p>
            <p
              ref={totalRaisedRef}
              className="break-words text-4xl font-black tabular-nums sm:text-5xl"
            >
              {totalRaised.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}
            </p>
          </div>
          <div className="stat-card flex min-h-48 flex-col justify-between border-2 border-tezforge-ink bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] sm:p-7">
            <p className="mb-4 border-b border-tezforge-ink/25 pb-4 text-xs font-black uppercase tracking-widest">
              Active Presales
            </p>
            <p
              ref={activePresalesRef}
              className="text-5xl font-black tabular-nums text-tezforge-blue sm:text-6xl"
            >
              {Math.floor(activePresales).toLocaleString()}
            </p>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="mb-24 how-section lg:mb-28">
          <h2 className="mb-8 text-balance text-4xl font-black uppercase tracking-tight sm:text-5xl">
            HOW IT WORKS
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="how-card border-2 border-tezforge-ink bg-white p-7 shadow-[4px_4px_0px_0px_rgba(26,26,46,1)]">
              <div className="mb-8 text-5xl font-black text-tezforge-blue">
                01
              </div>
              <h3 className="mb-3 text-2xl font-black uppercase">DISCOVER</h3>
              <p className="text-base font-bold leading-relaxed">
                Explore live launches.
              </p>
            </div>
            <div className="how-card border-2 border-tezforge-ink bg-white p-7 shadow-[4px_4px_0px_0px_rgba(26,26,46,1)]">
              <div className="mb-8 text-5xl font-black text-tezforge-blue">
                02
              </div>
              <h3 className="mb-3 text-2xl font-black uppercase">BACK</h3>
              <p className="text-base font-bold leading-relaxed">
                Join a presale.
              </p>
            </div>
            <div className="how-card border-2 border-tezforge-ink bg-white p-7 shadow-[4px_4px_0px_0px_rgba(26,26,46,1)]">
              <div className="mb-8 text-5xl font-black text-tezforge-blue">
                03
              </div>
              <h3 className="mb-3 text-2xl font-black uppercase">LAUNCH</h3>
              <p className="text-base font-bold leading-relaxed">
                Create your own.
              </p>
            </div>
          </div>
        </section>

        {/* ── Featured Launches ── */}
        <section className="mb-24 featured-section lg:mb-28">
          <h2 className="mb-8 text-balance text-4xl font-black uppercase tracking-tight sm:text-5xl">
            FEATURED LAUNCHES
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingPresales ? (
              <div className="border-2 border-tezforge-ink bg-white py-12 text-center font-bold md:col-span-2 lg:col-span-3">
                Loading Projects...
              </div>
            ) : featuredPresales.length === 0 ? (
              <div className="border-2 border-tezforge-ink bg-white px-6 py-12 text-center md:col-span-2 lg:col-span-3">
                <p className="text-2xl font-bold uppercase mb-2">
                  No Projects to Feature
                </p>
                <p className="text-gray-600 mb-6">
                  Check back soon for the latest launches.
                </p>
                <a
                  href="/dashboard/create"
                  className={`inline-block border-2 border-tezforge-ink bg-tezforge-blue px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_0px_rgba(26,26,46,1)] transition-[transform,shadow] hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_0px_rgba(26,26,46,1)] motion-reduce:transform-none ${focusStyles}`}
                >
                  Launch Your Project
                </a>
              </div>
            ) : (
              featuredPresales.map((presale, index) => (
                <Link
                  to={`/projects/${presale.address}`}
                  key={presale.address}
                  className={`block ${focusStyles}`}
                >
                  <div
                    className={`featured-card ${cardStyles[index % cardStyles.length].bg} ${
                      cardStyles[index % cardStyles.length].text
                    } flex h-full min-h-48 cursor-pointer flex-col border-2 border-tezforge-ink p-7 shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] transition-[transform,shadow] hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_0px_rgba(26,26,46,1)] motion-reduce:transform-none`}
                  >
                    <h3 className="text-2xl font-black uppercase mb-4 flex-grow">
                      {presale.saleTokenName || "Unnamed Project"}
                    </h3>
                    <span className="text-sm font-black uppercase">
                      LEARN MORE →
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section mb-16 border-2 border-tezforge-ink bg-tezforge-ink p-8 text-center text-white shadow-[4px_4px_0px_0px_#0F59FF] sm:p-12 md:p-16">
          <h2 className="mb-6 text-balance text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-6xl">
            Ready to Build?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl mb-10 max-w-2xl mx-auto px-4 text-pretty">
            Create a token or launch a presale.
          </p>
          <a
            href="/dashboard/create"
            className={`inline-block border-2 border-white bg-tezforge-blue px-8 py-4 text-base font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.5)] transition-[transform,shadow] hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_0px_rgba(255,255,255,0.5)] motion-reduce:transform-none sm:px-12 sm:py-5 sm:text-lg ${lightFocusStyles}`}
          >
            CREATE A PROJECT
          </a>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t-2 border-tezforge-ink bg-tezforge-ink text-white">
        <div className="container mx-auto px-6 py-8 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-bold uppercase tracking-wider text-center md:text-left">
            &copy; {new Date().getFullYear()} Tezforge
          </p>
          <div className="flex gap-6">
            <a
              href="https://x.com/tezforge"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors hover:text-tezforge-green ${lightFocusStyles}`}
              aria-label="Tezforge on X"
            >
              <XSocialIcon size={24} />
            </a>
            <a
              href="https://t.me/tezforge"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors hover:text-tezforge-green ${lightFocusStyles}`}
              aria-label="Tezforge on Telegram"
            >
              <TelegramIcon size={24} />
            </a>
            <a
              href="https://docs.tezforge.io"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors hover:text-tezforge-green ${lightFocusStyles}`}
              aria-label="Tezforge documentation"
            >
              <BookOpen size={24} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
