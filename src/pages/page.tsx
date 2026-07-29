import { TelegramIcon } from "@/components/ui/icons/telegram-icon";
import { XIcon as XSocialIcon } from "@/components/ui/icons/x-icon";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useLaunchpadPresales } from "@/lib/hooks/useLaunchpadPresales";
import { useReactPriceUsd } from "@/lib/hooks/useReactPriceUsd";
import { BookOpen, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";

const cardStyles = [
  { bg: "bg-[#7DF9FF]", text: "text-black" },
  { bg: "bg-[#FF4911]", text: "text-black" },
  { bg: "bg-[#3300FF]", text: "text-white" },
];

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  const { allPresales, isLoading: isLoadingPresales } =
    useLaunchpadPresales("all");

  const navLinks = [
    { label: "Projects", href: "/projects" },
    { label: "Staking", href: "/dashboard/staking" },
    { label: "Create", href: "/dashboard/create" },
  ];

  // Featured: show live and upcoming presales (prioritize live, then upcoming)
  const featuredPresales = useMemo(() => {
    const live = allPresales.filter((p) => p.status === "live");
    const upcoming = allPresales.filter((p) => p.status === "upcoming");
    return [...live, ...upcoming].slice(0, 3);
  }, [allPresales]);

  // Calculate total raised across all presales in REACT
  const totalRaisedValue = useMemo(() => {
    const sum = allPresales.reduce((acc, p) => acc + (p.totalRaised || 0n), 0n);
    return parseFloat(formatEther(sum));
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
  const reactPriceUsd = useReactPriceUsd();

  const totalRaisedUsd = useMemo(() => {
    if (reactPriceUsd === null) return null;
    return totalRaised * reactPriceUsd;
  }, [reactPriceUsd, totalRaised]);

  return (
    <main className="min-h-screen bg-[#FFF9F0] text-black">
      <div className="container mx-auto px-4 sm:px-6 py-7 max-w-7xl">
        <header className="mb-16">
          <div className="border-4 border-black bg-white px-4 py-4 sm:px-6 sm:py-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-3 text-2xl sm:text-3xl font-black tracking-wider uppercase"
              >
                <img
                  src="https://res.cloudinary.com/dma1c8i6n/image/upload/v1764289640/reactpad_swlsov.png"
                  alt="ReactPad Logo"
                  width={44}
                  height={44}
                  className="h-10 w-10 object-contain"
                />
                <span>ReactPad</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm lg:text-base font-black uppercase tracking-wider">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="hover:text-[#3300FF] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {!address && (
                  <button
                    type="button"
                    onClick={() => openConnectModal?.()}
                    className="inline-flex items-center bg-black text-white px-4 py-2 border-2 border-black hover:bg-[#7DF9FF] hover:text-black transition-colors"
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
                className="md:hidden inline-flex items-center justify-center border-2 border-black bg-[#7DF9FF] p-2"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            <div
              id="mobile-nav-menu"
              className={`md:hidden overflow-hidden transition-all duration-200 ${
                isMobileMenuOpen ? "max-h-80 mt-4 border-t-2 border-black pt-4" : "max-h-0"
              }`}
            >
              <nav className="flex flex-col gap-3 text-sm font-black uppercase tracking-wider">
                {navLinks.map((link) => (
                  <Link
                    key={`${link.href}-mobile`}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="border-2 border-black bg-[#FFF9F0] px-4 py-3"
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
                    className="inline-flex items-center justify-center border-2 border-black bg-black text-white px-4 py-3"
                  >
                    CONNECT WALLET
                  </button>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mb-32 text-center">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase leading-none mb-8 tracking-tight animate-fade-in-up">
            LAUNCH IDEAS.
            <br />
            MOON PROJECTS.
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl mb-12 max-w-3xl mx-auto font-bold px-4 animate-fade-in-up animation-delay-200">
            Discover, back, and launch the most promising projects on the
            Reactive Network.
          </p>
          <a
            href="/projects"
            className="inline-block bg-[#7DF9FF] text-black font-black py-4 px-8 sm:py-5 sm:px-12 text-base sm:text-lg border-4 border-black uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 animate-fade-in-up animation-delay-400"
          >
            EXPLORE PROJECTS →
          </a>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="bg-[#7DF9FF] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 animate-fade-in-up animation-delay-200">
            <p className="text-sm font-black tracking-wider mb-4 uppercase">
              Total Projects
            </p>
            <p ref={totalProjectsRef} className="text-6xl font-black">
              {Math.floor(totalProjects).toLocaleString()}
            </p>
          </div>
          <div className="bg-[#2FFF2F] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 animate-fade-in-up animation-delay-400">
            <p className="text-sm font-black tracking-wider mb-4 uppercase">
              Total Raised
            </p>
            <p ref={totalRaisedRef} className="text-6xl font-black">
              {totalRaisedUsd === null
                ? "..."
                : `$${totalRaisedUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
            </p>
            <p className="text-xl font-black mt-2">
              {totalRaised < 0.01 ? "0" : totalRaised.toFixed(2)} REACT
            </p>
          </div>
          <div className="bg-[#FF00F5] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 animate-fade-in-up animation-delay-600">
            <p className="text-sm font-black tracking-wider mb-4 uppercase">
              Active Presales
            </p>
            <p ref={activePresalesRef} className="text-6xl font-black">
              {Math.floor(activePresales).toLocaleString()}
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-32">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-16 tracking-tight text-center">
            HOW IT WORKS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-4 border-black p-8 text-center bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-6xl font-black mb-4">1</div>
              <h3 className="text-2xl font-black uppercase mb-4">DISCOVER</h3>
              <p className="font-bold text-lg">
                Browse a curated list of innovative projects seeking funding on
                the Reactive Network.
              </p>
            </div>
            <div className="border-4 border-black p-8 text-center bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-6xl font-black mb-4">2</div>
              <h3 className="text-2xl font-black uppercase mb-4">BACK</h3>
              <p className="font-bold text-lg">
                Support the projects you believe in by participating in their
                Funding Round.
              </p>
            </div>
            <div className="border-4 border-black p-8 text-center bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-6xl font-black mb-4">3</div>
              <h3 className="text-2xl font-black uppercase mb-4">LAUNCH</h3>
              <p className="font-bold text-lg">
                Help projects reach their funding goals and watch them launch
                into the stratosphere.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Projects Section */}
        <section className="mb-32">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-16 tracking-tight">
            FEATURED LAUNCHES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingPresales ? (
              <div className="text-center md:col-span-2 lg:col-span-3 py-10">
                Loading Projects...
              </div>
            ) : featuredPresales.length === 0 ? (
              <div className="text-center md:col-span-2 lg:col-span-3 py-10">
                <p className="text-2xl font-bold uppercase mb-2">
                  No Projects to Feature
                </p>
                <p className="text-gray-600">
                  Check back soon for the latest launches.
                </p>
              </div>
            ) : (
              featuredPresales.map((presale, index) => (
                <Link to={`/projects/${presale.address}`} key={presale.address}>
                  <div
                    className={`${cardStyles[index % cardStyles.length].bg} ${
                      cardStyles[index % cardStyles.length].text
                    } border-4 border-black p-8 cursor-pointer shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 h-full flex flex-col`}
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

        {/* Call to Action Section */}
        <section className="bg-black text-white border-4 border-black p-8 sm:p-12 md:p-16 text-center mb-16 shadow-[8px_8px_0px_0px_#7DF9FF]">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-6 tracking-tight">
            Ready to Launch?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl mb-10 max-w-2xl mx-auto px-4">
            Got the next big idea? Launch your project on ReactPad and get the
            funding you need to make it a reality.
          </p>
          <a
            href="/dashboard/create"
            className="inline-block bg-[#FF00F5] text-black font-black py-4 px-8 sm:py-5 sm:px-12 text-base sm:text-lg border-4 border-black uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)] hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
          >
            CREATE A PROJECT
          </a>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white border-t-4 border-black">
        <div className="container mx-auto px-6 py-8 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-bold uppercase tracking-wider text-center md:text-left">
            &copy; {new Date().getFullYear()} ReactPad
          </p>
          <div className="flex gap-6">
            <a
              href="https://x.com/reactpad"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#7DF9FF] transition-colors"
            >
              <XSocialIcon size={24} />
            </a>
            <a
              href="https://t.me/reactpad"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#7DF9FF] transition-colors"
            >
              <TelegramIcon size={24} />
            </a>
            <a
              href="https://reactpad.gitbook.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#7DF9FF] transition-colors"
            >
              <BookOpen size={24} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
