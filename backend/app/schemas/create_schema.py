from pydantic import BaseModel
from uuid import UUID 
class createSession(BaseModel):
    num_of_participants:int
    security_question:str
    security_answer:str
class QRresponse(BaseModel):
    qr_code_url:str

class Avatar(BaseModel):
    id: str
    name: str
    image: str

class AvatarAssignmentResponse(BaseModel):
    user_id: UUID
    session_id: str
    avatar: Avatar
class IdentityKeyPayload(BaseModel):
    session_id: int
    participant_id: str
    identity_public_key: str