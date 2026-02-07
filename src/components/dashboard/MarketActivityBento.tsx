"use client";

import { useEffect, useState } from "react";
import { fetchNSEMostActive, fetch52WeekHighLow, StockInsight } from "@/lib/marketInsights";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard"; // Import GlassCard

export function MarketActivityBento() {
    const [activeNSE, setActiveNSE] = useState<StockInsight[]>([]);
    const [breakouts, setBreakouts] = useState<{ high: any[], low: any[] }>({ high: [], low: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchNSEMostActive(), fetch52WeekHighLow()]).then(([nse, highlow]) => {
            setActiveNSE(nse.slice(0, 10));
            setBreakouts(highlow);
            setLoading(false);
        });
    }, []);

    // Fallback UI to check Bento layout
    const demoActive = [
        { symbol: "ZOMATO", stock_name: "Zomato Ltd", change_percent: 4.5 },
        { symbol: "RELIANCE", stock_name: "Reliance Ind", change_percent: 1.2 },
        { symbol: "HDFCBANK", stock_name: "HDFC Bank", change_percent: -0.8 }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Active NSE */}
            <GlassCard className="md:col-span-2 p-8 border-white/10 bg-white/5 backdrop-blur-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Activity className="text-primary" />
                        NSE Most Active
                    </h3>
                    <div className="text-[10px] font-black bg-primary/20 text-primary px-3 py-1 rounded-full uppercase border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.3)]">Live Ticks</div>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {(activeNSE.length > 0 ? activeNSE : demoActive).filter(stock => stock?.symbol).map((stock, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs border border-primary/20 group-hover:scale-110 transition-transform">
                                    {stock.symbol?.substring(0, 2) || "??"}
                                </div>
                                <div>
                                    <p className="font-bold text-white leading-none group-hover:text-primary transition-colors">{stock.symbol || "N/A"}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-black">{stock.stock_name || "Equity"}</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 font-bold ${(stock.change_percent ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {(stock.change_percent ?? 0) >= 0 ? "+" : ""}{stock.change_percent ?? 0}%
                                {(stock.change_percent ?? 0) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Breakout Signals */}
            <GlassCard className="p-8 flex flex-col justify-between border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-foreground">
                        <Zap className="text-primary fill-primary animate-pulse" />
                        Breakouts
                    </h3>
                    <p className="text-xs text-muted-foreground mb-6">52-Week High Signals detected.</p>

                    <div className="space-y-6">
                        {/* High Breakout Wrapper */}
                        <div className="relative pl-10 border-l border-primary/30">
                            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                            <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">High Taper</p>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">IRFC <span className="text-muted-foreground ml-2 text-xs">@ 175.40</span></p>
                            <p className="text-[10px] text-green-400 font-bold mt-1 bg-green-500/10 px-2 py-0.5 rounded-md w-fit border border-green-500/20">+12.4% above mean</p>
                        </div>

                        <div className="relative pl-10 border-l border-white/10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-white/40 rounded-full" />
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Momentum Lock</p>
                            <p className="text-sm font-bold text-white">NHPC <span className="text-muted-foreground ml-2 text-xs">@ 98.20</span></p>
                        </div>
                    </div>
                </div>

                <button className="w-full mt-8 py-4 bg-primary text-black font-black uppercase text-xs rounded-2xl shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] transition-all active:scale-95">
                    Unlock Elite Signals
                </button>
            </GlassCard>
        </div>
    );
}
