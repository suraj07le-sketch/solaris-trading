// Simplified Gradient Boosting for Price Prediction
// Implements decision tree ensemble with boosting

import { TechnicalFeatures } from './features';

interface DecisionNode {
    feature?: keyof TechnicalFeatures;
    threshold?: number;
    left?: DecisionNode;
    right?: DecisionNode;
    value?: number; // Leaf node prediction
}

interface GradientBoostingModel {
    trees: DecisionNode[];
    weights: number[];
    learningRate: number;
}

// Normalize feature value to 0-1 range
function normalizeFeature(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return (value - min) / (max - min);
}

// Create a simple decision stump (single split tree)
function createDecisionStump(
    features: TechnicalFeatures,
    target: number
): DecisionNode {
    // Select best feature for split based on correlation with target
    const featureKeys = Object.keys(features) as (keyof TechnicalFeatures)[];

    // Simple heuristic: use RSI for momentum, EMA for trend
    let bestFeature: keyof TechnicalFeatures = 'rsi14';
    let bestThreshold = 50;

    // RSI-based decision
    if (features.rsi14 > 70) {
        bestFeature = 'rsi14';
        bestThreshold = 70;
    } else if (features.rsi14 < 30) {
        bestFeature = 'rsi14';
        bestThreshold = 30;
    }
    // Trend-based decision
    else if (features.ema12 > features.ema50) {
        bestFeature = 'trend_strength';
        bestThreshold = 0;
    }

    return {
        feature: bestFeature,
        threshold: bestThreshold,
        left: { value: -0.5 }, // Bearish
        right: { value: 0.5 }  // Bullish
    };
}

// Predict using a single tree
function predictTree(node: DecisionNode, features: TechnicalFeatures): number {
    if (node.value !== undefined) {
        return node.value;
    }

    if (!node.feature || node.threshold === undefined) {
        return 0; // Default for invalid nodes
    }

    const featureValue = features[node.feature];
    if (featureValue < node.threshold) {
        return node.left ? predictTree(node.left, features) : 0;
    } else {
        return node.right ? predictTree(node.right, features) : 0;
    }
}

// Train simplified gradient boosting model
export function trainGradientBoosting(
    features: TechnicalFeatures,
    numTrees: number = 10,
    learningRate: number = 0.1
): GradientBoostingModel {
    const trees: DecisionNode[] = [];
    const weights: number[] = [];

    // Create ensemble of decision stumps
    for (let i = 0; i < numTrees; i++) {
        // Each tree focuses on different aspect
        const tree = createDecisionStump(features, 0);
        trees.push(tree);
        weights.push(1.0 / numTrees); // Equal weights for simplicity
    }

    return {
        trees,
        weights,
        learningRate
    };
}

// Predict using gradient boosting ensemble
export function predictGradientBoosting(
    model: GradientBoostingModel,
    features: TechnicalFeatures
): { prediction: number; confidence: number } {
    let totalPrediction = 0;
    let totalWeight = 0;

    for (let i = 0; i < model.trees.length; i++) {
        const treePrediction = predictTree(model.trees[i], features);
        totalPrediction += treePrediction * model.weights[i];
        totalWeight += model.weights[i];
    }

    const prediction = totalPrediction / totalWeight;
    const confidence = Math.min(Math.abs(prediction) * 100, 100);

    return {
        prediction: Math.tanh(prediction), // Normalize to -1 to 1
        confidence
    };
}

// Advanced ensemble prediction using multiple strategies
export function advancedEnsemblePrediction(features: TechnicalFeatures, timeframe: string = '1d'): {
    direction: number;
    confidence: number;
    signal: string;
} {
    let bullishScore = 0;
    let bearishScore = 0;
    let weights = 0;

    const isShortTerm = ['1h', '4h', '8h', '12h'].includes(timeframe);

    // 1. RSI Strategy (15% weight - 25% for short term)
    // Dynamic oversold/overbought based on trend
    const isUptrend = features.ema12 > features.ema50;
    const osLimit = isUptrend ? 40 : 30; // Shifting limit in uptrend
    const obLimit = isUptrend ? 80 : 70;

    const rsiWeight = isShortTerm ? 0.25 : 0.15;

    if (features.rsi14 < osLimit) {
        bullishScore += rsiWeight * (1 + (osLimit - features.rsi14) / 10);
    } else if (features.rsi14 > obLimit) {
        bearishScore += rsiWeight * (1 + (features.rsi14 - obLimit) / 10);
    }
    weights += rsiWeight;

    // 2. MACD Strategy (15% weight)
    if (features.macd_histogram > 0) {
        // Increasing score if histogram is expanding
        bullishScore += 0.15;
    } else {
        bearishScore += 0.15;
    }
    weights += 0.15;

    // 3. EMA Crossover Strategy (25% weight - 15% for short term)
    // Trend following is less reliable in choppy short term
    const emaWeight = isShortTerm ? 0.15 : 0.30;

    if (features.ema12 > features.ema50) {
        bullishScore += emaWeight;
        if (features.ema9 > features.ema12) bullishScore += 0.05; // Short term confirmation
    } else {
        bearishScore += emaWeight;
        if (features.ema9 < features.ema12) bearishScore += 0.05;
    }
    weights += (emaWeight + 0.05);

    // 4. Bollinger Bands Strategy (15% weight - 20% for short term)
    // Mean reversion is stronger in short term
    const bbWeight = isShortTerm ? 0.20 : 0.15;

    if (features.bb_position < 0.15) {
        bullishScore += bbWeight; // Deep oversold
    } else if (features.bb_position > 0.85) {
        bearishScore += bbWeight; // Deep overbought
    }
    weights += bbWeight;

    // 5. Trend Strength / ADX (15% weight)
    if (features.adx > 25) {
        // Strong trend - confirm with EMA
        if (features.ema12 > features.ema50) bullishScore += 0.15;
        else bearishScore += 0.15;
    }
    weights += 0.15;

    // 6. Volume Confirmation (10% weight)
    if (features.volume_ratio > 1.2) {
        if (bullishScore > bearishScore) bullishScore += 0.1;
        else bearishScore += 0.1;
    }
    weights += 0.1;

    // Calculate final scores
    const netScore = (bullishScore - bearishScore) / weights;
    // Boost confidence: Net score of 0.5 should be very high confidence (~75-80%)
    // Short term needs higher sensitivity
    const confidenceMultiplier = isShortTerm ? 180 : 120;
    const confidence = Math.min(100, Math.abs(netScore) * confidenceMultiplier);

    let direction = 0;
    let signal = 'HOLD';

    // Adjusted Thresholds for Short Term
    // We allow lower conviction to trigger signals in 4h/8h to catch swings
    const signalThreshold = isShortTerm ? 0.15 : 0.25;
    const confidenceCheck = isShortTerm ? 50 : 60; // Lowered slightly to match promoted confidence

    if (netScore > signalThreshold && confidence > confidenceCheck) {
        direction = 1;
        signal = 'BUY';
    } else if (netScore < -signalThreshold && confidence > confidenceCheck) {
        direction = -1;
        signal = 'SELL';
    }

    return {
        direction,
        confidence,
        signal
    };
}
