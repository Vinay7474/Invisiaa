from sqlalchemy import Column, Integer, DateTime, String, JSON, ForeignKey,Boolean
from sqlalchemy.orm import relationship
from database.connection import Base
from datetime import datetime
import uuid

class sessions(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    num_of_participants = Column(Integer, nullable=False)
    security_question = Column(String(256), nullable=False)
    security_answer = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    joined_count = Column(Integer, default=0)
    assigned_avatars = Column(JSON, default=list)

    # Define the one-to-many relationship
    participants = relationship("Participant", back_populates="session", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"))
    avatar_id = Column(String(256), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_connected = Column(Boolean, default=False)
    identity_public_key = Column(String(1024), nullable=True)

    #  Define the reverse relationship
    session = relationship("sessions", back_populates="participants")

class IdentityKey(Base):
    __tablename__ = "identity_keys"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(String(36), nullable=False, index=True)
    session_id = Column(Integer, nullable=False, index=True)
    identity_public_key = Column(String(1024), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

