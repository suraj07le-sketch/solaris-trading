import { Coin } from "@/types";
import { ArrowUpRight, ArrowDownRight, Plus, Brain, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LocalStorage } from "@/lib/storage";
import AssetIcon from "./AssetIcon";
import "crypto-icons/font.css";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/aceternity/SpotlightCard";
import { TiltCard } from "@/components/ui/tilt-card";
import { MagneticCard } from "@/components/ui/magnetic-button";
import { Sparkles } from "@/components/ui/sparkles";
import { HoverScale } from "@/components/ui/shine-effect";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

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

    // Generate prediction by navigating to the predictions page
    const handlePrediction = useCallback((coin: Coin) => {
        if (!user) {
            toast.error("Please login to use AI features.");
            return;
        }

        // Navigate immediately to the predictions page with the necessary parameters
        router.push(`/predictions?predict=${coin.symbol.toUpperCase()}&type=${assetType}&timeframe=4h&source=${source}`);
    }, [user, assetType, router, source]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {coins.map((coin, index) => {
                const isPositive = coin.price_change_percentage_24h >= 0;

                return (
                    <TiltCard
                        key={`${assetType}-${coin.symbol}-${coin.id ?? index}`}
                        className="group cursor-pointer"
                        tiltStrength={8}
                        perspective={1000}
                        glareEffect={true}
                    >
                        <HoverBorderGradient
                            containerClassName="rounded-3xl w-full h-full shadow-xl"
                            className="w-full h-full bg-transparent p-0 rounded-3xl"
                            as="div"
                            duration={3}
                        >
                            <SpotlightCard
                                className="h-full p-4 transition-all duration-300 rounded-3xl border-0"
                                spotlightColor="hsl(var(--primary) / 0.15)"
                                fillColor="hsl(var(--primary) / 0.05)"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />

                                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                    {/* Top Row: Info & Actions */}
                                    <div className="flex justify-between items-start gap-2 w-full">
                                        <div className="flex gap-3 md:gap-4 items-center min-w-0">
                                            <div className="relative">
                                                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-card/50 flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.2)] group-hover:shadow-[0_0_25px_rgba(var(--primary),0.4)] transition-shadow duration-300">
                                                    <AssetIcon
                                                        asset={coin}
                                                        size={36}
                                                        type={assetType}
                                                    />
                                                </div>
                                                <div className="absolute inset-0 rounded-full border-2 border-primary/30 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <HoverScale scale={1.05} duration={150}>
                                                    <h3 className="text-base md:text-lg font-black tracking-tight text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                                                        {coin.symbol.toUpperCase()}
                                                    </h3>
                                                </HoverScale>
                                                <p className="text-[10px] md:text-xs text-muted-foreground font-medium truncate group-hover:text-foreground transition-colors">
                                                    {coin.name}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                                            <Sparkles
                                                sparklesCount={15}
                                                sparklesColor="#ff9f1c"
                                                sparkleSize={3}
                                            >
                                                <button
                                                    className={cn(
                                                        "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black transition-all duration-300 shadow-sm z-20 hover:scale-110 hover:shadow-lg hover:shadow-primary/30",
                                                        generatingPrediction === coin.id && "opacity-50 cursor-not-allowed"
                                                    )}
                                                    title="AI Prediction"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePrediction(coin);
                                                    }}
                                                    disabled={generatingPrediction === coin.id}
                                                >
                                                    {generatingPrediction === coin.id ? (
                                                        <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                                                    ) : (
                                                        <Brain size={16} strokeWidth={2} />
                                                    )}
                                                </button>
                                            </Sparkles>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (watchlistIds.has(coin.id)) return;

                                                    if (!user) {
                                                        toast.error("Please login to use watchlist");
                                                        return;
                                                    }

                                                    try {
                                                        const localResult = LocalStorage.addToWatchlist(user.id, coin, assetType);

                                                        if (!localResult) {
                                                            toast.error("Item already in your watchlist!");
                                                            return;
                                                        }

                                                        toast.success("Added to Watchlist!");
                                                        onWatchlistChange?.();
                                                        setWatchlistIds(prev => new Set([...prev, coin.id]));

                                                        const { supabase } = await import("@/lib/supabase");
                                                        supabase.from('watchlist').insert({
                                                            user_id: user.id,
                                                            coin_id: coin.id,
                                                            coin_data: coin,
                                                            asset_type: assetType
                                                        } as any).then(({ error }: any) => {
                                                            if (error) {
                                                                console.error("Supabase Backup Sync Failed:", error);
                                                                toast.error("Failed to sync with cloud.");
                                                                setWatchlistIds(prev => {
                                                                    const next = new Set(prev);
                                                                    next.delete(coin.id);
                                                                    return next;
                                                                });
                                                            }
                                                        });
                                                    } catch (err) {
                                                        console.error("Watchlist Error:", err);
                                                    }
                                                }}
                                                disabled={watchlistIds.has(coin.id)}
                                                className={cn(
                                                    "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full transition-all duration-300 shadow-lg z-20",
                                                    "hover:scale-110",
                                                    watchlistIds.has(coin.id)
                                                        ? "bg-green-500/20 text-green-500 cursor-default border border-green-500/30"
                                                        : "bg-primary text-black hover:bg-primary/80 hover:shadow-primary/30"
                                                )}
                                                title={watchlistIds.has(coin.id) ? "Already in Watchlist" : "Add to Watchlist"}
                                            >
                                                {watchlistIds.has(coin.id) ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Price & Stats */}
                                    <div className="mt-4 w-full">
                                        <div className="text-xl md:text-2xl font-black tracking-tight text-foreground mb-0.5 group-hover:text-primary transition-colors duration-300">
                                            {assetType === 'stock' ? '₹' : '$'}
                                            {coin.current_price.toLocaleString()}
                                        </div>

                                        <div className={cn(
                                            "flex items-center gap-0.5 text-[11px] md:text-xs font-bold transition-all duration-300",
                                            isPositive ? 'text-[#00cc88] group-hover:text-[#00ff99]' : 'text-rose-500 group-hover:text-red-400'
                                        )}>
                                            <span className="transform group-hover:scale-125 transition-transform duration-200">
                                                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} /> : <ArrowDownRight className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} />}
                                            </span>
                                            <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </SpotlightCard>
                        </HoverBorderGradient>
                    </TiltCard>
                );
            })}
        </div>
    );
}

export default memo(MarketGridComponent);
