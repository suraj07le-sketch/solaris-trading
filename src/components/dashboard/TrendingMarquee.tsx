"use client";

import { useEffect, useState } from "react";
import { fetchTrendingStocks, StockInsight } from "@/lib/marketInsights";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";

export function TrendingMarquee() {
    const [stocks, setStocks] = useState<StockInsight[]>([]);

    useEffect(() => {
        fetchTrendingStocks().then((data) => {
            // Ensure data is an array before setting state
            setStocks(Array.isArray(data) ? data : []);
        });
    }, []);

    if (!stocks || stocks.length === 0) return null;

    // Double the stocks for seamless loop
    const doubledStocks = [...stocks, ...stocks];

    return (
        <div className="relative w-full overflow-hidden bg-primary/5 border-y border-primary/10 py-3 backdrop-blur-md">
            <div className="flex items-center gap-4 px-6 absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-background to-transparent pr-12">
                <Flame className="text-orange-500 w-5 h-5 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Trending Now</span>
            </div>

            <div
                className="flex items-center gap-12 whitespace-nowrap pl-[200px] animate-marquee will-change-transform"
                style={{ animationDuration: '30s' }}
            >
                {doubledStocks.map((stock, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-sm font-black text-white">{stock.symbol}</span>
                        <span className="text-sm font-mono opacity-60">₹{stock.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                        <div className={`flex items-center gap-1 text-xs font-bold ${stock.change_percent >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {stock.change_percent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(stock.change_percent)}%
                        </div>
                    </div>
                ))}
            </div>

            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        </div>
    );
}
