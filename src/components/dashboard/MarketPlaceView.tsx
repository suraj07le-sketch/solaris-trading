"use client";

import { useState, useEffect, useMemo } from "react";
import { useMarketData, useSyncMarketData } from "@/hooks/useQueries";
import { Coin, WatchlistItem } from "@/types";
import MarketGrid from "./MarketGrid";
import { Search } from "./Search";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { LocalStorage } from "@/lib/storage";
import ErrorState from "@/components/ui/ErrorState";

interface MarketPlaceViewProps {
    initialStocks: Coin[];
    initialCrypto: Coin[];
}

type FilterType = 'all' | 'watchlist' | 'top50' | 'gainers' | 'losers';



export default function MarketPlaceView({ initialStocks, initialCrypto }: MarketPlaceViewProps) {
    const [assetType, setAssetType] = useState<'stock' | 'crypto'>('stock');
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuth();
    const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

    // React Query handles global market data and background sync
    const { data: stockData } = useMarketData('stock', initialStocks);
    const { data: cryptoData } = useMarketData('crypto', initialCrypto);
    useSyncMarketData(); // Triggers global background revalidation

    const currentData = assetType === 'stock' ? (stockData || initialStocks) : (cryptoData || initialCrypto);

    // Load watchlist IDs
    useEffect(() => {
        if (!user) return;
        const loadList = () => {
            const list = LocalStorage.getWatchlist(user.id);
            setWatchlistIds(new Set(list.map((item: WatchlistItem) => item.coin_id)));
        };
        loadList();
        window.addEventListener('storage', loadList);
        return () => window.removeEventListener('storage', loadList);
    }, [user]);

    // Apply filters
    // Pagination logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // 4 cols * 2 rows

    // Reset page when filter changes
    const filteredData = currentData.filter((coin: Coin) => {
        const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

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

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedCoins = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Controls */}
            <div className="flex-none flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1 text-foreground">Market Place</h1>
                    <p className="text-sm text-muted-foreground">Discover and track global assets</p>
                </div>

                {/* Stock/Crypto Toggle */}
                {/* Stock/Crypto Toggle Segmented Control */}
                <div className="flex gap-1 bg-black/5 dark:bg-black/20 p-1 rounded-xl border border-black/5 dark:border-white/5">
                    <button
                        onClick={() => { setAssetType('stock'); setCurrentPage(1); }}
                        className={cn(
                            "px-4 py-1.5 rounded-lg font-bold text-xs transition-all duration-300",
                            assetType === 'stock'
                                ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        Stocks
                    </button>
                    <button
                        onClick={() => { setAssetType('crypto'); setCurrentPage(1); }}
                        className={cn(
                            "px-4 py-1.5 rounded-lg font-bold text-xs transition-all duration-300",
                            assetType === 'crypto'
                                ? "bg-white dark:bg-white/10 text-yellow-500 shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        Crypto
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex-none flex flex-col md:flex-row gap-2 justify-between items-center bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar items-center">
                    {/* All Assets Button */}
                    <button
                        onClick={() => { setFilter('all'); setCurrentPage(1); }}
                        className={cn(
                            "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                            filter === 'all'
                                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                : "bg-transparent border-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        )}
                    >
                        All Assets
                    </button>

                    <button
                        onClick={() => { setFilter('watchlist'); setCurrentPage(1); }}
                        className={cn(
                            "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                            filter === 'watchlist'
                                ? "bg-secondary text-secondary-foreground border-secondary shadow-[0_0_15px_rgba(var(--secondary),0.3)]"
                                : "bg-transparent border-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        )}
                    >
                        My Watchlist
                    </button>

                    {([
                        { id: 'top50', label: 'Top 50', activeColor: 'bg-blue-500 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
                        { id: 'gainers', label: 'Gainers', activeColor: 'bg-green-500 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' },
                        { id: 'losers', label: 'Losers', activeColor: 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' },
                    ] as const).map((f) => (
                        <button
                            key={f.id}
                            onClick={() => { setFilter(f.id); setCurrentPage(1); }}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                                filter === f.id
                                    ? f.activeColor
                                    : "bg-transparent border-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="w-full md:w-[25vw]">
                    <Search
                        value={searchQuery}
                        onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
                        placeholder={`Search ${assetType === 'stock' ? 'Stocks' : 'Crypto'}...`}
                    />
                </div>
            </div>

            {/* Grid Content */}

            {/* Grid Content */}
            {filteredData.length > 0 ? (
                <MarketGrid
                    coins={paginatedCoins}
                    assetType={assetType}
                    onSelect={(symbol) => console.log(symbol)}
                    watchlistIds={watchlistIds}
                    source={filter === 'watchlist' ? 'watchlist' : 'market'}
                    onWatchlistChange={() => {
                        if (user) {
                            const list = LocalStorage.getWatchlist(user.id);
                            setWatchlistIds(new Set(list.map(item => item.coin_id)));
                        }
                    }}
                />
            ) : (
                <div className="py-12">
                    <ErrorState
                        type={searchQuery ? 'search' : filter === 'watchlist' ? 'empty' : 'error'}
                        title={
                            searchQuery ? "No matches found" :
                                filter === 'watchlist' ? "Your Watchlist is Empty" :
                                    "No Market Data"
                        }
                        message={
                            searchQuery ? `No ${assetType} found matching "${searchQuery}"` :
                                filter === 'watchlist' ? "Star your favorite assets to track them here." :
                                    "We couldn't load any market data. Please try refreshing."
                        }
                        retryAction={filter === 'watchlist' ? undefined : () => window.location.reload()}
                        retryLabel="Refresh Page"
                    />
                </div>
            )}

            {/* Pagination Controls */}
            {
                filteredData.length > 0 && totalPages > 1 && (
                    <div className="mt-20 flex justify-center items-center gap-4 pt-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-medium text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                        <div className="hidden">
                            Debug: {filteredData.length} items, {totalPages} pages
                        </div>
                    </div>
                )
            }
        </div >
    );
}
