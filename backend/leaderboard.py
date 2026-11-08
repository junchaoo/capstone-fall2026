"""
GET /leaderboard             -> every saved player, best LP first
GET /leaderboard?region=NA   -> just one region
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import LadderEntry

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


class EntryOut(BaseModel):
    id: str
    name: str
    tag: str
    region: str
    tier: str
    lp: int
    wins: int
    losses: int


class LeaderboardOut(BaseModel):
    updatedAt: str | None = None   #when the data was last fetched from riot
    entries: list[EntryOut]


@router.get("", response_model=LeaderboardOut)
def get_leaderboard(region: str | None = None, db: Session = Depends(get_db)):
    query = db.query(LadderEntry)
    if region:
        query = query.filter(LadderEntry.region == region.upper())
    rows = query.order_by(LadderEntry.lp.desc()).all()

    updated = max((r.updated_at for r in rows), default=None)
    return LeaderboardOut(
        updatedAt=updated.isoformat() + "Z" if updated else None,
        entries=[
            EntryOut(
                id=f"{r.region}-{r.id}",
                name=r.game_name or "Unknown player",
                tag=r.tag_line,
                region=r.region,
                tier=r.tier,
                lp=r.lp,
                wins=r.wins,
                losses=r.losses,
            )
            for r in rows
        ],
    )