"use client";

import { BrainCircuit, Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { GridBackground } from "@/components/ui/GridBackground";

export default function PredictionsLoading() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <GridBackground />
            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="h-10 w-64 bg-muted rounded-xl animate-pulse flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted/50 rounded-lg"></div>
                            <div className="h-8 w-40 bg-muted/50 rounded-lg"></div>
                        </div>
                        <div className="h-4 w-48 bg-muted/30 rounded mt-3 animate-pulse"></div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-10 w-48 bg-card/50 rounded-full border border-border/50 animate-pulse"></div>
                        <div className="h-10 w-10 bg-card/50 rounded-full border border-border/50 animate-pulse"></div>
                    </div>
                </div>

                {/* Tab Switcher Skeleton */}
                <div className="flex gap-2 mb-8">
                    <div className="h-10 w-28 bg-primary/20 rounded-full animate-pulse border border-primary/10"></div>
                    <div className="h-10 w-28 bg-card/50 rounded-full animate-pulse border border-border/50"></div>
                </div>

                {/* Content Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex flex-col p-6 rounded-3xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/50 space-y-4 animate-pulse">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-20 bg-muted rounded"></div>
                                        <div className="h-6 w-14 bg-muted rounded-full"></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-24 bg-muted rounded-full"></div>
                                        <div className="h-4 w-20 bg-muted"></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-muted rounded-xl"></div>
                                    <div className="h-10 w-10 bg-muted rounded-xl"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-border/20 rounded-2xl overflow-hidden">
                                <div className="bg-muted/30 p-4 space-y-2">
                                    <div className="h-3 w-12 bg-muted"></div>
                                    <div className="h-6 w-24 bg-muted"></div>
                                </div>
                                <div className="bg-muted/30 p-4 space-y-2">
                                    <div className="h-3 w-12 bg-muted"></div>
                                    <div className="h-6 w-24 bg-muted"></div>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <div className="h-3 w-16 bg-muted"></div>
                                <div className="h-4 w-20 bg-muted"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
