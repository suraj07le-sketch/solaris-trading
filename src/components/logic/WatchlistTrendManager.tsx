"use client";

import { useWatchlist } from "@/hooks/useQueries";
import { useTrendMonitor } from "@/hooks/useTrendMonitor";
import { memo } from "react";

// Headless component to monitor a single asset
const SingleAssetMonitor = memo(({ symbol, type }: { symbol: string, type: 'stock' | 'crypto' }) => {
    // Only enable for crypto for now as per hook limitations
    const isScript = type === 'stock';

    useTrendMonitor({
        symbol: symbol,
        isScript: isScript,
        enabled: true // Always enabled for watchlist items
    });

    return null;
});

SingleAssetMonitor.displayName = "SingleAssetMonitor";

export function WatchlistTrendManager() {
    const { data: watchlist } = useWatchlist();

    if (!watchlist || watchlist.length === 0) return null;

    return (
        <>
            {watchlist.map((item: any) => (
                <SingleAssetMonitor
                    key={item.id}
                    symbol={item.coin_data?.symbol || item.symbol}
                    type={item.asset_type || 'crypto'}
                />
            ))}
        </>
    );
}
