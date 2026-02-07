"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, CheckCircle, Clock, TrendingDown, TrendingUp, X, Activity, Target, ShieldCheck, Calendar } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard"; // Import GlassCard

// Helper to clean up messy coin symbols (e.g. TRXUSDTUSD -> TRX)
const cleanSymbol = (symbol: string | null | undefined) => {
    if (!symbol) return "N/A";
    return symbol
        .replace(/USDTUSD$/i, '')
        .replace(/USDT$/i, '')
        .replace(/USD$/i, '')
        .toUpperCase();
};

const formatPrice = (price: number, currency: string) => {
    if (price === 0) return `${currency}0.00`;

    // Choose precision based on price value
    let decimals = 2;
    if (price < 0.0001) decimals = 8;
    else if (price < 1) decimals = 4;

    return `${currency}${price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals
    })}`;
};

const safeFormatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";

        // Use Intl.DateTimeFormat for reliable IST formatting
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata'
        }).format(date).replace(',', '');
    } catch (e) {
        console.error(e);
        return "Invalid Date";
    }
};

interface PredictionCardProps {
    pred: any;
    isStock: boolean;
    initialOpen?: boolean;
}

export function PredictionCard({ pred, isStock, initialOpen = false }: PredictionCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Auto-open if linked from dashboard
    useEffect(() => {
        if (initialOpen) {
            setIsOpen(true);
        }
    }, [initialOpen]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const normalizedTrend = (pred.trend || pred.signal || "").toUpperCase();
    const isBullish = normalizedTrend === "UP" || normalizedTrend === "BUY";
    const statusColor = pred.status === 'completed' ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10';
    const trendColor = isBullish ? 'text-green-400' : 'text-red-400';
    const borderColor = isBullish ? 'hover:border-green-500/30' : 'hover:border-red-500/30';
    const currency = isStock ? '₹' : '$';

    // Ensure prices are numbers and handle edge cases
    const currentPrice = Number(pred.current_price) || 0;
    const predictedPrice = Number(pred.predicted_price) || 0;
    const changePercent = Number(pred.prediction_change_percent) || 0;
    const formattedChange = (changePercent >= 0 ? "+" : "") + Math.abs(Number(changePercent)).toFixed(2) + "%";

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsOpen(true)}
                className="cursor-pointer"
            >
                <GlassCard className={`relative flex flex-col p-6 h-full transition-all duration-300 ${borderColor}`}>
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isBullish ? 'from-green-500 to-transparent' : 'from-red-500 to-transparent'}`} />

                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 z-10 gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="font-black text-xl md:text-2xl text-foreground tracking-tight truncate">
                                    {cleanSymbol(pred.stock_name || pred.stockname || pred.coin || pred.coin_name)}
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 bg-muted/50 border border-border/50 shrink-0 ${trendColor}`}>
                                    {isBullish ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {pred.trend || pred.signal || "N/A"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground font-mono">
                                <span className="px-2 py-0.5 rounded-full bg-muted/50 border border-border/50 uppercase">
                                    {pred.timeframe || "4H"}
                                </span>
                                <span>CONFIDENCE: <span className="text-foreground font-bold">{pred.confidence || pred.accuracy_percent || 0}%</span></span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Small Glowing Brain Icon */}
                            <div className={`relative flex items-center justify-center p-1.5 rounded-xl border bg-background/50 backdrop-blur-md shadow-[0_0_15px_-3px] transition-all duration-300 ${isBullish ? 'border-green-500/30 shadow-green-500/30' : 'border-red-500/30 shadow-red-500/30'}`}>
                                <BrainCircuit className={`w-4 h-4 md:w-5 md:h-5 ${isBullish ? 'text-green-500' : 'text-red-500'}`} />
                                <div className={`absolute inset-0 rounded-xl opacity-20 blur-[8px] ${isBullish ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>

                            <div className={`p-1.5 rounded-xl border border-transparent ${statusColor}`}>
                                {pred.status === 'completed' ? <CheckCircle size={18} /> : <Clock size={18} />}
                            </div>
                        </div>
                    </div>

                    {/* Prices */}
                    <div className="mt-auto space-y-4 z-10">
                        <div className="grid grid-cols-2 gap-px bg-border/20 rounded-2xl overflow-hidden border border-border/20">
                            <div className="bg-muted/30 p-4">
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Current</div>
                                <div className="font-mono text-lg text-foreground font-medium">
                                    {formatPrice(currentPrice, currency)}
                                </div>
                            </div>
                            <div className="bg-muted/30 p-4 text-right">
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Target</div>
                                <div className={`font-mono text-lg font-bold ${trendColor}`}>
                                    {formatPrice(predictedPrice, currency)}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-2">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Target Date</div>
                            <div className="text-xs font-mono text-muted-foreground">
                                {safeFormatDate(pred.predicted_time_ist || pred.prediction_time_ist || pred.predicted_time || pred.prediction_valid_till_ist)}
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Detailed Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl shadow-primary/20"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors z-50"
                            >
                                <X size={14} />
                            </button>

                            <div className="p-5 md:p-6">
                                {/* Modal Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-xl border bg-background/50 shadow-lg ${isBullish ? 'border-green-500/20 shadow-green-500/10' : 'border-red-500/20 shadow-red-500/10'}`}>
                                        <BrainCircuit size={20} className={isBullish ? 'text-green-500' : 'text-red-500'} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground capitalize leading-tight truncate">
                                            {cleanSymbol(pred.stock_name || pred.coin || pred.coin_name)} Analysis
                                        </h2>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${isBullish ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                {pred.trend || pred.signal || "N/A"}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border bg-white/5 border-white/10 text-muted-foreground">
                                                {pred.timeframe || "4H"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                                            <Activity size={10} />
                                            Current
                                        </div>
                                        <div className="text-xl md:text-2xl font-black font-mono leading-none">
                                            {formatPrice(currentPrice, currency)}
                                        </div>
                                    </div>
                                    <div className={`p-3.5 rounded-xl border flex flex-col gap-1 ${isBullish ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                                            <Target size={10} className={trendColor} />
                                            Target
                                        </div>
                                        <div className={`text-xl md:text-2xl font-black font-mono leading-none ${trendColor}`}>
                                            {formatPrice(predictedPrice, currency)}
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Stats Table */}
                                <div className="space-y-1.5 mb-3">
                                    <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 items-center">
                                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                                            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-primary">
                                                <Activity size={12} />
                                            </div>
                                            Change
                                        </div>
                                        <div className={`text-sm font-black font-mono ${trendColor}`}>
                                            {formattedChange}
                                        </div>
                                    </div>

                                    <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 items-center">
                                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                                            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-red-500">
                                                <ShieldCheck size={12} />
                                            </div>
                                            Stop Loss
                                        </div>
                                        <div className="text-sm font-black font-mono text-foreground">
                                            {formatPrice(Number(pred.stop_loss_price || pred.stop_loss || 0), currency)}
                                        </div>
                                    </div>

                                    <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 items-center">
                                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                                            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-amber-500">
                                                <TrendingUp size={12} />
                                            </div>
                                            Regime
                                        </div>
                                        <div className="text-[10px] font-black tracking-widest uppercase text-foreground bg-white/5 px-2 py-1 rounded">
                                            {pred.market_regime || "TRENDING"}
                                        </div>
                                    </div>

                                    {/* New Ensemble Indicators */}
                                    {pred.indicators && (
                                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                                            <div className="flex justify-between p-2 rounded-lg bg-primary/5 border border-primary/10 items-center">
                                                <span className="text-[9px] text-primary font-bold uppercase tracking-wider">MACD Hist</span>
                                                <span className="text-[10px] font-mono font-bold text-foreground">{pred.indicators.macd}</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded-lg bg-secondary/5 border border-secondary/10 items-center">
                                                <span className="text-[9px] text-secondary font-bold uppercase tracking-wider">Volatility</span>
                                                <span className="text-[10px] font-mono font-bold text-foreground">{pred.indicators.volatility}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Timeline Section */}
                                <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 mb-3">
                                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold tracking-widest uppercase text-indigo-400">
                                        <Calendar size={12} />
                                        Timeline (IST)
                                    </div>
                                    <div className="flex justify-between items-center text-xs md:text-sm">
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Gen</div>
                                            <div className="font-black font-mono leading-none">{safeFormatDate(pred.created_at || pred.prediction_time)}</div>
                                        </div>
                                        <div className="h-6 w-px bg-white/10" />
                                        <div className="space-y-1 text-right">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Exp</div>
                                            <div className="font-black font-mono text-primary leading-none">{safeFormatDate(pred.prediction_valid_till_ist || pred.valid_till || pred.predicted_time)}</div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-3 rounded-xl bg-foreground text-background font-black tracking-tight hover:opacity-90 transition-opacity text-sm uppercase"
                                >
                                    Close Analysis
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
