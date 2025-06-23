from fastapi import WebSocket
from typing import Dict, List, Any
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.ephemeral_keys: Dict[int, List[Dict[str, Any]]] = {}  # New: stores ephemeral key info

    def get_session(self, session_id: int):
        return self.active_connections.get(session_id)

    def add_session(self, session_id: int):
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        if session_id not in self.ephemeral_keys:
            self.ephemeral_keys[session_id] = []

    async def connect(self, session_id: int, websocket: WebSocket):
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: int, websocket: WebSocket):
        if session_id in self.active_connections:
            try:
                self.active_connections[session_id].remove(websocket)
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
                    del self.ephemeral_keys[session_id]
            except ValueError:
                pass

    async def broadcast(self, session_id: int, message: str, sender: WebSocket = None):
        connections = self.active_connections.get(session_id, [])

        #  Store ephemeral keys
        try:
            parsed = json.loads(message)
            if parsed.get("type") == "ephemeral_key":
                self.ephemeral_keys[session_id].append(parsed)
        except Exception:
            pass  # Don't crash if message isn't JSON

        for connection in connections[:]:
            if connection == sender:
                continue
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(session_id, connection)

    async def send_personal_message(self, websocket: WebSocket, message: str):
        try:
            await websocket.send_text(message)
        except Exception:
            pass

    def get_active_users(self, session_id: int) -> int:
        return len(self.active_connections.get(session_id, []))

    def get_ephemeral_keys(self, session_id: int) -> List[Dict[str, Any]]:
        return self.ephemeral_keys.get(session_id, [])

manager = ConnectionManager()
