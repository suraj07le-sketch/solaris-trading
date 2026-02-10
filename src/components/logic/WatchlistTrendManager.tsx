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

    // Filter for supported assets (Crypto only for now)
    // The cleanSymbol logic might be needed if symbols are messy like "BTCUSDTUSD"
    const validItems = watchlist.filter(item => {
        // Assuming asset_type is reliable. If not, we can infer from symbol.
        // For existing logic, assume 'crypto' type or if it looks like a pair
        return item.asset_type === 'crypto';
    });

    return (
        <>
            {validItems.map((item: any) => (
                <SingleAssetMonitor
                    key={item.id || item.symbol}
                    symbol={item.symbol}
                    type={item.asset_type || 'crypto'}
                />
            ))}
        </>
    );
}
