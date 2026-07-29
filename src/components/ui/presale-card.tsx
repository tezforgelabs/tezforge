import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Project } from "@/components/ui/project-card";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { formatEther } from "viem";
import type { PresaleWithStatus } from "@/lib/hooks/useLaunchpadPresales";
import type { PresaleCategory } from "@/lib/store/launchpad-presale-store";
import { Twitter, Send, Globe, MessageCircle } from "lucide-react";
import { getPresaleMetadata } from "@/config/presale-metadata";

function CountdownTimer({ targetDate, isStart = false }: { targetDate: Date; isStart?: boolean }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance > 0) {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="text-sm">
            <span className="font-bold uppercase tracking-wider">{isStart ? "STARTS IN:" : "ENDS IN:"}</span>
            <div className="font-mono mt-2 text-xl font-black">
                {timeLeft.days}D {timeLeft.hours}H {timeLeft.minutes}M {timeLeft.seconds}S
            </div>
        </div>
    );
}

function mapStatusToStatusType(status: PresaleWithStatus['status']): Project['statusType'] {
    switch (status) {
        case 'live':
            return 'live';
        case 'upcoming':
            return 'upcoming';
        case 'ended':
        case 'cancelled':
        case 'finalized':
            return 'completed';
        default:
            return 'upcoming';
    }
}

function getCategoryStyle(category?: PresaleCategory) {
    switch (category) {
        case 'defi': return { bg: 'bg-[#7DF9FF]', label: 'DeFi' };
        case 'ai': return { bg: 'bg-[#E879F9]', label: 'AI' };
        case 'gaming': return { bg: 'bg-[#FB923C]', label: 'Gaming' };
        case 'infrastructure': return { bg: 'bg-[#7DF9FF]', label: 'INFRA' };
        case 'meme': return { bg: 'bg-[#FFFF00]', label: 'Meme' };
        default: return { bg: 'bg-[#D1D5DB]', label: 'Other' };
    }
}

