"use client";

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useWatchlist, usePredictions, useDashboardStats } from '@/hooks/useQueries';
import { Prediction } from '@/types/prediction';

interface DashboardData {
    stats: { stockCount: number; cryptoCount: number; totalStocks: number; totalCrypto: number };
    recentPredictions: any[];
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
    recentPredictions: [],
    topWatchlist: [],
    watchlist: [],
    lastFetched: null,
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 1. Get Watchlist
    const { data: watchlist, isLoading: wlLoading } = useWatchlist();

    // 2. Get Stats
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();

    // 3. Get Recent Predictions (Both Stocks and Crypto for Dashboard)
    const { data: stockPreds, isLoading: spLoading } = usePredictions('stock');
    const { data: cryptoPreds, isLoading: cpLoading } = usePredictions('crypto');

    const data = useMemo(() => {
        const list = watchlist || [];
        const combined: Prediction[] = [
            ...(stockPreds || []).map(p => ({ ...p, type: 'stock' as const })),
            ...(cryptoPreds || []).map(p => ({ ...p, type: 'crypto' as const }))
        ].sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });

        return {
            watchlist: list,
            recentPredictions: combined.slice(0, 50),
            topWatchlist: list.slice(0, 5),
            lastFetched: Date.now(),
            stats: {
                stockCount: statsData?.watchlistStocks || 0,
                cryptoCount: statsData?.watchlistCrypto || 0,
                totalStocks: statsData?.totalStocks || 0,
                totalCrypto: statsData?.totalCrypto || 0
            }
        };
    }, [watchlist, statsData, stockPreds, cryptoPreds]);

    const isLoading = (wlLoading || statsLoading || spLoading || cpLoading) && !watchlist;
    const isInitialized = !!watchlist && !!statsData;

    const fetchDashboard = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
        await queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
        await queryClient.invalidateQueries({ queryKey: ['predictions', 'stock', undefined, user?.id] });
        await queryClient.invalidateQueries({ queryKey: ['predictions', 'crypto', undefined, user?.id] });
    }, [queryClient, user]);

    const invalidateCache = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
    }, [queryClient, user]);

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
