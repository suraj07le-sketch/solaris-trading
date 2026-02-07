"use client";

import AuthForm from "@/components/auth/AuthForm";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
// Removed unused imports
import {
    UserPlus,
    Terminal,
    Sparkles,
    Cpu,
    Shield,
    Zap,
    Globe,
    Network
} from "lucide-react";

function ThemeAdaptiveBackground() {
    const { resolvedTheme } = useTheme();
    const mounted = useMounted();
    // Derived state instead of useEffect to avoid "set-state-in-effect" lint error
    const currentTheme = mounted ? (resolvedTheme || "dark") : "dark";

    const getThemeColors = () => {
        switch (currentTheme) {
            case "light":
                return {
                    bg: "bg-slate-50",
                    bgGradient: "from-slate-100 to-white",
                    accent: "text-indigo-600",
                    accentBg: "bg-indigo-500",
                    glow: "bg-indigo-400/20",
                    border: "border-slate-200",
                    text: "text-slate-800",
                    textMuted: "text-slate-500",
                    cardBg: "bg-white/80",
                    gradient: "from-indigo-500 to-purple-500",
                };
            case "neon":
                return {
                    bg: "bg-black",
                    bgGradient: "from-pink-950 to-black",
                    accent: "text-fuchsia-500",
                    accentBg: "bg-fuchsia-500",
                    glow: "bg-fuchsia-500/20",
                    border: "border-fuchsia-500/30",
                    text: "text-white",
                    textMuted: "text-fuchsia-300/60",
                    cardBg: "bg-pink-950/50",
                    gradient: "from-fuchsia-500 to-pink-500",
                };
            case "cyber":
                return {
                    bg: "bg-slate-950",
                    bgGradient: "from-slate-900 to-slate-950",
                    accent: "text-emerald-400",
                    accentBg: "bg-emerald-400",
                    glow: "bg-emerald-400/20",
                    border: "border-emerald-500/30",
                    text: "text-emerald-50",
                    textMuted: "text-emerald-300/50",
                    cardBg: "bg-slate-900/60",
                    gradient: "from-emerald-500 to-teal-500",
                };
            default:
                return {
                    bg: "bg-[#030305]",
                    bgGradient: "from-slate-950 to-black",
                    accent: "text-violet-500",
                    accentBg: "bg-violet-500",
                    glow: "bg-violet-500/20",
                    border: "border-violet-500/30",
                    text: "text-violet-50",
                    textMuted: "text-violet-300/50",
                    cardBg: "bg-slate-900/60",
                    gradient: "from-violet-500 to-purple-600",
                };
        }
    };

    const colors = getThemeColors();

    return (
        <div className={cn("absolute inset-0 overflow-hidden transition-colors duration-500", colors.bg)}>
            {/* Ambient glow orbs */}
            <motion.div
                className={cn("absolute w-[600px] h-[600px] rounded-full blur-[120px]", colors.glow)}
                animate={{
                    x: [0, 150, 0],
                    y: [0, -80, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                style={{ left: "5%", top: "10%" }}
            />
            <motion.div
                className={cn("absolute w-[500px] h-[500px] rounded-full blur-[100px]", colors.glow.replace("/20", "/15"))}
                animate={{
                    x: [0, -120, 0],
                    y: [0, 60, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                style={{ right: "5%", bottom: "10%" }}
            />
            <motion.div
                className={cn("absolute w-[350px] h-[350px] rounded-full blur-[80px]", colors.glow)}
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{ left: "35%", top: "35%" }}
            />

            {/* Hexagon pattern overlay */}
            <div
                className={cn(
                    "absolute inset-0 opacity-[0.03] transition-opacity duration-500",
                    currentTheme === "light"
                        ? "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE1IDBMMzAgMjZIMFYyNnoiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]"
                        : "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE1IDBMMzAgMjZIMFYyNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]"
                )}
            />

            {/* Animated mesh lines */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="lineGradSignup" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" className={colors.accent.replace("text-", "")} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" className={colors.accent.replace("text-", "")} />
                    </linearGradient>
                </defs>
                {[...Array(6)].map((_, i) => (
                    <motion.path
                        key={i}
                        d={`M ${8 + i * 17} 0 Q ${12 + i * 15} 50 ${10 + i * 18} 100`}
                        stroke="currentColor"
                        strokeWidth="0.5"
                        fill="none"
                        className={colors.accent}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: [0, 1, 0],
                            opacity: [0, 0.4, 0],
                        }}
                        transition={{
                            duration: 10 + i,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.6,
                        }}
                    />
                ))}
            </svg>

            {/* Data stream animations */}
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={`stream-${i}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{
                        opacity: [0, 0.5, 0],
                        x: ["0%", "100vw"],
                    }}
                    transition={{
                        duration: 7 + i * 2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 1.2,
                    }}
                    className={cn("absolute h-[1px] w-[150px] bg-gradient-to-r from-transparent via-current to-transparent", colors.accent)}
                    style={{ top: `${25 + i * 18}%` }}
                />
            ))}

            {/* Floating accent elements */}
            {[
                { Icon: UserPlus, x: 6, y: 12, delay: 0 },
                { Icon: Terminal, x: 90, y: 20, delay: 0.3 },
                { Icon: Network, x: 10, y: 78, delay: 0.6 },
                { Icon: Shield, x: 85, y: 72, delay: 0.9 },
                { Icon: Cpu, x: 48, y: 8, delay: 1.2 },
                { Icon: Sparkles, x: 94, y: 48, delay: 1.5 },
                { Icon: Globe, x: 4, y: 48, delay: 1.8 },
                { Icon: Zap, x: 45, y: 92, delay: 2.1 },
            ].map((item, i) => {
                const Icon = item.Icon;
                return (
                    <motion.div
                        key={i}
                        className={cn("absolute opacity-20", colors.accent)}
                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: item.delay, duration: 0.5 }}
                    >
                        <motion.div
                            animate={{
                                y: [0, -12, 0],
                                rotate: [0, 6, -6, 0],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: item.delay,
                            }}
                        >
                            <Icon size={currentTheme === "light" ? 16 : 20} />
                        </motion.div>
                    </motion.div>
                );
            })}
        </div>
    );
}

function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const mounted = useMounted();

    if (!mounted) return null;

    const themes = [
        { value: "light", label: "Light", icon: "☀️" },
        { value: "dark", label: "Dark", icon: "🌙" },
        { value: "neon", label: "Neon", icon: "✨" },
        { value: "cyber", label: "Cyber", icon: "⚡" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-1 sm:gap-2 px-2 py-1.5"
        >
            <div className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-full border backdrop-blur-sm transition-colors duration-300",
                resolvedTheme === "light"
                    ? "bg-white border-slate-200 shadow-sm"
                    : "bg-slate-800/50 border-white/10"
            )}>
                {themes.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setTheme(t.value)}
                        className={cn(
                            "p-1.5 rounded-full transition-all duration-200 text-xs",
                            theme === t.value
                                ? cn(
                                    resolvedTheme === "light"
                                        ? "bg-indigo-500 text-white"
                                        : resolvedTheme === "neon"
                                            ? "bg-fuchsia-500 text-white"
                                            : resolvedTheme === "cyber"
                                                ? "bg-emerald-500 text-black"
                                                : "bg-violet-500 text-white"
                                )
                                : cn(
                                    resolvedTheme === "light"
                                        ? "text-slate-500 hover:text-slate-700"
                                        : "text-slate-400 hover:text-white"
                                )
                        )}
                        title={t.label}
                    >
                        {t.icon}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

import { useTranslations } from "next-intl";

export default function SignupPage() {
    const mounted = useMounted();
    const { resolvedTheme } = useTheme();
    const t = useTranslations('Auth.decorations');

    if (!mounted) {
        return (
            <div className="relative min-h-screen w-full flex items-center justify-center bg-[#030305]">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    const isLight = resolvedTheme === "light";

    return (
        <div className={cn(
            "relative min-h-screen w-full flex items-center justify-center overflow-hidden transition-colors duration-500 p-4",
            isLight ? "bg-slate-50" : "bg-[#030305]"
        )}>
            <ThemeAdaptiveBackground />
            <ThemeToggle />

            {/* Shine Animation Styles */}
            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                @keyframes text-shine {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                .text-shine {
                    background: linear-gradient(
                        to right,
                        inherit 20%,
                        #fff 30%,
                        #fff 70%,
                        inherit 80%
                    );
                    -webkit-background-clip: text;
                    background-clip: text;
                    background-size: 200% auto;
                    color: transparent;
                    animation: text-shine 3s linear infinite;
                }
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-sm sm:max-w-md"
            >
                <AuthForm mode="signup" />
            </motion.div>

            {/* Decorative elements - responsive */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className={cn(
                    "absolute bottom-4 left-2 sm:bottom-8 sm:left-8 text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.3em] [writing-mode:vertical-lr] transition-colors duration-300 hidden xs:block",
                    isLight ? "text-slate-400" : "text-slate-500"
                )}
            >
                {t('system')}
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={cn(
                    "absolute top-4 right-2 sm:top-8 sm:right-8 text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.3em] items-end flex transition-colors duration-300",
                    isLight ? "text-slate-400" : "text-slate-500"
                )}
            >
                {t('protocol')}
            </motion.div>

            {/* Corner accents - responsive */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className={cn(
                    "absolute top-4 left-4 sm:top-6 sm:left-6 w-12 h-12 sm:w-16 sm:h-16 border-l-2 border-t-2 rounded-tl-lg transition-colors duration-300 hidden sm:block",
                    isLight ? "border-indigo-200" : "border-violet-500/30"
                )}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className={cn(
                    "absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 border-r-2 border-b-2 rounded-br-lg transition-colors duration-300 hidden sm:block",
                    isLight ? "border-indigo-200" : "border-violet-500/30"
                )}
            />
        </div>
    );
}
