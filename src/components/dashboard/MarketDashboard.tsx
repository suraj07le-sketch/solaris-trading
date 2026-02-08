"use client";

import { useState, useRef, useEffect } from "react";
import { useMarketData } from "@/hooks/useQueries";
import { Coin, WatchlistItem } from "@/types";
import TradingViewWidget from "@/components/dashboard/TradingViewWidget";
import MarketTable from "@/components/dashboard/MarketTable";
import { useAuth } from "@/context/AuthContext";
import { LocalStorage } from "@/lib/storage";
import { useRouter } from "next/navigation";

interface MarketDashboardProps {
    coins: Coin[];
    assetType?: 'stock' | 'crypto';
}

export default function MarketDashboard({ coins, assetType = 'stock' }: MarketDashboardProps) {
    const [selectedSymbol, setSelectedSymbol] = useState(assetType === 'stock' ? "BSE:RELIANCE" : "BINANCE:BTCUSDT");
    const topRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // React Query version of market data
    const { data: liveCoins } = useMarketData(assetType, coins);

    const displayCoins = liveCoins || coins;

    const handleCoinSelect = (symbol: string) => {
        // Assume symbols from DB are like 'RELIANCE', 'TCS'.
        // TradingView needs 'NSE:RELIANCE' or 'BSE:RELIANCE'.
        // Switching to BSE as it's often more successfully embeddable for free.
        let chartSymbol = symbol.toUpperCase();
        if (assetType === 'stock') {
            chartSymbol = (symbol.includes(":") ? symbol : `BSE:${symbol}`).toUpperCase();
        } else {
            const base = symbol.toUpperCase().endsWith("USDT")
                ? symbol.toUpperCase()
                : `${symbol.toUpperCase()}USDT`;
            chartSymbol = `BINANCE:${base}`;
        }

        setSelectedSymbol(chartSymbol);

        // Scroll to top to see chart with a slight delay to ensure rendering
        setTimeout(() => {
            topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    // Filter Logic
    const [filter, setFilter] = useState<'all' | 'watchlist' | 'top50' | 'gainers' | 'losers'>('all');
    const { user } = useAuth();
    const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

    // Fetch watchlist IDs for indicators and filtering
    useEffect(() => {
        if (!user) return;
        const loadWatchlist = () => {
            const list = LocalStorage.getWatchlist(user.id);
            setWatchlistIds(new Set(list.map((item: WatchlistItem) => item.coin_id)));
        };
        loadWatchlist();
        // Listen for storage changes (optional but good)
        window.addEventListener('storage', loadWatchlist);
        return () => window.removeEventListener('storage', loadWatchlist);
    }, [user]);

    const filteredCoins = displayCoins.filter((coin: Coin) => {
        switch (filter) {
            case 'watchlist':
                return watchlistIds.has(coin.id);
            case 'top50':
                return (coin.market_cap_rank || 999) <= 50;
            case 'gainers':
                return coin.price_change_percentage_24h > 0;
            case 'losers':
                return coin.price_change_percentage_24h < 0;
            default:
                return true;
        }
    });

    return (
        <div className="space-y-8" ref={topRef}>
            {/* Graph Container - Hardcoded Height Enforcement */}
            <div className="w-full h-[65vh] min-h-[500px] rounded-xl overflow-hidden border border-border bg-card/60 shadow-2xl backdrop-blur-md relative">
                <TradingViewWidget
                    symbol={selectedSymbol}
                    className="w-full h-full"
                />
            </div>

            {/* Filters Bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {([
                    { id: 'all', label: 'All Assets' },
                    { id: 'watchlist', label: 'My Watchlist' },
                    { id: 'top50', label: 'Top 50' },
                    { id: 'gainers', label: 'Gainers' },
                    { id: 'losers', label: 'Losers' },
                ] as const).map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === f.id
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-transparent border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <MarketTable
                coins={filteredCoins}
                onSelect={handleCoinSelect}
                assetType={assetType}
                watchlistIds={watchlistIds}
                onWatchlistChange={() => {
                    if (user) {
                        const list = LocalStorage.getWatchlist(user.id);
                        setWatchlistIds(new Set(list.map(item => item.coin_id)));
                    }
                }}
            />
        </div>
    );
}
