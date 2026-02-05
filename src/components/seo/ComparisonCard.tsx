"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BrainCircuit, Target, Scale } from "lucide-react";

interface AssetData {
    name: string;
    symbol: string;
    current_price: number;
    predicted_price: number;
    signal: string;
    confidence: number;
    change: number;
}

interface ComparisonCardProps {
    asset1: AssetData;
    asset2: AssetData;
}

export function ComparisonCard({ asset1, asset2 }: ComparisonCardProps) {
    const isAsset1PerformingBetter = Math.abs(asset1.change) > Math.abs(asset2.change);

    return (
        <div className="flex flex-col gap-6 p-1 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                {/* VS Overlay */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-background border border-border shadow-xl">
                    <span className="text-xs font-black tracking-tighter text-muted-foreground">VS</span>
                </div>

                {[asset1, asset2].map((asset, idx) => {
                    const isBullish = (asset.signal || "").toUpperCase() === "BUY" || (asset.signal || "").toUpperCase() === "UP";
                    const isBetter = (idx === 0 && isAsset1PerformingBetter) || (idx === 1 && !isAsset1PerformingBetter);

                    return (
                        <motion.div
                            key={asset.symbol + idx}
                            initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`
                                relative p-6 rounded-[2rem] bg-card/40 backdrop-blur-xl border 
                                transition-all duration-500
                                ${isBetter ? 'border-primary/50 shadow-2xl shadow-primary/5' : 'border-border/50'}
                            `}
                        >
                            {/* Better Tag */}
                            {isBetter && (
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-[10px] font-black tracking-widest text-white rounded-full">
                                    TOP PICK
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight text-foreground">{asset.name}</h3>
                                    <span className="text-xs font-mono text-muted-foreground uppercase">{asset.symbol}</span>
                                </div>
                                <div className={`p-3 rounded-2xl bg-muted/50 border border-border/50 ${isBullish ? 'text-green-500' : 'text-red-500'}`}>
                                    {isBullish ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-background/50 border border-border/20">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Price</div>
                                    <div className="text-xl font-black font-mono">
                                        ${asset.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl border ${isBullish ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                        <Target size={12} className={isBullish ? 'text-green-500' : 'text-red-500'} />
                                        Target Price
                                    </div>
                                    <div className={`text-xl font-black font-mono ${isBullish ? 'text-green-500' : 'text-red-500'}`}>
                                        ${asset.predicted_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">AI Logic</div>
                                        <div className="text-xs font-bold flex items-center gap-1">
                                            <BrainCircuit size={10} className="text-primary" />
                                            {asset.confidence}%
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Sentiment</div>
                                        <div className="text-xs font-bold uppercase">{asset.signal}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Recommendation Footer */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-6 rounded-3xl bg-primary/10 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4"
            >
                <div>
                    <h4 className="font-black text-lg tracking-tight text-foreground flex items-center gap-2">
                        <Scale className="text-primary w-5 h-5" />
                        AI Verdict
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        {isAsset1PerformingBetter ? asset1.name : asset2.name} shows stronger momentum signals and higher relative confidence.
                    </p>
                </div>
                <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/25">
                    Execute Trade
                </button>
            </motion.div>
        </div>
    );
}
