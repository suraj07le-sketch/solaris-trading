/**
 * Market Insights Service
 * Centralized fetching for Advanced Indian Market Data
 * Routes through /api/proxy to avoid CORS issues
 */

export interface StockInsight {
    symbol: string;
    stock_name: string;
    current_price: number;
    change_percent: number;
    status?: "UP" | "DOWN";
}

// Helper to build proxy URL - ensuring we use the 'url' parameter which is more robust
const buildProxyUrl = (endpoint: string, params?: Record<string, string>) => {
    const baseUrl = "https://stock.indianapi.in";
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    const targetUrl = `${baseUrl}/${endpoint}${queryString ? `?${queryString}` : ""}`;
    return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
};

export const fetchTrendingStocks = async () => {
    try {
        const res = await fetch(buildProxyUrl("trending_stocks"));
        if (!res.ok) throw new Error("API Offline");
        return await res.json();
    } catch (err) {
        console.warn("[MarketInsights] Trending fetch failed, using fallback");
        return [
            { symbol: "TATAELXSI", stock_name: "Tata Elxsi", current_price: 7850.45, change_percent: 2.34 },
            { symbol: "RELIANCE", stock_name: "Reliance Ind", current_price: 2456.20, change_percent: 1.15 },
            { symbol: "HDFCBANK", stock_name: "HDFC Bank", current_price: 1645.80, change_percent: -0.45 },
            { symbol: "ZOMATO", stock_name: "Zomato Ltd", current_price: 156.40, change_percent: 4.56 },
            { symbol: "WIPRO", stock_name: "Wipro", current_price: 489.20, change_percent: -1.20 }
        ];
    }
};

export const fetchNSEMostActive = async () => {
    try {
        // Correct endpoint as per probe-nse.js: NSE_most_active
        const res = await fetch(buildProxyUrl("NSE_most_active"));
        if (!res.ok) throw new Error("API Path Error");
        const data = await res.json();

        const list = Array.isArray(data) ? data : (data.data || []);
        if (!Array.isArray(list)) return [];

        return list.map((item: any) => ({
            symbol: item.ticker ? item.ticker.replace('.NS', '') : item.symbol,
            stock_name: item.company || item.stock_name || item.name,
            current_price: item.price || item.current_price || item.currentPrice?.NSE || 0,
            change_percent: item.percent_change || item.change_percent || item.pChange || 0,
            status: (item.percent_change || item.change_percent || item.pChange || 0) >= 0 ? "UP" : "DOWN"
        }));
    } catch (err: any) {
        if (err.message?.includes("429")) {
            console.warn("[MarketInsights] Rate Limit Exceeded (429) for NSE Most Active. Cooling down...");
        } else {
            console.warn("[MarketInsights] NSE Most Active fetch failed", err);
        }
        return [];
    }
};

export const fetch52WeekHighLow = async () => {
    try {
        // Common pattern for this API
        const res = await fetch(buildProxyUrl("52_week_high_low"));
        if (!res.ok) throw new Error("API Path Error");
        return await res.json();
    } catch (err) {
        console.warn("[MarketInsights] 52 Week High/Low fetch failed");
        return { high: [], low: [] };
    }
};

export const searchMutualFunds = async (query: string) => {
    try {
        const res = await fetch(buildProxyUrl("mutual_fund_search", { query }));
        if (!res.ok) return [];
        return await res.json();
    } catch (err) { return []; }
};

export const getMutualFundDetails = async (fundId: string) => {
    try {
        const res = await fetch(buildProxyUrl("mutual_funds_details", { id: fundId }));
        if (!res.ok) return null;
        return await res.json();
    } catch (err) { return null; }
};

