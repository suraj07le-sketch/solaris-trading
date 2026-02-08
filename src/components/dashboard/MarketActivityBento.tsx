"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNSEMostActive, fetch52WeekHighLow, StockInsight } from "@/lib/marketInsights";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";

export function MarketActivityBento() {
    const { data, isLoading } = useQuery({
        queryKey: ['market-activity'],
        queryFn: async () => {
            const [nse, highlow] = await Promise.all([fetchNSEMostActive(), fetch52WeekHighLow()]);
            return {
                activeNSE: nse.slice(0, 10),
                breakouts: highlow
            };
        },
        staleTime: 15 * 60 * 1000, // 15 minutes cache
        retry: 1, // Don't hammer the API if it fails
        refetchOnWindowFocus: false, // Prevent 429s on tab switch
    });

    const activeNSE = data?.activeNSE || [];
    const breakouts = data?.breakouts || { high: [], low: [] };
    const loading = isLoading;

    // Fallback UI to check Bento layout
    const demoActive = [
        { symbol: "ZOMATO", stock_name: "Zomato Ltd", change_percent: 4.5 },
        { symbol: "RELIANCE", stock_name: "Reliance Ind", change_percent: 1.2 },
        { symbol: "HDFCBANK", stock_name: "HDFC Bank", change_percent: -0.8 }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Active NSE */}
            <div className="md:col-span-2 bg-secondary/20 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="text-primary" />
                        NSE Most Active
                    </h3>
                    <div className="text-[10px] font-black bg-primary/20 text-primary px-3 py-1 rounded-full uppercase">Live Ticks</div>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {(activeNSE.length > 0 ? activeNSE : demoActive).filter((stock: any) => stock?.symbol).map((stock: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs">
                                    {stock.symbol?.substring(0, 2) || "??"}
                                </div>
                                <div>
                                    <p className="font-bold text-white leading-none">{stock.symbol || "N/A"}</p>
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
            </div>

            {/* Breakout Signals */}
            <div className="bg-primary/10 backdrop-blur-xl border border-primary/20 rounded-[2rem] p-8 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <Zap className="text-primary fill-primary" />
                        Breakouts
                    </h3>
                    <p className="text-xs text-muted-foreground mb-6">52-Week High Signals detected.</p>

                    <div className="space-y-6">
                        {/* High Breakout Wrapper */}
                        <div className="relative pl-10 border-l border-primary/30">
                            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-primary rounded-full" />
                            <p className="text-[10px] font-black uppercase text-primary mb-1">High Taper</p>
                            <p className="text-sm font-bold text-white">IRFC <span className="text-muted-foreground ml-2">@ 175.40</span></p>
                            <p className="text-[10px] text-green-400 font-bold mt-1">+12.4% above mean</p>
                        </div>

                        <div className="relative pl-10 border-l border-white/10 opacity-60">
                            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-white/40 rounded-full" />
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Momentum Lock</p>
                            <p className="text-sm font-bold text-white">NHPC <span className="text-muted-foreground ml-2">@ 98.20</span></p>
                        </div>
                    </div>
                </div>

                <button className="w-full mt-8 py-4 bg-primary text-black font-black uppercase text-xs rounded-2xl shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:scale-[1.02] transition-all">
                    Unlock Elite Signals
                </button>
            </div>
        </div>
    );
}
