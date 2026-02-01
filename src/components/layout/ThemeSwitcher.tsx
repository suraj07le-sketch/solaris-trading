"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Zap, Cpu, ChevronDown, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
    { name: "light", label: "Light", icon: Sun, color: "text-yellow-500" },
    { name: "dark", label: "Dark", icon: Moon, color: "text-blue-400" },
    { name: "neon", label: "Neon", icon: Zap, color: "text-pink-500" },
    { name: "cyber", label: "OLED", icon: Cpu, color: "text-green-500" },
];

export function ThemeSwitcher({ className }: { className?: string }) {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!mounted) return null;

    const currentTheme = themes.find(t => t.name === theme) || themes[1];
    const CurrentIcon = currentTheme.icon;

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200",
                    "bg-muted/50 hover:bg-muted border border-border hover:border-primary/30",
                    "text-foreground"
                )}
            >
                <CurrentIcon size={16} className={currentTheme.color} />
                <span className="text-sm font-medium hidden sm:inline">{currentTheme.label}</span>
                <ChevronDown
                    size={14}
                    className={cn(
                        "transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                    >
                        {themes.map((t) => {
                            const Icon = t.icon;
                            const isActive = theme === t.name;
                            return (
                                <button
                                    key={t.name}
                                    onClick={() => {
                                        setTheme(t.name);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2.5 transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-foreground hover:bg-muted"
                                    )}
                                >
                                    <Icon size={16} className={isActive ? currentTheme.color : "text-muted-foreground"} />
                                    <span className="text-sm font-medium">{t.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeThemeIndicator"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
