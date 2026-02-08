"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePredictions } from "@/hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import { PredictionCard } from "@/components/dashboard/PredictionCard";
import { GridBackground } from "@/components/ui/GridBackground";
import { motion } from "framer-motion";
import { BrainCircuit, RefreshCw, Clock, Sparkles, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Prediction Skeleton Component
function PredictionSkeleton() {
    return (
        <div className="flex flex-col p-6 rounded-3xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/50 space-y-4">
            <div className="flex justify-between items-start">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border/20 rounded-2xl overflow-hidden">
                <div className="bg-muted/30 p-4 space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="bg-muted/30 p-4 space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </div>
            <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    );
}


export default function PredictionsPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Always use current date in IST timezone
    const getISTDate = () => {
        const now = new Date();
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now);
    };

    const todayDate = getISTDate();
    const [selectedDate, setSelectedDate] = useState(todayDate);

    // Format date for display (ensure it's treated as UTC to avoid timezone shifts)
    const formatDateDisplay = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            timeZone: 'UTC' // Treat the YYYY-MM-DD as UTC midnight to prevent shifts
        }).format(date);
    };

    const [activeTab, setActiveTab] = useState<'stock' | 'crypto'>('stock');
    const [isPolling, setIsPolling] = useState(false);
    const [pollProgress, setPollProgress] = useState(0);
    const [lastPredictionTime, setLastPredictionTime] = useState<number>(Date.now());
    const [isGenerating, setIsGenerating] = useState(false);

    const queryClient = useQueryClient();
    const { data: predictions, isLoading: isQueryLoading } = usePredictions(activeTab, selectedDate);
    const isLoading = isQueryLoading && !predictions;

    // Check URL parameters for auto-polling (when redirected from market page)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shouldPoll = params.get('poll');
        const assetType = params.get('type');
        const source = params.get('source'); // 'market' or 'watchlist'
        const predictSymbol = params.get('predict');
        const timeframe = params.get('timeframe') || '4h';

        if (assetType) {
            setActiveTab(assetType as 'stock' | 'crypto');
        }

        if (predictSymbol && assetType) {
            // Instant predict flow
            setTimeout(() => {
                generatePrediction(predictSymbol, assetType as 'stock' | 'crypto', timeframe);
            }, 500);
        } else if (shouldPoll === 'true' && assetType) {
            // Legacy/Background poll flow
            // Small delay to ensure tab switch completes before starting loading state
            setTimeout(() => {
                // For watchlist, use different loading behavior
                if (source === 'watchlist') {
                    setIsGenerating(true); // Shows single skeleton at top
                } else {
                    setIsPolling(true); // Shows full skeleton grid
                }

                setLastPredictionTime(Date.now());
            }, 100);
        }

        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
    }, []);

    // Auto-stop generating state when new data arrives
    useEffect(() => {
        if (isGenerating && predictions && predictions.length > 0) {
            const hasNew = predictions.some((p: any) => {
                const pTime = new Date(p.created_at).getTime();
                return pTime > lastPredictionTime;
            });

            if (hasNew) {
                setIsGenerating(false);
                toast.success("New prediction received!");
            }
        }
    }, [predictions, isGenerating, lastPredictionTime]);

    // Auto-stop polling when new data arrives
    useEffect(() => {
        if (isPolling && predictions && predictions.length > 0) {
            const hasNew = predictions.some((p: any) => {
                const pTime = new Date(p.created_at).getTime();
                return pTime > lastPredictionTime;
            });

            if (hasNew) {
                setIsPolling(false);
                toast.success("New prediction received!");
            }
        }
    }, [predictions, isPolling, lastPredictionTime]);

    // Polling timer
    useEffect(() => {
        if (!isPolling) {
            setPollProgress(0);
            return;
        }

        const totalDuration = 15000;
        const interval = 100;
        const startTime = Date.now();

        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / totalDuration) * 100, 100);
            setPollProgress(progress);

            if (elapsed >= totalDuration) {
                setIsPolling(false);
            }
        }, interval);

        return () => clearInterval(timer);
    }, [isPolling]);

    // Generate prediction function
    const generatePrediction = async (symbol: string, type: 'stock' | 'crypto', timeframe: string = '4h', tradingSymbol?: string) => {
        if (!user) {
            toast.error("Please login to generate predictions");
            return;
        }

        setIsGenerating(true);
        setIsPolling(true);

        // Switch tab if needed
        if (type === 'crypto' && activeTab !== 'crypto') setActiveTab('crypto');
        if (type === 'stock' && activeTab !== 'stock') setActiveTab('stock');

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coinId: symbol,
                    coinName: symbol,
                    symbol: tradingSymbol || symbol,
                    timeframe: timeframe,
                    type: type
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Prediction generated for ${symbol}!`);
                setLastPredictionTime(Date.now());

                // --- INSTANT UI UPDATE ---
                // Map API response to match our display schema
                const newPred = {
                    ...data.prediction,
                    id: `temp-${Date.now()}`,
                    stock_name: type === 'stock' ? symbol : undefined,
                    coin: type === 'crypto' ? symbol : undefined, // This is usually the symbol from CG
                    trend: data.prediction.signal,
                    created_at: data.prediction.prediction_time
                };

                queryClient.setQueryData(['predictions', type, selectedDate, user.id], (current: any) => {
                    if (!current) return [newPred];
                    // Filter out old prediction for same asset to prevent duplicates
                    const filtered = current.filter((p: any) =>
                        (type === 'stock' && p.stock_name !== symbol) ||
                        (type === 'crypto' && p.coin !== symbol)
                    );
                    return [newPred, ...filtered];
                });
            } else {
                toast.error(`Prediction failed: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            toast.error("Failed to generate prediction");
            console.error(err);
        } finally {
            setIsGenerating(false);
            setIsPolling(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full font-sans">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <GridBackground />
            </div>

            <div className="relative z-10 space-y-6 p-1 md:p-8 pb-20 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground flex items-center gap-3">
                            AI Analysis Log
                            {isPolling && (
                                <span className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full text-sm font-medium text-primary">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Scanning...
                                </span>
                            )}
                        </h1>

                        {isPolling && (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>Checking for new predictions ({(60 - (pollProgress / 100 * 60)).toFixed(0)}s remaining)</span>
                                </div>
                                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pollProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tab Switcher & Date Picker */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Custom Date Navigator */}
                        <div className="flex items-center bg-black/5 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-full p-1 pl-1 pr-1 relative group">
                            <button
                                onClick={() => {
                                    const date = new Date(selectedDate);
                                    date.setDate(date.getDate() - 1);
                                    setSelectedDate(date.toISOString().split('T')[0]);
                                }}
                                className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2 px-2 relative">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold font-mono min-w-[100px] text-center">
                                    {formatDateDisplay(selectedDate)}
                                </span>
                                {/* Invisible date input for picker functionality */}
                                <input
                                    type="date"
                                    value={selectedDate}
                                    max={todayDate} // Use our robust IST todayDate
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>

                            <button
                                onClick={() => {
                                    const date = new Date(selectedDate);
                                    date.setDate(date.getDate() + 1);
                                    setSelectedDate(date.toISOString().split('T')[0]);
                                }}
                                disabled={selectedDate === todayDate}
                                className={`p-2 rounded-full transition-colors ${selectedDate === todayDate
                                    ? "text-muted-foreground/30 cursor-not-allowed"
                                    : "hover:bg-white/10 text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex gap-1 bg-black/5 dark:bg-black/20 p-1 rounded-xl border border-black/5 dark:border-white/5">
                            <button
                                onClick={() => setActiveTab('stock')}
                                className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 ${activeTab === 'stock'
                                    ? "bg-white dark:bg-white/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                    }`}
                            >
                                Stocks
                            </button>
                            <button
                                onClick={() => setActiveTab('crypto')}
                                className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 ${activeTab === 'crypto'
                                    ? "bg-white dark:bg-white/10 text-yellow-500 shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                    }`}
                            >
                                Crypto
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {isLoading || isPolling ? (
                    // Full skeleton grid for initial load or market page navigation
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <PredictionSkeleton key={i} />
                        ))}
                    </div>
                ) : isGenerating ? (
                    // Single skeleton at top + existing predictions for watchlist
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* Single skeleton card at top */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="order-first"
                        >
                            <PredictionSkeleton />
                        </motion.div>

                        {/* Existing predictions below */}
                        {(predictions ?? []).map((pred: any) => (
                            <PredictionCard key={pred.id} pred={pred} isStock={activeTab === 'stock'} />
                        ))}
                    </motion.div>
                ) : (predictions?.length ?? 0) > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {(predictions ?? []).map((pred: any) => (
                            <PredictionCard key={pred.id} pred={pred} isStock={activeTab === 'stock'} />
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-muted/30 p-4 rounded-full mb-4">
                            <BrainCircuit className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-bold text-muted-foreground">No Predictions for Today</h3>
                        <p className="text-muted-foreground/50 mt-2 max-w-sm">
                            AI has not generated any {activeTab} predictions for today.
                        </p>
                        <button
                            onClick={() => router.push('/market')}
                            className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all duration-300"
                        >
                            <Sparkles className="w-5 h-5" />
                            Let's Predict
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
