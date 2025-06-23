from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.connection import sessionLocal
from models.session_model import IdentityKey
from schemas.create_schema import createSession, QRresponse
from crud.session_crud import createDB
from core.qr_gererator import generate_qr
from core.avatar_pool import AVATAR_POOL
from core.websocket_manager import manager
from schemas.create_schema import IdentityKeyPayload
from models.session_model import sessions, Participant
from database.utils import get_db
from pydantic import BaseModel
from urllib.parse import urlparse
import os
import cv2
import random
import numpy as np
from uuid import uuid4
import json

router = APIRouter()
UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/create_session", response_model=QRresponse)
def create_session(data: createSession, db: Session = Depends(get_db)):
    session = createDB(db, data)
    qr = generate_qr(session.id)
    return {"qr_code_url": qr}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as f:
            f.write(contents)
        return {"message": "File uploaded successfully!", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.post("/get_security_question/")
async def get_security_question(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        detector = cv2.QRCodeDetector()
        qr_data, bbox, _ = detector.detectAndDecode(image)

        if not qr_data:
            raise HTTPException(status_code=400, detail="Could not read QR code.")

        path = urlparse(qr_data).path
        session_id = int(path.split("/")[-1])

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"QR decode error: {str(e)}")

    session_obj = db.query(sessions).filter_by(id=session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found or QR expired.")

    if datetime.utcnow() > session_obj.created_at + timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="QR Code expired.")

    if session_obj.joined_count >= session_obj.num_of_participants:
        raise HTTPException(status_code=403, detail="Session is full.")

    session_obj.joined_count += 1
    db.commit()

    return {
        "security_question": session_obj.security_question,
        "session_id": session_id
    }

class AnswerInput(BaseModel):
    session_id: int
    answer: str

@router.post("/verify_security_answer/")
def verify_answer(payload: AnswerInput, db: Session = Depends(get_db)):
    session = db.query(sessions).filter_by(id=payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    is_verified = session.security_answer.strip().lower() == payload.answer.strip().lower()
    if is_verified:
        return {
            "verified": True,
            "user_id": str(uuid4())
        }

    return {"verified": False}

from sqlalchemy.exc import IntegrityError
from fastapi import WebSocket, WebSocketDisconnect

@router.websocket("/ws/{session_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: int, user_id: str, db: Session = Depends(get_db)):
    await websocket.accept()
    participant = None
    avatar_meta = {}

    try:
        session = db.query(sessions).with_for_update().filter_by(id=session_id).first()
        if not session:
            await websocket.close(code=1008)
            return

        participant = db.query(Participant).filter_by(id=user_id, session_id=session_id).first()

        def get_available():
            if isinstance(session.assigned_avatars, str):
                assigned = json.loads(session.assigned_avatars)
            elif isinstance(session.assigned_avatars, list):
                assigned = session.assigned_avatars
            else:
                assigned = []
            used_ids = set(assigned)
            return assigned, [a for a in AVATAR_POOL if a["id"] not in used_ids]

        if not participant:
            for _ in range(10):
                assigned, temp_pool = get_available()
                if not temp_pool:
                    await websocket.close(code=1013, reason="No avatars available.")
                    return

                selected = random.choice(temp_pool)

                try:
                    participant = Participant(
                        id=user_id,
                        session_id=session_id,
                        avatar_id=selected["id"],
                        is_connected=True
                    )
                    db.add(participant)
                    db.flush()

                    assigned.append(selected["id"])
                    session.assigned_avatars = assigned
                    avatar_meta = selected
                    db.commit()
                    break
                except Exception:
                    db.rollback()
                    session = db.query(sessions).with_for_update().filter_by(id=session_id).first()
                    continue
            else:
                await websocket.close(code=1013, reason="Avatar assignment failed after retries.")
                return
        else:
            participant.is_connected = True
            avatar_meta = next((a for a in AVATAR_POOL if a["id"] == participant.avatar_id), {})
            db.commit()

        if not manager.get_session(session_id):
            manager.add_session(session_id)
        await manager.connect(session_id, websocket)

        avatar_image = f"http://localhost:8000/static/avatars/{avatar_meta['id']}"
        await websocket.send_json({
            "type": "self",
            "avatar": avatar_image,
            "name": avatar_meta.get("name", "User")
        })

        # Send previously received ephemeral keys to the new participant
        for eph_key in manager.get_ephemeral_keys(session_id):
            await websocket.send_json(eph_key)

        while True:
            raw = await websocket.receive_text()
            parsed = json.loads(raw)

            if parsed.get("type") == "ephemeral_key":
                ephemeral_key = parsed.get("ephemeralPublicKey")
                if not ephemeral_key:
                    await websocket.send_json({"error": "Missing ephemeralPublicKey"})
                    continue

                # Store and broadcast ephemeral key
                message = {
                    "type": "ephemeral_key",
                    "from": user_id,
                    "ephemeralPublicKey": ephemeral_key,
                    "name": avatar_meta.get("name", "User"),
                    "avatar": avatar_image
                }
                await manager.broadcast(session_id, json.dumps(message))
                continue

            enriched = {
                "type": "message",
                "text": parsed.get("text", ""),
                "timestamp": parsed.get("timestamp", ""),
                "from": user_id,
                "to": parsed.get("to", ""),  # Important: retain recipient
                "name": avatar_meta.get("name", "User"),
                "avatar": avatar_image,
            }

            await manager.broadcast(session_id, json.dumps(enriched), sender=websocket)

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
        if participant:
            participant.is_connected = False
            db.commit()


@router.post("/store_identity_key/")
def store_identity_key(payload: IdentityKeyPayload, db: Session = Depends(get_db)):
    try:
        print(" Received identity key payload:", payload.dict())

        existing = db.query(IdentityKey).filter_by(
            participant_id=payload.participant_id,
            session_id=payload.session_id
        ).first()

        if existing:
            existing.identity_public_key = payload.identity_public_key
        else:
            new_key = IdentityKey(
                participant_id=payload.participant_id,
                session_id=payload.session_id,
                identity_public_key=payload.identity_public_key
            )
            db.add(new_key)

        db.commit()
        print("Identity key stored successfully.")
        return {"status": "success", "message": "Identity key stored securely."}

    except Exception as e:
        print("ERROR while storing identity key:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error: Identity key save failed.")

