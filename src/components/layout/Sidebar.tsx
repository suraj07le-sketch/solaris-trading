"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Coins, Star, Activity, LogOut, TrendingUp, Store, X, CreditCard, Layers } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { cn } from "@/lib/utils";
import { SolarisIcon } from "@/components/ui/SolarisIcon";
import { Sparkles } from "@/components/ui/sparkles";

import { useTranslations } from "next-intl";


interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { signOut, user } = useAuth();
    const t = useTranslations('Navigation');

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const navItems = useMemo(() => [
        { name: t('dashboard'), href: "/dashboard", icon: LayoutDashboard },
        { name: t('market'), href: "/market", icon: Store },
        { name: t('stocks'), href: "/stocks", icon: TrendingUp },
        { name: t('crypto'), href: "/crypto", icon: Coins },
        { name: t('watchlist'), href: "/watchlist", icon: Star },
        { name: t('ipo'), href: "/ipo", icon: TrendingUp },
        { name: t('mutualFunds'), href: "/mutual-funds", icon: Layers },
        { name: t('predictions'), href: "/predictions", icon: Activity },
        { name: t('billing'), href: "/billing", icon: CreditCard },
    ], [t]);

    if (!isMounted) return null;

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-background/95 backdrop-blur-xl border-r border-border flex flex-col justify-between p-8 transition-transform duration-300 shadow-2xl",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    "md:translate-x-0"
                )}
            >

                {/* Logo & Brand */}
                <div className="flex flex-col gap-3 mb-16 transition-all w-full">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1">
                            <div className="relative">
                                <SolarisIcon className="w-10 h-10 text-primary flex-shrink-0" />
                                <div className="absolute inset-0 rounded-full border-2 border-primary/30 opacity-0 hover:opacity-100 hover:scale-125 transition-all duration-300" />
                            </div>
                            <h1 className="text-2xl font-black text-gradient">
                                SHURSUNT
                            </h1>
                        </div>

                        {/* Mobile Close Button (In Flow) */}
                        <button
                            onClick={onClose}
                            className="p-2 bg-black/20 hover:bg-red-500/10 rounded-full border border-white/10 hover:border-red-500/50 transition-all duration-300 md:hidden group hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95 flex-shrink-0 ml-2 -translate-y-1"
                            title="Close Sidebar"
                        >
                            <X size={20} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                        </button>
                    </div>
                    <div className="pl-1">
                        <p className="text-[10px] text-muted-foreground tracking-[0.4em] font-black uppercase opacity-60 leading-tight">
                            {t.rich('tagline', {
                                br: () => <br />
                            })}
                        </p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (window.innerWidth < 1024) onClose?.();
                                }}
                            >
                                <div className={cn(
                                    "relative px-4 py-3 group cursor-pointer rounded-xl transition-all duration-300 overflow-hidden",
                                    isActive ? "bg-primary/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-primary/10" : "hover:bg-white/5 hover:text-foreground border border-transparent"
                                )}>
                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                    {/* Active/Hover Indicator Line */}
                                    <div className={cn(
                                        "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-primary transition-all duration-300",
                                        isActive ? "h-6 opacity-100" : "h-0 opacity-0 group-hover:h-4 group-hover:opacity-100"
                                    )} />

                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 border border-primary/10 rounded-xl"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}

                                    <div className="relative flex items-center gap-3 z-10">
                                        <div className="relative">
                                            <item.icon
                                                className={cn(
                                                    "w-5 h-5 transition-all duration-300",
                                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                                )}
                                            />
                                            {/* Glow effect */}
                                            {isActive && (
                                                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse" />
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                "font-medium transition-all duration-300",
                                                isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                                            )}
                                        >
                                            {item.name}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings / User Menu */}
                <div className="pt-6 border-t border-border space-y-4">




                    <div className="px-4">
                        <ThemeSelector variant="sidebar" />
                    </div>
                    {user && (
                        <Link
                            href="/settings"
                            onClick={() => {
                                if (window.innerWidth < 1024) onClose?.();
                            }}
                        >
                            <div className="relative px-4 py-3 group cursor-pointer rounded-xl transition-all duration-300 hover:bg-primary/5 overflow-hidden">
                                {/* Gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                {/* Thin shine line on left */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-primary group-hover:h-8 transition-all duration-300 rounded-r-full" />
                                {pathname === "/settings" && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-primary/10 rounded-xl"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <div className="relative flex items-center gap-3">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-[10px] font-black text-primary">
                                                {user?.email?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {/* Avatar glow */}
                                        <div className={cn(
                                            "absolute inset-0 rounded-full bg-primary/30 blur-md opacity-0 transition-all duration-300",
                                            pathname === "/settings" ? "opacity-100 scale-150" : "group-hover:opacity-60 group-hover:scale-125"
                                        )} />
                                    </div>
                                    <span
                                        className={cn(
                                            "font-medium transition-all duration-300",
                                            pathname === "/settings" ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                        )}
                                    >
                                        {t('settings')}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )}

                    {!user && (
                        <div className="px-2">
                            <Link href="/login">
                                <HoverBorderGradient
                                    containerClassName="rounded-xl w-full"
                                    className="flex items-center gap-3 px-4 py-3 w-full text-primary bg-primary/10 hover:bg-primary/20 transition-all shadow-lg shadow-primary/5"
                                >
                                    <Sparkles sparklesCount={10} sparklesColor="#ff9f1c">
                                        <div className="flex items-center gap-3">
                                            <LogOut className="w-5 h-5" />
                                            <span className="text-sm font-black uppercase tracking-tight">{t('login')}</span>
                                        </div>
                                    </Sparkles>
                                </HoverBorderGradient>
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
