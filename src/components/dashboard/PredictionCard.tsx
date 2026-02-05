"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, CheckCircle, Clock, TrendingDown, TrendingUp, X, Activity, Target, ShieldCheck, Calendar } from "lucide-react";
import { format } from "date-fns";

// Helper to clean up messy coin symbols (e.g. TRXUSDTUSD -> TRX)
const cleanSymbol = (symbol: string | null | undefined) => {
    if (!symbol) return "N/A";
    return symbol
        .replace(/USDTUSD$/i, '')
        .replace(/USDT$/i, '')
        .replace(/USD$/i, '')
        .toUpperCase();
};

const safeFormatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";

    try {
        let date = new Date(dateString);
        // Convert to IST timezone
        if (!isNaN(date.getTime())) {
            const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            return format(istDate, "MMM d, HH:mm");
        }

        const parts = dateString.split(', ');
        if (parts.length === 2) {
            const [datePart, timePart] = parts;
            const [day, month, year] = datePart.split('/').map(Number);
            const [time, period] = timePart.split(' ');
            let [hours, minutes, seconds] = time.split(':').map(Number); // eslint-disable-line @typescript-eslint/no-unused-vars

            if (period?.toLowerCase() === 'pm' && hours < 12) hours += 12;
            if (period?.toLowerCase() === 'am' && hours === 12) hours = 0;

            date = new Date(year, month - 1, day, hours, minutes, 0);
            if (!isNaN(date.getTime())) {
                const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                return format(istDate, "MMM d, HH:mm");
            }
        }
    } catch (e) { console.error(e) }

    return "Invalid Date";
};

interface PredictionCardProps {
    pred: any;
    isStock: boolean;
}

export function PredictionCard({ pred, isStock }: PredictionCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const normalizedTrend = (pred.trend || pred.signal || "").toUpperCase();
    const isBullish = normalizedTrend === "UP" || normalizedTrend === "BUY";
    const statusColor = pred.status === 'completed' ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10';
    const trendColor = isBullish ? 'text-green-400' : 'text-red-400';
    const borderColor = isBullish ? 'hover:border-green-500/30' : 'hover:border-red-500/30';
    const currency = isStock ? '₹' : '$';

    const changePercent = pred.prediction_change_percent || 0;
    const formattedChange = (changePercent >= 0 ? "+" : "") + Number(changePercent).toFixed(2) + "%";

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsOpen(true)}
                className={`
                    group relative flex flex-col p-6 rounded-3xl overflow-hidden
                    bg-card/40 backdrop-blur-xl
                    border border-border/50
                    transition-all duration-300 ${borderColor}
                    hover:shadow-2xl hover:shadow-primary/5
                    cursor-pointer
                `}
            >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isBullish ? 'from-green-500 to-transparent' : 'from-red-500 to-transparent'}`} />

                {/* Header */}
                <div className="flex justify-between items-start mb-6 z-10 gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                            <h3 className="font-black text-2xl md:text-3xl text-foreground tracking-tight truncate">
                                {cleanSymbol(pred.stock_name || pred.stockname || pred.coin || pred.coin_name)}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 bg-muted/50 border border-border/50 shrink-0 ${trendColor}`}>
                                {isBullish ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
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
                                {currency}{Number(pred.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="bg-muted/30 p-4 text-right">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Target</div>
                            <div className={`font-mono text-lg font-bold ${trendColor}`}>
                                {currency}{Number(pred.predicted_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
            </motion.div>

            {/* Detailed Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                            className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/20"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors z-50"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-8">
                                {/* Modal Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`p-4 rounded-2xl border bg-background/50 shadow-lg ${isBullish ? 'border-green-500/20 shadow-green-500/10' : 'border-red-500/20 shadow-red-500/10'}`}>
                                        <BrainCircuit size={32} className={isBullish ? 'text-green-500' : 'text-red-500'} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight text-foreground lowercase first-letter:uppercase">
                                            {cleanSymbol(pred.stock_name || pred.coin || pred.coin_name)} Analysis
                                        </h2>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase border ${isBullish ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                {pred.trend || pred.signal || "N/A"}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase border bg-white/5 border-white/10 text-muted-foreground">
                                                {pred.timeframe || "4H"} Timeframe
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold tracking-widest uppercase">
                                            <Activity size={14} />
                                            Current Price
                                        </div>
                                        <div className="text-2xl font-black font-mono">
                                            {currency}{Number(pred.current_price || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className={`p-6 rounded-3xl border flex flex-col gap-2 ${isBullish ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold tracking-widest uppercase">
                                            <Target size={14} className={trendColor} />
                                            Target Price
                                        </div>
                                        <div className={`text-2xl font-black font-mono ${trendColor}`}>
                                            {currency}{Number(pred.predicted_price || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Stats Table */}
                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 items-center">
                                        <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary">
                                                <Activity size={16} />
                                            </div>
                                            Predicted Change
                                        </div>
                                        <div className={`text-lg font-black font-mono ${trendColor}`}>
                                            {formattedChange}
                                        </div>
                                    </div>

                                    <div className="flex justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 items-center">
                                        <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-red-500">
                                                <ShieldCheck size={16} />
                                            </div>
                                            Stop Loss
                                        </div>
                                        <div className="text-lg font-black font-mono text-foreground">
                                            {currency}{Number(pred.stop_loss_price || pred.stop_loss || 0).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="flex justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 items-center">
                                        <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-amber-500">
                                                <TrendingUp size={16} />
                                            </div>
                                            Market Regime
                                        </div>
                                        <div className="text-xs font-black tracking-widest uppercase text-foreground bg-white/5 px-3 py-1 rounded-full">
                                            {pred.market_regime || "TRENDING"}
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline Section */}
                                <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                                    <div className="flex items-center gap-2 mb-4 text-xs font-bold tracking-widest uppercase text-indigo-400">
                                        <Calendar size={14} />
                                        Prediction Timeline (IST)
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Generated At</div>
                                            <div className="text-sm font-black font-mono">{safeFormatDate(pred.created_at || pred.prediction_time)}</div>
                                        </div>
                                        <div className="h-8 w-px bg-white/10" />
                                        <div className="space-y-1 text-right">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Expires At</div>
                                            <div className="text-sm font-black font-mono text-primary">{safeFormatDate(pred.prediction_valid_till_ist || pred.valid_till || pred.predicted_time)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-4 rounded-2xl bg-foreground text-background font-black tracking-tight hover:opacity-90 transition-opacity"
                                    >
                                        Close Analysis
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

