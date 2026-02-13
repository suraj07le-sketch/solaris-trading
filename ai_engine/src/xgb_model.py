import xgboost as xgb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

class CryptoXGB:
    def __init__(self):
        self.model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=1000, learning_rate=0.05)

    def prepare_data(self, df, target_col='close', shift=-1):
        """
        Prepares data for XGBoost (flattened features).
        Shift target by -1 to predict next step.
        """
        df = df.copy()
        df['target'] = df[target_col].shift(shift)
        df.dropna(inplace=True)
        
        X = df.drop(columns=['target', 'timestamp']) # Drop non-numeric
        y = df['target']
        return X, y

    def train(self, X_train, y_train):
        self.model.fit(X_train, y_train, eval_set=[(X_train, y_train)], verbose=False)

    def predict(self, X):
        return self.model.predict(X)

    def save(self, filepath):
        self.model.save_model(filepath)

    def load(self, filepath):
        self.model.load_model(filepath)

if __name__ == "__main__":
    # Test
    try:
        # Dummy data
        df = pd.DataFrame(np.random.rand(100, 10), columns=[f'feat_{i}' for i in range(10)])
        df['timestamp'] = pd.date_range(start='1/1/2022', periods=100)
        df['close'] = np.random.rand(100)
        
        xgb_model = CryptoXGB()
        X, y = xgb_model.prepare_data(df)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
        
        xgb_model.train(X_train, y_train)
        preds = xgb_model.predict(X_test)
        print("Predictions:", preds[:5])
    except Exception as e:
        print(f"Error: {e}")
