"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { WatchlistItem } from "@/types";
import { LocalStorage } from "@/lib/storage";
import "crypto-icons/font.css"; // Ensure icons are loaded
import { Trash2, Brain as BrainIcon } from "lucide-react"; // Renamed Brain to likely match usage if needed, or keeping Brain
import { Brain } from "lucide-react";
import Image from "next/image";
import { getLogoUrl } from "@/lib/imageUtils";
import { motion } from "framer-motion";
import { toast } from "sonner"; // Added import

import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import AssetIcon from "@/components/dashboard/AssetIcon";
import { useWatchlist } from "@/hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";

// Sub-component for individual watchlist items
function WatchlistRow({ item, onDelete }: { item: WatchlistItem; onDelete: (id: string) => void }) {
    const { user } = useAuth();
    const router = useRouter();
    const [timeframe, setTimeframe] = useState("4h");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [predicting, setPredicting] = useState(false);

    const handlePredict = () => {
        if (!user) {
            toast.error("Please login to use AI features.");
            return;
        }

        const symbol = (item.coin_data.symbol || "").toUpperCase();
        const type = item.asset_type || 'crypto';

        // Navigate immediately to the predictions page
        router.push(`/predictions?predict=${symbol}&type=${type}&timeframe=${timeframe}&source=watchlist`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-12 gap-4 items-center p-4 bg-card/60 rounded-xl border border-border hover:border-primary/50 transition-colors shadow-lg hover:shadow-xl"
        >
            {/* 1. Identity (Col 1-4) - Icon + Name + Symbol */}
            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                <AssetIcon asset={item.coin_data} size={48} type={item.asset_type} />
                <div>
                    <h3 className="font-bold text-lg leading-none mb-1 text-foreground">{item.coin_data.name}</h3>
                    <span className="text-xs font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded border border-border">
                        {item.coin_data.symbol}
                    </span>
                </div>
            </div>

            {/* 2. Price Data (Col 5-7) - Big Price + Change Tag */}
            <div className="col-span-6 md:col-span-3">
                <div className="text-xs text-muted-foreground mb-1">Price</div>
                <div className="flex flex-col items-start gap-1">
                    <span className="font-mono text-xl font-bold tracking-tight text-foreground">
                        {item.asset_type === 'stock' ? '₹' : '$'}{item.coin_data.current_price?.toLocaleString()}
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${(item.coin_data.price_change_percentage_24h || 0) > 0
                        ? "text-green-500 bg-green-500/10"
                        : "text-red-500 bg-red-500/10"
                        }`}>
                        {(item.coin_data.price_change_percentage_24h || 0) > 0 ? "▲" : "▼"}
                        {Math.abs(item.coin_data.price_change_percentage_24h || 0).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* 3. Stats (Col 8-9) - High/Low Stacked */}
            <div className="col-span-6 md:col-span-2">
                <div className="space-y-1 bg-muted/30 p-2 rounded-lg border border-border">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">High</span>
                        <span className="font-mono text-foreground">{item.asset_type === 'stock' ? '₹' : '$'}{item.coin_data.high_24h?.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-px bg-border" />
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Low</span>
                        <span className="font-mono text-foreground">{item.asset_type === 'stock' ? '₹' : '$'}{item.coin_data.low_24h?.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* 4. Actions (Col 10-12) */}
            <div className="col-span-12 md:col-span-3 flex items-center justify-end gap-2 mt-2 md:mt-0">
                {/* Custom Timeframe Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center justify-between gap-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium hover:bg-muted text-foreground transition-all min-w-[70px]"
                    >
                        {timeframe}
                        <div className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-current opacity-50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <>
                            {/* Backdrop to close on click outside */}
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />

                            <motion.div
                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1 w-24 bg-popover border border-border rounded-lg shadow-xl z-20 overflow-hidden py-1"
                            >
                                {["15m", "1h", "4h", "8h", "1d", "3d", "1w"].map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => {
                                            setTimeframe(tf);
                                            setDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${timeframe === tf ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"}`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </motion.div>
                        </>
                    )}
                </div>

                <button
                    onClick={handlePredict}
                    disabled={predicting}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[90px]"
                >
                    {predicting ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Brain className="w-3 h-3" />
                    )}
                    {predicting ? "..." : "Predict"}
                </button>

                <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div >
    );
}

function WatchlistSkeletonRow() {
    return (
        <div className="grid grid-cols-12 gap-4 items-center p-4 bg-card/60 rounded-xl border border-border">
            {/* 1. Identity (Col 1-4) - Icon + Name + Symbol */}
            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>

            {/* 2. Price Data (Col 5-7) - Big Price + Change Tag */}
            <div className="col-span-6 md:col-span-3 space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-20" />
            </div>

            {/* 3. Stats (Col 8-9) - High/Low Stacked */}
            <div className="col-span-6 md:col-span-2 space-y-2 bg-muted/30 p-2 rounded-lg border border-border">
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <div className="w-full h-px bg-border" />
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>

            {/* 4. Actions (Col 10-12) */}
            <div className="col-span-12 md:col-span-3 flex items-center justify-end gap-2 mt-2 md:mt-0">
                <Skeleton className="h-9 w-[70px] rounded-lg" />
                <Skeleton className="h-9 w-[90px] rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
        </div>
    );
}

const FALLBACK_CRYPTO_IDS = [
    'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple', 'usdc', 'staked-ether', 'dogecoin', 'cardano',
    'avalanche-2', 'tron', 'polkadot', 'chainlink', 'matic-network', 'toncoin', 'shiba-inu', 'litecoin', 'dai', 'bitcoin-cash',
    'uniswap', 'leo-token', 'wrapped-bitcoin', 'okb', 'ethereum-classic', 'monero', 'stellar'
];

