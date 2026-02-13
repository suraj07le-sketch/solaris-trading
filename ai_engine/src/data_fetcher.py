import ccxt.pro as ccxt
import pandas as pd
import os
import time
from datetime import datetime

class DataFetcher:
    def __init__(self, exchange_id='binance', data_dir='../data'):
        self.exchange = getattr(ccxt, exchange_id)()
        self.data_dir = data_dir
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def fetch_ohlcv(self, symbol, timeframe='4h', limit=1000):
        """
        Fetches OHLCV data from exchange.
        Tries to load from cache first if recent enough? 
        For now, let's just fetch fresh or append.
        """
        try:
            print(f"Fetching {symbol} {timeframe} from {self.exchange.id}...")
            # Fetch data
            ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            
            # Convert to DataFrame
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            # Save to CSV for cache/debug
            filename = f"{symbol.replace('/', '_')}_{timeframe}.csv"
            filepath = os.path.join(self.data_dir, filename)
            df.to_csv(filepath, index=False)
            print(f"Saved data to {filepath}")
            
            return df
        except Exception as e:
            print(f"Error fetching data: {e}")
            return None

if __name__ == "__main__":
    # Test
    fetcher = DataFetcher(data_dir=os.path.join(os.path.dirname(__file__), '../data'))
    df = fetcher.fetch_ohlcv('BTC/USDT', '4h')
    print(df.head())
