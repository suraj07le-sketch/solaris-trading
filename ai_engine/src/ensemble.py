import numpy as np
import pandas as pd
from .lstm_model import CryptoLSTM
from .xgb_model import CryptoXGB
from .data_fetcher import DataFetcher
from .features import FeatureEngineer
import joblib
import os

class HybridEngine:
    def __init__(self, model_dir='../models'):
        self.model_dir = model_dir
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir)

        self.lstm = CryptoLSTM(input_shape=(60, 15)) # 60 timesteps, 15 features? Need to verify feature count
        self.xgb = CryptoXGB()
        self.fetcher = DataFetcher()
        self.fe = FeatureEngineer()
        
        # Weights (Meta-learner could learn these)
        self.w_lstm = 0.6
        self.w_xgb = 0.4

    def train_models(self, symbol='BTC/USDT', timeframe='4h'):
        # 1. Fetch & Feature Engineering
        df = self.fetcher.fetch_ohlcv(symbol, timeframe)
        if df is None: return

        df = self.fe.add_all_features(df)
        
        # 2. Prepare Data for LSTM (Sequence)
        # Need to implement sequence generation
        # For now, let's assume we have a helper or do it here
        # ...
        pass

    def run_prediction(self, symbol='BTC/USDT', timeframe='4h'):
        """
        Runs the full prediction pipeline.
        Fetches data, generates features, runs models, combines output.
        """
        # 1. Fetch
        df = self.fetcher.fetch_ohlcv(symbol, timeframe, limit=200)
        if df is None: return None
        
        # 2. Features
        df = self.fe.add_all_features(df)
        current_price = df['close'].iloc[-1]
        
        # 3. Predict (Mocking for now as we need trained models)
        # In a real scenario, we'd process sequences for LSTM and flatten for XGB
        
        # Mock Prediction Logic based on rules for now until training is complete
        # This allows the API to function immediately while models train
        
        # Simple logic based on indicators
        rsi = df['rsi'].iloc[-1]
        macd = df['macd'].iloc[-1]
        sma200 = df['sma_200'].iloc[-1]
        
        # Simulated Model Output (to be replaced by actual model.predict)
        predicted_price = current_price * (1 + (np.random.normal(0, 0.01))) 
        
        # Signal Logic
        signal = "Hold"
        confidence = 0.5
        
        if predicted_price > current_price * 1.015 and rsi < 60:
            signal = "Buy"
            confidence = 0.8
        elif predicted_price < current_price * 0.985 and rsi > 40:
            signal = "Sell"
            confidence = 0.8
            
        return {
            "pair": symbol,
            "prediction": signal,
            "current_price": current_price,
            "target_price": predicted_price,
            "confidence": confidence,
            "timestamp": pd.Timestamp.now().isoformat()
        }

if __name__ == "__main__":
    engine = HybridEngine()
    result = engine.run_prediction()
    print(result)
