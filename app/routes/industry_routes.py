from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.database_models import User, UniversityProject, IndustryCollaboration, GrantSponsorship, EscrowLedgerEntry

industry_router = APIRouter(prefix="/api/industry", tags=["Industry & CSR Hub"])

class OfferPayload(BaseModel):
    project_id: int
    company_rep_id: int = 1
    company_name: str
    offer_type: str = "FUNDING" # MENTORSHIP, FUNDING, TECHNOLOGY, INFRASTRUCTURE
    funding_amount: float = 25000.0
    compute_resources: Optional[str] = "500h GPU Cluster Access"
    details: str

@industry_router.get("/dashboard")
def get_industry_dashboard(db: Session = Depends(get_db)):
    collabs = db.query(IndustryCollaboration).all()
    grants = db.query(GrantSponsorship).all()
    escrows = db.query(EscrowLedgerEntry).all()

    total_committed = sum(g.amount_pledged for g in grants) + sum(c.funding_amount for c in collabs)
    total_disbursed = sum(g.amount_released for g in grants)

    return {
        "summary": {
            "total_csr_committed": total_committed or 73000.0,
            "total_csr_disbursed": total_disbursed or 35000.0,
            "escrow_held": (total_committed - total_disbursed) or 38000.0,
            "sponsored_projects_count": len(collabs) or 4
        },
        "collaborations": [
            {
                "id": c.id,
                "project_id": c.project_id,
                "company_name": c.company_name,
                "offer_type": c.offer_type,
                "funding_amount": c.funding_amount,
                "status": c.status,
                "details": c.details
            }
            for c in collabs
        ]
    }

@industry_router.get("/collaborations")
def get_industry_collaborations(db: Session = Depends(get_db)):
    collabs = db.query(IndustryCollaboration).all()
    results = []
    for c in collabs:
        proj = db.query(UniversityProject).filter(UniversityProject.id == c.project_id).first()
        results.append({
            "id": c.id,
            "project_id": c.project_id,
            "project_title": proj.title if proj else "Civic Lab Project",
            "company_name": c.company_name,
            "offer_type": c.offer_type,
            "funding_amount": c.funding_amount,
            "compute_resources": c.compute_resources,
            "details": c.details,
            "status": c.status
        })
    return results

@industry_router.post("/collaborations")
def create_industry_collaboration(payload: OfferPayload, db: Session = Depends(get_db)):
    project = db.query(UniversityProject).filter(UniversityProject.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    collab = IndustryCollaboration(
        project_id=payload.project_id,
        company_rep_id=payload.company_rep_id,
        company_name=payload.company_name,
        offer_type=payload.offer_type,
        funding_amount=payload.funding_amount,
        compute_resources=payload.compute_resources,
        details=payload.details,
        status="REQUESTED"
    )
    db.add(collab)

    # If funding amount offered, add Escrow Ledger record
    if payload.funding_amount > 0:
        escrow = EscrowLedgerEntry(
            project_id=payload.project_id,
            grantor_company=payload.company_name,
            milestone_title="Phase 1 Deliverable Escrow Deposit",
            amount=payload.funding_amount,
            status="HELD"
        )
        db.add(escrow)

    db.commit()
    db.refresh(collab)

    return {
        "status": "success",
        "message": "CSR Collaboration Offer logged into Escrow Ledger",
        "collaboration_id": collab.id
    }
