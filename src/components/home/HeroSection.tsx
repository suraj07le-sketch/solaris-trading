"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Zap, Shield, TrendingUp, Bot } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { Starfield } from "@/components/ui/sparkles";
import { Spotlight } from "@/components/aceternity/Spotlight";
import { SolarisIcon } from "@/components/ui/SolarisIcon";
import Link from "next/link";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

// Deterministic values for floating icons to avoid hydration mismatch
const floatingIconConfigs = [
    { left: 25, top: 35, size: 32, duration: 6, delay: 0 },
    { left: 45, top: 28, size: 38, duration: 7, delay: 0.5 },
    { left: 62, top: 45, size: 28, duration: 5, delay: 1 },
    { left: 38, top: 68, size: 42, duration: 8, delay: 1.5 },
];

export function HeroSection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const smoothScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
    const y = useTransform(smoothScroll, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // Mouse position for spotlight effect
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Icons array for mapping
    const icons = useMemo(() => [Zap, Shield, TrendingUp, Bot], []);

    return (
        <div ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Starfield background */}
            <Starfield className="opacity-50" starCount={100} />

            {/* Dynamic spotlight that follows mouse */}
            <motion.div
                className="fixed pointer-events-none z-0"
                style={{
                    left: mousePosition.x,
                    top: mousePosition.y,
                }}
                animate={{
                    x: -8,
                    y: -8,
                }}
                transition={{ type: "tween", duration: 0.1 }}
            >
                <div
                    className="w-20 h-20 rounded-full bg-primary/30 blur-xl"
                    style={{
                        transform: "translate(-50%, -50%)",
                    }}
                />
            </motion.div>

            {/* Animated background orbs */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <motion.div
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px]"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[128px]"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.35, 0.2],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
            </div>

            <motion.div
                style={{ y, opacity }}
                className="relative z-10 container px-4 mx-auto text-center flex flex-col items-center justify-center h-full"
            >
                {/* Spotlight effect */}
                <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />





                {/* New Hero Content */}
                <div className="flex flex-col items-center justify-center z-50 mt-10">
                    {/* Logo Top Center */}
                    <div className="flex items-center gap-5 mb-12">
                        <SolarisIcon className="w-20 h-20 text-primary" />
                        <span className="text-4xl font-bold tracking-widest text-foreground">SHURSUNT</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-foreground px-4 tracking-tight leading-tight mb-2">
                        AI Crypto Analytics &
                    </h1>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-foreground px-4 tracking-tight leading-tight mb-8">
                        Trading Signals. <span className="text-blue-500 animate-pulse">|</span>
                    </h1>

                    <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mt-4 font-medium">
                        Real-time predictions, advanced charting, and AI-driven
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
                        insights for the modern trader.
                    </p>

                    <Link href="/login" className="text-blue-500 font-bold text-lg mb-8 hover:text-blue-400 transition-colors">
                        Experience the future of trading.
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="relative z-50"
                    >
                        <Link href="/login">
                            <button className="bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/20 flex items-center gap-3 px-8 py-3 rounded-full text-sm font-bold shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:scale-105 transition-all duration-300">
                                <Zap className="w-4 h-4 text-primary-foreground fill-current" />
                                <span>Start Trading</span>
                            </button>
                        </Link>
                    </motion.div>
                </div>


                {/* Floating icons */}
                <motion.div
                    className="absolute inset-0 pointer-events-none overflow-hidden -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    {icons.map((Icon, i) => (
                        <motion.div
                            key={i}
                            className="absolute opacity-20"
                            style={{
                                left: `${floatingIconConfigs[i].left}%`,
                                top: `${floatingIconConfigs[i].top}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                rotate: [0, 360],
                                scale: [1, 1.3, 1],
                            }}
                            transition={{
                                duration: floatingIconConfigs[i].duration,
                                repeat: Infinity,
                                delay: floatingIconConfigs[i].delay,
                            }}
                        >
                            <Icon
                                size={floatingIconConfigs[i].size}
                                className="text-primary filter drop-shadow-lg"
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>



            {/* Aurora background effect */}
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_20s_linear_infinite]">
                    <div className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[40%] bg-gradient-to-r from-secondary/10 via-primary/10 to-secondary/10 blur-[80px] rounded-full" />
                </div>
            </div>
        </div>
    );
}

// Shine text component with better visibility
function ShineText({ text }: { text: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative flex flex-col items-center justify-center z-50 text-center"
        >
            <motion.h1
                className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-[linear-gradient(110deg,#b3b3b3,45%,#ffffff,55%,#b3b3b3)] dark:bg-[linear-gradient(110deg,#b3b3b3,45%,#ffffff,55%,#b3b3b3)] bg-[length:250%_100%] pb-2 text-zinc-900 dark:text-transparent"
                style={{
                    backgroundImage: 'linear-gradient(110deg, #18181b 45%, #52525b 55%, #18181b)' // Dark gradient for light mode fallback/override
                }}
                animate={{
                    backgroundPosition: ["-100% 0", "200% 0"],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "linear",
                }}
            >
                {text}
            </motion.h1>
            {/* Subtle Glow Reflection */}
            <div className="absolute inset-0 bg-white/20 blur-[100px] opacity-0 animate-pulse pointer-events-none" />
        </motion.div>
    );
}
