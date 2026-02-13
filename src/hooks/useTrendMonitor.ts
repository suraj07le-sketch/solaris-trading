import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface TrendMonitorProps {
    symbol: string;
    isScript: boolean; // stock vs crypto
    enabled: boolean;
}

// Helper: Calculate Linear Regression
function calculateLinearRegression(prices: number[]) {
    const n = prices.length;
    if (n < 2) return { slope: 0, intercept: 0 };
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += prices[i];
        sumXY += i * prices[i];
        sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}

// Helper: Standard Deviation
function calculateStdDev(prices: number[], slope: number, intercept: number) {
    if (prices.length === 0) return 0;
    const residuals = prices.map((p, i) => {
        const predicted = slope * i + intercept;
        return Math.pow(p - predicted, 2);
    });
    const variance = residuals.reduce((a, b) => a + b, 0) / prices.length;
    return Math.sqrt(variance);
}

import { indianApiLimiter } from '@/lib/rateLimiter';

// ... other imports ...

export function useTrendMonitor({ symbol, isScript, enabled }: TrendMonitorProps) {
    const lastAlertTime = useRef<number>(0);
    const lastHugeAlertTime = useRef<number>(0);

    const { data: analysis } = useQuery({
        queryKey: ['trend-analysis-v2', symbol, isScript],
        queryFn: async () => {
            if (!enabled || !symbol) return null;

            let closes: number[] = [];
            let currentPrice = 0;
            let priceChange24h = 0;

            try {
                if (!isScript) {
                    // Crypto - Binance (Proxy)
                    // Crypto APIs usually have higher limits, so we might not strictly need the limiter here, 
                    // but if Binance proxy also hits 429, we could wrap this too. For now leaving as is.
                    const formattedSymbol = symbol.toUpperCase() + (symbol.toUpperCase().endsWith("USDT") ? "" : "USDT");
                    const res = await axios.get("/api/proxy", {
                        params: {
                            url: `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=1h&limit=500`
                        }
                    });
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    closes = res.data.map((d: any) => parseFloat(d[4]));
                    currentPrice = closes[closes.length - 1];

                    // Approximate 24h change from klines if ticker not available
                    const price24hAgo = closes[closes.length - 25] || closes[0];
                    priceChange24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;
                } else {
                    // Stock - Proxy
                    // WRAPPED with Rate Limiter to prevent 429s on IndianAPI
                    const targetUrl = `https://stock.indianapi.in/stock?name=${symbol.toUpperCase()}`;

                    const res = await indianApiLimiter.add(() => axios.get("/api/proxy", {
                        params: { url: targetUrl }
                    }));

                    // Flexible mapping: handles both direct object and { success, data } wrap
                    const stock = res.data?.data || res.data;
                    if (stock) {
                        currentPrice = stock.current_price || stock.currentPrice?.NSE || stock.lastPrice || 0;
                        priceChange24h = stock.price_change_percentage_24h || stock.pChange || 0;

                        // stocks will primarily trigger on "Huge Move" percentage due to limited intraday data in this simple fetch
                        closes = [stock.low_24h || currentPrice, currentPrice];
                    }
                }
            } catch (e) {
                console.error(`[TrendMonitor] Fetch failed for ${symbol}:`, e);
                return null;
            }

            if (closes.length < 2) return null;

            // Trend Analysis
            const { slope: ltSlope, intercept: ltIntercept } = calculateLinearRegression(closes);
            const ltStdDev = calculateStdDev(closes, ltSlope, ltIntercept);
            const ltCurrentIdx = closes.length - 1;
            const upperBand = (ltSlope * ltCurrentIdx + ltIntercept) + (2 * ltStdDev);
            const lowerBand = (ltSlope * ltCurrentIdx + ltIntercept) - (2 * ltStdDev);

            const recentCloses = closes.slice(-24);
            const { slope: stSlope } = calculateLinearRegression(recentCloses);

            return {
                currentPrice,
                priceChange24h,
                ltSlope,
                stSlope,
                upperBand,
                lowerBand,
                last3Green: closes.length > 3 ? (closes[ltCurrentIdx] > closes[ltCurrentIdx - 1] && closes[ltCurrentIdx - 1] > closes[ltCurrentIdx - 2]) : false,
                last3Red: closes.length > 3 ? (closes[ltCurrentIdx] < closes[ltCurrentIdx - 1] && closes[ltCurrentIdx - 1] < closes[ltCurrentIdx - 2]) : false,
                ltTrend: ltSlope > 0 ? 'UP' : 'DOWN',
                stTrend: stSlope > 0 ? 'UP' : 'DOWN',
                hourlyMove: closes.length > 1 ? ((currentPrice - closes[closes.length - 2]) / closes[closes.length - 2]) * 100 : 0
            };
        },
        enabled: enabled && !!symbol,
        staleTime: 5 * 60 * 1000,
        refetchInterval: 30 * 60 * 1000,
    });

    useEffect(() => {
        if (!analysis || isScript) return; // Disable all trend notifications for Stocks (isScript)

        const now = Date.now();
        const COOLDOWN_NORMAL = 2 * 60 * 60 * 1000;
        const COOLDOWN_HUGE = 30 * 60 * 1000;

        // 1. HUGE MOVE DETECTION (Priority 1)
        const isHugeMove = Math.abs(analysis.hourlyMove) >= 2.5 || Math.abs(analysis.priceChange24h) >= 5.0;

        if (isHugeMove && (now - lastHugeAlertTime.current > COOLDOWN_HUGE)) {
            const direction = analysis.hourlyMove > 0 || analysis.priceChange24h > 0 ? '🚀 HUGE UP' : '📉 HUGE DOWN';
            const reason = Math.abs(analysis.hourlyMove) >= 2.5
                ? `${Math.abs(analysis.hourlyMove).toFixed(1)}% move in last hour!`
                : `${Math.abs(analysis.priceChange24h).toFixed(1)}% move today!`;

            if (Notification.permission === "granted") {
                new Notification(`${direction}: ${symbol}`, {
                    body: reason,
                    icon: "/icons/icon-192x192.png",
                    tag: `huge-move-${symbol}`
                });
            } else {
                toast(direction, {
                    description: `${symbol} is highly volatile: ${reason}`,
                    duration: 15000,
                });
            }
            lastHugeAlertTime.current = now;
            return;
        }

        // 2. NORMAL TREND REVERSALS (Priority 2)
        if (now - lastAlertTime.current < COOLDOWN_NORMAL) return;

        // Bottom Reversal (Buy)
        const stReversalUP = analysis.stTrend === 'UP' && analysis.last3Green;
        const reachedSupport = analysis.currentPrice <= (analysis.lowerBand * 1.01);

        if (stReversalUP || reachedSupport) {
            const title = `🚀 BUY ALERT: ${symbol}`;
            const body = stReversalUP ? `Short-term momentum turned UP!` : `Price hit major support!`;

            if (Notification.permission === "granted") {
                new Notification(title, { body, icon: "/icons/icon-192x192.png", tag: `trend-${symbol}` });
            } else {
                toast.success(title, { description: body });
            }
            lastAlertTime.current = now;
        }

        // Top Reversal (Sell)
        const stReversalDOWN = analysis.stTrend === 'DOWN' && analysis.last3Red;
        const reachedResistance = analysis.currentPrice >= (analysis.upperBand * 0.99);

        if (stReversalDOWN || reachedResistance) {
            const title = `📉 SELL ALERT: ${symbol}`;
            const body = reachedResistance ? `Price hit major resistance!` : `Short-term momentum turned DOWN!`;

            if (Notification.permission === "granted") {
                new Notification(title, { body, icon: "/icons/icon-192x192.png", tag: `trend-${symbol}` });
            } else {
                toast.error(title, { description: body });
            }
            lastAlertTime.current = now;
        }

        if (Notification.permission === "default") {
            Notification.requestPermission();
        }

    }, [analysis, symbol, isScript]);
}
