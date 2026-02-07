"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { LocalStorage } from "@/lib/storage";
import useSWR, { SWRConfiguration } from "swr";
import { PredictionCard } from "@/components/dashboard/PredictionCard";
import { GridBackground } from "@/components/ui/GridBackground";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Sparkles, Calendar, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Prediction Skeleton Component
function PredictionSkeleton() {
    return (
        <div className="flex flex-col p-6 rounded-3xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/50 space-y-4 animate-pulse">
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
    );
}

// Robust fetcher function
const fetcher = async function ([userId, date, tab]: [string, string, 'stock' | 'crypto']) {
    if (!userId) return [];

    const tableName = tab === 'stock' ? 'stock_predictions' : 'crypto_predictions';

    try {
        if (!userId || userId === 'undefined' || userId === 'null') {
            return [];
        }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
        if (!isUUID && userId !== '00000000-0000-0000-0000-000000000000') {
            return LocalStorage.getPredictionCache(userId, date, tab) || [];
        }

        console.log(`[Fetcher] Fetching ${tab} for user ${userId} on date ${date}`);

        const { data, error } = await supabase
            .from(tableName as "stock_predictions" | "crypto_predictions")
            .select("*")
            .or(`user_id.eq.${userId},user_id.eq.00000000-0000-0000-0000-000000000000`)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            // Handle AbortError gracefully - this happens when component unmounts/navigates away
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                console.log("[Fetcher] Request was aborted (component unmounted or navigation)");
                return [];
            }
            console.error("[Fetcher] Supabase Error:", error.message);
            toast.error("Failed to update data. Showing cached version.");
            return LocalStorage.getPredictionCache(userId, date, tab) || [];
        }

        console.log(`[Fetcher] Found ${data?.length || 0} raw records in ${tableName}`);

        // Normalize fields
        const normalized = (data || []).map((item: any) => ({
            ...item,
            coin_name: item.coin_name || item.coin || item.symbol || item.asset_name || item.coinId,
            coin: item.coin || item.symbol || item.coin_name || item.coinId,
            stock_name: item.stock_name || item.symbol || item.asset_name || item.stock || item.stock_symbol,
            current_price: item.current_price || item.currentPrice || item.price || item.last_price || item.lastPrice || item.close || item.closePrice || 0,
            predicted_price: item.predicted_price || item.predictedPrice || item.target_price || item.targetPrice || item.target || 0,
            prediction_change_percent: item.prediction_change_percent || item.predictionChangePercent || item.change_percent || item.changePercent || 0,
            predicted_time: item.predicted_time || item.predictedTime || item.predicted_time_ist || item.prediction_time || item.prediction_time_ist || item.created_at,
            created_at: item.created_at,
            trend: item.trend || item.signal || item.Trend || item.Signal,
            signal: item.signal || item.trend || item.Signal || item.Trend,
            confidence: item.confidence || item.accuracy_percent || item.accuracyPercent || item.confidence_percent || 0
        }));

        // Helper to parse date
        const parseRobust = function (d: string) {
            if (!d) return null;
            if (d.includes('/')) {
                try {
                    const parts = d.split(', ');
                    const datePart = parts[0];
                    const [day, month, year] = datePart.split('/').map(Number);
                    if (parts.length === 2) {
                        const timePart = parts[1];
                        const [time, period] = timePart.split(' ');
                        const [hoursStr, minutesStr] = time.split(':');
                        let hours = Number(hoursStr);
                        const minutes = Number(minutesStr);
                        if (period?.toLowerCase() === 'pm' && hours < 12) hours += 12;
                        if (period?.toLowerCase() === 'am' && hours === 12) hours = 0;
                        return new Date(year, month - 1, day, hours, minutes || 0);
                    }
                    return new Date(year, month - 1, day);
                } catch (_e) { return null; }
            }
            const parsed = new Date(d);
            return isNaN(parsed.getTime()) ? null : parsed;
        };

        // Filter by date (IST timezone)
        const filtered = normalized.filter((item: any) => {
            const targetDateStr = item.predicted_time || item.created_at;
            if (!targetDateStr) return false;
            try {
                const predDate = parseRobust(targetDateStr);
                if (!predDate) return false;
                const istPart = new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(predDate);
                return istPart === date;
            } catch (_e) { return false; }
        });

        console.log(`[Fetcher] ${filtered.length} records match date ${date}`);

        // Group by stock/crypto name
        const grouped = new Map<string, any>();
        filtered.forEach((item: any) => {
            const key = tab === 'stock' ? item.stock_name : (item.coin_name || item.coin);
            const existing = grouped.get(key);
            if (!existing) {
                grouped.set(key, item);
            } else {
                const existingTime = new Date(existing.created_at).getTime();
                const currentTime = new Date(item.created_at).getTime();
                if (currentTime > existingTime) {
                    grouped.set(key, item);
                }
            }
        });

        const finalData = Array.from(grouped.values());
        console.log(`[Fetcher] Returning ${finalData.length} unique assets`);

        // Save to cache
        LocalStorage.savePredictionCache(userId, date, tab, finalData);

        return finalData;
    } catch (err) {
        console.error("[Fetcher] Error:", err);
        toast.error("Connection error. Showing cached version.");
        return LocalStorage.getPredictionCache(userId, date, tab) || [];
    }
};

