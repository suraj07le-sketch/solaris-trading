"use client";

import { useState, useMemo } from "react";
import { useIPOData } from "@/hooks/useQueries";
import { IPOList } from "@/components/ipo/IPOList";
import { motion } from "framer-motion";
import { Rocket, ShieldCheck, Zap } from "lucide-react";

export default function IPOPage() {
    const [category, setCategory] = useState<"all" | "mainboard" | "sme">("all");

    const { data: rawData, error } = useIPOData();

    const fullIpoData = useMemo(() => {
        if (!rawData) return [];

        const allItems: any[] = [];
        const categories = ['active', 'upcoming', 'listed', 'closed'];

        categories.forEach(statusKey => {
            if (Array.isArray(rawData[statusKey])) {
                rawData[statusKey].forEach((item: any) => {
                    const priceValue = item.max_price || item.issue_price || "TBA";
                    allItems.push({
                        company_name: item.name || item.company_name || "Unknown",
                        issue_price_raw: `${priceValue}`,
                        issue_size: item.issue_size || item.size || "TBA",
                        listing_date: item.listing_date,
                        open_date: item.bidding_start_date || item.open_date,
                        close_date: item.bidding_end_date || item.close_date,
                        status: statusKey === 'active' ? 'open' : statusKey,
                        subscription: item.subscription_status || item.subscription,
                        gmp: item.gmp,
                        type: (item.is_sme || (item.name && item.name.includes('(SME)'))) ? "sme" : "mainboard",
                        additional_text: item.additional_text,
                        document_url: item.document_url
                    });
                });
            }
        });

        return allItems;
    }, [rawData]);

    const ipoData = useMemo(() => {
        if (category === "all") return fullIpoData;
        return fullIpoData.filter(ipo => ipo.type === category);
    }, [fullIpoData, category]);

    const loading = !fullIpoData.length && !error;

    return (
        <div className="min-h-screen bg-background p-2 md:p-10">
            {/* Header Hero */}
            <div className="relative mb-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-8 md:p-12 border border-white/5 shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-4"
                    >
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Rocket className="text-primary w-5 h-5" />
                        </div>
                        <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">Institutional Grade</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight"
                    >
                        IPO <span className="text-gradient">Intelligence</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground text-lg mb-8 leading-relaxed"
                    >
                        Unlock listing day potential with our elite sentiment analysis. We track Grey Market Premium (GMP) and institutional subscription patterns in real-time.
                    </motion.p>

                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="text-primary w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase opacity-60">Verified GMP</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="text-primary w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase opacity-60">Instant Analysis</span>
                        </div>
                    </div>
                </div>

                {/* Category Toggle */}
                <div className="mt-6 md:mt-0 md:absolute md:bottom-10 md:right-10 flex gap-2">
                    {["all", "mainboard", "sme"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat as any)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${category === cat
                                ? "bg-primary text-black border-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                                : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            </div>

            {/* List View */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[400px] bg-white/5 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <IPOList data={ipoData} />
            )}
        </div>
    );
}
