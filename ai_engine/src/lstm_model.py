import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input, Attention, Concatenate
import numpy as np

class CryptoLSTM:
    def __init__(self, input_shape):
        self.input_shape = input_shape
        self.model = self._build_model()

    def _build_model(self):
        # Functional API for Attention
        inputs = Input(shape=self.input_shape)
        
        # Stacked LSTM
        lstm_1 = LSTM(100, return_sequences=True)(inputs)
        dropout_1 = Dropout(0.2)(lstm_1)
        
        lstm_2 = LSTM(100, return_sequences=True)(dropout_1)
        dropout_2 = Dropout(0.2)(lstm_2)
        
        lstm_3 = LSTM(50, return_sequences=True)(dropout_2)
        dropout_3 = Dropout(0.2)(lstm_3)
        
        # Attention Layer
        # Self-attention: Query, Value, and Key are the same
        attention = Attention()([dropout_3, dropout_3])
        
        # Concatenate or just use attention output?
        # Usually we pool or take the last step
        # Let's flatten or global average
        # For sequence to one, we often take the last output of LSTM or Attention
        
        # Let's take the last time step from attention
        last_step = tf.keras.layers.Lambda(lambda x: x[:, -1, :])(attention)
        
        dense_1 = Dense(50, activation='relu')(last_step)
        outputs = Dense(1)(dense_1)
        
        model = Model(inputs=inputs, outputs=outputs)
        model.compile(optimizer='adam', loss='mse')
        
        return model

    def train(self, X_train, y_train, epochs=50, batch_size=32):
        self.model.fit(X_train, y_train, epochs=epochs, batch_size=batch_size, validation_split=0.1)

    def predict(self, X):
        return self.model.predict(X)

    def save(self, filepath):
        self.model.save(filepath)

    def load(self, filepath):
        self.model = tf.keras.models.load_model(filepath)

if __name__ == "__main__":
    # Test
    # (samples, time_steps, features)
    dummy_input = np.random.random((100, 60, 15)) 
    dummy_target = np.random.random((100, 1))
    
    lstm = CryptoLSTM(input_shape=(60, 15))
    lstm.model.summary()
    lstm.train(dummy_input, dummy_target, epochs=2)
