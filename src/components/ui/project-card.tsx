"use client"

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Twitter, Send, Globe, MessageCircle } from "lucide-react";

export type ProjectCategory = 'defi' | 'ai' | 'gaming' | 'infrastructure' | 'meme' | 'other';

export interface ProjectSocials {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
}

export interface Project {
    id: string;
    statusType: 'live' | 'upcoming' | 'completed' | 'idea';
    category?: ProjectCategory;
    logo: string;
    name: string;
    website: string;
    description: string;
    progress: number;
    raised: number;
    currency: string;
    goal: number;
    endTime?: Date;
    startTime?: Date;
    socials?: ProjectSocials;
}

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

export function ProjectCard({ project }: { project: Project }) {
    const getStatusColor = () => {
        switch (project.statusType) {
            case 'live': return 'bg-[#0F59FF]';
            case 'upcoming': return 'bg-[#64FE3E]';
            case 'completed': return 'bg-[#64FE3E]';
            default: return 'bg-[#F7F3EE]';
        }
    };

    const getCategoryStyle = () => {
        switch (project.category) {
            case 'defi': return { bg: 'bg-[#0F59FF]', label: 'DeFi' };
            case 'ai': return { bg: 'bg-[#E879F9]', label: 'AI' };
            case 'gaming': return { bg: 'bg-[#FB923C]', label: 'Gaming' };
            case 'infrastructure': return { bg: 'bg-[#A78BFA]', label: 'Infra' };
            case 'meme': return { bg: 'bg-[#64FE3E]', label: 'Meme' };
            default: return { bg: 'bg-[#D1D5DB]', label: 'Other' };
        }
    };

    const categoryStyle = getCategoryStyle();

    return (
        <div className="relative border-4 border-[#1A1A2E] p-6 bg-[#F7F3EE] shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:shadow-[8px_8px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-[transform,shadow,opacity,colors] duration-200 group cursor-pointer">
            {/* Status indicator */}
            <div className={`absolute top-0 right-0 size-4 border-2 border-[#1A1A2E] ${getStatusColor()}`}></div>

            {/* Category badge */}
            <div className={`absolute top-4 left-4 px-3 py-1 ${categoryStyle.bg} border-2 border-[#1A1A2E] text-xs font-black uppercase tracking-wider`}>
                {categoryStyle.label}
            </div>

            <div className="flex items-center space-x-4 mb-6 mt-8">
                <div className="border-2 border-[#1A1A2E] rounded-full p-1 bg-white">
                    <Avatar className="size-14 border-2 border-[#1A1A2E] rounded-full">
                        <AvatarImage src={project.logo} alt={`${project.name} logo`} />
                        <AvatarFallback className="text-lg font-black uppercase">
                            {project.name.slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-black uppercase tracking-tight leading-tight break-words">
                        {project.name}
                    </h3>
                    <p className="text-sm font-bold mt-1 truncate">{project.website}</p>
                </div>
            </div>

            {/* Social icons */}
            {project.socials && (
                <div className="flex items-center gap-2 mb-4">
                    {project.socials.twitter && (
                        <a
                            href={project.socials.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Twitter"
                            className="size-8 flex items-center justify-center border-2 border-[#1A1A2E] bg-white hover:bg-black hover:text-white transition-colors"
                        >
                            <Twitter className="size-4" />
                        </a>
                    )}
                    {project.socials.telegram && (
                        <a
                            href={project.socials.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Telegram"
                            className="size-8 flex items-center justify-center border-2 border-[#1A1A2E] bg-white hover:bg-black hover:text-white transition-colors"
                        >
                            <Send className="size-4" />
                        </a>
                    )}
                    {project.socials.discord && (
                        <a
                            href={project.socials.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Discord"
                            className="size-8 flex items-center justify-center border-2 border-[#1A1A2E] bg-white hover:bg-black hover:text-white transition-colors"
                        >
                            <MessageCircle className="size-4" />
                        </a>
                    )}
                    {project.socials.website && (
                        <a
                            href={project.socials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Website"
                            className="size-8 flex items-center justify-center border-2 border-[#1A1A2E] bg-white hover:bg-black hover:text-white transition-colors"
                        >
                            <Globe className="size-4" />
                        </a>
                    )}
                </div>
            )}

            <p className="font-medium mb-6 min-h-[3rem]">{project.description}</p>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black uppercase tracking-wider">PROGRESS</span>
                    <span className="text-sm font-black tabular-nums">{project.progress}%</span>
                </div>
                <div className="w-full bg-white border-2 border-[#1A1A2E] h-4">
                    <div
                        className="bg-black h-full transition-[width]"
                        style={{ width: `${project.progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold">{project.raised.toLocaleString()} {project.currency}</span>
                    <span className="text-xs font-bold">{project.goal.toLocaleString()} {project.currency}</span>
                </div>
            </div>

            {project.statusType === 'live' && project.endTime && (
                <div className="pt-6 border-t-2 border-[#1A1A2E]">
                    <CountdownTimer targetDate={project.endTime} />
                    <button className="w-full mt-4 bg-[#0F59FF] text-[#1A1A2E] h-12 font-black uppercase text-sm tracking-wider border-4 border-[#1A1A2E] shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-[transform,shadow,opacity,colors]">
                        PARTICIPATE
                    </button>
                </div>
            )}

            {project.statusType === 'upcoming' && project.startTime && (
                <div className="pt-6 border-t-2 border-[#1A1A2E]">
                    <CountdownTimer targetDate={project.startTime} isStart={true} />
                    <button className="w-full mt-4 bg-[#64FE3E] text-[#1A1A2E] h-12 font-black uppercase text-sm tracking-wider border-4 border-[#1A1A2E] shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-[transform,shadow,opacity,colors]">
                        NOTIFY ME
                    </button>
                </div>
            )}

            {project.statusType === 'completed' && (
                <div className="pt-6 border-t-2 border-[#1A1A2E] text-center">
                    <p className="font-black uppercase text-sm tracking-wider mb-2">PROJECT COMPLETED</p>
                    <button className="text-sm font-black uppercase underline hover:no-underline">VIEW RESULTS →</button>
                </div>
            )}
        </div>
    );
}
