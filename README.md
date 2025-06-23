
# 🔐 INVISIAA – Secure Real-Time Chat Application

INVISIAA is a full-stack secure real-time chat application that combines **FastAPI + WebSockets** on the backend with a **React-based chat UI** on the frontend. It features **end-to-end encryption**, **QR-code based session authentication**, and a unique avatar system to manage session participants securely.

---

## 📸 Features

- ✅ **Session-based entry** using QR codes and optional security question
- 🛡️ **End-to-end encrypted messaging** using identity + ephemeral key exchange (based on Signal principles)
- 🎭 **Unique avatar assignment** per session to visually differentiate users
- 💬 **Emoji support**, dark mode, and screenshot prevention in the chat UI
- 🔐 **NaCl-based encryption** using `tweetnacl` (frontend)
- 🧼 **Automatic cleanup** of expired sessions using `fastapi-utils`

---

## 🗂️ Folder Structure

```
INVISIA/
├── backend/        # FastAPI + MySQL + WebSocket secure server
│   ├── app/
│   ├── .env        # Contains database URL (ignored)
│   ├── venv/       # Virtual environment (ignored)
│   └── requirements.txt
├── frontend/       # React chat UI
│   ├── node_modules/
│   ├── .env        # For frontend config (if needed)
│   └── package.json
├── .gitignore
├── README.md
```

---

## 🚀 Getting Started

### 📦 Backend Setup (FastAPI + MySQL)

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate     # On Windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up `.env`**
   Create a `.env` file inside `backend/`:
   ```
   DATABASE_URL=mysql+mysqlconnector://<user>:<password>@localhost/invisiaa
   ```

5. **Run the FastAPI server**
   ```bash
   uvicorn app.main:app --reload
   ```

---

### 🌐 Frontend Setup (React + Tailwind)

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

---

## 🔐 Security Model (Simplified Signal Protocol)

- 🔑 Each user generates:
  - A long-term **identity keypair**
  - A short-term **ephemeral keypair**
- 🤝 On joining, participants exchange **ephemeral public keys** over WebSocket
- 🔐 Shared secrets are derived using `nacl.box.before()` (frontend)
- 📨 Messages are encrypted with `nacl.box.after()` and decrypted per-user

---

## 📷 Screenshot Protection

The frontend UI implements:
- `user-select: none` and `pointer-events: none` for non-interactive sections
- Optional blur on canvas if screenshot is attempted (browser-dependent)

---

## 🧠 Technologies Used

| Category     | Stack                              |
|--------------|-------------------------------------|
| Frontend     | React, Tailwind CSS, emoji-mart, tweetnacl |
| Backend      | FastAPI, Uvicorn, WebSockets, SQLAlchemy |
| Database     | MySQL                              |
| Security     | NaCl (tweetnacl.js), ephemeral key exchange |
| Other        | QR code (qrcode, Pillow), `fastapi-utils` |

---

## ⚠️ Notes

- `.env` files must not be committed — secrets like DB URLs are stored there
- `venv/` and `node_modules/` are ignored via `.gitignore`

---

## 🧪 Future Improvements

- ✅ PyNaCl integration on backend
- 🔄 Real-time key rotation
- ☁️ Docker-based deployment
- 🌍 P2P session scaling

---

## 👨‍💻 Author

**Kowluri Vinay Kumar**  
B.Tech in Computer Science and Engineering  
Passionate about privacy, cryptography, and real-time systems.

---

## ⭐️ Star the Repo

If you like the project or find it useful, consider giving it a ⭐️ on GitHub!
