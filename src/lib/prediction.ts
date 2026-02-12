import axios from "axios";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Architect, Trainer } from "synaptic";

// ============================
// CONFIG
// ============================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Only create Supabase client if configuration exists
let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false },
    });
} else {
    console.warn("[Prediction] Supabase not configured - models and predictions will not be saved to database");
}

// Technical Indicators
const calculateEMA = (prices: number[], period: number) => {
    if (prices.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
};

const calculateRSI = (prices: number[], period = 14) => {
    if (prices.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
};

const calculateMACD = (prices: number[]) => {
    const ema12 = calculateEMA(prices.slice(-12), 12);
    const ema26 = calculateEMA(prices.slice(-26), 26);
    return ema12 - ema26;
};

const calculateATR = (klines: any[], period = 14) => {
    if (klines.length < period) return 0;
    const trs = klines.slice(-period).map((k: any) => {
        const h = Number(k[2]);
        const l = Number(k[3]);
        const pc = Number(k[4]);
        return Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    });
    return trs.reduce((a: number, b: number) => a + b, 0) / period;
};

// Persistence Helpers (safe even without Supabase)
const saveModel = async (symbol: string, network: any, confidence: number) => {
    if (!supabase) return;
    try {
        const modelData = network.toJSON();
        await (supabase as SupabaseClient).from("prediction_models").upsert({
            symbol,
            model_data: modelData,
            confidence,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'symbol' });
    } catch (err) {
        console.error("Error saving model:", err);
    }
};

const loadModel = async (symbol: string) => {
    if (!supabase) return null;
    try {
        const { data, error } = await (supabase as SupabaseClient)
            .from("prediction_models")
            .select("model_data, confidence, updated_at")
            .eq("symbol", symbol)
            .single();

        if (error) return null;
        if (Date.now() - new Date(data.updated_at).getTime() > 12 * 3600000) return null;
        return data;
    } catch (err) {
        return null;
    }
};

// Ensemble Scoring Logic
const getEnsembleSignal = (neuralTrend: string, statTrend: string, momTrend: string) => {
    const votes = { UP: 0, DOWN: 0, SIDEWAYS: 0 };
    [neuralTrend, statTrend, momTrend].forEach(t => votes[t as keyof typeof votes]++);

    if (votes.UP >= 2) return { signal: "UP", probability: votes.UP === 3 ? 95 : 70 };
    if (votes.DOWN >= 2) return { signal: "DOWN", probability: votes.DOWN === 3 ? 95 : 70 };
    return { signal: "SIDEWAYS", probability: 50 };
};

// Prediction Engine
export async function runProPrediction(coin: string, timeframe: string = "4h", userId: string) {
    let formatted = coin.toUpperCase().replace("/", "");
    if (formatted.endsWith("USD") && !formatted.endsWith("USDT")) {
        formatted = formatted.replace("USD", "USDT");
    } else if (!formatted.endsWith("USDT")) {
        formatted += "USDT";
    }

    const symbol = formatted;

    try {
        // 1. Fetch Multi-Timeframe Data Concurrently
        const [res4h, res1h, res1d] = await Promise.all([
            axios.get("https://api.binance.com/api/v3/klines", { params: { symbol, interval: "4h", limit: 500 } }),
            axios.get("https://api.binance.com/api/v3/klines", { params: { symbol, interval: "1h", limit: 500 } }),
            axios.get("https://api.binance.com/api/v3/klines", { params: { symbol, interval: "1d", limit: 300 } })
        ]);

        const klines4h = res4h.data;

        // Validate data
        if (!klines4h || !Array.isArray(klines4h) || klines4h.length < 100) {
            return { success: false, error: "Insufficient market data for prediction" };
        }

        const closes4h = klines4h.map((k: any) => Number(k[4]));
        const volumes4h = klines4h.map((k: any) => Number(k[5]));
        const currentPrice = closes4h[closes4h.length - 1];

        const closes1d = res1d.data.map((k: any) => Number(k[4]));
        const rsi1d = calculateRSI(closes1d);
        const ema20_1d = calculateEMA(closes1d.slice(-20), 20);
        const ema50_1d = calculateEMA(closes1d.slice(-50), 50);

        // --- MACRO BIAS (from 1D) ---
        let macroBias = "NEUTRAL";
        if (currentPrice > ema50_1d && rsi1d > 50) macroBias = "BULLISH";
        if (currentPrice < ema50_1d && rsi1d < 50) macroBias = "BEARISH";

        // 2. Feature Engineering (4h)
        const atr = calculateATR(klines4h);
        const volAvg = volumes4h.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
        const volDelta = volumes4h[volumes4h.length - 1] / volAvg;

        // 3. Model 1: Neural Network (Synaptic)
        let network: any;
        const saved = await loadModel(symbol);

        if (saved && saved.model_data) {
            try {
                network = (Architect.Perceptron as any).fromJSON(saved.model_data);
            } catch (e) {
                console.warn("Failed to load saved model, creating new one");
                network = new Architect.Perceptron(4, 12, 6, 1);
            }
        } else {
            network = new Architect.Perceptron(4, 12, 6, 1);
        }

        // Prepare training data
        const trainingSet = [];
        const minTrainingIdx = Math.max(100, 50 + 14 + 12);
        for (let i = minTrainingIdx; i < closes4h.length - 1; i++) {
            const win = closes4h.slice(i - 50, i + 1);
            const wMax = Math.max(...win);
            const wMin = Math.min(...win);
            const norm = (v: number) => (v - wMin) / (wMax - wMin || 1);

            trainingSet.push({
                input: [norm(closes4h[i]), calculateRSI(win.slice(-14)) / 100, calculateMACD(win) / (wMax * 0.01 || 1), volDelta],
                output: [norm(closes4h[i + 1])]
            });
        }

        // Train if we have enough data
        if (trainingSet.length > 0) {
            const trainer = new Trainer(network);
            await trainer.train(trainingSet, { rate: 0.01, iterations: 500, error: 0.001 });
            await saveModel(symbol, network, 88);
        }

        const winEnd = closes4h.slice(-51);
        const wMaxEnd = Math.max(...winEnd);
        const wMinEnd = Math.min(...winEnd);
        const forecast = network.activate([
            (currentPrice - wMinEnd) / (wMaxEnd - wMinEnd || 1),
            calculateRSI(winEnd.slice(-14)) / 100,
            calculateMACD(winEnd) / (wMaxEnd * 0.01 || 1),
            volDelta
        ]);
        const predPrice = forecast[0] * (wMaxEnd - wMinEnd) + wMinEnd;
        const changePct = ((predPrice - currentPrice) / currentPrice) * 100;

        // Model 1 trend
        let neuralTrend = "SIDEWAYS";
        if (changePct > 0.05) neuralTrend = "UP";
        if (changePct < -0.05) neuralTrend = "DOWN";

        // Model 2: Statistical (EMA Cross & RSI)
        const ema20_4h = calculateEMA(closes4h.slice(-20), 20);
        const rsi4h = calculateRSI(closes4h);
        let statTrend = "SIDEWAYS";
        if (currentPrice > ema20_4h && rsi4h > 52) statTrend = "UP";
        if (currentPrice < ema20_4h && rsi4h < 48) statTrend = "DOWN";

        // Model 3: Momentum (MACD & Volume)
        const macd4h = calculateMACD(closes4h);
        let momTrend = "SIDEWAYS";
        if (macd4h > 0 && volDelta > 1.1) momTrend = "UP";
        if (macd4h < 0 && volDelta > 1.1) momTrend = "DOWN";

        // --- ENSEMBLE CONSENSUS ---
        const { signal, probability } = getEnsembleSignal(neuralTrend, statTrend, momTrend);

        const stopLoss = signal === "UP" ? currentPrice - atr * 2.5 : signal === "DOWN" ? currentPrice + atr * 2.5 : null;

        // Refined for User: "next 4 and 8 hour"
        let validHours = 24;
        if (timeframe === '1h') validHours = 1;
        if (timeframe === '4h') validHours = 4;
        if (timeframe === '8h') validHours = 8;

        const targetTime = new Date(Date.now() + validHours * 3600000);

        const result = {
            user_id: userId,
            coin: symbol,
            timeframe,
            current_price: currentPrice,
            predicted_price: predPrice,
            prediction_change_percent: changePct,
            confidence: probability,
            trend: signal,
            stop_loss_price: stopLoss,
            macro_bias: macroBias,
            model: "v4-elite-ensemble",
            predicted_time_ist: targetTime.toISOString()
        };

        // Save to database if Supabase is configured
        if (supabase) {
            try {
                await (supabase as SupabaseClient).from("crypto_predictions").insert([result]);
            } catch (dbError) {
                console.warn("Failed to save prediction to database:", dbError);
            }
        }

        return {
            success: true,
            symbol,
            trend: signal,
            currentPrice: currentPrice.toFixed(2),
            predictedPrice: predPrice.toFixed(2),
            changePercent: changePct.toFixed(2) + "%",
            probability: probability + "%",
            macroBias,
            stopLoss: stopLoss ? stopLoss.toFixed(2) : null,
            targetTime: targetTime.toLocaleString(),
            rsi: rsi4h.toFixed(2)
        };

    } catch (err: any) {
        console.error("Prediction error:", err);
        return { success: false, error: err.message || "Unknown error occurred" };
    }
}
