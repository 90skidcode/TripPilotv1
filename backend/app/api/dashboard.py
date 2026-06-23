from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.lead import Lead, LeadStage, LeadSource
from app.models.user import User
from app.services.ai_service import generate_dashboard_insights

router = APIRouter()


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("dashboard", "read")),
):
    total_leads = db.query(func.count(Lead.id)).filter(Lead.org_id == current_user.org_id).scalar()
    won_leads = db.query(func.count(Lead.id)).filter(Lead.org_id == current_user.org_id, Lead.stage == LeadStage.won).scalar()
    lost_leads = db.query(func.count(Lead.id)).filter(Lead.org_id == current_user.org_id, Lead.stage == LeadStage.lost).scalar()
    fresh_leads = db.query(func.count(Lead.id)).filter(Lead.org_id == current_user.org_id, Lead.stage == LeadStage.fresh).scalar()
    not_responding = db.query(func.count(Lead.id)).filter(Lead.org_id == current_user.org_id, Lead.stage == LeadStage.not_responding).scalar()
    conversion_rate = round((won_leads / total_leads * 100), 1) if total_leads else 0

    return {
        "total_leads": total_leads,
        "won_leads": won_leads,
        "lost_leads": lost_leads,
        "fresh_leads": fresh_leads,
        "not_responding": not_responding,
        "conversion_rate": conversion_rate,
        "active_leads": total_leads - won_leads - lost_leads,
    }


@router.get("/leads-by-source")
def leads_by_source(db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read"))):
    rows = db.query(Lead.source, func.count(Lead.id)).filter(Lead.org_id == current_user.org_id).group_by(Lead.source).all()
    return [{"source": r[0].value if r[0] else "unknown", "count": r[1]} for r in rows]


@router.get("/leads-by-stage")
def leads_by_stage(db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read"))):
    rows = db.query(Lead.stage, func.count(Lead.id)).filter(Lead.org_id == current_user.org_id).group_by(Lead.stage).all()
    return [{"stage": r[0].value if r[0] else "unknown", "count": r[1]} for r in rows]


@router.get("/leaderboard")
def team_leaderboard(db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read"))):
    rows = db.query(
        User.name,
        func.count(Lead.id).label("leads"),
        func.sum(case((Lead.stage == LeadStage.won, 1), else_=0)).label("won"),
    ).filter(User.org_id == current_user.org_id).join(Lead, Lead.assigned_to == User.id, isouter=True).group_by(User.id, User.name).all()
    return [{"agent": r[0], "leads": r[1], "won": r[2]} for r in rows]


@router.get("/ai-insights")
async def get_ai_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("dashboard", "read")),
):
    try:
        leads = (
            db.query(Lead)
            .filter(Lead.org_id == current_user.org_id)
            .order_by(Lead.created_at.desc())
            .limit(30)
            .all()
        )

        leads_list = []
        for l in leads:
            leads_list.append({
                "id": l.id,
                "name": l.name,
                "phone": l.phone,
                "source": l.source.value if l.source else "manual",
                "stage": l.stage.value if l.stage else "fresh",
                "destination": l.destination,
                "trip_type": l.trip_type,
                "budget": l.budget,
                "notes": l.notes
            })

        return await generate_dashboard_insights(leads_list)
    except Exception as e:
        print(f"[ai-insights] Error: {e}")
        return {"insights": []}
