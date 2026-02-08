"use client";

import { useEffect } from "react";
import { Coin } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { motion, useMotionValue, useSpring, useTransform, Variants } from "framer-motion";
import { TrendingUp, TrendingDown, Layers, Activity, ArrowRight, BrainCircuit, Sparkles } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { SolarisIcon } from "@/components/ui/SolarisIcon";
import { useTranslations } from "next-intl";
import { MarketIndices } from "./MarketIndices";
import { MarketActivityBento } from "./MarketActivityBento";
import { HighConvictionPanel } from "./HighConvictionPanel";
import AssetIcon from "./AssetIcon";




function DashboardSkeleton() {
    return (
        <div className="space-y-10 pb-10">
            {/* Header Skeleton */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 solaris-skeleton" />
                    <div className="h-12 w-64 solaris-skeleton" />
                </div>
                <div className="h-6 w-96 solaris-skeleton opacity-70" />
            </div>

            {/* Stats Cards Skeleton - 4 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} role="status" className="solaris-card p-4 animate-pulse w-full h-[200px] flex flex-col justify-between">
                        <div>
                            <div className="h-2.5 bg-white/10 rounded-full w-32 mb-2.5"></div>
                            <div className="w-48 h-2 mb-10 bg-white/10 rounded-full"></div>
                        </div>
                        <div className="flex items-end mt-4 h-full pb-2">
                            <div className="w-full bg-white/10 rounded-t-2xl h-[40%]"></div>
                            <div className="w-full h-[80%] ms-4 bg-white/10 rounded-t-2xl"></div>
                            <div className="w-full bg-white/10 rounded-t-2xl h-[50%] ms-4"></div>
                            <div className="w-full h-[70%] ms-4 bg-white/10 rounded-t-2xl"></div>
                            <div className="w-full bg-white/10 rounded-t-2xl h-[85%] ms-4"></div>
                            <div className="w-full bg-white/10 rounded-t-2xl h-[60%] ms-4"></div>
                            <div className="w-full bg-white/10 rounded-t-2xl h-[75%] ms-4"></div>
                        </div>
                        <span className="sr-only">Loading...</span>
                    </div>
                ))}
            </div>

            {/* Lists Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[1, 2].map(col => (
                    <div key={col} className="space-y-5">
                        <div className="flex justify-between items-center">
                            <div className="h-8 w-48 solaris-skeleton" />
                            <div className="h-8 w-20 solaris-skeleton" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map(row => (
                                <div key={row} className="h-24 solaris-skeleton" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- Dashboard Component ---
export default function ClientDashboard({ initialData }: { initialData: Coin[] }) {
    const { user, loading: authLoading } = useAuth();
    const { data, isLoading, isInitialized, fetchDashboard } = useDashboard();
    const t = useTranslations('Dashboard');

    // React Query handles fetching, staleness, and focus revalidation automatically
    // we just read the data from the context (which uses React Query)

    // Only show skeleton on first load, not subsequent navigations
    if (!isInitialized && isLoading) return <DashboardSkeleton />;

    const { stats, recentPredictions, topWatchlist } = data;

    // Helper to find market data for a watchlist item
    const getPriceData = (coinId: string, symbol: string) => {
        const found = initialData.find(c => c.id === coinId || c.symbol.toLowerCase() === symbol.toLowerCase());
        return found || null;
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1 // Cinematic stagger
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6 pb-4"
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <SolarisIcon className="w-10 h-10 text-orange-500" />
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground drop-shadow-[0_0_15px_rgba(var(--foreground),0.2)]">
                            {t('overview')}<span className="text-secondary">.</span>
                        </h1>
                    </div>
                </div>

                {/* Pill Navigation (Visual Only for now, acts as filter/status) */}
                <div className="pill-nav">
                    <div className="pill-tab active">{t('overview')}</div>
                    <div className="pill-tab">{t('liveMarket')}</div>
                </div>
            </motion.div>

            {/* Market Indices (Nifty 50 & Sensex) */}
            <motion.div variants={itemVariants}>
                <MarketIndices />
            </motion.div>

            {/* 1. Portfolio Stats Cards - Solaris Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* 1. Crypto All */}
                <motion.div variants={itemVariants}>
                    <div className="solaris-card h-full p-3 md:p-4 flex flex-col justify-between group relative overflow-hidden hover:border-orange-500/50">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-[50px] group-hover:bg-orange-500/20 transition-all" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-1.5 md:p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                    <Activity className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="text-[9px] md:text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest text-right leading-tight max-w-[60px] md:max-w-none">{t('allCrypto').toUpperCase()}</div>
                            </div>
                        </div>
                        <div className="relative z-10 flex-1 flex flex-col justify-center min-h-[60px]">
                            <div className="text-2xl md:text-3xl font-mono font-bold tracking-tighter text-foreground truncate">
                                {stats.totalCrypto.toLocaleString()}
                            </div>
                            <div className="text-[9px] md:text-[10px] font-medium text-muted-foreground truncate">{t('availableAssets')}</div>
                        </div>
                        <Link href="/crypto" className="mt-2 md:mt-4 flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-orange-500 hover:text-foreground transition-colors">
                            {t('viewMarket')} <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        </Link>
                    </div>
                </motion.div>

                {/* 2. Crypto Watchlist */}
                <motion.div variants={itemVariants}>
                    <div className="solaris-card h-full p-3 md:p-4 flex flex-col justify-between group relative overflow-hidden hover:border-pink-500/50">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-[50px] group-hover:bg-pink-500/20 transition-all" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-1.5 md:p-2 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="text-[9px] md:text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest text-right leading-tight max-w-[60px] md:max-w-none">{t('myCrypto').toUpperCase()}</div>
                            </div>
                        </div>
                        <div className="relative z-10 flex-1 flex flex-col justify-center min-h-[60px]">
                            <div className="text-2xl md:text-3xl font-mono font-bold tracking-tighter text-foreground truncate">
                                {stats.cryptoCount}
                            </div>
                            <div className="text-[9px] md:text-[10px] font-medium text-muted-foreground truncate">{t('inWatchlist')}</div>
                        </div>
                        <Link href="/watchlist" className="mt-2 md:mt-4 flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-pink-500 hover:text-foreground transition-colors">
                            {t('viewWatchlist')} <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        </Link>
                    </div>
                </motion.div>

                {/* 3. Stock All */}
                <motion.div variants={itemVariants}>
                    <div className="solaris-card h-full p-3 md:p-4 flex flex-col justify-between group hover:border-amber-500/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-[50px] group-hover:bg-amber-500/20 transition-all" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-1.5 md:p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <Layers className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="text-[9px] md:text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest text-right leading-tight max-w-[60px] md:max-w-none">{t('allStocks').toUpperCase()}</div>
                            </div>
                        </div>
                        <div className="relative z-10 flex-1 flex flex-col justify-center min-h-[60px]">
                            <div className="text-2xl md:text-3xl font-mono font-bold tracking-tighter text-foreground truncate">
                                {stats.totalStocks.toLocaleString()}
                            </div>
                            <div className="text-[9px] md:text-[10px] font-medium text-muted-foreground truncate">{t('availableAssets')}</div>
                        </div>
                        <Link href="/stocks" className="mt-2 md:mt-4 flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-amber-500 hover:text-foreground transition-colors">
                            {t('viewMarket')} <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        </Link>
                    </div>
                </motion.div>

                {/* 4. Stock Watchlist */}
                <motion.div variants={itemVariants}>
                    <div className="solaris-card h-full p-3 md:p-4 flex flex-col justify-between group hover:border-yellow-500/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-[50px] group-hover:bg-yellow-500/20 transition-all" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-1.5 md:p-2 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                    <BrainCircuit className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="text-[9px] md:text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest text-right leading-tight max-w-[60px] md:max-w-none">{t('myStocks').toUpperCase()}</div>
                            </div>
                        </div>
                        <div className="relative z-10 flex-1 flex flex-col justify-center min-h-[60px]">
                            <div className="text-2xl md:text-3xl font-mono font-bold tracking-tighter text-foreground truncate">
                                {stats.stockCount}
                            </div>
                            <div className="text-[9px] md:text-[10px] font-medium text-muted-foreground truncate">{t('inWatchlist')}</div>
                        </div>
                        <Link href="/watchlist" className="mt-2 md:mt-4 flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-yellow-500 hover:text-foreground transition-colors">
                            {t('viewWatchlist')} <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Advanced Market Activity (Trending & Most Active) */}
            <motion.div variants={itemVariants} className="mt-4">
                <MarketActivityBento />
            </motion.div>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 2. Today's Predictions */}
                <motion.div variants={itemVariants} className="space-y-5">
                    {/* Unified AI High Conviction Picks */}
                    <HighConvictionPanel />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-foreground">
                            <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            {t('aiPredictions').toUpperCase()}
                        </h2>
                        <Link href="/predictions" className="text-xs font-bold px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-center">
                            {t('viewAll').toUpperCase()}
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-24 solaris-skeleton" />)
                        ) : recentPredictions.length > 0 ? (
                            recentPredictions.slice(0, 10).map((pred, i) => {
                                const prediction = pred.signal || pred.trend || 'HOLD';
                                const isBullish = prediction === 'UP' || prediction === 'BUY' || prediction === 'BULLISH';
                                return (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.01 }}
                                        className="flex items-center justify-between p-4 solaris-card border-none hover:bg-white/5 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isBullish ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {isBullish ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg leading-none text-foreground tracking-tight">{pred.name || pred.coin_name || "Unknown"}</div>
                                                <div className="text-xs font-medium text-muted-foreground mt-1.5 flex gap-2 items-center">
                                                    <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{pred.timeframe}</span>
                                                    <span className="text-primary">Conf: {pred.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Target</div>
                                            <div className={`font-mono text-xl font-bold ${isBullish ? 'text-green-500' : 'text-red-500'}`}>
                                                {pred.predictedPrice || pred.predicted_price}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center solaris-card border-dashed">
                                <p className="text-muted-foreground mb-4">{t('noPredictions')}</p>
                                <Link href="/watchlist" className="inline-flex items-center justify-center px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
                                    {t('startPredicting')}
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 3. Top Watchlist Items */}
                <motion.div variants={itemVariants} className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-foreground">
                            <Layers className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
                            {t('topWatchlist').toUpperCase()}
                        </h2>
                        <Link href="/watchlist" className="text-xs font-bold px-4 py-2 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-background transition-all text-center">
                            {t('viewAll').toUpperCase()}
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-20 solaris-skeleton" />)
                        ) : topWatchlist.length > 0 ? (
                            topWatchlist.map((item) => {
                                const marketData = getPriceData(item.coin_id, item.coin_data?.symbol);
                                const price = marketData?.current_price || item.coin_data?.current_price;
                                const change = marketData?.price_change_percentage_24h || item.coin_data?.price_change_percentage_24h || 0;
                                const isPositive = change > 0;
                                const symbol = item.coin_data?.symbol?.toUpperCase() || "UNK";

                                return (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ x: 5 }}
                                        className="flex items-center justify-between p-4 solaris-card border-none hover:bg-white/5 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm border border-border overflow-hidden">
                                                <AssetIcon
                                                    asset={{
                                                        symbol: item.coin_data?.symbol || "UNK",
                                                        name: item.coin_data?.name || "Unknown",
                                                        image: item.coin_data?.image,
                                                        id: item.coin_id
                                                    } as any}
                                                    size={40}
                                                    type={item.asset_type || "crypto"}
                                                    showBackground={false}
                                                />
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground tracking-tight">{item.coin_data?.name || "Unknown"}</div>
                                                <div className="text-xs font-bold text-muted-foreground uppercase mt-0.5 tracking-wider">{item.asset_type || "Crypto"}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-bold text-foreground">
                                                {item.asset_type === 'stock' ? '₹' : '$'}{Number(price || 0).toLocaleString()}
                                            </div>
                                            <div className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-1 ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {isPositive ? '+' : ''}{change.toFixed(2)}%
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="p-12 text-center solaris-card border-dashed">
                                {t('emptyWatchlist')}
                                <Link href="/market" className="block text-secondary font-bold hover:underline mt-2">
                                    {t('exploreMarkets')}
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div >
    );
}
