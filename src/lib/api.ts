import { supabase } from "./supabase";
import { unstable_cache } from "next/cache";

const SAMPLE_STOCKS = [
    { id: 'rel', symbol: 'RELIANCE', name: 'Reliance Industries', current_price: 2950.45, price_change_percentage_24h: 1.2, market_cap: 1900000, image: 'https://logo.clearbit.com/reliance.com' },
    { id: 'tcs', symbol: 'TCS', name: 'Tata Consultancy Services', current_price: 4120.10, price_change_percentage_24h: -0.5, market_cap: 1500000, image: 'https://logo.clearbit.com/tcs.com' },
    { id: 'hdfc', symbol: 'HDFCBANK', name: 'HDFC Bank', current_price: 1680.30, price_change_percentage_24h: 0.8, market_cap: 1200000, image: 'https://logo.clearbit.com/hdfcbank.com' },
    { id: 'infy', symbol: 'INFY', name: 'Infosys', current_price: 1540.20, price_change_percentage_24h: 2.1, market_cap: 650000, image: 'https://logo.clearbit.com/infosys.com' },
    { id: 'icici', symbol: 'ICICIBANK', name: 'ICICI Bank', current_price: 1120.50, price_change_percentage_24h: 0.3, market_cap: 780000, image: 'https://logo.clearbit.com/icicibank.com' }
];

const SAMPLE_CRYPTO = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 65430.20, price_change_percentage_24h: 3.5, market_cap: 1200000000, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 3450.80, price_change_percentage_24h: 2.1, market_cap: 410000000, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', current_price: 145.30, price_change_percentage_24h: 5.8, market_cap: 65000000, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', current_price: 580.40, price_change_percentage_24h: 1.2, market_cap: 85000000, image: 'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png' },
    { id: 'ripple', symbol: 'XRP', name: 'Ripple', current_price: 0.62, price_change_percentage_24h: -1.5, market_cap: 35000000, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' }
];

// Wrapped in unstable_cache to prevent DB blasting
export const getMarketData = unstable_cache(
    async (assetType: 'stock' | 'crypto' = 'stock') => {
        try {
            const tableName = assetType === 'stock' ? 'indian_stocks' : 'crypto_coins';

            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order(assetType === 'stock' ? 'market_cap' : 'rank', { ascending: assetType === 'crypto' });

            if (error) {
                console.error(`Supabase ${assetType} Error:`, JSON.stringify(error, null, 2));
                // Return samples on DB error
                return assetType === 'stock' ? SAMPLE_STOCKS : SAMPLE_CRYPTO;
            }

            // If data is empty, return samples
            const finalData = (data && data.length > 0) ? data : (assetType === 'stock' ? SAMPLE_STOCKS : SAMPLE_CRYPTO);

            return finalData.map((item: any, index: number) => ({
                id: item.id,
                symbol: item.symbol,
                name: item.name,
                image: item.image || null,
                current_price: assetType === 'stock' ? item.current_price : (item.price_usd || item.current_price), // Handle schema variance
                price_change_percentage_24h: assetType === 'stock' ? item.price_change_percentage_24h : (item.change_24h || item.price_change_percentage_24h),
                high_24h: item.high_24h,
                low_24h: item.low_24h,
                market_cap: assetType === 'stock' ? item.market_cap : (item.market_cap_usd || item.market_cap || 0),
                market_cap_rank: item.market_cap_rank || item.rank || (index + 1),
                volume: item.volume,
                asset_type: assetType
            }));

        } catch (error) {
            console.error("Market Data Error:", error);
            return [];
        }
    },
    ['market-data-v2'],
    { revalidate: 30, tags: ['market-data-v2'] }
);

export async function getCoinDetails(id: string) {
    const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`,
        { next: { revalidate: 60 } }
    );

    if (!res.ok) {
        // Fallback or error
        return null;
    }
    return res.json();
}