// Cache crypto IDs in localStorage for faster checks
const getCryptoIdSet = () => {
    if (typeof window === 'undefined') return new Set(FALLBACK_CRYPTO_IDS);

    const cached = localStorage.getItem('nexus_crypto_ids');
    if (cached) {
        try {
            return new Set(JSON.parse(cached));
        } catch (e) {
            return new Set(FALLBACK_CRYPTO_IDS);
        }
    }

    return new Set(FALLBACK_CRYPTO_IDS);
};

// Initialize crypto ID cache
const initCryptoCache = async () => {
    if (typeof window === 'undefined') return;

    const cached = localStorage.getItem('nexus_crypto_ids');
    if (cached) return;

    try {
        const { data } = await supabase.from('crypto_coins').select('id').limit(100);
        if (data && data.length > 0) {
            const ids = [...FALLBACK_CRYPTO_IDS, ...(data as any[]).map(c => c.id)];
            localStorage.setItem('nexus_crypto_ids', JSON.stringify(ids));
        }
    } catch (e) {
        console.error('Failed to cache crypto IDs');
    }
};

export default function WatchlistPage() {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'stock' | 'crypto'>('stock');

    // Use React Query for data fetching
    const { data: watchlist = [], isLoading: loading } = useWatchlist();

    const [localWatchlist, setLocalWatchlist] = useState<WatchlistItem[]>([]);

    // Sync React Query data to local state for filtering/manipulation
    useEffect(() => {
        if (watchlist) {
            setLocalWatchlist(watchlist);
        }
    }, [watchlist]);

    // Auto-switch tab if one is empty
    useEffect(() => {
        if (!loading && localWatchlist.length > 0) {
            const hasStocks = localWatchlist.some(i => (i.asset_type || 'crypto') === 'stock');
            const hasCrypto = localWatchlist.some(i => (i.asset_type || 'crypto') === 'crypto');

            if (!hasStocks && hasCrypto && activeTab === 'stock') {
                setActiveTab('crypto');
            } else if (hasStocks && !hasCrypto && activeTab === 'crypto') {
                setActiveTab('stock');
            }
        }
    }, [loading, localWatchlist.length, activeTab]); // Added activeTab to deps to prevent loops if state stabilizes

    const filteredWatchlist = localWatchlist.filter(item =>
        (item.asset_type || 'crypto') === activeTab
    );

    // Realtime subscription to keep data fresh
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('watchlist-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'watchlist', filter: `user_id=eq.${user.id}` },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    const fixWatchlistTypes = async (currentWatchlist: WatchlistItem[]) => {
        // Use cached crypto IDs for faster checks
        const cryptoIdSet = getCryptoIdSet();

        let hasUpdates = false;
        const updatedList = currentWatchlist.map(item => {
            const currentType = item.asset_type || 'crypto';
            if (currentType === 'stock' && cryptoIdSet.has(item.coin_id)) {
                hasUpdates = true;
                // Fire and forget Supabase update
                supabase.from('watchlist').update({ asset_type: 'crypto' }).eq('id', item.id)
                    .then(() => {
                        // Invalidate to refresh data cleanly after fix
                        queryClient.invalidateQueries({ queryKey: ['watchlist'] });
                    })
                    .catch(() => { });
                return { ...item, asset_type: 'crypto' as const };
            }
            return item;
        });

        if (hasUpdates) {
            setLocalWatchlist(updatedList);
        }
    };

    useEffect(() => {
        if (!user) return;
        initCryptoCache();
    }, [user]);

    useEffect(() => {
        if (localWatchlist.length > 0 && !loading) {
            fixWatchlistTypes(localWatchlist);
        }
    }, [localWatchlist.length, loading]);

    const handleDelete = async (id: string) => {
        if (!user) return;

        // Optimistic Update
        setLocalWatchlist((prev) => prev.filter((item) => item.id !== id));

        // 1. Delete from LocalStorage (Legacy support)
        const itemToDelete = localWatchlist.find(i => i.id === id);
        if (itemToDelete) {
            LocalStorage.removeFromWatchlist(user.id, itemToDelete.coin_id);
        }

        // 2. Delete from Supabase
        const { error } = await supabase.from("watchlist").delete().eq("id", id);

        if (!error) {
            toast.success("Item removed from watchlist");
            // Invalidate query to ensure sync
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        } else {
            toast.error("Failed to remove item");
            // Revert optimistic update (simplified: just invalidate)
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-48 rounded-xl" />
                </div>
                <div className="grid gap-4">
                    {[...Array(5)].map((_, i) => (
                        <WatchlistSkeletonRow key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    My Watchlist
                </h1>

                <div className="flex items-center p-1 bg-card border border-border rounded-xl w-fit">
                    {(['stock', 'crypto'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary rounded-lg shadow-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 capitalize">{tab === 'stock' ? 'Stocks' : 'Crypto'}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {filteredWatchlist.map((item) => (
                    <WatchlistRow key={item.id} item={item} onDelete={handleDelete} />
                ))}

                {filteredWatchlist.length === 0 && (
                    <div className="text-center text-muted-foreground py-20 bg-card/60 rounded-2xl border border-dashed border-border">
                        <p>No {activeTab}s in your watchlist.</p>
                        <button
                            onClick={() => router.push(activeTab === 'stock' ? '/stocks' : '/crypto')}
                            className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors font-bold text-sm"
                        >
                            Browse {activeTab === 'stock' ? 'Stocks' : 'Crypto'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
