"use client";

import { useTrendMonitor } from "@/hooks/useTrendMonitor";
import { useState } from "react";
import { Bell, BellOff, BrainCircuit, CheckCircle, Clock, TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import Tilt from "react-parallax-tilt";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { Prediction } from "@/types/prediction";
import { toast } from "sonner";

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
    pred: Prediction;
    isStock: boolean;
    onRepredict?: () => void;
}

export function PredictionCard({ pred, isStock, onRepredict }: PredictionCardProps) {
    const [monitorEnabled, setMonitorEnabled] = useState(false);
    const symbol = pred.stock_name || pred.coin || pred.name || "";

    // Enable trend monitoring (only for crypto 4h for now as per MVP)
    useTrendMonitor({
        symbol: cleanSymbol(symbol),
        isScript: isStock,
        enabled: monitorEnabled
    });

    const normalizedTrend = (pred.trend || pred.signal || "").toUpperCase();
    const isBullish = normalizedTrend === "UP" || normalizedTrend === "BUY";
    const statusColor = pred.status === 'completed' ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10';
    const trendColor = isBullish ? 'text-green-400' : 'text-red-400';
    const borderColor = isBullish ? 'hover:border-green-500/30' : 'hover:border-red-500/30';
    const currency = isStock ? '₹' : '$';

    // Abstracted content to reuse in both Mobile (No Tilt) and Desktop (Tilt) views
    const CardContent = ({ pred, isStock, trendColor, statusColor, isBullish, currency }: { pred: Prediction, isStock: boolean, trendColor: string, statusColor: string, isBullish: boolean, currency: string }) => (
        <div className="flex flex-col h-full relative z-10">
            {/* Header: Symbol & Status */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-black text-3xl text-foreground tracking-tight leading-none">
                            {cleanSymbol(pred.stock_name || pred.coin || pred.name)}
                        </h3>
                        {/* Status Icon Wrapper */}
                        <div className={`p-1.5 rounded-full border border-current opacity-20 ${trendColor}`}>
                            {isBullish ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                    </div>

                    {/* Timeframe & Action Badges */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-muted/40 text-muted-foreground border border-border/30">
                            {pred.timeframe || "4H"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 border ${isBullish ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {pred.trend || pred.signal || "HOLD"}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMonitorEnabled(!monitorEnabled);
                            toast.info(monitorEnabled ? "Trend alerts disabled" : "Trend alerts enabled (1h frame)");
                        }}
                        className={`p-2 rounded-xl transition-all ${monitorEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/50'}`}
                    >
                        {monitorEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRepredict?.();
                        }}
                        className={`p-2 rounded-xl transition-all text-muted-foreground/50 hover:text-foreground hover:bg-muted/50`}
                    >
                        <BrainCircuit size={16} />
                    </button>

                    <div className={`p-2 rounded-xl ${statusColor}`}>
                        {pred.status === 'completed' ? <CheckCircle size={16} /> : <Clock size={16} />}
                    </div>
                </div>
            </div>

            {/* Metrics Row: Confidence & Alignment */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-0.5">Confidence</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-foreground">{Math.round(Number(pred.confidence || pred.accuracy_percent || 0))}%</span>
                        <div className="h-1.5 w-8 rounded-full bg-muted overflow-hidden relative top-[-2px]">
                            <div
                                className={`h-full rounded-full ${Number(pred.confidence) > 75 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.round(Number(pred.confidence || 0))}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-px h-8 bg-border/40" />

                {(pred as any).market_alignment !== undefined && (
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Sparkles size={10} className="text-yellow-500" /> Alignment
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-lg font-bold ${(pred as any).market_alignment > 70 ? 'text-green-500' : 'text-yellow-500'}`}>
                                {(pred as any).market_alignment}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Prices Section */}
            <div className="mt-auto">
                <div className="relative p-0.5 rounded-2xl bg-gradient-to-b from-border/10 to-transparent">
                    <div className="flex rounded-[14px] bg-card/50 backdrop-blur-sm border border-white/5 divide-x divide-white/5 overflow-hidden">
                        <div className="flex-1 p-3 flex flex-col items-center justify-center bg-white/[0.02]">
                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Entry</span>
                            <span className="font-mono text-base text-foreground/90">
                                {currency}{Number(pred.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex-1 p-3 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className={`absolute inset-0 opacity-10 ${isBullish ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${isBullish ? 'text-green-500' : 'text-red-500'}`}>Target</span>
                            <span className={`font-mono text-xl font-bold ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
                                {currency}{Number(pred.predicted_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer: Date */}
                <div className="flex justify-between items-center px-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Target Time</div>
                    <div className="text-xs font-mono text-muted-foreground">
                        {safeFormatDate(pred.predicted_time || pred.prediction_valid_till_ist)}
                    </div>
                </div>
            </div>
        </div>
    );

    const { isMobile } = usePerformanceTier();

    if (isMobile) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                    group relative flex flex-col p-6 rounded-3xl overflow-hidden h-full
                    bg-card/40 backdrop-blur-xl
                    border border-border/50
                    transition-all duration-300 ${borderColor}
                `}
            >
                {/* Background Gradient - Simplified for Mobile */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isBullish ? 'from-green-500 to-transparent' : 'from-red-500 to-transparent'}`} />

                {/* Content - Same as below but without Tilt wrapper overhead */}
                <CardContent pred={pred} isStock={isStock} trendColor={trendColor} statusColor={statusColor} isBullish={isBullish} currency={currency} />
            </motion.div>
        );
    }

    return (
        <Tilt
            tiltMaxAngleX={3}
            tiltMaxAngleY={3}
            scale={1.02}
            transitionSpeed={450}
            className="h-full"
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                    group relative flex flex-col p-6 rounded-3xl overflow-hidden h-full
                    bg-card/40 backdrop-blur-xl
                    border border-border/50
                    transition-all duration-300 ${borderColor}
                    hover:shadow-2xl hover:shadow-primary/5
                `}
            >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isBullish ? 'from-green-500 to-transparent' : 'from-red-500 to-transparent'}`} />

                <CardContent pred={pred} isStock={isStock} trendColor={trendColor} statusColor={statusColor} isBullish={isBullish} currency={currency} />
            </motion.div>
        </Tilt>
    );
}
