# Krishimitra – Architecture & Google AI Studio Setup

This document describes the main components of the Krishimitra app and how to get everything working, including the Gemini API via Google AI Studio.

---

## 1. High-level architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER (Browser)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)  –  http://localhost:5173                           │
│  • Auth (Firebase Auth)   • Layout, Sidebar, Chatbot, NotificationCenter     │
│  • Pages: Home, Settings, Bank Statement, Sensor, Crop, Quiz, Weather, etc.   │
│  • i18n: English, Hindi, Marathi   • LanguageContext, AuthContext              │
│  • Calls backend at VITE_API_URL for chat, uploads, crop analysis           │
└─────────────────────────────────────────────────────────────────────────────┘
        │                              │
        │ Firebase SDK                 │ REST (fetch)
        ▼                              ▼
┌───────────────────┐    ┌─────────────────────────────────────────────────────┐
│  FIREBASE         │    │  BACKEND (Flask)  –  http://127.0.0.1:5000             │
│  • Auth           │    │  • /api/register, /api/login (Flask DB)             │
│  • Firestore      │    │  • /api/chat → Gemini (customer care)               │
│  (users,          │    │  • /api/crop-analysis → Gemini (image)              │
│   transactions,   │    │  • /api/bank-statement, /api/sensor-readings        │
│   loginHistory)   │    │  • /api/feedback (support feedback to DB)           │
│                   │    │  • GEMINI_API_KEY, GEMINI_MODEL from .env            │
└───────────────────┘    └─────────────────────────────────────────────────────┘
                                                    │
                                                    │ HTTPS
                                                    ▼
                                         ┌─────────────────────┐
                                         │  GOOGLE GEMINI API  │
                                         │  (AI Studio key)    │
                                         │  • generateContent  │
                                         │  • gemini-pro (v1)  │
                                         │  • or 1.5-flash     │
                                         │    (v1beta)         │
                                         └─────────────────────┘
```

---

## 2. Main components

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Vite, React Router | SPA: login, home, trust score, uploads, quiz, chatbot, notifications |
| **Auth** | Firebase Auth | Email/password sign-in, sign-up; user identity |
| **Database** | Firestore + Flask SQLite | Firestore: user profile, transactions, login history (per user). Flask: legacy auth, feedback, file metadata |
| **Backend API** | Flask (Python) | Chat (Gemini), crop analysis (Gemini), bank/sensor parsing, feedback |
| **AI** | Google Gemini API | Support chatbot (with Krishimitra knowledge); crop image analysis |
| **i18n** | translations.js + LanguageContext | English, Hindi, Marathi |

---

## 3. Data flow (summary)

- **Login/Register:** Frontend → Firebase Auth; profile/trust score can sync to Firestore.
- **Chatbot:** Frontend → `POST /api/chat` (message + history) → Backend → Gemini `generateContent` → reply to frontend.
- **Crop analysis:** Frontend → `POST /api/crop-analysis` (image) → Backend → Gemini (image + prompt) → quality/issues back to frontend.
- **Bank/Sensor:** Frontend → Backend upload endpoints → parsing and trust score logic → response.
- **Feedback:** Frontend → `POST /api/feedback` → Backend stores in DB.

---

## 4. Environment variables

| Where | Variable | Purpose |
|-------|----------|---------|
| **Project root** | `VITE_API_URL` | Backend base URL for frontend (e.g. `http://127.0.0.1:5000`) |
| **backend/.env** | `GEMINI_API_KEY` | API key from Google AI Studio (chat + crop analysis) |
| **backend/.env** | `GEMINI_MODEL` | Model ID, e.g. `gemini-pro` (use v1) or `gemini-1.5-flash` (v1beta) |
| **backend/.env** | `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL` | Flask app and DB |
| **Frontend** | Firebase config | In `frontend/src/config/firebase.js` (apiKey, projectId, etc.) from Firebase Console |

---

## 5. Google AI Studio – get everything working

Do these in order so the chatbot and crop analysis work.

### Step 1: Create or get an API key

1. Open **Google AI Studio**: https://aistudio.google.com/
2. Sign in with your Google account.
3. Go to **Get API key** (or **API keys** in the menu).
4. Create an API key for your project (or use an existing one).
5. Copy the key (starts with `AIza...`).

### Step 2: Put the key in the backend

1. Open `backend/.env`.
2. Set (no space after `=`):
   ```env
   GEMINI_API_KEY=your_copied_key_here
   GEMINI_MODEL=gemini-pro
   ```
3. Save. Use only one `GEMINI_API_KEY` line.

### Step 3: Which model to use

- **gemini-pro**  
  - Use with **v1** endpoint.  
  - The app already uses v1 when `GEMINI_MODEL=gemini-pro`.  
  - No `systemInstruction`; the app sends the knowledge as the first user message.

