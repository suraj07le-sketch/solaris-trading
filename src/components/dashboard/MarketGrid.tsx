"use client";

import { Coin } from "@/types";
import { ArrowUpRight, ArrowDownRight, Plus, Brain, Check, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LocalStorage } from "@/lib/storage";
import AssetIcon from "./AssetIcon";
import "crypto-icons/font.css";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// --- Simple Tilt Wrapper ---
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
    const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

    return (
        <motion.div
            style={{ perspective: 1000, rotateX, rotateY }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className={cn("relative group transform-gpu transition-all duration-200 ease-out", className)}
        >
            {children}
        </motion.div>
    );
}

interface MarketGridProps {
    coins: Coin[];
    onSelect?: (symbol: string) => void;
    assetType: 'stock' | 'crypto';
    watchlistIds?: Set<string>;
    onWatchlistChange?: () => void;
    source?: 'market' | 'watchlist'; // Track where predictions are triggered from
}

function MarketGridComponent({
    coins,
    onSelect,
    assetType,
    watchlistIds: initialWatchlistIds,
    onWatchlistChange,
    source = 'market' // Default to market if not specified
}: MarketGridProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [watchlistIds, setWatchlistIds] = useState<Set<string>>(initialWatchlistIds || new Set());

    useEffect(() => {
        if (initialWatchlistIds) {
            setWatchlistIds(initialWatchlistIds);
        } else if (user) {
            const list = LocalStorage.getWatchlist(user.id);
            setWatchlistIds(new Set(list.map(item => item.coin_id)));
        }
    }, [initialWatchlistIds, user]);

    const [generatingPrediction, setGeneratingPrediction] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<{ id: string, count: number, symbol: string } | null>(null);

    // Handle redirection safely after countdown
    useEffect(() => {
        if (countdown && countdown.count <= 0) {
            const { symbol, id } = countdown;
            // Immediate transition
            router.push(`/predictions?generating=true&symbol=${symbol || id}&type=${assetType}&source=${source}`);
            setCountdown(null);
        }
    }, [countdown, router, assetType, source]);

    // Generate prediction using local API
    const handlePrediction = useCallback((coin: Coin) => {
        if (!user) {
            toast.error("Please login to use AI features.");
            return;
        }

        if (generatingPrediction || countdown) {
            toast.error("Please wait for the current action to complete.");
            return;
        }

        // Start 5 second countdown with symbol data
        setCountdown({ id: coin.id, symbol: coin.symbol, count: 5 });

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (!prev || prev.count <= 1) {
                    clearInterval(timer);
                    return { ...prev!, count: 0 }; // Trigger useEffect
                }
                return { ...prev, count: prev.count - 1 };
            });
        }, 1000);

        toast.info(`Starting AI Analysis for ${coin.name} in 5s...`, { duration: 2000 });
    }, [user, generatingPrediction, countdown]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {coins.map((coin, index) => {
                const isPositive = coin.price_change_percentage_24h >= 0;

                return (
                    <TiltCard
                        key={`${assetType}-${coin.symbol}-${coin.id ?? index}`}
                        className="group cursor-pointer h-full"
                    >
                        <GlassCard className="h-full p-5 flex flex-col justify-between hover:bg-white/10 border-white/5 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                {/* Top Row: Info & Actions */}
                                <div className="flex justify-between items-start gap-2 w-full">
                                    <div className="flex gap-3 md:gap-4 items-center min-w-0">
                                        <div className="relative">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 flex items-center justify-center shadow-lg border border-white/10 group-hover:border-primary/50 transition-all duration-300">
                                                <AssetIcon
                                                    asset={coin}
                                                    size={32}
                                                    type={assetType}
                                                />
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base md:text-lg font-black tracking-tight text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                                                {coin.symbol.toUpperCase()}
                                            </h3>
                                            <p className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">
                                                {coin.name}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            className={cn(
                                                "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 bg-white/5 hover:bg-primary hover:text-white border border-white/10",
                                                generatingPrediction === coin.id && "opacity-50 cursor-not-allowed"
                                            )}
                                            title="AI Prediction"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePrediction(coin);
                                            }}
                                            disabled={!!generatingPrediction || !!countdown}
                                        >
                                            {countdown?.id === coin.id ? (
                                                <span className="text-sm font-black">{countdown.count}</span>
                                            ) : generatingPrediction === coin.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Brain size={14} />
                                            )}
                                        </button>
                                        
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (watchlistIds.has(coin.id)) return;
                                                if (!user) {
                                                    toast.error("Please login");
                                                    return;
                                                }
                                                try {
                                                    const localResult = LocalStorage.addToWatchlist(user.id, coin, assetType);
                                                    if (!localResult) {
                                                        toast.error("Already in watchlist!");
                                                        return;
                                                    }
                                                    toast.success("Added!");
                                                    onWatchlistChange?.();
                                                    setWatchlistIds(prev => new Set([...prev, coin.id]));
                                                } catch (err) {
                                                    console.error("Watchlist Error:", err);
                                                }
                                            }}
                                            disabled={watchlistIds.has(coin.id)}
                                            className={cn(
                                                "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 border border-white/10",
                                                watchlistIds.has(coin.id)
                                                    ? "bg-green-500/20 text-green-500 cursor-default"
                                                    : "bg-white/5 hover:bg-white/20 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {watchlistIds.has(coin.id) ? <Check size={14} /> : <Plus size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Row: Price & Stats */}
                                <div className="mt-2 w-full">
                                    <div className="text-xl md:text-2xl font-black tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors">
                                        {assetType === 'stock' ? '₹' : '$'}
                                        {coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                    </div>

                                    <div className={cn(
                                        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg w-fit",
                                        isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                    )}>
                                        <span className="transform group-hover:scale-110 transition-transform">
                                            {isPositive ? <ArrowUpRight className="w-3 h-3" strokeWidth={3} /> : <ArrowDownRight className="w-3 h-3" strokeWidth={3} />}
                                        </span>
                                        <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </TiltCard>
                );
            })}
        </div>
    );
}

export default memo(MarketGridComponent);
