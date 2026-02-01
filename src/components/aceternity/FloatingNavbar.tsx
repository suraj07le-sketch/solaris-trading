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
import { SolarisIcon } from "@/components/ui/SolarisIcon";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

import { Menu, X, Palette, User, Home, TrendingUp, Sparkles, LogIn } from "lucide-react";

export const FloatingNavbar = ({
    className,
}: {
    className?: string;
}) => {
    const { scrollYProgress } = useScroll();
    const [visible, setVisible] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useMotionValueEvent(scrollYProgress, "change", (current) => {
        // Check if current is not undefined and is a number
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
        <>
            <motion.div
                initial={{
                    opacity: 0,
                    y: 0,
                }}
                animate={{
                    y: 0,
                    opacity: 1,
                }}
                transition={{
                    duration: 0.5,
                    ease: "easeOut",
                }}
                style={{
                    backdropFilter: "blur(16px) saturate(180%)",
                }}
                className={cn(
                    "flex max-w-fit fixed top-4 inset-x-0 mx-auto md:left-auto md:right-6 md:mx-0 border border-border/40 rounded-full bg-card/80 shadow-lg z-[5000] px-4 py-2 pr-2 items-center justify-center space-x-4",
                    className
                )}
            >
                {/* Desktop Links - Hidden on Mobile */}
                <div className="hidden md:flex items-center gap-2">
                    <Link href="/dashboard" className="relative px-4 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-primary transition-all duration-200 flex items-center gap-2 hover:bg-muted/50">
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </Link>
                    <Link href="/market" className="relative px-4 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-primary transition-all duration-200 flex items-center gap-2 hover:bg-muted/50">
                        <TrendingUp className="w-4 h-4" />
                        <span>Market</span>
                    </Link>
                    <Link href="/predictions" className="relative px-4 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-primary transition-all duration-200 flex items-center gap-2 hover:bg-muted/50">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Signals</span>
                    </Link>
                    <Link href="/login" className="relative px-4 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-primary transition-all duration-200 flex items-center gap-2 hover:bg-muted/50">
                        <LogIn className="w-4 h-4" />
                        <span>Login</span>
                    </Link>
                </div>

                {/* Mobile Header: Logo/Icon + Brand + Menu Button */}
                <div className="flex md:hidden items-center justify-between w-full  gap-2.5">
                    <div className="flex items-center gap-4">
                        <SolarisIcon className="w-8 h-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
                        <span className="font-bold text-sm tracking-wider text-foreground">SHURSUNT</span>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
                    </button>
                </div>

                {/* Theme Toggle Button (Desktop: Always visible) */}
                <div className="hidden md:block pl-2 border-l border-border/50">
                    <ThemeSwitcher />
                </div>
            </motion.div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: "spring", duration: 0.4 }}
                        className="fixed top-24 right-4 left-4 md:hidden bg-card/90 backdrop-blur-2xl border border-border/50 rounded-2xl p-4 z-[4999] shadow-2xl flex flex-col gap-2"
                    >
                        <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted/50 flex items-center gap-3 text-sm font-bold text-foreground">
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </Link>
                        <Link href="/market" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted/50 flex items-center gap-3 text-sm font-bold text-foreground">
                            <TrendingUp className="w-4 h-4" />
                            <span>Market</span>
                        </Link>
                        <Link href="/predictions" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted/50 flex items-center gap-3 text-sm font-bold text-foreground">
                            <Sparkles className="w-4 h-4" />
                            <span>AI Signals</span>
                        </Link>
                        <Link href="/login" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted/50 flex items-center gap-3 text-sm font-bold text-foreground">
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                        </Link>

                        <div className="h-px bg-border/50 my-1" />

                        <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Theme</span>
                            <ThemeSwitcher />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};


