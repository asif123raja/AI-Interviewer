from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Interview ML Service", version="1.0.0")

# Render/Vercel CORS Security Let-Through
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hirepath-api.onrender.com",
        "https://hirepath.vercel.app",
        "http://localhost:3000",
        "http://localhost:4000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MetricsProcessRequest(BaseModel):
    user_id: str
    metrics: Dict[str, Any]
    interview_type: str
    job_id: str
    domain: Optional[str] = "General"
    subtopic: Optional[str] = None
    custom_prompt: Optional[str] = None
    faceMetrics: Optional[Dict[str, Any]] = None
    facial_analysis_enabled: Optional[bool] = True

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ml-processing"}

@app.post("/api/process-metrics")
async def trigger_processing(request: MetricsProcessRequest, background_tasks: BackgroundTasks):
    """
    Receives pre-computed behavior metrics (confidence, nervous moments, emotion vectors)
    from the client-side device SVM. No raw video is ever uploaded.
    """
    from worker import execute_ml_pipeline
    background_tasks.add_task(
        execute_ml_pipeline, 
        request.user_id, 
        request.metrics, 
        request.interview_type,
        request.domain,
        request.subtopic,
        request.custom_prompt,
        request.faceMetrics,
        request.facial_analysis_enabled
    )
    
    return {"message": "Metrics Analysis started", "job_id": request.job_id}

if __name__ == "__main__":
    port = int(os.getenv("PYTHON_ML_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