export default function PredictionsPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Get today's date in IST
    const todayDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());

    const [selectedDate, setSelectedDate] = useState(todayDate);
    const [activeTab, setActiveTab] = useState<'stock' | 'crypto'>('stock');
    const [isPolling, setIsPolling] = useState(false);
    const [pollProgress, setPollProgress] = useState(0);
    const [lastPredictionTime, setLastPredictionTime] = useState<number>(Date.now());
    const [isGenerating, setIsGenerating] = useState(false);
    const [isOffline, setIsOffline] = useState(typeof window !== 'undefined' ? !navigator.onLine : false);
    const [targetSymbol, setTargetSymbol] = useState<string | null>(null);

    // Load cached data immediately
    const cachedData = user ? LocalStorage.getPredictionCache(user.id, selectedDate, activeTab) : null;

    // SWR configuration - enable revalidate on mount
    const swrConfig: SWRConfiguration = {
        revalidateOnFocus: false,
        revalidateOnMount: true,
        revalidateOnReconnect: false,
        dedupingInterval: 30000, // 30s deduping for instant back/forth
        suspense: false,
        keepPreviousData: true,
        revalidateIfStale: false, // Don't show spinner if data is in cache
        focusThrottleInterval: 5000,
        errorRetryCount: 1,
        errorRetryInterval: 1000
    };

    const { data: predictions, isLoading, isValidating, mutate } = useSWR(
        user ? [user.id, selectedDate, activeTab] : null,
        fetcher,
        swrConfig
    );

    // Show cached data immediately while fetching
    const displayData = predictions || cachedData || [];

    // Auto-stop generating state when new data arrives
    useEffect(function () {
        if (isGenerating && predictions && predictions.length > 0) {
            const hasNew = predictions.some(function (p: any) {
                const pTime = new Date(p.created_at).getTime();
                return pTime > lastPredictionTime;
            });
            if (hasNew) {
                setIsGenerating(false);
            }
        }
    }, [predictions, isGenerating, lastPredictionTime]);

    // Auto-stop polling when new data arrives
    useEffect(function () {
        if (isPolling && predictions && predictions.length > 0) {
            const hasNew = predictions.some(function (p: any) {
                const pTime = new Date(p.created_at).getTime();
                return pTime > lastPredictionTime;
            });
            if (hasNew) {
                setIsPolling(false);
            }
        }
    }, [predictions, isPolling, lastPredictionTime]);

    // Offline detection
    useEffect(function () {
        const handleOnline = function () {
            setIsOffline(false);
            toast.success("Back Online!");
            mutate();
        };
        const handleOffline = function () {
            setIsOffline(true);
            toast.warning("You are currently offline.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return function () {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [mutate]);

    // Polling timer
    useEffect(function () {
        if (!isPolling) {
            setPollProgress(0);
            return;
        }

        const totalDuration = 60000;
        const interval = 100;
        const startTime = Date.now();

        const timerId = setInterval(function () {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / totalDuration) * 100, 100);
            setPollProgress(progress);

            if (progress >= 100) {
                clearInterval(timerId);
                setIsPolling(false);
            }
        }, interval);

        return function () { clearInterval(timerId); };
    }, [isPolling]);

    // Generate prediction function (used by Market page redirects)
    const generatePrediction = useCallback(async function (symbol: string, type: 'stock' | 'crypto') {
        if (!user) return;

        setIsGenerating(true);
        setLastPredictionTime(Date.now());

        try {
            toast.info(`Analyzing ${symbol}...`, { duration: 2000 });

            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coinId: symbol,
                    type,
                    userId: user.id
                })
            });

            if (!response.ok) throw new Error('Prediction failed');

            const result = await response.json();
            console.log("[generatePrediction] Success:", result);

            toast.success(`Analysis complete for ${symbol}!`);

            mutate();

            const allPredictions = predictions || [];
            if (allPredictions.length > 0 || (result && result.data)) {
                setIsPolling(true);
            }
        } catch (error) {
            console.error("[generatePrediction] Failed:", error);
            toast.error(`Failed to analyze ${symbol}`);
        } finally {
            setIsGenerating(false);
        }
    }, [user, predictions, mutate]);

    // Check URL parameters for auto-generation and tab selection
    useEffect(function () {
        const params = new URLSearchParams(window.location.search);
        const autoGenerate = params.get('generating') === 'true';
        const symbol = params.get('symbol');
        const type = params.get('type') as 'stock' | 'crypto';

        // Always set the active tab if type is provided in URL
        if (type && (type === 'stock' || type === 'crypto')) {
            setActiveTab(type);
        }

        if (symbol) {
            setTargetSymbol(symbol);
        }

        if (autoGenerate && symbol && type) {
            toast.info(`Preparing AI Analysis for ${symbol}...`, { duration: 2000 });

            const timer = setTimeout(function () {
                generatePrediction(symbol, type);
                // Clean up URL but keep type if needed? Actually, user just wants it to open.
                // We'll replace state to remove the 'generating' flag but can keep type if we want
                // Actually, let's just clear it to keep it clean after starting.
                window.history.replaceState({}, '', window.location.pathname);
            }, 2000);

            return function () { clearTimeout(timer); };
        }
    }, [generatePrediction]);

    // Format date for display
    const formatDateDisplay = function (dateStr: string) {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                timeZone: 'Asia/Kolkata'
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    // Handle date navigation
    const handleDateChange = function (direction: 'prev' | 'next') {
        const current = new Date(selectedDate);
        if (direction === 'prev') {
            current.setDate(current.getDate() - 1);
        } else {
            current.setDate(current.getDate() + 1);
        }
        const newDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(current);
        setSelectedDate(newDate);
    };

    // Handle tab switch
    const handleTabSwitch = function (tab: 'stock' | 'crypto') {
        setActiveTab(tab);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <GridBackground />
            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                            <BrainCircuit className="w-10 h-10 text-purple-400" />
                            AI Predictions
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Advanced machine learning predictions
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Date Selector */}
                        <div className="flex items-center bg-card/50 backdrop-blur-sm rounded-full border border-border/50 p-1">
                            <button
                                onClick={function () { handleDateChange('prev'); }}
                                className="p-2 hover:bg-accent/50 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-4 font-medium min-w-[140px] text-center flex items-center justify-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {formatDateDisplay(selectedDate)}
                            </span>
                            <button
                                onClick={function () { handleDateChange('next'); }}
                                className="p-2 hover:bg-accent/50 rounded-full transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={function () { mutate(); }}
                            disabled={isLoading || isValidating}
                            className="p-2 bg-card/50 backdrop-blur-sm rounded-full border border-border/50 hover:bg-accent/50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading || isValidating ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Offline indicator */}
                        {isOffline && (
                            <div className="flex items-center gap-2 text-amber-500 text-sm bg-amber-500/10 px-3 py-1.5 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                Offline
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-8">
                    {(['stock', 'crypto'] as const).map(function (tab) {
                        return (
                            <button
                                key={tab}
                                onClick={function () { handleTabSwitch(tab); }}
                                className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === tab
                                    ? 'bg-primary text-primary-foreground shadow-lg'
                                    : 'bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground border border-border/50'
                                    }`}
                            >
                                {tab === 'stock' ? ' Stocks' : ' Crypto'}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                {isLoading && !cachedData && displayData.length === 0 && !isGenerating && !isPolling ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(function (i) { return <PredictionSkeleton key={i} />; })}
                    </div>
                ) : displayData.length > 0 || isGenerating || isPolling ? (
                    <>
                        {/* Status bar */}
                        <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                {isValidating && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                                {isValidating ? 'Updating live data...' : `Showing ${displayData.length} predictions`}
                            </span>
                            <span>
                                {isGenerating ? 'Generating prediction...' : ''}
                            </span>
                        </div>

                        {/* Predictions Grid */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {/* Show skeleton as first item if generating or polling */}
                                {(isGenerating || isPolling) && (
                                    <motion.div
                                        key="generating-skeleton"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <PredictionSkeleton />
                                    </motion.div>
                                )}

                                {displayData.map(function (prediction: any, index: number) {
                                    return (
                                        <motion.div
                                            key={prediction.id || prediction.coin || prediction.stock_name || index}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                show: { opacity: 1, y: 0 }
                                            }}
                                            layout
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <PredictionCard
                                                pred={prediction}
                                                isStock={activeTab === 'stock'}
                                                initialOpen={targetSymbol === (prediction.stock_name || prediction.coin || prediction.symbol)}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    </>
                ) : (
                    /* No predictions state */
                    <div className="text-center py-20 px-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6 relative group"
                        >
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                            <Sparkles className="w-12 h-12 text-primary relative z-10" />
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-3">No predictions found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                            Get AI-powered insights for your favorite {activeTab === 'stock' ? 'stocks' : 'crypto assets'} instantly.
                        </p>
                        <button
                            onClick={() => router.push('/market')}
                            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95"
                        >
                            Generate Prediction
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
}