export function PresaleCard({ presale }: { presale: PresaleWithStatus }) {
    // Get metadata from config (socials, category, etc.)
    const metadata = useMemo(() => getPresaleMetadata(presale.address), [presale.address]);

    // Default social links
    const defaultSocials = {
        twitter: "https://twitter.com",
        telegram: "https://t.me",
        discord: "https://discord.com",
        website: "#",
    };

    // Merge presale data with metadata (metadata takes precedence if available)
    const socials = {
        twitter: presale.socials?.twitter ?? metadata?.socials?.twitter ?? defaultSocials.twitter,
        telegram: presale.socials?.telegram ?? metadata?.socials?.telegram ?? defaultSocials.telegram,
        discord: presale.socials?.discord ?? metadata?.socials?.discord ?? defaultSocials.discord,
        website: presale.socials?.website ?? metadata?.socials?.website ?? defaultSocials.website,
    };
    const category = presale.category || metadata?.category;
    const customDescription = presale.description || metadata?.description;
    const customLogo = presale.logo || metadata?.logo;

    // Convert wei values to ether
    const raised = parseFloat(formatEther(presale.totalRaised || 0n));
    const goal = parseFloat(formatEther(presale.hardCap || 0n));
    const progressValue = presale.progress || 0;

    // Parse dates from bigint timestamps
    const startTime = new Date(Number(presale.startTime) * 1000);
    const endTime = new Date(Number(presale.endTime) * 1000);

    // Determine status type
    const statusType = mapStatusToStatusType(presale.status);

    // Use sale token name as display name
    const displayName = presale.saleTokenName || presale.saleTokenSymbol || 'Unknown';

    // Create a default description
    const description = customDescription || `Presale for ${presale.saleTokenName || presale.saleTokenSymbol}.`;

    // Use a deterministic avatar based on the token address
    const logo = customLogo || `https://api.dicebear.com/7.x/rings/svg?seed=${presale.saleToken}`;

    // Use payment token symbol if available, otherwise default to REACT
    const currency = presale.paymentTokenSymbol || 'REACT';

    const project: Project = {
        id: presale.address,
        name: displayName,
        description: description,
        logo: logo,
        statusType: statusType,
        raised: raised,
        goal: goal,
        currency: currency,
        progress: progressValue,
        endTime: endTime,
        startTime: startTime,
        website: '',
    }

    const getStatusColor = () => {
        switch (project.statusType) {
            case 'live': return 'bg-[#7DF9FF]';
            case 'upcoming': return 'bg-[#FFFF00]';
            case 'completed': return 'bg-[#2FFF2F]';
            default: return 'bg-[#FFF9F0]';
        }
    };

    const categoryStyle = getCategoryStyle(category);

    return (
        <Link to={`/projects/${presale.address}`}>
            <div className="relative border-4 border-black p-6 bg-[#FFF9F0] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 group cursor-pointer h-full flex flex-col">
                {/* Status indicator */}
                <div className={`absolute top-0 right-0 w-4 h-4 border-2 border-black ${getStatusColor()}`}></div>

                {/* Category badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 ${categoryStyle.bg} border-2 border-black text-xs font-black uppercase tracking-wider`}>
                    {categoryStyle.label}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-8 mb-4">
                    {presale.requiresWhitelist && (
                        <span className="border-2 border-black bg-[#FFB3C1] px-3 py-1 text-xs font-black uppercase tracking-wider">
                            Whitelist Only
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="w-14 h-14 border-2 border-black">
                        <AvatarImage src={logo} alt={`${project.name} logo`} />
                        <AvatarFallback className="text-lg font-black uppercase">
                            {project.name.slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-2xl font-black uppercase tracking-tight leading-tight break-words">
                            {project.name}
                        </h3>
                    </div>
                </div>

                {/* Social icons */}
                <div className="flex items-center gap-2 mb-4">
                    {socials.twitter && socials.twitter !== "#" && (
                        <a
                            href={socials.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                        >
                            <Twitter className="w-4 h-4" />
                        </a>
                    )}
                    {socials.telegram && socials.telegram !== "#" && (
                        <a
                            href={socials.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </a>
                    )}
                    {socials.discord && socials.discord !== "#" && (
                        <a
                            href={socials.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                        </a>
                    )}
                    {socials.website && socials.website !== "#" && (
                        <a
                            href={socials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                        </a>
                    )}
                </div>

                <p className="font-medium mb-6 min-h-[3rem]">{description}</p>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black uppercase tracking-wider">PROGRESS</span>
                        <span className="text-sm font-black">{project.progress.toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-white border-2 border-black h-4">
                        <div
                            className="bg-black h-full transition-all"
                            style={{ width: `${project.progress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-bold">{project.raised.toLocaleString()} {project.currency}</span>
                        <span className="text-xs font-bold">{project.goal.toLocaleString()} {project.currency}</span>
                    </div>
                </div>

                <div className="mt-auto">

                    {project.statusType === 'live' && project.endTime && (
                        <div className="pt-6 border-t-2 border-black">
                            <CountdownTimer targetDate={project.endTime} />
                            <button className="w-full mt-4 bg-[#7DF9FF] text-black h-12 font-black uppercase text-sm tracking-wider border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                PARTICIPATE
                            </button>
                        </div>
                    )}

                    {project.statusType === 'upcoming' && project.startTime && (
                        <div className="pt-6 border-t-2 border-black">
                            <CountdownTimer targetDate={project.startTime} isStart={true} />
                            <button className="w-full mt-4 bg-[#FFFF00] text-black h-12 font-black uppercase text-sm tracking-wider border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                NOTIFY ME
                            </button>
                        </div>
                    )}

                    {project.statusType === 'completed' && (
                        <div className="pt-6 border-t-2 border-black text-center">
                            <p className="font-black uppercase text-sm tracking-wider mb-2">PROJECT COMPLETED</p>
                            <button className="text-sm font-black uppercase underline hover:no-underline">VIEW RESULTS →</button>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
