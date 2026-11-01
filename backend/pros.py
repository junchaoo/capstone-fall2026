from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Player

router = APIRouter(prefix="/pros", tags=["pros"])

class AccountOut(BaseModel):
    name: str


class SocialOut(BaseModel):
    platform: str
    handle: str
    url: str


class ProPlayerOut(BaseModel):
    id: str                      
    name: str
    team: str
    role: str
    region: str
    league: str
    logoUrl: str | None = None
    photoUrl: str | None = None
    accounts: list[AccountOut]
    socials: list[SocialOut]
    leaguepediaUrl: str | None = None


def to_out(p: Player) -> ProPlayerOut:
    """Turns a database Player (plus its team, accounts, socials) into the JSON shape above."""
    return ProPlayerOut(
        id=p.slug,
        name=p.name,
        team=p.team.name,
        role=p.role,
        region=p.team.region,
        league=p.team.league,
        logoUrl=p.team.logo_url,
        photoUrl=p.photo_url,
        accounts=[AccountOut(name=a.name) for a in p.accounts],
        socials=[SocialOut(platform=s.platform, handle=s.handle, url=s.url) for s in p.socials],
        leaguepediaUrl=p.leaguepedia_url,
    )


@router.get("", response_model=list[ProPlayerOut])
def list_pros(db: Session = Depends(get_db)):
    players = (
        db.query(Player)
        .options(
            selectinload(Player.team),
            selectinload(Player.accounts),
            selectinload(Player.socials),
        )
        .order_by(Player.id)
        .all()
    )
    return [to_out(p) for p in players]


@router.get("/{slug}", response_model=ProPlayerOut)
def get_pro(slug: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.slug == slug).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return to_out(player)