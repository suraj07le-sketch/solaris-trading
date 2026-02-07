"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface DashboardData {
    stats: { stockCount: number; cryptoCount: number; totalStocks: number; totalCrypto: number };
    todaysPredictions: any[];
    topWatchlist: any[];
    watchlist?: any[];
    lastFetched: number | null;
}

interface DashboardContextType {
    data: DashboardData;
    isLoading: boolean;
    isInitialized: boolean;
    fetchDashboard: () => Promise<void>;
    invalidateCache: () => void;
}

const defaultData: DashboardData = {
    stats: { stockCount: 0, cryptoCount: 0, totalStocks: 0, totalCrypto: 0 },
    todaysPredictions: [],
    topWatchlist: [],
    watchlist: [],
    lastFetched: null,
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const CACHE_DURATION = 60 * 1000; // 1 minute cache

import useSWR from 'swr';

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    // Demo user ID for sample predictions
    const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

    // 1. Static Counts (Infrequent refresh)
    const { data: counts } = useSWR(
        user ? `dashboard-counts` : null,
        async () => {
            const [totalStocksRes, totalCryptoRes] = await Promise.all([
                supabase.from("indian_stocks").select("*", { count: 'exact', head: true }),
                supabase.from("crypto_coins").select("*", { count: 'exact', head: true })
            ]);
            return {
                totalStocks: totalStocksRes.count || 0,
                totalCrypto: totalCryptoRes.count || 0
            };
        },
        {
            refreshInterval: 600000,
            revalidateOnFocus: true,
            revalidateOnMount: true,
            revalidateOnReconnect: true,
        }
    );

    // 2. Dynamic Dashboard Data
    const { data: rawDashboard, error, mutate } = useSWR(
        user ? `dashboard-data-${user.id}` : null,
        async () => {
            // Get today's date in IST
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

            const startDate = startOfDay.toISOString();
            const endDate = endOfDay.toISOString();

            // Fetch user's watchlist
            const watchlistRes = await supabase
                .from("watchlist")
                .select("*")
                .eq("user_id", user!.id);

            // Fetch predictions (user's own + demo predictions)
            const userId = user!.id;

            const [stockPredsRes, cryptoPredsRes] = await Promise.all([
                supabase
                    .from("stock_predictions")
                    .select("*")
                    .or(`user_id.eq.${userId},user_id.eq.${DEMO_USER_ID}`)
                    .gte("created_at", startDate)
                    .order("created_at", { ascending: false })
                    .limit(10),
                supabase
                    .from("crypto_predictions")
                    .select("*")
                    .or(`user_id.eq.${userId},user_id.eq.${DEMO_USER_ID}`)
                    .gte("created_at", startDate)
                    .order("created_at", { ascending: false })
                    .limit(10)
            ]);

            const list = watchlistRes.data || [];

            // Combine predictions from both tables
            const combined = [
                ...(stockPredsRes.data || []).map((p: any) => ({
                    ...p,
                    type: 'stock',
                    name: p.stock_name,
                    confidence: p.confidence || p.accuracy_percent || 0
                })),
                ...(cryptoPredsRes.data || []).map((p: any) => ({
                    ...p,
                    type: 'crypto',
                    name: p.coin || p.coin_name,
                    confidence: p.confidence || 0
                }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Trigger background sync to ensure data is fresh for next time
            // We don't await this so it doesn't block the initial dashboard load
            console.log("[Dashboard] Triggering background sync via /api/sync");
            fetch('/api/sync')
                .then(res => res.json())
                .then(res => console.log("[Dashboard] Sync Result:", res))
                .catch(e => console.error("[Dashboard] Background sync failed:", e));

            return {
                watchlist: list,
                todaysPredictions: combined.slice(0, 10),
                topWatchlist: list.slice(0, 5),
                lastFetched: Date.now()
            };
        },
        {
            revalidateOnFocus: true,
            revalidateOnMount: true,
            revalidateOnReconnect: true,
            refreshInterval: 15000, // Faster refresh for dashboard (15s)
            dedupingInterval: 2000,  // Aggressive deduping for snappy navigation
            keepPreviousData: true
        }
    );

    const data = useMemo(() => {
        const d = rawDashboard || defaultData;
        const c = counts || { totalStocks: 0, totalCrypto: 0 };
        const list = d.watchlist || [];

        return {
            ...d,
            stats: {
                stockCount: list.filter((i: any) => i.asset_type === 'stock').length,
                cryptoCount: list.filter((i: any) => i.asset_type === 'crypto' || !i.asset_type).length,
                totalStocks: c.totalStocks,
                totalCrypto: c.totalCrypto
            }
        };
    }, [rawDashboard, counts]);

    const isLoading = !rawDashboard && !error;
    const isInitialized = !!rawDashboard;

    const fetchDashboard = useCallback(async () => {
        await mutate();
    }, [mutate]);

    const invalidateCache = useCallback(() => {
        mutate();
    }, [mutate]);

    return (
        <DashboardContext.Provider value={{ data, isLoading, isInitialized, fetchDashboard, invalidateCache }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
