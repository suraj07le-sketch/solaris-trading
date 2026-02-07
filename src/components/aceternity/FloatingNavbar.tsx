"use client";
import React, { useState } from "react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SolarisIcon } from "@/components/ui/SolarisIcon";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { Menu, X, Home, TrendingUp, Sparkles, LogIn } from "lucide-react";

const NAV_ITEMS = [
    { name: "Home", link: "/dashboard", icon: Home },
    { name: "Market", link: "/market", icon: TrendingUp },
    { name: "AI Signals", link: "/predictions", icon: Sparkles },
    { name: "Login", link: "/login", icon: LogIn },
];

export const FloatingNavbar = ({ className }: { className?: string }) => {
    const { scrollYProgress } = useScroll();
    const [visible, setVisible] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    useMotionValueEvent(scrollYProgress, "change", (current) => {
        if (typeof current === "number") {
            let direction = current! - scrollYProgress.getPrevious()!;
            if (scrollYProgress.get() < 0.05) {
                setVisible(true);
            } else {
                if (direction < 0) {
                    setVisible(true);
                } else {
                    setVisible(false);
                }
            }
        }
    });

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{
                    y: visible ? 0 : -100,
                    opacity: visible ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "fixed top-6 inset-x-0 mx-auto max-w-fit z-[5000] px-4 py-2 border border-white/10 rounded-full bg-black/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center space-x-6",
                    className
                )}
            >
                {/* Logo Section */}
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                        <SolarisIcon className="relative w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>
                    <span className="hidden md:block font-bold text-sm tracking-widest text-white uppercase font-mono">
                        SHURSUNT
                    </span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-2">
                    {NAV_ITEMS.map((item, idx) => {
                        const isActive = pathname.startsWith(item.link);
                        return (
                            <Link
                                key={idx}
                                href={item.link}
                                className={cn(
                                    "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 group",
                                    isActive
                                        ? "text-white bg-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] border border-white/5"
                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "w-4 h-4 transition-colors duration-300",
                                        isActive ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" : "group-hover:text-cyan-300"
                                    )}
                                />
                                <span>{item.name}</span>
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Theme & Mobile Toggle */}
                <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                    <ThemeSwitcher />
                    
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </motion.div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="fixed top-24 left-4 right-4 z-[4999] bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl md:hidden flex flex-col gap-2"
                >
                    {NAV_ITEMS.map((item, idx) => (
                        <Link
                            key={idx}
                            href={item.link}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-neutral-300 hover:text-white transition-colors"
                        >
                            <item.icon className="w-5 h-5 text-cyan-400" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
