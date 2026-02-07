"use client";

import { useEffect, useState } from "react";
import { getHighConvictionPicks, UnifiedPrediction } from "@/lib/aiEngine";
import { motion } from "framer-motion";
import { BrainCircuit, Star, ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard"; // Import GlassCard

import { useRouter } from "next/navigation";

export function HighConvictionPanel() {
    const router = useRouter();
    const [picks, setPicks] = useState<UnifiedPrediction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHighConvictionPicks().then(data => {
            setPicks(data);
            setLoading(false);
        });
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 } // Faster stagger
        }
    };

    const itemVariants = {
        hidden: { x: -10, opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { type: "tween" as const, duration: 0.2 } }
    };

    return (
        <GlassCard className="p-8 relative overflow-hidden border-primary/20 shadow-2xl shadow-primary/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <BrainCircuit className="text-primary w-6 h-6 animate-pulse" />
                        High Conviction Picks
                    </h2>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mt-1 tracking-widest">Cross-Asset AI Consensus</p>
                </div>
                <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black text-primary uppercase shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                    Model: v4-Elite-Ensemble
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4 relative z-10"
            >
                {picks.map((pick, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        onMouseEnter={() => router.prefetch(`/predictions?type=${pick.asset_type || 'crypto'}&symbol=${pick.symbol}`)}
                        onClick={() => router.push(`/predictions?type=${pick.asset_type || 'crypto'}&symbol=${pick.symbol}`)}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center font-black text-primary border border-primary/20">
                                    {pick.symbol?.substring(0, 2) || "??"}
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center shadow-sm">
                                    <ShieldCheck className="text-black w-2.5 h-2.5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{pick.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white/5 rounded-md text-muted-foreground border border-white/5">{pick.asset_type}</span>
                                    <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">{pick.ensemble_consensus}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-0 flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Probability</p>
                                <p className="text-2xl font-black text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">{pick.probability}%</p>
                            </div>
                            <div className="w-px h-10 bg-white/10 hidden sm:block" />
                            <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 border ${pick.prediction === 'UP' || pick.prediction === 'BULLISH' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {pick.prediction}
                                <ArrowUpRight size={14} className={pick.prediction === 'UP' || pick.prediction === 'BULLISH' ? '' : 'rotate-90'} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <button className="w-full mt-8 py-4 border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-black hover:border-primary transition-all shadow-[0_0_20px_transparent] hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] relative z-10">
                Access Elite Alpha Terminal
            </button>
        </GlassCard>
    );
}
