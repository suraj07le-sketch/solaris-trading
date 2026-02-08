"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export function MarketIndices() {
    const [indices, setIndices] = useState([
        { name: "Nifty 50", value: 24323.85, change: 156.30, percent: 0.65, status: "UP" },
        { name: "Sensex", value: 79724.12, change: -124.50, percent: -0.16, status: "DOWN" }
    ]);

    useEffect(() => {
        // In a real app, we'd fetch from stock.indianapi.in
        // Simulating live ticks
        const interval = setInterval(() => {
            setIndices(prev => prev.map(idx => {
                const tick = (Math.random() - 0.5) * 5;
                const newValue = idx.value + tick;
                const newChange = idx.change + tick;
                return {
                    ...idx,
                    value: Number(newValue.toFixed(2)),
                    change: Number(newChange.toFixed(2)),
                    percent: Number(((newChange / newValue) * 100).toFixed(2)),
                    status: newChange >= 0 ? "UP" : "DOWN"
                };
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            {indices.map((idx) => (
                <motion.div
                    key={idx.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full md:w-auto md:min-w-[240px] flex-shrink-0 bg-card/40 dark:bg-secondary/20 backdrop-blur-xl border border-border/50 dark:border-white/5 rounded-3xl p-5 shadow-xl"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${idx.status === 'UP' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                <Activity size={14} className={idx.status === 'UP' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{idx.name}</span>
                        </div>
                        <div className={`text-[10px] font-black px-2 py-0.5 rounded-md ${idx.status === 'UP' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                            {idx.status === 'UP' ? '+' : ''}{idx.percent}%
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-foreground">{idx.value.toLocaleString()}</span>
                        <div className={`flex items-center gap-1 text-xs font-bold ${idx.status === 'UP' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {idx.status === 'UP' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {idx.change.toFixed(2)}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
