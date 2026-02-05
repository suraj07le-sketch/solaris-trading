import { WatchlistItem, Coin } from "@/types";

const STORAGE_KEY_PREFIX = 'nexus_watchlist_';

export const LocalStorage = {
    getWatchlist: (userId: string): WatchlistItem[] => {
        if (typeof window === 'undefined') return [];
        try {
            const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("LocalStorage Read Error:", error);
            return [];
        }
    },

    addToWatchlist: (userId: string, coin: Coin, assetType: 'stock' | 'crypto'): WatchlistItem | null => {
        try {
            const current = LocalStorage.getWatchlist(userId);

            // Check for duplicates
            if (current.some(item => item.coin_id === coin.id)) {
                return null; // Already exists
            }

            const newItem: WatchlistItem = {
                id: crypto.randomUUID(),
                user_id: userId,
                coin_id: coin.id,
                coin_data: coin,
                asset_type: assetType,
                // Add a local timestamp for sorting if needed
                // created_at: new Date().toISOString() 
            };

            const updated = [...current, newItem];
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
            return newItem;
        } catch (error) {
            console.error("LocalStorage Write Error:", error);
            return null;
        }
    },

    removeFromWatchlist: (userId: string, coinId: string): void => {
        try {
            const current = LocalStorage.getWatchlist(userId);
            const updated = current.filter(item => item.coin_id !== coinId && item.id !== coinId);
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
        } catch (error) {
            console.error("LocalStorage Delete Error:", error);
        }
    },

    savePredictionCache: (userId: string, date: string, tab: string, data: any[]): void => {
        if (typeof window === 'undefined') return;
        try {
            const key = `pred_cache_${userId}_${date}_${tab}`;
            const cacheItem = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheItem));
        } catch (error) {
            console.error("Cache Save Error:", error);
        }
    },

    getPredictionCache: (userId: string, date: string, tab: string): any[] | null => {
        if (typeof window === 'undefined') return null;
        try {
            const key = `pred_cache_${userId}_${date}_${tab}`;
            const raw = localStorage.getItem(key);
            if (!raw) return null;

            const cacheItem = JSON.parse(raw);
            const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

            if (Date.now() - cacheItem.timestamp > TWO_DAYS_MS) {
                localStorage.removeItem(key);
                return null;
            }

            return cacheItem.data;
        } catch (error) {
            console.error("Cache Read Error:", error);
            return null;
        }
    },

    // --- SYNC QUEUE LOGIC FOR 100/100 QA ---
    queueForSync: (userId: string, prediction: any): void => {
        if (typeof window === 'undefined') return;
        try {
            const key = `sync_queue_${userId}`;
            const currentRaw = localStorage.getItem(key);
            const current = currentRaw ? JSON.parse(currentRaw) : [];

            // Add to queue if not already there (id check)
            if (!current.some((p: any) => p.id === prediction.id)) {
                localStorage.setItem(key, JSON.stringify([...current, prediction]));
            }
        } catch (error) {
            console.error("Sync Queue Error:", error);
        }
    },

    getSyncQueue: (userId: string): any[] => {
        if (typeof window === 'undefined') return [];
        try {
            const key = `sync_queue_${userId}`;
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    },

    clearSyncQueue: (userId: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(`sync_queue_${userId}`);
    }
};
