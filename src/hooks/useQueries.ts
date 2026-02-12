"use client";

import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

import { Prediction } from "@/types/prediction";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000"; // Placeholder for public/demo predictions

/**
 * Fetch all market data (Stocks or Crypto)
 * Reads primarily from Supabase, but can be updated by Sync
 */
export function useMarketData(type: 'stock' | 'crypto' = 'stock', initialData: any[] = []) {
    return useQuery({
        queryKey: ['market-data', type],
        queryFn: async () => {
            const tableName = type === 'stock' ? 'indian_stocks' : 'crypto_coins';
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order(type === 'stock' ? 'market_cap' : 'rank', { ascending: type === 'crypto' });

            if (error) throw error;

            const results = (data || []).map((item: any, index: number) => ({
                id: item.id,
                symbol: item.symbol,
                name: item.name,
                image: item.image || null,
                current_price: type === 'stock' ? item.current_price : (item.price_usd || item.current_price),
                price_change_percentage_24h: type === 'stock' ? item.price_change_percentage_24h : (item.change_24h || item.price_change_percentage_24h),
                high_24h: item.high_24h,
                low_24h: item.low_24h,
                market_cap: type === 'stock' ? item.market_cap : (item.market_cap_usd || item.market_cap || 0),
                market_cap_rank: item.market_cap_rank || item.rank || (index + 1),
                volume: item.volume,
                asset_type: type
            }));

            return results.length > 0 ? results : initialData;
        },
        initialData: initialData.length > 0 ? initialData : undefined,
        staleTime: 5 * 60 * 1000, // 5 mins
        refetchOnWindowFocus: false,
    });
}

/**
 * Triggers a live sync from /api/sync and updates the market-data queries
 */
export function useSyncMarketData() {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ['market-sync'],
        queryFn: async () => {
            const res = await fetch('/api/sync');
            const json = await res.json();

            if (json.success && json.data) {
                if (json.data.stocks?.length > 0) {
                    queryClient.setQueryData(['market-data', 'stock'], json.data.stocks);
                }
                if (json.data.cryptos?.length > 0) {
                    queryClient.setQueryData(['market-data', 'crypto'], json.data.cryptos);
                }
                return json.data;
            }
            return null;
        },
        refetchInterval: 5 * 60 * 1000, // Sync every 5 mins
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

/**
 * Fetch User's Watchlist
 */
export function useWatchlist() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['watchlist', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("watchlist")
                .select("*")
                .eq("user_id", user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
    });
}

/**
 * Fetch Predictions for a specific tab and date
 */
export function usePredictions(type: 'stock' | 'crypto', date?: string): UseQueryResult<Prediction[], Error> {
    const { user } = useAuth();
    const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

    return useQuery({
        queryKey: ['predictions', type, date, user?.id],
        queryFn: async () => {
            if (!user) return [];

            const tableName = type === 'stock' ? 'stock_predictions' : 'crypto_predictions';
            let query = supabase
                .from(tableName as any)
                .select("*")
                .or(`user_id.eq.${user.id},user_id.eq.${DEMO_USER_ID}`)
                .order('created_at', { ascending: false });

            if (date) {
                // IST date range logic
                const dateObj = new Date(`${date}T00:00:00Z`);
                const istOffsetMs = 19800000;
                const startTimestamp = dateObj.getTime() - istOffsetMs;
                const endTimestamp = startTimestamp + (24 * 60 * 60 * 1000) - 1;

                query = query
                    .gte('created_at', new Date(startTimestamp).toISOString())
                    .lte('created_at', new Date(endTimestamp).toISOString())
                    .limit(1000);
            } else {
                query = query.limit(100);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Normalize
            const normalized = (data || []).map((p: any) => ({
                ...p,
                type,
                name: type === 'stock' ? p.stock_name : (p.coin_name || p.coin),
                confidence: p.confidence || p.accuracy_percent || 0,
                predicted_time: p.predicted_time || p.predicted_time_ist || p.created_at
            }));

            // Deduplicate
            const seen = new Set();
            return normalized.filter((p: any) => {
                const key = p.name;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

/**
 * Dashboard Stats and Aggregations
 */
export function useDashboardStats() {
    const { user } = useAuth();
    const { data: watchlist } = useWatchlist();

    return useQuery({
        queryKey: ['dashboard-stats', user?.id],
        queryFn: async () => {
            const [stocks, crypto] = await Promise.all([
                supabase.from("indian_stocks").select("*", { count: 'exact', head: true }),
                supabase.from("crypto_coins").select("*", { count: 'exact', head: true })
            ]);

            return {
                totalStocks: stocks.count || 0,
                totalCrypto: crypto.count || 0,
                watchlistStocks: (watchlist || []).filter((i: any) => i.asset_type === 'stock').length,
                watchlistCrypto: (watchlist || []).filter((i: any) => i.asset_type === 'crypto' || !i.asset_type).length,
            };
        },
        enabled: !!user && !!watchlist,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Fetch Mutual Funds based on search
 */
export function useMutualFunds(query: string) {
    return useQuery({
        queryKey: ['mutual-funds', query],
        queryFn: async () => {
            if (query.length < 3) return [];
            const targetUrl = `https://stock.indianapi.in/mutual_fund_search?query=${query}`;
            const res = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
            return res.json();
        },
        enabled: query.length >= 3,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Fetch IPO Data
 */
export function useIPOData() {
    return useQuery({
        queryKey: ['ipo-data'],
        queryFn: async () => {
            const targetUrl = 'https://stock.indianapi.in/ipo';
            const res = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
            return res.json();
        },
        staleTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
