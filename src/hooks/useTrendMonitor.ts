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
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length; // Not used for std dev of residuals but good context
    const residuals = prices.map((p, i) => {
        const predicted = slope * i + intercept;
        return Math.pow(p - predicted, 2);
    });
    const variance = residuals.reduce((a, b) => a + b, 0) / prices.length;
    return Math.sqrt(variance);
}

export function useTrendMonitor({ symbol, isScript, enabled }: TrendMonitorProps) {
    const lastAlertTime = useRef<number>(0);

    const { data: analysis } = useQuery({
        queryKey: ['trend-analysis-7w', symbol],
        queryFn: async () => {
            if (!enabled || !symbol || isScript) return null; // Only Crypto MVP for now

            // Fetch 7 weeks of 1h data (~1176 candles)
            // Binance API limit is 1000 per call. We need 2 calls or just use 1000 candles (approx 6 weeks) which is close enough for MVP.
            // Let's stick to 1000 candles (approx 42 days / 6 weeks) to keep it simple and fast.
            const formattedSymbol = symbol.toUpperCase() + (symbol.toUpperCase().endsWith("USDT") ? "" : "USDT");
            const res = await axios.get("https://api.binance.com/api/v3/klines", {
                params: { symbol: formattedSymbol, interval: "1h", limit: 1000 }
            });

            const closes = res.data.map((d: any) => parseFloat(d[4]));
            const { slope, intercept } = calculateLinearRegression(closes);
            const stdDev = calculateStdDev(closes, slope, intercept);

            // Calculate Channel Bounds
            const currentIdx = closes.length - 1;
            const currentPrice = closes[currentIdx];
            const predictedPrice = slope * currentIdx + intercept;

            const upperBand = predictedPrice + (2 * stdDev);
            const lowerBand = predictedPrice - (2 * stdDev);

            // Recent momentum (last 3 candles)
            const c1 = parseFloat(res.data[currentIdx - 1][4]); // closed
            const last3Green = closes[currentIdx] > closes[currentIdx - 1] && closes[currentIdx - 1] > closes[currentIdx - 2];
            const last3Red = closes[currentIdx] < closes[currentIdx - 1] && closes[currentIdx - 1] < closes[currentIdx - 2];

            return {
                currentPrice,
                slope,
                upperBand,
                lowerBand,
                last3Green,
                last3Red,
                trendDirection: slope > 0 ? 'UP' : 'DOWN'
            };
        },
        enabled: enabled && !isScript,
        refetchInterval: 5 * 60 * 1000, // Check every 5 minutes (less frequent due to heavy calculation)
    });

    useEffect(() => {
        if (!analysis) return;

        const now = Date.now();
        // Alert cooldown: 4 hours (don't spam user on every tick)
        if (now - lastAlertTime.current < 4 * 60 * 60 * 1000) {
            return;
        }

        // LOGIC: Reversal at Channel Extremes

        // 1. Bottom Reversal (Buy)
        // Price is near Lower Band AND starting to move UP
        if (analysis.currentPrice <= (analysis.lowerBand * 1.02) && analysis.last3Green) {
            // Send Notification
            if (Notification.permission === "granted") {
                new Notification(`🚀 BUY ALERT: ${symbol}`, {
                    body: `Price bounced off 7-week support! \nTarget: $${analysis.upperBand.toFixed(2)}`,
                    icon: "/icons/icon-192x192.png" // assuming PWA icon exists
                });
            } else {
                toast.success(`🚀 BUY ALERT: ${symbol}`, {
                    description: `Price support at $${analysis.lowerBand.toFixed(2)}. 7-Week Trend suggests reversal UP!`,
                    duration: 10000,
                });
            }
            lastAlertTime.current = now;
        }

        // 2. Top Reversal (Sell)
        // Price is near Upper Band AND starting to move DOWN
        if (analysis.currentPrice >= (analysis.upperBand * 0.98) && analysis.last3Red) {
            if (Notification.permission === "granted") {
                new Notification(`📉 SELL ALERT: ${symbol}`, {
                    body: `Price hit 7-week resistance! \nTarget: $${analysis.lowerBand.toFixed(2)}`,
                    icon: "/icons/icon-192x192.png"
                });
            } else {
                toast.error(`📉 SELL ALERT: ${symbol}`, {
                    description: `Price resistance at $${analysis.upperBand.toFixed(2)}. 7-Week Trend suggests reversal DOWN!`,
                    duration: 10000,
                });
            }
            lastAlertTime.current = now;
        }

        // Request notification permission if not asked yet
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }

    }, [analysis, symbol]);
}
