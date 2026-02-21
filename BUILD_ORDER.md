# Build order (push / read top to bottom)

Use this order when pushing code or when someone reads the repo—it reflects how the project was built step by step. **Backend and frontend stay at the top level** so you can always `cd backend` or `cd frontend` to run them.

**→ To push to GitHub in a natural order:** see [PUSH_ORDER.md](PUSH_ORDER.md) for step-by-step commits.

---

## 1. Project root (setup)

- `README.md` – what the app is, how to run
- `.gitignore` – what not to commit
- `STRUCTURE.md` – folder layout and tech stack
- `BUILD_ORDER.md` – this file

---

## 2. Backend (API first)

- `backend/requirements.txt` – Python deps
- `backend/.env.example` – env template (copy to `.env`)
- `backend/krishimitra_knowledge.py` – chatbot knowledge base
- `backend/app.py` – Flask app, routes, chat, crop analysis, uploads
- `backend/uploads/` – runtime uploads (gitignored except `.gitkeep`)

**Run:** `cd backend` → activate venv → `pip install -r requirements.txt` → `python app.py`

---

## 3. Frontend (UI)

- `frontend/package.json` – Node deps and scripts
- `frontend/index.html` – entry HTML
- `frontend/vite.config.js` – Vite config
- `frontend/public/` – static assets (e.g. favicon)
- `frontend/src/main.jsx` – React entry
- `frontend/src/App.jsx` – routes and layout
- `frontend/src/index.css` – global styles
- `frontend/src/config/firebase.js` – Firebase (Auth, Firestore)
- `frontend/src/utils/storageKeys.js` – localStorage key helpers
- `frontend/src/lib/translations.js` – i18n (EN/HI/MR)
- `frontend/src/context/` – AuthContext, LanguageContext, NotificationContext
- `frontend/src/components/` – Layout, Sidebar, Chatbot, Quiz, etc.
- `frontend/src/pages/` – Home, Login, Register, Settings, Bank, Sensor, Crop, etc.

**Run:** `cd frontend` → `npm install` → `npm run dev`

---

## 4. Database & docs

- `database/` – Firestore rules, any DB notes
- `docs/` – ARCHITECTURE, FIREBASE_SETUP, CHATBOT_SETUP, MASTER_PROMPT, etc.

---

**Summary:** Root → **backend** → **frontend** → database → docs. Backend and frontend stay where they are so you can open and run them without hunting.
