"use client";

import { Check, CreditCard, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard"; // Import GlassCard

export default function BillingPage() {
    const plans = [
        {
            name: "Monthly",
            price: "$100",
            period: "/month",
            description: "Essential trading tools for active traders.",
            features: [
                "Real-time Market Data",
                "Advanced Charts",
                "Crypto Predictions (Basic)",
                "Watchlist (limit 50)",
                "Priority Support"
            ],
            color: "text-blue-500",
            borderColor: "group-hover:border-blue-500/50",
            bgGlow: "bg-blue-500/10",
            buttonStyle: "bg-blue-500 hover:bg-blue-600 text-white"
        },
        {
            name: "Yearly",
            price: "$1000",
            period: "/year",
            description: "Complete ecosystem access for professionals.",
            features: [
                "Everything in Monthly",
                "AI-Powered Predictions",
                "Unlimited Watchlists",
                "Portfolio Analysis",
                "24/7 VIP Support",
                "Save $200 per year"
            ],
            recommended: true,
            color: "text-primary", // Uses global primary (Pink/Purple)
            borderColor: "group-hover:border-primary/50",
            bgGlow: "bg-primary/10",
            buttonStyle: "bg-primary hover:opacity-90 text-primary-foreground"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.4 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto space-y-12 pb-10"
        >
            <motion.div variants={itemVariants} className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                    Upgrade your <span className="text-primary">Experience</span>.
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Unlock the full potential of ShursunT with our premium plans. Real-time data, AI insights, and professional tools at your fingertips.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <motion.div variants={itemVariants} key={plan.name}>
                        <GlassCard className={cn(
                            "relative h-full p-8 flex flex-col group transition-all duration-300 overflow-visible",
                            plan.recommended ? "border-primary/60 shadow-2xl shadow-primary/10" : "hover:border-border/80"
                        )}>
                            {plan.recommended && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-green-500 text-black text-xs font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)] z-20 border border-green-400">
                                    Recommended
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={cn("text-xl font-bold uppercase tracking-widest mb-2", plan.color)}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-foreground tracking-tight">
                                        {plan.price}
                                    </span>
                                    <span className="text-muted-foreground font-medium">
                                        {plan.period}
                                    </span>
                                </div>
                                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-foreground/80">
                                        <div className={cn("mt-0.5 p-0.5 rounded-full", plan.bgGlow)}>
                                            <Check size={12} className={plan.color} strokeWidth={3} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button className={cn(
                                "w-full py-4 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg active:scale-95",
                                plan.buttonStyle
                            )}>
                                Get Started
                            </button>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            <motion.div variants={itemVariants} className="text-center pt-8">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                    Secure Payment by Stripe • Cancel Anytime
                </p>
            </motion.div>
        </motion.div>
    );
}
