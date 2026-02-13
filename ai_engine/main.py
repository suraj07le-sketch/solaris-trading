from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import sys
import os

from src.ensemble import HybridEngine

app = FastAPI(title="AI Crypto Engine")
engine = HybridEngine(model_dir='./models')

class PredictionRequest(BaseModel):
    pair: str = "BTC/USDT"
    timeframe: str = "4h"

@app.get("/")
def home():
    return {"status": "AI Engine Online"}

@app.post("/predict")
def predict(req: PredictionRequest):
    try:
        result = engine.run_prediction(req.pair, req.timeframe)
        if not result:
            raise HTTPException(status_code=500, detail="Prediction failed")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
