"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { SolarisIcon } from "@/components/ui/SolarisIcon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardProvider } from "@/context/DashboardContext";
import { WatchlistTrendManager } from "@/components/logic/WatchlistTrendManager";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <DashboardProvider>
            <WatchlistTrendManager />
            <div className="flex h-screen overflow-hidden relative">

                {/* Mobile Header (Hidden on Desktop) */}
                <div className="fixed top-0 left-0 right-0 z-30 flex items-center p-4 bg-background/80 backdrop-blur-md md:hidden border-b border-white/10 h-16">
                    {(isMounted && !isSidebarOpen) && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 hover:bg-white/10 rounded-lg text-primary"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    )}

                    <div className="flex items-center gap-2 ml-4">
                        <SolarisIcon className="w-6 h-6 text-orange-500" />
                        <div className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600 uppercase tracking-tighter">
                            SHURSUNT
                        </div>
                    </div>
                </div>

                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main
                    className={cn(
                        "flex-1 overflow-y-auto w-full transition-all duration-300 px-2 py-3 md:p-8 relative z-10 pt-20 md:pt-8 no-scrollbar md:ml-64"
                    )}
                >
                    <div className="glass-card rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl px-3 py-4 md:p-6 min-h-[calc(100vh-6rem)] md:min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </DashboardProvider>
    );
}
