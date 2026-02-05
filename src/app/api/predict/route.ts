/** 
 * REFRESH ATTEMPT: FIXED YAHOO FINANCE v3 INITIALIZATION 
 * Timestamp: 2026-02-05 02:18
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import YahooFinance from 'yahoo-finance2';

// Create instance for Yahoo Finance v3
const yf = new YahooFinance();

// Import ML models
import { extractFeatures, type MarketData as MLMarketData } from '@/lib/ml/features';
import { advancedEnsemblePrediction, trainGradientBoosting, predictGradientBoosting } from '@/lib/ml/gradient-boost';
import { sequencePrediction, multiHorizonPrediction, detectPatterns } from '@/lib/ml/lstm-predictor';

// ============================================
// PROFESSIONAL QUANTITATIVE PREDICTION ENGINE
// ============================================

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
const INDIAN_API_KEY = process.env.INDIAN_API_KEY || process.env.NEXT_PUBLIC_INDIAN_API_KEY || "sk-live-ASP6f2VKjpJhs4yUrBjmRXw5kUI6gUVRlLrhmrYv";

declare global {
    var modelCache: Map<string, any>;
    var priceCache: Map<string, { data: any[], timestamp: number }>;
}

if (!global.modelCache) {
    global.modelCache = new Map<string, any>();
}
if (!global.priceCache) {
    global.priceCache = new Map<string, { data: any[], timestamp: number }>();
}

const modelCache = global.modelCache;
const priceCache = global.priceCache;
const CACHE_DURATION = 60 * 1000;

// Indicators
function calculateEMA(data: number[], period: number): number[] {
    const result: number[] = [];
    if (data.length === 0) return result;
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
        result.push(ema);
    }
    return result;
}

function calculateRSI(data: number[], period: number = 14): number[] {
    const result: number[] = [];
    if (data.length <= period) return result;
    const gains: number[] = [];
    const losses: number[] = [];
    for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? -change : 0);
    }
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < gains.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
    }
    return result;
}

function calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const emaFast = calculateEMA(data, fastPeriod);
    const emaSlow = calculateEMA(data, slowPeriod);
    const macdLine: number[] = [];
    if (emaFast.length === 0 || emaSlow.length === 0) return { macd: [], signal: [], histogram: [] };
    const offset = emaSlow.length - emaFast.length;
    for (let i = 0; i < emaFast.length; i++) {
        const slowIdx = i + offset;
        if (slowIdx >= 0 && slowIdx < emaSlow.length) macdLine.push(emaFast[i] - emaSlow[slowIdx]);
    }
    const signalLine = calculateEMA(macdLine, signalPeriod);
    const macdHistogram: number[] = [];
    const histOffset = signalLine.length - macdLine.length;
    for (let i = 0; i < macdLine.length - histOffset; i++) {
        const macdIdx = i + histOffset;
        if (macdIdx >= 0 && macdIdx < macdLine.length) macdHistogram.push(macdLine[macdIdx] - signalLine[i]);
    }
    return { macd: macdLine, signal: signalLine, histogram: macdHistogram };
}

function calculateATR(highData: number[], lowData: number[], closeData: number[], period: number = 14): number[] {
    const result: number[] = [];
    if (highData.length <= period) return result;
    const trueRanges: number[] = [];
    for (let i = 1; i < highData.length; i++) {
        const tr = Math.max(highData[i] - lowData[i], Math.abs(highData[i] - closeData[i - 1]), Math.abs(lowData[i] - closeData[i - 1]));
        trueRanges.push(tr);
    }
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < trueRanges.length; i++) {
        atr = (atr * (period - 1) + trueRanges[i]) / period;
        if (i >= period - 1) result.push(atr);
    }
    return result;
}

function calculateVolatility(data: number[], period: number = 20): number[] {
    const result: number[] = [];
    if (data.length <= period) return result;
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) returns.push(Math.log(data[i] / data[i - 1]));
    for (let i = period; i < returns.length; i++) {
        const slice = returns.slice(i - period, i);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
        result.push(Math.sqrt(variance) * Math.sqrt(252) * 100);
    }
    return result;
}

function detectMarketRegime(closeData: number[], emaFast: number[], emaSlow: number[], volatility: number[]): 'TRENDING' | 'RANGING' {
    if (emaFast.length === 0 || emaSlow.length === 0 || volatility.length === 0) return 'RANGING';
    const latestFast = emaFast[emaFast.length - 1];
    const latestSlow = emaSlow[emaSlow.length - 1];
    const latestVol = volatility[volatility.length - 1];
    const emaSeparation = Math.abs(latestFast - latestSlow) / latestSlow * 100;
    const avgVol = volatility.reduce((a, b) => a + b, 0) / volatility.length;
    if (emaSeparation > 1.5 && latestVol > avgVol * 0.9) return 'TRENDING';
    if (emaSeparation < 0.5 && latestVol < avgVol * 1.1) return 'RANGING';
    return emaSeparation > 0.8 ? 'TRENDING' : 'RANGING';
}

function ensemblePrediction(features: { emaFast: number[]; emaSlow: number[]; rsi: number[]; macd: { histogram: number[] }; volatility: number[]; returns: number[]; }): { direction: number; confidence: number } {
    let score = 0; let weights = 0;
    if (features.emaFast.length > 0 && features.emaSlow.length > 0) {
        const fastVal = features.emaFast[features.emaFast.length - 1];
        const slowVal = features.emaSlow[features.emaSlow.length - 1];
        if (!isNaN(fastVal) && !isNaN(slowVal) && slowVal !== 0) {
            const trend = (fastVal - slowVal) / slowVal;
            score += trend * 0.25; weights += 0.25;
        }
    }
    if (features.rsi.length > 0) {
        const rsi = features.rsi[features.rsi.length - 1];
        if (!isNaN(rsi)) {
            const rsiSignal = (rsi - 50) / 50;
            score += rsiSignal * 0.2; weights += 0.2;
        }
    }
    if (features.macd.histogram.length > 0) {
        const hist = features.macd.histogram[features.macd.histogram.length - 1];
        if (!isNaN(hist)) {
            const histNormalized = Math.tanh(hist * 1000);
            score += histNormalized * 0.2; weights += 0.2;
        }
    }
    if (features.returns.length > 0) {
        const recentReturn = features.returns[features.returns.length - 1];
        if (!isNaN(recentReturn)) { score += recentReturn * 2; weights += 0.2; }
    }
    if (features.returns.length > 5) {
        const recentReturns = features.returns.slice(-5);
        const validReturns = recentReturns.filter(r => !isNaN(r));
        if (validReturns.length > 0) {
            const avgReturn = validReturns.reduce((a, b) => a + b, 0) / validReturns.length;
            if (!isNaN(avgReturn)) { score -= avgReturn * 0.15; weights += 0.15; }
        }
    }
    const normalizedScore = weights > 0 ? score / weights : 0;
    const direction = normalizedScore > 0.02 ? 1 : normalizedScore < -0.02 ? -1 : 0;
    const confidence = Math.min(Math.abs(normalizedScore) * 7.5, 1) * 100;
    return { direction, confidence: isNaN(confidence) ? 50 : confidence };
}

// Helper to clean and normalize stock symbols for Yahoo/Indian API
function cleanStockSymbol(s: string): string {
    return s
        .replace(/ Ltd\./gi, '')
        .replace(/ Ltd/gi, '')
        .replace(/ Limited/gi, '')
        .replace(/ Bank/gi, '')
        .replace(/ Industries/gi, '')
        .replace(/ /g, '')
        .toUpperCase();
}

// Common Indian stock symbol mappings (full name -> Yahoo symbol)
const INDIAN_STOCK_SYMBOLS: Record<string, string> = {
    'HINDUSTANUNILEVER': 'HINDUNILIV',
    'HINDUSTAN UNILEVER': 'HINDUNILIV',
    'HUL': 'HINDUNILIV',
    'RELIANCE': 'RELIANCE',
    'TCS': 'TCS',
    'INFOSYS': 'INFY',
    'WIPRO': 'WIPRO',
    'HDFCBANK': 'HDFCBANK',
    'ICICIBANK': 'ICICIBANK',
    'SBIN': 'SBIN',
    'BAJFINANCE': 'BAJFINANCE',
    'MARUTI': 'MARUTI',
    'TATAMOTORS': 'TATAMOTORS',
    'AXISBANK': 'AXISBANK',
    'KOTAKBANK': 'KOTAKBANK',
    'ASIANPAINTS': 'ASIANPAINT',
    'TITAN': 'TITAN',
    'ULTRACEMCO': 'ULTRACEMCO',
    'NESTLEIND': 'NESTLEIND',
    'POWERGRID': 'POWERGRID',
    'NTPC': 'NTPC',
    'COALINDIA': 'COALINDIA',
    'ONGC': 'ONGC',
    'BPCL': 'BPCL',
    'IOC': 'IOC',
    'ADANIENT': 'ADANIENT',
    'ADANIPORTS': 'ADANIPORTS',
    'SUNPHARMA': 'SUNPHARMA',
    'CIPLA': 'CIPLA',
    'DRREDDY': 'DRREDDY',
    'BHARTIARTL': 'BHARTIARTL',
    'AIRTEL': 'BHARTIARTL',
    'TECHM': 'TECHM',
    'LT': 'LT',
    'HEROMOTOCO': 'HEROMOTOCO',
    'BAJAJ-AUTO': 'BAJAJ_AUTO',
    'EICHERMOT': 'EICHERMOT',
    'M&M': 'M&M',
    'MAHINDRA': 'M&M',
    'INDUSINDBK': 'INDUSINDBK',
    'JSWSTEEL': 'JSWSTEEL',
    'TATASTEEL': 'TATASTEEL',
    'JSPL': 'JINDALSTEL',
    'GRASIM': 'GRASIM',
    'SHREECEM': 'SHREECEM',
    'AMBUJCEM': 'AMBUJACEM',
    'UPL': 'UPL',
    'DIVISLAB': 'DIVISLAB',
    'BERGEPAINT': 'BERGEPAINT',
    'PATANJALI': 'PATANJALI',
};

// Data Fetching
async function fetchStockData(symbol: string, expectedPrice?: number): Promise<{ close: number[]; high: number[]; low: number[]; volume: number[] } | null> {
    const cleanSym = cleanStockSymbol(symbol);
    // Get the mapped Yahoo symbol if available
    const yahooSym = INDIAN_STOCK_SYMBOLS[cleanSym] || cleanSym;
    
    try {
        console.log(`[API] Trying Indian Stock API for symbol: ${cleanSym}`);
        const url = `https://stock.indianapi.in/historical_data?stock_name=${cleanSym}&period=1m&filter=default`;
        const res = await fetch(url, { headers: { "X-Api-Key": INDIAN_API_KEY } });
        if (res.ok) {
            const data = await res.json();
            const priceDataset = data.datasets?.find((d: any) => d.metric === "Price");
            if (priceDataset && priceDataset.values && priceDataset.values.length > 50) {
                const close = priceDataset.values.map((v: any) => Number(v[1]));
                const high = close.map((p: number) => p * 1.005);
                const low = close.map((p: number) => p * 0.995);
                const volume = close.map(() => 100000);
                return { close, high, low, volume };
            }
        }
    } catch (error) {
        console.error(`[API] Indian API error for ${symbol}:`, error);
    }

    // Build list of symbols to try - use mapped symbol first, then original
    const symbolsToTry = [
        `${yahooSym}.NS`,
        `${yahooSym}.BO`,
        `${cleanSym}.NS`,
        `${cleanSym}.BO`,
        yahooSym,
        cleanSym
    ];
    
    // Remove duplicates
    const uniqueSymbolsToTry = [...new Set(symbolsToTry)];
    
    for (const s of uniqueSymbolsToTry) {
        try {
            console.log(`[API] Trying Yahoo Finance Chart for: ${s}`);

            // Use chart() instead of historical() to avoid "No data found" errors and deprecation
            const chartData = await yf.chart(s, {
                period1: new Date(Date.now() - 365 * 2 * 24 * 60 * 60 * 1000), // 2 Years
                period2: new Date(),
                interval: '1d'
            });

            if (chartData.quotes && chartData.quotes.length > 50) {
                const close: number[] = [];
                const high: number[] = [];
                const low: number[] = [];
                const volume: number[] = [];

                for (const day of chartData.quotes) {
                    if (day.close && day.high && day.low && day.volume) {
                        close.push(day.close);
                        high.push(day.high);
                        low.push(day.low);
                        volume.push(day.volume);
                    }
                }

                if (close.length > 50) {
                    console.log(`[API] Successfully fetched labels for ${s}`);
                    return { close, high, low, volume };
                }
            }
        } catch (error) {
            console.error(`[API] Error fetching chart data for ${s}:`, error);
        }
    }
    return null;
}

async function fetchCryptoData(symbol: string, timeframe: string, expectedPrice?: number): Promise<{ close: number[]; high: number[]; low: number[]; volume: number[] } | null> {
    const symbolMap: Record<string, string> = {
        'bitcoin': 'BTC', 'ethereum': 'ETH', 'solana': 'SOL', 'dogecoin': 'DOGE',
        'ripple': 'XRP', 'cardano': 'ADA', 'polkadot': 'DOT', 'chainlink': 'LINK',
        'polygon': 'MATIC', 'algorand': 'ALGO', 'avalanche-2': 'AVAX', 'stellar': 'XLM',
        'cosmos': 'ATOM', 'litecoin': 'LTC', 'near-protocol': 'NEAR', 'filecoin': 'FIL',
        'shiba-inu': 'SHIB', 'pepe': 'PEPE', 'tron': 'TRX', 'uniswap': 'UNI'
    };

    // Resolve: "algorand" -> "ALGO", "BTC" -> "BTC"
    let baseSymbol = symbolMap[symbol.toLowerCase()] || symbol.toUpperCase();

    // Sanitize: Avoid doubling USDT if it's already in the symbol
    const cleanBase = baseSymbol.replace(/USDT$/i, '').toUpperCase();

    try {
        const interval = timeframe || '4h';
        const pair = `${cleanBase}USDT`;
        console.log(`[API] Fetching Binance data for ${pair} (${interval})`);

        const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=1000`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const close: number[] = [], high: number[] = [], low: number[] = [], volume: number[] = [];
            for (const k of data) {
                close.push(parseFloat(k[4]));
                high.push(parseFloat(k[2]));
                low.push(parseFloat(k[3]));
                volume.push(parseFloat(k[5]));
            }
            if (close.length > 50) return { close, high, low, volume };
        }
    } catch (e) {
        console.warn(`[API] Binance failed for ${cleanBase}, trying Yahoo...`);
    }

    try {
        const yahooSymbol = `${cleanBase}-USD`;
        console.log(`[API] Fetching Yahoo Finance Chart for ${yahooSymbol}`);

        // Use chart() instead of historical() to avoid deprecation and "No data found" errors
        const chartData = await yf.chart(yahooSymbol, {
            period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            period2: new Date(),
            interval: '1d'
        });

        if (chartData.quotes && chartData.quotes.length > 50) {
            const close: number[] = [], high: number[] = [], low: number[] = [], volume: number[] = [];
            for (const d of chartData.quotes) {
                if (d.close && d.high && d.low && d.volume) {
                    close.push(d.close);
                    high.push(d.high);
                    low.push(d.low);
                    volume.push(d.volume);
                }
            }
            return { close, high, low, volume };
        }
    } catch (e) {
        console.error(`[API] Yahoo Crypto error for ${cleanBase}:`, e);
    }
    return null;
}

async function generatePrediction(asset: string, assetType: 'stock' | 'crypto', timeframe: string = '4h', providedPrice?: number): Promise<any> {
    try {
        let marketData = assetType === 'stock' ? await fetchStockData(asset, providedPrice) : await fetchCryptoData(asset, timeframe, providedPrice);
        if (!marketData || marketData.close.length < 50) return { success: false, error: `Insufficient data for ${asset}.`, asset };

        const { close, high, low, volume } = marketData;
        const emaFast = calculateEMA(close, 12); const emaSlow = calculateEMA(close, 50);
        const rsi = calculateRSI(close, 14); const macd = calculateMACD(close);
        const volatility = calculateVolatility(close, 20); const atr = calculateATR(high, low, close, 14);
        const returns: number[] = []; for (let i = 1; i < close.length; i++) returns.push(Math.log(close[i] / close[i - 1]));

        const regime = detectMarketRegime(close, emaFast, emaSlow, volatility);
        const features = extractFeatures({ close, high, low, volume });
        const lstm = sequencePrediction(close); const multiHorizon = multiHorizonPrediction(close);
        const patterns = detectPatterns(close, high, low);
        const gbModel = trainGradientBoosting(features, 10, 0.1); const gbPred = predictGradientBoosting(gbModel, features);
        const ensembleAdv = advancedEnsemblePrediction(features);
        const baseline = ensemblePrediction({ emaFast, emaSlow, rsi, macd, volatility, returns });

        const currentPrice = close[close.length - 1];
        const combinedDirection = (lstm.prediction * 0.4 + gbPred.prediction * 0.3 + ensembleAdv.direction * 0.2 + baseline.direction * 0.1);
        const combinedConfidence = (lstm.confidence * 0.4 + gbPred.confidence * 0.3 + ensembleAdv.confidence * 0.2 + baseline.confidence * 0.1);
        const finalConfidence = Math.min(100, combinedConfidence + Math.abs(patterns.bullishScore - patterns.bearishScore) * 0.5);

        const latestVol = volatility.length > 0 ? volatility[volatility.length - 1] : 2;
        const latestATR = atr[atr.length - 1] || currentPrice * 0.02;

        // Unified Signal Logic
        let signal = 'HOLD';
        if (combinedDirection > 0.1 && finalConfidence > 55) {
            signal = 'BUY';
        } else if (combinedDirection < -0.1 && finalConfidence > 55) {
            signal = 'SELL';
        }

        // Logic Check: Ensure predictedPrice follows the signal
        // We use multiHorizon.consensus but pivot it based on the signal direction
        let predictedChange = multiHorizon.consensus * (finalConfidence / 100) * (latestVol / 100);

        if (signal === 'BUY' && predictedChange <= 0) {
            // Force a positive change based on ATR if the models were slightly contradictory
            // Safe division check
            const divisor = currentPrice > 0 ? currentPrice : 1;
            predictedChange = (latestATR / divisor) * 1.5;
        } else if (signal === 'SELL' && predictedChange >= 0) {
            // Force a negative change
            const divisor = currentPrice > 0 ? currentPrice : 1;
            predictedChange = -(latestATR / divisor) * 1.5;
        } else if (signal === 'HOLD') {
            // Dampen change for HOLD
            predictedChange = predictedChange * 0.2;
        }

        const predictedPrice = currentPrice * (1 + predictedChange);
        const stopLoss = signal === 'BUY' ? currentPrice - latestATR * 2 : (signal === 'SELL' ? currentPrice + latestATR * 2 : currentPrice);

        const validHours = timeframe === '1h' ? 1 : timeframe === '4h' ? 4 : 24;
        const now = new Date();
        const validTill = new Date(now.getTime() + validHours * 60 * 60 * 1000);

        return {
            success: true, asset, type: assetType, timeframe, current_price: currentPrice,
            predicted_price: predictedPrice, prediction_change_percent: ((predictedPrice - currentPrice) / currentPrice) * 100,
            signal, confidence: finalConfidence, stop_loss: stopLoss, market_regime: regime,
            prediction_time: now.toISOString(),
            valid_till: validTill.toISOString()
        };
    } catch (e: any) {
        console.error('[API] Prediction error:', e); return { success: false, error: e.message };
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Config error" }, { status: 500 });

        const supabase = createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
                remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
            },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { coinId, coinName, timeframe, type, currentPrice, symbol: providedSymbol } = await req.json();

        // Smarter asset type detection
        const isCrypto = type === 'crypto' ||
            ["btc", "eth", "sol", "doge", "xrp", "algo", "avax", "shib", "matic"].includes(providedSymbol?.toLowerCase() || coinId?.toLowerCase());
        const assetType = isCrypto ? 'crypto' : 'stock';

        // Prioritize ticker symbol over Slug/ID for AI Analysis
        const assetName = isCrypto
            ? (providedSymbol || coinId)
            : (coinName || coinId);

        const result = await generatePrediction(assetName, assetType, timeframe || '4h', currentPrice);

        // If first attempt fails and it was crypto, try one last time with a forced ticker if we have one
        if (!result.success && isCrypto && coinId !== providedSymbol && providedSymbol) {
            console.log(`[API] Retrying with provided symbol: ${providedSymbol}`);
            const retry = await generatePrediction(providedSymbol, assetType, timeframe || '4h', currentPrice);
            if (retry.success) return NextResponse.json({ success: true, prediction: retry });

            // If retry also fails, return the error from the retry attempt
            return NextResponse.json({ success: false, error: retry.error || 'Retry failed' });
        }

        if (!result.success) {
            console.warn(`[API] Prediction failed for ${assetName}: ${result.error}`);
            // Return 200 success:false instead of 500 for business logic failure
            return NextResponse.json({ success: false, error: result.error });
        }

        // --- BACKGROUND STORAGE (Non-blocking) ---
        (async () => {
            try {
                const predictionsTable = assetType === 'crypto' ? 'crypto_predictions' : 'stock_predictions';
                const predictionData: any = {
                    user_id: user.id,
                    timeframe: result.timeframe,
                    current_price: result.current_price,
                    predicted_price: result.predicted_price,
                    prediction_change_percent: result.prediction_change_percent,
                    stop_loss_price: result.stop_loss,
                    prediction_valid_till_ist: result.valid_till,
                    created_at: result.prediction_time
                };

                if (assetType === 'stock') {
                    predictionData.stock_name = assetName;
                    predictionData.signal = result.signal;
                    predictionData.accuracy_percent = Math.round(result.confidence);
                    predictionData.prediction_time_ist = result.prediction_time;
                } else {
                    predictionData.coin = assetName;
                    predictionData.trend = result.signal;
                    predictionData.confidence = Math.round(result.confidence);
                    predictionData.predicted_time_ist = result.prediction_time;
                    predictionData.model = 'ai-advanced-hybrid-v1';
                }

                // Delete old prediction for same timeframe/asset
                const delQuery = supabase.from(predictionsTable).delete().eq("user_id", user.id).eq("timeframe", result.timeframe);
                if (assetType === 'stock') delQuery.eq("stock_name", assetName); else delQuery.eq("coin", assetName);
                await delQuery;

                // Insert new prediction
                const { error: insErr } = await supabase.from(predictionsTable).insert(predictionData);
                if (insErr) console.error('[API] Storage failed:', insErr);
                else console.log(`[API] Saved prediction for ${assetName} to background storage.`);
            } catch (err) {
                console.error('[API] Background storage error:', err);
            }
        })();

        // Return immediately to the UI
        return NextResponse.json({ success: true, prediction: result });
    } catch (e: any) {
        console.error('[API] POST Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
