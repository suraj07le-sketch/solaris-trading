
import { advancedEnsemblePrediction } from '../src/lib/ml/gradient-boost';
import { TechnicalFeatures } from '../src/lib/ml/features';

const mockFeatures: TechnicalFeatures = {
    // Price features
    ema9: 99,
    ema12: 100,
    ema21: 101,
    ema50: 105,
    ema200: 110,

    // Bollinger Bands
    bb_upper: 105,
    bb_middle: 100,
    bb_lower: 95,
    bb_width: 0.1,
    bb_position: 0.7, // Neutral-ish

    // Momentum
    rsi14: 60, // Weak
    rsi21: 55,
    stoch_k: 60,
    stoch_d: 60,
    williams_r: -40,
    cci: 50,
    mfi: 50,

    // MACD
    macd_line: 0.5,
    macd_signal: 1.0,
    macd_histogram: -0.5,

    // Volatility
    atr14: 2,
    atr21: 2.5,
    volatility20: 5,
    volatility50: 6,

    // Volume
    volume_sma: 800,
    volume_ratio: 1.5,
    obv: 1000,

    // Trend
    adx: 20, // Weak trend
    trend_strength: 0.8,

    // Price patterns
    higher_highs: 1,
    higher_lows: 1,
    price_momentum_1h: 1.5,
    price_momentum_4h: 2.0,
    price_momentum_1d: 5.0
};

console.log("\n--- TRACE START ---");
console.log("Testing Short Term (4h)...");
const shortTerm = advancedEnsemblePrediction(mockFeatures, '4h');
console.log(`Short Term (4h): Signal=${shortTerm.signal}, Confidence=${shortTerm.confidence.toFixed(2)}%`);

console.log("\nTesting Long Term (1d)...");
const longTerm = advancedEnsemblePrediction(mockFeatures, '1d');
console.log(`Long Term (1d): Signal=${longTerm.signal}, Confidence=${longTerm.confidence.toFixed(2)}%`);

console.log(`\nComparison: Short(${shortTerm.confidence.toFixed(2)}) vs Long(${longTerm.confidence.toFixed(2)})`);

if (shortTerm.confidence > longTerm.confidence) {
    console.log("\nSUCCESS: Short term confidence is boosted!");
    process.exit(0);
} else {
    console.error("\nFAILURE: Short term confidence is NOT boosted.");
    process.exit(1);
}
