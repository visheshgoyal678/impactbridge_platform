"""
AI Problem Statement & Description Enhancer Service
Transforms citizen rough notes into well-structured, high-impact problem statements.
"""

from typing import Dict, Any, Optional
import os

SDG_MAP = {
    "WATER": ("SDG_6", "Clean Water & Sanitation"),
    "HEALTH": ("SDG_3", "Good Health & Well-being"),
    "ENERGY": ("SDG_7", "Affordable & Clean Energy"),
    "EDUCATION": ("SDG_4", "Quality Education"),
    "AGRICULTURE": ("SDG_2", "Zero Hunger"),
    "INFRASTRUCTURE": ("SDG_9", "Industry, Innovation & Infrastructure"),
    "ENVIRONMENT": ("SDG_13", "Climate Action"),
    "SANITATION": ("SDG_6", "Clean Water & Sanitation"),
    "URBAN": ("SDG_11", "Sustainable Cities & Communities"),
    "OTHER": ("SDG_11", "Sustainable Cities & Communities")
}

CATEGORY_KEYWORDS = {
    "WATER": ["water", "leak", "pipe", "drainage", "tap", "drinking", "contamination", "sewage", "flood", "borewell"],
    "HEALTH": ["health", "hospital", "clinic", "disease", "fever", "medical", "sanitary", "waste", "mosquito"],
    "ENERGY": ["power", "electricity", "solar", "outage", "transformer", "wire", "voltage", "energy"],
    "INFRASTRUCTURE": ["road", "pothole", "bridge", "street light", "crack", "traffic", "building", "sidewalk"],
    "ENVIRONMENT": ["air", "pollution", "tree", "smoke", "trash", "garbage", "dump", "plastic"],
    "AGRICULTURE": ["crop", "soil", "farmer", "irrigation", "pesticide", "harvest", "market"]
}

def detect_category(title: str, text: str) -> str:
    combined = f"{title} {text}".lower()
    for cat, kws in CATEGORY_KEYWORDS.items():
        if any(kw in combined for kw in kws):
            return cat
    return "INFRASTRUCTURE"

class ProblemDescriptionAIEngine:
    @classmethod
    def enhance(
        cls,
        title: str,
        rough_description: str,
        category: Optional[str] = None,
        location: Optional[str] = None,
        style: str = "COMPREHENSIVE"
    ) -> Dict[str, Any]:
        """
        Synthesizes a structured, highly persuasive problem statement from rough input.
        """
        title_clean = (title or "").strip()
        desc_clean = (rough_description or "").strip()
        loc_clean = (location or "Local Ward Community").strip()
        
        if not category or category == "ALL":
            category = detect_category(title_clean, desc_clean)
        
        sdg_key, sdg_title = SDG_MAP.get(category.upper(), ("SDG_11", "Sustainable Cities & Communities"))
        
        # Build Title if generic
        if len(title_clean) < 5 or "problem" in title_clean.lower():
            refined_title = f"{category.capitalize()} Disruption & Infrastructure Hazard at {loc_clean}"
        else:
            refined_title = title_clean.title()

        # Core Synthesis
        if style == "CONCISE":
            enhanced_text = (
                f"Severe {category.lower()} malfunction reported at {loc_clean}. "
                f"{desc_clean.capitalize() if desc_clean else 'Immediate attention required to prevent escalating civic hazards.'} "
                f"Requires priority inspection and municipal/student prototype intervention under {sdg_title}."
            )
        elif style == "TECHNICAL":
            enhanced_text = (
                f"### ⚙️ Technical Diagnostics & Systemic Issue\n"
                f"- **Location**: {loc_clean}\n"
                f"- **Domain**: {category} Engineering & Municipal Maintenance\n"
                f"- **Observed Anomaly**: {desc_clean if desc_clean else 'Structural breakdown and service interruption identified on site.'}\n\n"
                f"### 🔬 Recommended Engineering & IoT Intervention\n"
                f"1. Deploy on-site sensor telemetry / physical validation at target coordinate.\n"
                f"2. Form a student-faculty engineering project to design a resilient, low-cost fix.\n"
                f"3. Validate compliance with {sdg_title} ({sdg_key}) metrics."
            )
        else: # COMPREHENSIVE / PROFESSIONAL
            enhanced_text = (
                f"### 📌 Problem Overview\n"
                f"A critical {category.lower()} issue has been documented at **{loc_clean}**. "
                f"{desc_clean if desc_clean else 'The existing municipal system has experienced severe deterioration, impeding daily community life and posing ongoing safety risks.'}\n\n"
                f"### ⚠️ Community Impact & Urgency\n"
                f"- **Public Safety & Health**: Directly impacts local residents and daily commuters with elevated hazard levels.\n"
                f"- **Economic Disruption**: Inefficiencies and property damage resulting from unaddressed delays.\n\n"
                f"### 🎯 Proposed Action & Research Scope\n"
                f"- Immediate field assessment by civic authorities and student innovators.\n"
                f"- Development of a sustainable solution aligned with **{sdg_title} ({sdg_key})**."
            )

        return {
            "success": True,
            "refined_title": refined_title,
            "enhanced_description": enhanced_text,
            "suggested_category": category,
            "suggested_sdg_tag": sdg_key,
            "suggested_sdg_name": sdg_title,
            "suggested_urgency": "CRITICAL" if any(w in desc_clean.lower() for w in ["rupture", "danger", "burst", "urgent", "hazard", "shock", "flood"]) else "MEDIUM",
            "style_used": style
        }
