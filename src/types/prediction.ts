export interface Prediction {
    id: string;
    stock_name?: string;
    coin_name?: string;
    coin?: string;
    type: 'stock' | 'crypto';
    trend: 'UP' | 'DOWN';
    predicted_price: number;
    current_price: number;
    confidence: number;
    timeframe: string;
    created_at: string;
    prediction_valid_till_ist?: string;
    name?: string;
    predicted_time?: string;
    signal?: 'BUY' | 'SELL' | 'HOLD';
    accuracy_percent?: number;
    status?: 'completed' | 'pending';
    predicted_time_ist?: string;
    prediction_time_ist?: string;
}
