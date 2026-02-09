"use client";

import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import Tilt from "react-parallax-tilt";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { Prediction } from "@/types/prediction";

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
    const normalizedTrend = (pred.trend || pred.signal || "").toUpperCase();
    const isBullish = normalizedTrend === "UP" || normalizedTrend === "BUY";
    const statusColor = pred.status === 'completed' ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10';
    const trendColor = isBullish ? 'text-green-400' : 'text-red-400';
    const borderColor = isBullish ? 'hover:border-green-500/30' : 'hover:border-red-500/30';
    const currency = isStock ? '₹' : '$';

    // Abstracted content to reuse in both Mobile (No Tilt) and Desktop (Tilt) views
    const CardContent = ({ pred, isStock, trendColor, statusColor, isBullish, currency }: { pred: Prediction, isStock: boolean, trendColor: string, statusColor: string, isBullish: boolean, currency: string }) => (
        <>
            {/* Header */}
            <div className="flex justify-between items-start mb-6 z-10 gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-black text-2xl md:text-3xl text-foreground tracking-tight truncate">
                            {cleanSymbol(pred.stock_name || pred.coin || pred.name)}
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
                        <span>CONFIDENCE: <span className="text-foreground font-bold">{Math.round(Number(pred.confidence || pred.accuracy_percent || 0))}%</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click if any
                            onRepredict?.();
                        }}
                        className={`group/brain relative flex items-center justify-center p-1.5 rounded-xl border bg-background/50 backdrop-blur-md shadow-[0_0_15px_-3px] transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 ${isBullish ? 'border-green-500/30 shadow-green-500/30 hover:shadow-green-500/50' : 'border-red-500/30 shadow-red-500/30 hover:shadow-red-500/50'}`}
                        title="Regenerate Prediction"
                    >
                        <BrainCircuit className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-700 group-hover/brain:rotate-180 ${isBullish ? 'text-green-500' : 'text-red-500'}`} />
                        <div className={`absolute inset-0 rounded-xl opacity-20 blur-[8px] group-hover/brain:opacity-40 transition-opacity ${isBullish ? 'bg-green-500' : 'bg-red-500'}`} />
                    </button>

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
                        {safeFormatDate(pred.predicted_time || pred.prediction_valid_till_ist)}
                    </div>
                </div>
            </div>
        </>
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
