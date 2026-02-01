"use client";

import React from "react";
import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/aceternity/SpotlightCard";
import { SolarisIcon } from "@/components/ui/SolarisIcon";
import { Shield, Globe, Cpu, ArrowRight } from "lucide-react";
import Link from "next/link";

export const AboutSection = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <SpotlightCard
                        className="p-8 md:p-12 border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl"
                        spotlightColor="hsl(var(--primary) / 0.2)"
                        fillColor="hsl(var(--primary) / 0.05)"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase"
                                >
                                    <SolarisIcon className="w-4 h-4" />
                                    <span>About SHURSUNT</span>
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="text-3xl md:text-5xl font-black text-foreground"
                                >
                                    Architecting the Future of Finance
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="text-lg text-muted-foreground leading-relaxed"
                                >
                                    SHURSUNT is not just a trading platform; it is a quantum-grade infrastructure built for those who demand absolute precision. We combine next-generation neural networks with ultra-low latency execution to provide an unfair advantage in global markets.
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all">
                                        Start Trading <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { icon: Cpu, title: "Neural Core Architecture", desc: "Self-optimizing algorithms that adapt to market volatility in real-time." },
                                    { icon: Globe, title: "Global Liquidity Matrix", desc: "Unified access to crypto, forex, and equity markets across 40+ exchanges." },
                                    { icon: Shield, title: "Zero-Trust Security", desc: "Military-grade encryption with decentralized key management." },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 + (i * 0.1) }}
                                        className="group p-4 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-primary/30 transition-all cursor-default"
                                    >
                                        <div className="flex gap-4">
                                            <div className="mt-1 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <item.icon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground leading-snug mt-1">{item.desc}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </SpotlightCard>
                </div>
            </div>

            {/* Ambient Glow */}
            <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        </section>
    );
};
