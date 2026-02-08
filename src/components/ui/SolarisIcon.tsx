"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export const SolarisIcon = ({ className = "w-6 h-6", color = "currentColor" }: { className?: string, color?: string }) => {
    // Determine dimensions based on className if possible, or fallback to filling parent container
    // We use 'fill' to let the parent div control the size via className
    return (
        <div className={`relative ${className} flex items-center justify-center`}>
            {/* Rotating Shine Border */}
            <motion.div
                className="absolute -inset-[3px] rounded-full opacity-100 blur-[2px]"
                style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, #ff9f1c 60deg, transparent 120deg, transparent 360deg)`
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            {/* Counter-rotating subtle glow */}
            <motion.div
                className="absolute -inset-[3px] rounded-full opacity-40 blur-[4px]"
                style={{
                    background: `conic-gradient(from 180deg, transparent 0deg, #ff9f1c 60deg, transparent 120deg, transparent 360deg)`
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Background mask for the center */}
            <div className="absolute inset-[1px] bg-background rounded-full z-10" />

            <div className="relative z-20 w-full h-full rounded-full overflow-hidden">
                <img
                    src="/favicon.ico"
                    alt="ShursunT Logo"
                    className="w-full h-full object-contain p-[2px]"
                />
            </div>
        </div>
    );
};
