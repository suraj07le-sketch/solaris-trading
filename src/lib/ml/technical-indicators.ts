
/**
 * technical-indicators.ts
 * 
 * A comprehensive library of technical analysis indicators for the prediction engine.
 * migrating hardcoded logic from route.ts and adding advanced skills.
 */

// ============================================
// BASIC HELPERS
// ============================================

function calculateMean(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((a, b) => a + b, 0) / data.length;
}

function calculateStdDev(data: number[]): number {
    if (data.length < 2) return 0;
    const mean = calculateMean(data);
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
}

// ============================================
// MOVING AVERAGES
// ============================================

export function calculateSMA(data: number[], period: number): number[] {
    const result: number[] = [];
    if (data.length < period) return result;
    for (let i = 0; i <= data.length - period; i++) {
        const slice = data.slice(i, i + period);
        result.push(calculateMean(slice));
    }
    // Pad the beginning with nulls or just return the valid slice? 
    // To match original route.ts behavior (aligned with end of array), we usually return aligned arrays.
    // However, route.ts EMA implementation returned an array of same length as input (starting from 0).
    // Let's stick to the convention: Result index i corresponds to Input index i.
    // Fill initial values with first valid SMA or 0.
    const paddedResult = new Array(period - 1).fill(0).concat(result);
    return paddedResult;
}

export function calculateEMA(data: number[], period: number): number[] {
    const result: number[] = [];
    if (data.length === 0) return result;
    const k = 2 / (period + 1);
    let ema = data[0]; // Start with first price as initial EMA
    result.push(ema);

    for (let i = 1; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
        result.push(ema);
    }
    return result;
}

// ============================================
// MOMENTUM INDICATORS
// ============================================

export function calculateRSI(data: number[], period: number = 14): number[] {
    const result: number[] = [];
    if (data.length <= period) return result;
    const gains: number[] = [];
    const losses: number[] = [];

    // First pass: diffs
    for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? -change : 0);
    }

    // Initial average
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Fill initial 'undefined' periods
    for (let i = 0; i < period; i++) result.push(50);

    for (let i = period; i < gains.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
    }

    // Pad to match input length (diffs shifted by 1 + loops)
    while (result.length < data.length) {
        result.unshift(50);
    }
    return result.slice(result.length - data.length);
}

export function calculateStochastic(
    high: number[],
    low: number[],
    close: number[],
    period: number = 14,
    kPeriod: number = 3,
    dPeriod: number = 3
): { k: number[], d: number[] } {
    const kLine: number[] = [];

    for (let i = 0; i < close.length; i++) {
        if (i < period - 1) {
            kLine.push(50);
            continue;
        }

        const periodLow = Math.min(...low.slice(i - period + 1, i + 1));
        const periodHigh = Math.max(...high.slice(i - period + 1, i + 1));

        const fastK = ((close[i] - periodLow) / (periodHigh - periodLow)) * 100;
        kLine.push(isNaN(fastK) ? 50 : fastK);
    }

    // Smooth K to get %K
    const smoothK = calculateSMA(kLine, kPeriod);
    // Smooth %K to get %D
    const dLine = calculateSMA(smoothK, dPeriod);

    return { k: smoothK, d: dLine };
}

export function calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const emaFast = calculateEMA(data, fastPeriod);
    const emaSlow = calculateEMA(data, slowPeriod);
    const macdLine: number[] = [];

    // Align lengths
    for (let i = 0; i < data.length; i++) {
        macdLine.push(emaFast[i] - emaSlow[i]);
    }

    const signalLine = calculateEMA(macdLine, signalPeriod);
    const macdHistogram: number[] = [];

    for (let i = 0; i < data.length; i++) {
        macdHistogram.push(macdLine[i] - signalLine[i]);
    }

    return { macd: macdLine, signal: signalLine, histogram: macdHistogram };
}

// ============================================
// VOLATILITY INDICATORS
// ============================================

export function calculateBollingerBands(data: number[], period: number = 20, multiplier: number = 2) {
    const upper: number[] = [];
    const middle: number[] = []; // Same as SMA
    const lower: number[] = [];
    const bandwidth: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            upper.push(data[i]);
            middle.push(data[i]);
            lower.push(data[i]);
            bandwidth.push(0);
            continue;
        }

        const slice = data.slice(i - period + 1, i + 1);
        const sma = calculateMean(slice);
        const stdDev = calculateStdDev(slice);

        middle.push(sma);
        upper.push(sma + (stdDev * multiplier));
        lower.push(sma - (stdDev * multiplier));
        bandwidth.push((upper[i] - lower[i]) / middle[i]);
    }

    return { upper, middle, lower, bandwidth };
}

