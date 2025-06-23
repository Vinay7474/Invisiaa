from fastapi import FastAPI
from api import sessionRoutes
from database.connection import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from fastapi_utils.tasks import repeat_every
from models.session_model import sessions
from database.utils import get_db
import logging
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
@repeat_every(seconds=300)
def delete_expired_sessions_task() -> None:
    logger.info("Running cleanup task...")
    db_gen = get_db()
    db = next(db_gen)
    try:
        expiry_threshold = datetime.now() - timedelta(minutes=1)
        expired_sessions = db.query(sessions).filter(sessions.created_at < expiry_threshold).all()
        logger.info(f"Found {len(expired_sessions)} expired sessions to delete")

        for session in expired_sessions:
            logger.info(f"Deleting session id={session.id} created_at={session.created_at}")
            db.delete(session)
        db.commit()
    except Exception as e:
        logger.exception("Failed to commit deletions")
        db.rollback()
    finally:
        db.close()
        try:
            next(db_gen)
        except StopIteration:
            pass

Base.metadata.create_all(bind=engine)

app.include_router(sessionRoutes.router)
app.mount(
    "/static",
    StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")),
    name="static"
)
