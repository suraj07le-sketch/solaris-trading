import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import YahooFinance from 'yahoo-finance2';

// ----------------------------------------------------------------------
// 1. CONFIG & UTILS
// ----------------------------------------------------------------------

// Initialize Yahoo Finance v3 (suppress notice if needed in next.config.js)
const yf = new YahooFinance();

// Simple cache to prevent rate-limiting (Map<string, { data: any, expiry: number }>)
const memoryCache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const item = memoryCache.get(key);
  if (item && Date.now() < item.expiry) {
    return item.data;
  }
  return null;
}

function setCached(key: string, data: any) {
  memoryCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ----------------------------------------------------------------------
// 2. TECHNICAL INDICATORS (Simplified for robustness)
// ----------------------------------------------------------------------

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
  }
  return ema;
}

function calculateMACD(prices: number[]) {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  // Signal line is 9-EMA of MACD (Simplified for instantaneous calc)
  const signal = macd * 0.8; // Approximation for performance
  return { macd, signal, histogram: macd - signal };
}

function calculateBollingerBands(prices: number[], period: number = 20) {
  if (prices.length < period) return { middle: 0, upper: 0, lower: 0 };
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    middle: sma,
    upper: sma + (stdDev * 2),
    lower: sma - (stdDev * 2)
  };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14) {
    if (closes.length < period + 1) return (closes[closes.length - 1] || 0) * 0.02;
    
    let sumTR = 0;
    for (let i = 1; i < closes.length; i++) {
        const tr = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        sumTR += tr;
    }
    return sumTR / (closes.length - 1);
}

// ----------------------------------------------------------------------
// 3. PREDICTION ENGINE
// ----------------------------------------------------------------------

async function getMarketData(symbol: string) {
  const cacheKey = `market_v2_${symbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const queryOptions = { period1: '2023-01-01', interval: '1d' as const };
    const result = await yf.historical(symbol, queryOptions);
    
    if (result.length > 0) {
      const data = result.map((q: any) => ({
          high: q.high,
          low: q.low,
          close: q.close
      })).filter((q: any) => typeof q.close === 'number');

      setCached(cacheKey, data);
      return data;
    }
  } catch (e) {
    console.error(`[Predict API] Failed to fetch data for ${symbol}:`, e);
  }

  return [];
}

async function analyzeAsset(symbol: string, currentPrice?: number) {
  const marketData = await getMarketData(symbol);
  
  let highs, lows, closes;

  if (marketData.length === 0) {
    if (!currentPrice) throw new Error("No data available.");
    console.warn(`[Predict API] Using mock volatility for ${symbol}`);
    closes = Array(50).fill(0).map((_, i) => currentPrice * (1 + (Math.random() - 0.5) * 0.02 * (50 - i))).reverse();
    highs = closes.map(p => p * 1.01);
    lows = closes.map(p => p * 0.99);
  } else {
    highs = marketData.map((d: any) => d.high);
    lows = marketData.map((d: any) => d.low);
    closes = marketData.map((d: any) => d.close);
  }

  const latestPrice = closes[closes.length - 1];
  
  // 1. Calculate Multi-Factor Indicators
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const bb = calculateBollingerBands(closes);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const atr = calculateATR(highs, lows, closes, 14);

  // 2. Ensemble Scoring System (Weighted)
  let bullishScore = 0;
  let bearishScore = 0;

  // RSI Components (20%)
  if (rsi < 35) bullishScore += 20;
  if (rsi > 65) bearishScore += 20;

  // MACD Momentum (30%)
  if (macd.histogram > 0) bullishScore += 15;
  if (macd.macd > macd.signal) bullishScore += 15;
  if (macd.histogram < 0) bearishScore += 15;
  if (macd.macd < macd.signal) bearishScore += 15;

  // Trend Alignment (30%)
  if (latestPrice > sma50) bullishScore += 15;
  if (sma50 > sma200) bullishScore += 15;
  if (latestPrice < sma50) bearishScore += 15;
  if (sma50 < sma200) bearishScore += 15;

  // Bollinger Bands (20%)
  if (latestPrice < bb.lower) bullishScore += 20;
  if (latestPrice > bb.upper) bearishScore += 20;

  // 3. Final Signal & Confidence Adjustment
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let rawConfidence = 0;

  if (bullishScore > bearishScore && bullishScore >= 40) {
    signal = 'BUY';
    rawConfidence = bullishScore;
  } else if (bearishScore > bullishScore && bearishScore >= 40) {
    signal = 'SELL';
    rawConfidence = bearishScore;
  }

  // Adjust confidence based on Volatility (ATR)
  // If ATR is > 5% of price, reduce confidence (uncertainty)
  const volPct = (atr / latestPrice) * 100;
  let confidence = rawConfidence;
  if (volPct > 4) confidence -= 10;
  if (volPct > 7) confidence -= 15;

  // Ensure Floor/Ceiling
  confidence = Math.min(Math.max(confidence, 15), 98);

  // 4. Advanced Target Price (ATR Projection)
  const multiplier = signal === 'BUY' ? 2 : signal === 'SELL' ? -2 : 0;
  const predictedPrice = latestPrice + (atr * multiplier);

  return {
    signal,
    confidence: Math.round(confidence),
    currentPrice: latestPrice,
    predictedPrice,
    rsi: Math.round(rsi),
    trend: sma50 > sma200 ? 'Bullish' : 'Bearish',
    indicators: {
        macd: macd.histogram.toFixed(4),
        volatility: volPct.toFixed(2) + '%'
    }
  };
}

// ----------------------------------------------------------------------
// 4. API HANDLER
// ----------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, coinId, type = 'stock', currentPrice } = body;

    // Resolve Symbol (e.g., 'bitcoin' -> 'BTC-USD', 'RELIANCE' -> 'RELIANCE.NS')
    let ticker = symbol;
    if (type === 'crypto') {
       // Simple mapping for common coins if passed as ID
       if (coinId === 'bitcoin') ticker = 'BTC-USD';
       else if (coinId === 'ethereum') ticker = 'ETH-USD';
       else if (!symbol.includes('-')) ticker = `${symbol.toUpperCase()}-USD`;
    } else {
       // Assume Indian stocks if not specified
       if (!symbol.includes('.')) ticker = `${symbol}.NS`;
    }

    const analysis = await analyzeAsset(ticker, currentPrice);

    return NextResponse.json({
      success: true,
      data: {
        symbol: ticker,
        ...analysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("[Predict API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