export function calculateATR(highData: number[], lowData: number[], closeData: number[], period: number = 14): number[] {
    const result: number[] = [];
    if (highData.length <= period) return result;

    const trueRanges: number[] = [];
    // First TR is High - Low
    trueRanges.push(highData[0] - lowData[0]);

    for (let i = 1; i < highData.length; i++) {
        const tr = Math.max(
            highData[i] - lowData[i],
            Math.abs(highData[i] - closeData[i - 1]),
            Math.abs(lowData[i] - closeData[i - 1])
        );
        trueRanges.push(tr);
    }

    // Calculate ATR using RMA (Running Moving Average) or EMA approach
    // Standard is usually RMA (wilder's smoothing) which matches calculateEMA logic with 1/N
    // Reusing logic from route.ts for consistency
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Fill initial
    for (let i = 0; i < period; i++) result.push(atr);

    for (let i = period; i < trueRanges.length; i++) {
        atr = (atr * (period - 1) + trueRanges[i]) / period;
        result.push(atr);
    }

    return result;
}

export function calculateVolatility(data: number[], period: number = 20): number[] {
    const result: number[] = [];
    if (data.length <= period) return result;
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) returns.push(Math.log(data[i] / data[i - 1]));

    // Pad
    for (let i = 0; i < period; i++) result.push(0);

    for (let i = period; i < returns.length; i++) {
        const slice = returns.slice(i - period, i);
        const stdDev = calculateStdDev(slice);
        // Annualized volatility
        result.push(stdDev * Math.sqrt(252) * 100);
    }
    return result;
}

// ============================================
// TREND / CLOUD
// ============================================

export function calculateIchimoku(
    high: number[],
    low: number[],
    tenkanPeriod: number = 9,
    kijunPeriod: number = 26,
    senkouBPeriod: number = 52,
    displacement: number = 26
) {
    const tenkanSen: number[] = [];
    const kijunSen: number[] = [];
    const senkouSpanA: number[] = [];
    const senkouSpanB: number[] = [];
    // Chikou Span is just close price displaced backwards, we usually don't need to calc it for simple current-state logic

    const getAvg = (h: number[], l: number[]) => (Math.max(...h) + Math.min(...l)) / 2;

    for (let i = 0; i < high.length; i++) {
        // Tenkan-sen (Conversion Line): (9-period high + 9-period low)/2
        if (i >= tenkanPeriod - 1) {
            const h = high.slice(i - tenkanPeriod + 1, i + 1);
            const l = low.slice(i - tenkanPeriod + 1, i + 1);
            tenkanSen.push(getAvg(h, l));
        } else {
            tenkanSen.push(0);
        }

        // Kijun-sen (Base Line): (26-period high + 26-period low)/2
        if (i >= kijunPeriod - 1) {
            const h = high.slice(i - kijunPeriod + 1, i + 1);
            const l = low.slice(i - kijunPeriod + 1, i + 1);
            kijunSen.push(getAvg(h, l));
        } else {
            kijunSen.push(0);
        }

        // Senkou Span A (Leading Span A): (Conversion Line + Base Line)/2
        // Plotted 26 periods ahead. We store it at current index for 'future' reference or shifted reference.
        // Standard arrays typically store "what is the span value at this time t".
        // At time t, Span A is calculated from t-displacement.
        if (i >= displacement) {
            const prevTenkan = tenkanSen[i - displacement];
            const prevKijun = kijunSen[i - displacement];
            senkouSpanA.push((prevTenkan + prevKijun) / 2);
        } else {
            senkouSpanA.push(0);
        }

        // Senkou Span B (Leading Span B): (52-period high + 52-period low)/2
        // Plotted 26 periods ahead
        if (i >= senkouBPeriod - 1 && i >= displacement) {
            const h = high.slice(i - displacement - senkouBPeriod + 1, i - displacement + 1);
            const l = low.slice(i - displacement - senkouBPeriod + 1, i - displacement + 1);
            senkouSpanB.push(getAvg(h, l));
        } else {
            senkouSpanB.push(0);
        }
    }

    return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB };
}
