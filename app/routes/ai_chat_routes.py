"""
CivicNexus / ImpactBridge AI Copilot & Chatbot Router
Provides intelligent conversational assistance for citizens, students, faculty, and industry partners.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import re

from app.database.db import get_db
from app.models.database_models import Challenge, UniversityProject, User
from app.database.firebase_db import log_bot_chat_to_firestore

router = APIRouter(prefix="/api/ai", tags=["AI Copilot & Chatbot"])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "session_default"
    role: Optional[str] = "CITIZEN"
    user_name: Optional[str] = "Arjun Sharma"

class ChatAction(BaseModel):
    label: str
    action_type: str  # "NAVIGATE_TAB", "OPEN_MODAL", "FILTER_MAP"
    target: str       # "map", "projects", "challenges", "student", "industry", "camera", "describe"

class ChatResponse(BaseModel):
    reply: str
    spoken_text: Optional[str] = None
    actions: List[ChatAction] = []
    suggested_prompts: List[str] = []

@router.post("/chat", response_model=ChatResponse)
def handle_ai_chat(req: ChatRequest, db = Depends(get_db)):
    msg = (req.message or "").strip().lower()
    session_id = req.session_id or "session_default"
    
    # Contextual Database Metrics
    total_challenges = db.query(Challenge).count()
    total_projects = db.query(UniversityProject).count()
    
    actions = []
    suggested_prompts = []
    
    # 1. GROUND PROBLEMS & REPORTING
    if any(k in msg for k in ["problem", "challenge", "issue", "report", "camera", "photo", "pothole", "water", "pipe"]):
        reply = (
            f"🌾 **Ground Challenges Hub**: ImpactBridge actively tracks **{total_challenges} verified community problems** across 9 cities in India.\n\n"
            "**How to report an issue:**\n"
            "1. **Live Camera**: Capture HD photographic evidence with GPS geotags.\n"
            "2. **AI Refinement**: Our built-in Gemini engine transforms rough notes into standardized problem statements with UN SDG tags.\n"
            "3. **Lab Matching**: Premier university labs adopt verified challenges for engineering prototypes."
        )
        spoken_text = f"Impact Bridge currently tracks {total_challenges} verified challenges. You can snap a photo or describe an issue with AI refinement."
        actions = [
            ChatAction(label="📸 Snap Field Photo", action_type="OPEN_MODAL", target="camera"),
            ChatAction(label="✍️ Describe Problem with AI", action_type="OPEN_MODAL", target="describe"),
            ChatAction(label="🗺️ View City Map", action_type="NAVIGATE_TAB", target="map")
        ]
        suggested_prompts = ["Show open ground problems", "How does camera geotagging work?", "Browse university labs"]

    # 2. UNIVERSITY LABS & RESEARCH PROJECTS
    elif any(k in msg for k in ["lab", "project", "university", "faculty", "iit", "iisc", "bits", "research"]):
        reply = (
            "🔬 **University Lab Research Network**:\n\n"
            "We partner with **4 premier academic engineering centers**:\n"
            "• **IIT Bombay** — HydroLab (IoT Smart Water Mesh & Turbidity)\n"
            "• **IISc Bengaluru** — Smart Grid & Distributed Sensor Lab\n"
            "• **BITS Pilani** — Edge AI & Hardware Acceleration Lab\n"
            "• **IIT Delhi** — CleanTech & Community Resilience Lab\n\n"
            "Faculty PIs direct student engineers through **TRL 4–7 milestones**, backed by dedicated CSR escrow stipends."
        )
        spoken_text = "We partner with 4 premier research labs at IIT Bombay, IISc, BITS Pilani, and IIT Delhi to engineer hardware prototypes."
        actions = [
            ChatAction(label="🔬 Browse University Labs", action_type="NAVIGATE_TAB", target="projects"),
            ChatAction(label="🎓 View Student Applications", action_type="NAVIGATE_TAB", target="student")
        ]
        suggested_prompts = ["How can students apply?", "What is Technology Readiness Level (TRL)?", "How does escrow work?"]

    # 3. MILESTONE ESCROW & CSR GRANTS
    elif any(k in msg for k in ["escrow", "grant", "fund", "money", "csr", "dollar", "pledge", "tranche", "tata"]):
        reply = (
            "💰 **4-Stage Milestone Escrow Protocol**:\n\n"
            "ImpactBridge uses a smart-contract escrow architecture with **$93,000+ pledged funding** from CSR partners (e.g. Tata Sustainability):\n\n"
            "1. **Phase 1: Research & Feasibility (20%)** — Literature review & technical architecture.\n"
            "2. **Phase 2: MVP & CAD Twin (30%)** — Bench hardware testing & faculty review.\n"
            "3. **Phase 3: Field Pilot (30%)** — Community pilot with live LoRa telemetry.\n"
            "4. **Phase 4: Scale & Industrial Handover (20%)** — Open-source docs & deployment."
        )
        spoken_text = "Impact Bridge uses a 4-stage smart contract escrow model. Funds are automatically disbursed across 4 phases upon faculty and telemetry validation."
        actions = [
            ChatAction(label="💼 Open CSR Grant Ledger", action_type="NAVIGATE_TAB", target="industry"),
            ChatAction(label="🔬 Browse Lab Milestones", action_type="NAVIGATE_TAB", target="projects")
        ]
        suggested_prompts = ["How are escrow funds verified?", "Who provides CSR grants?", "Show student stipends"]

    # 4. STUDENT RESEARCHERS & STIPENDS
    elif any(k in msg for k in ["student", "stipend", "intern", "apply", "scholar", "hiring"]):
        reply = (
            "🎓 **Student Innovator Program**:\n\n"
            "Undergraduate and graduate researchers can join university lab projects solving real community problems.\n\n"
            "**Key Benefits:**\n"
            "• **$1,500/mo Research Stipends** disbursed from verified escrow pools.\n"
            "• **Academic Course Credits** endorsed by Faculty PIs.\n"
            "• **Co-Inventorship & Patent IP** for deployable hardware."
        )
        spoken_text = "Students can join university lab projects to earn 1500 dollar monthly research stipends and co-authorship on patentable civic hardware."
        actions = [
            ChatAction(label="🎓 Apply for Research Lab", action_type="OPEN_MODAL", target="apply_project"),
            ChatAction(label="📂 My Applications", action_type="NAVIGATE_TAB", target="student")
        ]
        suggested_prompts = ["Browse open lab openings", "What skills are required?", "How does escrow payout work?"]

    # 5. IOT SENSORS & TELEMETRY
    elif any(k in msg for k in ["sensor", "lora", "gps", "hardware", "esp32", "telemetry", "accuracy"]):
        reply = (
            "📡 **Tamper-Proof IoT Telemetry Stack**:\n\n"
            "• **Microcontrollers**: ESP32-S3 with Edge Impulse AI models.\n"
            "• **Long-Range Uplink**: LoRaWAN 868 MHz Mesh Network with 99.8% uptime.\n"
            "• **GNSS Precision**: Multi-constellation GPS with **±0.2m spatial accuracy**.\n"
            "• **Live Cloud Sync**: Telemetry pings replicate in real-time to Google Cloud Firestore."
        )
        spoken_text = "Our hardware stack uses ESP32 nodes with 868 MHz LoRaWAN mesh and sub-meter GPS accuracy synced to Cloud Firestore."
        actions = [
            ChatAction(label="🗺️ View Telemetry on Map", action_type="NAVIGATE_TAB", target="map"),
            ChatAction(label="📸 Snap Field Telemetry", action_type="OPEN_MODAL", target="camera")
        ]
        suggested_prompts = ["Show city problem map", "How does milestone escrow work?", "How to report ground problems?"]

    # 6. CITY PROBLEM MAP & GIS
    elif any(k in msg for k in ["city", "map", "gis", "location", "mumbai", "gwalior", "belagavi", "hotspot"]):
        reply = (
            "🗺️ **Interactive City Problem Hotspots Map**:\n\n"
            "Visualizes ground challenges across **9 monitored municipalities** in India (Mumbai, Gwalior, Belagavi, Delhi, Bengaluru, etc.).\n\n"
            "• Color-coded urgency rings (🔴 Critical, 🟠 High, 🟢 In Progress).\n"
            "• Ward-level density analytics and municipal resolution progress meters."
        )
        spoken_text = "The City Problem Hotspots Map visualizes ground issues across 9 municipalities with real-time GPS coordinates and ward analytics."
        actions = [
            ChatAction(label="🗺️ Open City Problem Map", action_type="NAVIGATE_TAB", target="map")
        ]
        suggested_prompts = ["Show open ground problems", "Browse university lab projects", "Who provides CSR grants?"]

    # 7. DEFAULT / GREETING
    else:
        reply = (
            "🤖 **Hello! I am Nova, your CivicNexus AI Copilot.**\n\n"
            "I can assist you with:\n"
            "• **Ground Challenges**: Geotagging civic issues with AI structure & photo proof.\n"
            "• **University Labs**: R&D prototypes at IIT Bombay, IISc, BITS, and IIT Delhi.\n"
            "• **Milestone Escrow**: Smart contract grant pools ($93k pledged).\n"
            "• **Student Stipends**: Fast-track research applications & $1,500/mo payouts.\n\n"
            "What would you like to explore today?"
        )
        spoken_text = "Hello! I am Nova, your CivicNexus AI Copilot. Ask me anything about ground challenges, lab projects, or milestone escrow funding."
        actions = [
            ChatAction(label="🌾 Open Problems", action_type="NAVIGATE_TAB", target="challenges"),
            ChatAction(label="🔬 Lab Projects", action_type="NAVIGATE_TAB", target="projects"),
            ChatAction(label="🗺️ City Map", action_type="NAVIGATE_TAB", target="map"),
            ChatAction(label="💰 CSR Escrow", action_type="NAVIGATE_TAB", target="industry")
        ]
        suggested_prompts = ["How do I report a problem?", "Show university lab projects", "How does milestone escrow work?", "Student researcher openings"]

    # Log to Firestore asynchronously if configured
    try:
        log_bot_chat_to_firestore(session_id, req.message, reply, {"role": req.role, "user_name": req.user_name})
    except Exception:
        pass

    return ChatResponse(
        reply=reply,
        spoken_text=spoken_text,
        actions=actions,
        suggested_prompts=suggested_prompts
    )
