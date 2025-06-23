from models.session_model import sessions
from schemas.create_schema import createSession
from sqlalchemy.orm import Session
from core.avatar_pool import AVATAR_POOL
from models.session_model import Participant
import random

def createDB(db:Session,data:createSession):
    session_data=sessions(**data.dict())
    db.add(session_data)
    db.commit()
    db.refresh(session_data)
    return session_data

def assign_avatar(db: Session, session_id: str, user_id: str):
    existing = db.query(Participant).filter_by(session_id=session_id, id=user_id).first()
    if existing:
        return next(a for a in AVATAR_POOL if a["id"] == existing.avatar_id)

    used = db.query(Participant).filter_by(session_id=session_id).all()
    used_ids = {p.avatar_id for p in used}

    available = [a for a in AVATAR_POOL if a["id"] not in used_ids]
    if not available:
        raise Exception("No avatars left")

    avatar = random.choice(available)

    participant = Participant(id=user_id, session_id=session_id, avatar_id=avatar["id"])
    db.add(participant)
    db.commit()

    return avatar
