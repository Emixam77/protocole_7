from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from .agents import AgentSourcing, AgentCommunity, AgentAdsIntel
from .database import get_supabase
import os

app = FastAPI(title="Protocole 7 Jours API")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir le frontend (uniquement si le dossier existe)
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

class SourcingRequest(BaseModel):
    user_id: str
    niche: str
    city: str

@app.get("/")
async def root():
    return {"message": "Protocole 7 Jours Backend Active"}

@app.post("/scan/leads")
async def scan_leads(req: SourcingRequest):
    agent = AgentSourcing(niche=req.niche, city=req.city)
    leads = agent.scan_google_maps()
    agent.inject_leads(leads, req.user_id)
    return {"status": "success", "leads": leads, "leads_count": len(leads)}

class PitchRequest(BaseModel):
    company_name: str
    gap: str

@app.post("/commando/pitch")
async def get_pitch(req: PitchRequest):
    agent = AgentAdsIntel()
    pitch = agent.generate_pitch(req.company_name, req.gap)
    return {"pitch": pitch}

@app.get("/intelligence/ads")
async def get_ads_intel():
    agent = AgentAdsIntel()
    return agent.analyze_competitors()

@app.get("/radar/signals")
async def get_radar_signals():
    agent = AgentCommunity()
    return agent.detect_distress()

@app.get("/user/progress/{user_id}")
async def get_progress(user_id: str):
    supabase = get_supabase()
    result = supabase.table("user_activity").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data
