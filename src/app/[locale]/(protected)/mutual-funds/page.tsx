"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutualFunds } from "@/hooks/useQueries";
import { analyzeFundConviction } from "@/lib/fundLogic";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, PieChart, BrainCircuit } from "lucide-react";

export default function MutualFundExplorer() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const showInitial = debouncedSearch.length < 3;
    const url = showInitial ? null : `https://stock.indianapi.in/mutual_fund_search?query=${debouncedSearch}`;

    const { data: rawFunds, isLoading: isValidating } = useMutualFunds(debouncedSearch);

    const funds = useMemo(() => {
        if (showInitial) {
            return [
                { id: "1", name: "Axis Bluechip Fund - Direct Plan", category: "Equity: Large Cap", nav: 68.45, return_1y: 18.2 },
                { id: "2", name: "Quant Small Cap Fund - Direct", category: "Equity: Small Cap", nav: 215.12, return_1y: 42.5 },
                { id: "3", name: "Parag Parikh Flexi Cap Fund", category: "Equity: Flexi Cap", nav: 72.30, return_1y: 24.8 }
            ];
        }
        return (rawFunds || []).slice(0, 10);
    }, [rawFunds, showInitial]);

    const loading = isValidating && !funds.length;

    return (
        <div className="min-h-screen bg-background p-2 md:p-10">
            {/* Header */}
            <div className="mb-12">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl md:text-6xl font-black text-white mb-4"
                >
                    Mutual <span className="text-gradient">Funds</span>
                </motion.h1>
                <p className="text-muted-foreground text-lg max-w-2xl font-medium">
                    Explore high-yield Indian mutual funds with institutional-grade data and performance tracking.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-12 max-w-3xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search Funds (e.g. Axis Bluechip, Quant Small Cap)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-secondary/30 backdrop-blur-xl border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-2xl"
                />
            </div>

            {/* Fund Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {funds.map((fund: any, idx: number) => {
                        const ai = analyzeFundConviction(fund);
                        return (
                            <motion.div
                                key={fund.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group bg-secondary/20 border border-white/5 rounded-3xl p-6 hover:border-primary/30 transition-all"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-primary/10 rounded-2xl relative">
                                        <BrainCircuit className="text-primary w-6 h-6" />
                                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary rounded text-[8px] font-black text-black">
                                            {ai.rating}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">AI Prob | 1Y</p>
                                        <p className="text-lg font-black text-green-400">{ai.probability}% | {fund.return_1y}%</p>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                    {fund.name}
                                </h3>
                                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-6">
                                    {fund.category}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60 mb-1">Current NAV</p>
                                        <p className="text-md font-mono font-bold">₹{fund.nav}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60 mb-1">Risk Profile</p>
                                        <div className="flex items-center justify-end gap-2 text-xs font-bold text-primary">
                                            <Shield size={12} />
                                            {ai.sentiment}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {
                loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )
            }
        </div >
    );
}
