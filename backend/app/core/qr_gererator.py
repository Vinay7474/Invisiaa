import qrcode
import base64
from io import BytesIO

def generate_qr(session_id:int):
    data=f"http://localhost:5173/join_session/{session_id}"
    qr=qrcode.make(data)
    buffer=BytesIO()
    qr.save(buffer,format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{qr_base64}"