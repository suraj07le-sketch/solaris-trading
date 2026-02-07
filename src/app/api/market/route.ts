import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { unstable_cache } from 'next/cache';

// Rate Limiting Mock (In a real app, use Redis/Upstash)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;
const requestLog = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const requests = requestLog.get(ip) || [];
    const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= MAX_REQUESTS) return false;
    
    validRequests.push(now);
    requestLog.set(ip, validRequests);
    return true;
}

// Cached Data Fetcher
const getMarketData = unstable_cache(
    async (type: 'stock' | 'crypto') => {
        try {
            const table = type === 'stock' ? 'indian_stocks' : 'crypto_coins';
            
            // Fetch data with error handling
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .order(type === 'stock' ? 'market_cap' : 'rank', { ascending: type === 'crypto', nullsFirst: false })
                .limit(50); // Limit to top 50 for performance

            if (error) {
                console.error(`[Market API] Supabase error for ${type}:`, error);
                throw new Error("Database query failed");
            }
            
            return data || [];
        } catch (e) {
            console.error(`[Market API] Unexpected error in fetcher:`, e);
            return [];
        }
    },
    ['market-data-db-v2'], // Versioned cache key
    { revalidate: 60, tags: ['market-data'] }
);

export async function GET(request: Request) {
    const start = Date.now();
    try {
        // 1. Rate Limiting
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { success: false, error: "Too Many Requests" },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') === 'crypto' ? 'crypto' : 'stock';

        // 2. Fetch Data (Cached)
        const rawData = await getMarketData(type);

        // 3. Normalize Data
        const normalized = rawData.map((item: any, index: number) => ({
            id: item.id || `asset-${index}`,
            symbol: item.symbol?.toUpperCase() || "UNK",
            name: item.name || "Unknown Asset",
            image: item.image || item.logo_url || null,
            current_price: type === 'stock' ? item.current_price : (item.price_usd || item.current_price || 0),
            price_change_percentage_24h: type === 'stock' 
                ? item.price_change_percentage_24h 
                : (item.change_24h || item.price_change_percentage_24h || 0),
            high_24h: item.high_24h || 0,
            low_24h: item.low_24h || 0,
            market_cap: type === 'stock' ? item.market_cap : (item.market_cap_usd || item.market_cap || 0),
            rank: item.market_cap_rank || item.rank || (index + 1),
            volume: item.volume || item.total_volume || 0,
            type: type
        }));

        // 4. Performance Header
        const duration = Date.now() - start;
        const response = NextResponse.json({
            success: true,
            count: normalized.length,
            data: normalized
        });
        
        response.headers.set('X-Response-Time', `${duration}ms`);
        return response;

    } catch (error: any) {
        console.error("[Market API] Critical Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error", message: error.message },
            { status: 500 }
        );
    }
}
