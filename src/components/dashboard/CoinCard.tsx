"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Plus, BrainCircuit } from "lucide-react";
import { Coin } from "@/types";
import Image from "next/image";
import { getLogoUrl } from "@/lib/imageUtils";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface CoinCardProps {
    coin: Coin;
}

export default function CoinCard({ coin }: CoinCardProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [predicting, setPredicting] = useState(false);

    const priceChangeColor =
        (coin.price_change_percentage_24h ?? 0) > 0 ? "text-green-500" : "text-red-500";
    const Arrow = (coin.price_change_percentage_24h ?? 0) > 0 ? ArrowUp : ArrowDown;

    const router = useRouter(); // Import useRouter

    const addToWatchlist = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            if (confirm("You must be logged in to use the watchlist. Go to login?")) {
                router.push("/login");
            }
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from("watchlist")
                .insert({ user_id: user.id, coin_id: coin.id, coin_data: coin } as any);

            if (error) {
                if (error.code === '23505') {
                    // Unique violation - already added
                    import('sonner').then(({ toast }) => toast.error("Already in watchlist!"));
                }
                else {
                    console.error(error);
                    import('sonner').then(({ toast }) => toast.error("Failed to add to watchlist"));
                }
            } else {
                import('sonner').then(({ toast }) => toast.success("Added to watchlist!"));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePredict = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            if (confirm("You must be logged in to use features. Go to login?")) {
                router.push("/login");
            }
            return;
        }

        setPredicting(true);

        try {
            // Redirect immediately with query param to trigger prediction on destination
            router.push(`/predictions?predict=${coin.symbol.toUpperCase()}&type=${coin.asset_type || 'crypto'}&timeframe=4h&source=market`);

        } catch (err) {
            console.error("Prediction Error:", err);
            alert("Failed to start prediction");
        } finally {
            setPredicting(false);
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative p-6 rounded-2xl glass-card border border-white/10 cursor-pointer overflow-hidden group shadow-xl"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    {(() => {
                        const logoUrl = getLogoUrl(coin);
                        return logoUrl ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/20">
                                <Image
                                    src={logoUrl}
                                    alt={coin.name}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                    unoptimized
                                    style={{ width: "auto", height: "auto" }}
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <span className={`icon icon-${coin.symbol.toLowerCase()} text-lg`} />
                            </div>
                        );
                    })()}
                    <div>
                        <h3 className="font-bold text-lg">{coin.symbol.toUpperCase()}</h3>
                        <span className="text-xs text-muted-foreground">{coin.name}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Predict Button */}
                    <button
                        onClick={handlePredict}
                        disabled={loading || predicting}
                        className="p-2 rounded-full bg-white/5 hover:bg-purple-500 hover:text-white transition-colors"
                        title="AI Prediction"
                    >
                        {predicting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    </button>
                    {/* Watchlist Button */}
                    <button
                        onClick={addToWatchlist}
                        disabled={loading}
                        className="p-2 rounded-full bg-white/5 hover:bg-primary hover:text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="text-2xl font-bold">
                    {coin.asset_type === 'stock' ? '₹' : '$'}{coin.current_price?.toLocaleString() ?? "N/A"}
                </h4>
                <div className={`flex items-center text-sm font-medium ${priceChangeColor}`}>
                    <Arrow className="w-4 h-4 mr-1" />
                    {Math.abs(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                </div>
            </div>

            {/* Mini Chart Background/Overlay Effect - Simplified for now */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </motion.div>
    );
}
