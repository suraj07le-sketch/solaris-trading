"use client";

import React, { useState, useEffect } from "react";
import { FloatingNavbar } from "@/components/aceternity/FloatingNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { SolarisIcon } from "@/components/ui/SolarisIcon";
import { AboutSection } from "@/components/home/AboutSection";
import { GlowingFeatures } from "@/components/aceternity/GlowingFeatures";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const NeuralFluxBackground = dynamic(() => import('@/components/ui/NeuralFluxBackground'), { ssr: false });

export default function Home() {
  const t = useTranslations('Home');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-hidden selection:bg-primary/30 relative">
      <NeuralFluxBackground />

      {/* Global spotlight effect */}
      <div
        className="fixed pointer-events-none inset-0 z-50 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--primary) / 0.08), transparent 30%)`,
        }}
      />

      {/* Navigation */}
      <FloatingNavbar className="top-4 md:top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6" />

      {/* Introduction */}
      <div className="relative z-10">
        <HeroSection />
      </div>

      {/* About Section */}
      <AboutSection />

      {/* Features Section */}
      <section className="py-12 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </motion.div>
          <GlowingFeatures />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card/50 relative overflow-hidden mt-8">
        {/* Animated glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-center md:justify-around gap-6 relative z-10">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <SolarisIcon className="w-16 h-16 text-primary drop-shadow-[0_0_15px_hsl(var(--primary)/0.4)]" />
            <FooterShineText text={t('logoText')} />
          </motion.div>
          <div className="text-sm text-foreground/80 text-center">
            <p>{t('footerCopyright')}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{t('footerTagline')}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Shine text for Footer - Theme aware with Primary (Yellow) shine
function FooterShineText({ text }: { text: string }) {
  return (
    <div className="relative inline-flex flex-col items-center justify-center overflow-visible">
      <motion.span
        className="font-bold tracking-widest text-lg bg-clip-text text-transparent"
        style={{
          backgroundImage: "linear-gradient(110deg, hsl(var(--foreground)) 35%, hsl(var(--primary)) 50%, hsl(var(--foreground)) 65%)",
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["100% 0", "-100% 0"],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        {text}
      </motion.span>
    </div>
  );
}