- **gemini-1.5-flash** (if your key has access)  
  - Use with **v1beta** and `systemInstruction`.  
  - Set `GEMINI_MODEL=gemini-1.5-flash` in `backend/.env`.  
  - If you get “model not found”, switch back to `gemini-pro`.

### Step 4: Restart backend

After changing `.env`:

```bash
cd backend
# Activate venv if you use one, then:
python app.py
```

### Step 5: Frontend

- Ensure `VITE_API_URL` in project root `.env` points to your backend (e.g. `http://127.0.0.1:5000`).
- Run frontend: `cd frontend && npm run dev`.
- Open the app, open the chatbot, and ask e.g. “What format for bank statement?” to confirm Gemini is answering.

---

## 6. Prompt for Google AI Studio (testing the support bot)

If you want to test the **support bot behavior** inside Google AI Studio (playground), use the prompt below as the **system instruction** or as the first user message. It matches what the app sends to Gemini.

Copy everything between the quotes (or the whole block) into AI Studio.

```
You are the official customer care assistant for Krishimitra, a farmer-focused digital platform that helps farmers build a Trust Score and access agricultural loans, insurance, vouchers, and financial literacy.

What is Krishimitra?
- Web app for farmers: Trust Score (0–100), tasks (profile, bank statement, sensor uploads, crop analysis, financial quiz, weather insurance), Pay-as-you-Grow and Vouchers unlock at score 80+, languages: English, Hindi, Marathi.

Trust Score (0–100): Built from Profile, Bank Statement, Sensor Readings, Crop Analysis, Financial Quests, Weather Insurance. 80+ unlocks Vouchers and Pay-as-you-Grow.

File formats:
- Sensor readings: JSON (preferred), CSV, Excel, or PDF; include pH, moisture, nitrogen, rainfall, location.
- Bank statement: PDF, CSV, Excel, or JSON.
- Crop analysis: upload a photo (image).

Features: Home (dashboard, progress), Settings (profile), Bank Statement (upload), Sensor Readings (upload), Crop Analysis (photo + AI), Financial Quests (videos + quiz, +20 Trust Score), Pay-as-you-Grow (stages), Vouchers (QR/PIN at Agro-Dealer), Weather Insurance (parametric, uses sensor rainfall).

Feedback/complaints/ratings: Direct users to the "Send feedback / complaint / rating" option in the same chat. Contact details (telephone, mobile, toll-free, email, WhatsApp, Instagram, helpline hours) are in the app sidebar.

Answer only from this context; be concise and friendly. For contact details, say they are in the Contact Us section in the app sidebar.
```

In AI Studio you can:

- Paste this as **System instruction** (if the model supports it), or  
- Paste as the **first user message** and then ask e.g. “What format for bank statement?” as the next user message.

This mirrors how the app uses Gemini so you can verify behavior and model availability (e.g. gemini-pro vs 1.5-flash) before relying on the backend.

---

## 7. File layout (main paths)

```
krishimitra/
├── frontend/
│   ├── src/
│   │   ├── main.jsx, App.jsx, index.css
│   │   ├── components/     # Layout, Sidebar, Chatbot, NotificationCenter, Quiz
│   │   ├── pages/          # Home, Login, Register, Settings, BankStatement, etc.
│   │   ├── context/        # AuthContext, LanguageContext, NotificationContext
│   │   ├── config/         # firebase.js
│   │   ├── lib/            # translations.js
│   │   └── utils/          # storageKeys.js
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app.py              # All Flask routes + Gemini chat + crop analysis
│   ├── krishimitra_knowledge.py   # Bot knowledge base
│   ├── .env                 # GEMINI_API_KEY, GEMINI_MODEL, etc.
│   └── requirements.txt
├── database/               # Firestore rules (deploy in Firebase Console)
├── docs/                   # FIREBASE_SETUP, ARCHITECTURE, etc.
├── .env                    # VITE_API_URL (frontend → backend)
├── README.md
└── STRUCTURE.md
```

---

## 8. Quick checklist for “everything working”

- [ ] Firebase project created; Auth and Firestore enabled.
- [ ] `frontend/src/config/firebase.js` has correct config from Firebase Console.
- [ ] Firestore rules deployed (e.g. from `database/` or Firebase Console).
- [ ] Google AI Studio API key created and copied.
- [ ] `backend/.env` has `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-pro` (or 1.5-flash if you use it).
- [ ] Root `.env` has `VITE_API_URL=http://127.0.0.1:5000` (or your backend URL).
- [ ] Backend running: `python app.py` (port 5000).
- [ ] Frontend running: `npm run dev` in `frontend` (e.g. port 5173).
- [ ] Chatbot and crop analysis use the same Gemini key and model; if one works, the other should too once routes and env are correct.

Using the same API key and model (e.g. gemini-pro) for both chat and crop analysis keeps configuration simple and avoids “model not found” or version mismatches.
