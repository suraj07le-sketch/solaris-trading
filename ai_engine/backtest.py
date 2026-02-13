import pandas as pd
import numpy as np
from src.ensemble import HybridEngine
from sklearn.metrics import mean_squared_error, mean_absolute_error
from src.data_fetcher import DataFetcher
from src.features import FeatureEngineer

class Backtester:
    def __init__(self, symbol='BTC/USDT', timeframe='4h'):
        self.symbol = symbol
        self.timeframe = timeframe
        self.engine = HybridEngine()
        self.fetcher = DataFetcher()
        self.fe = FeatureEngineer()

    def run(self):
        print(f"Starting Backtest for {self.symbol} {self.timeframe}...")
        
        # 1. Fetch Historical Data
        df = self.fetcher.fetch_ohlcv(self.symbol, self.timeframe, limit=1000)
        if df is None:
            print("No data found.")
            return

        # 2. Features
        df = self.fe.add_all_features(df)
        
        # 3. Simulate Predictions
        # In a real backtest, we would walk forward
        # Here we just check if our 'mock' logic or trained model (if ready) aligns with reality
        
        df['target_next_close'] = df['close'].shift(-1)
        df.dropna(inplace=True)
        
        predictions = []
        actuals = []
        directions_pred = []
        directions_actual = []
        
        # Simple loop for simulation
        for i in range(len(df)):
            row = df.iloc[i]
            
            # Predict
            # Using our engine's logic (currently random/mock in run_prediction, need separate method for raw price)
            # Let's approximate the engine logic here for backtest
            current_price = row['close']
            
            # Mock Prediction Logic (Same as in ensemble.py for consistency)
            # In production, this call would go to self.engine.model.predict(...)
            predicted_price = current_price * (1 + (np.random.normal(0, 0.01))) 
            
            predictions.append(predicted_price)
            actuals.append(row['target_next_close'])
            
            # Direction
            pred_dir = 1 if predicted_price > current_price else 0
            act_dir = 1 if row['target_next_close'] > current_price else 0
            
            directions_pred.append(pred_dir)
            directions_actual.append(act_dir)
            
        # 4. Metrics
        mse = mean_squared_error(actuals, predictions)
        mae = mean_absolute_error(actuals, predictions)
        
        correct_directions = sum([1 for p, a in zip(directions_pred, directions_actual) if p == a])
        accuracy = correct_directions / len(directions_pred) * 100
        
        print("\n=== Backtest Returns ===")
        print(f"MSE: {mse:.4f}")
        print(f"MAE: {mae:.4f}")
        print(f"Directional Accuracy: {accuracy:.2f}%")
        
        if accuracy > 55:
            print("✅ Strategy Passed Baseline (55%)")
        else:
            print("❌ Strategy Needs Improvement")

if __name__ == "__main__":
    bt = Backtester()
    bt.run()
