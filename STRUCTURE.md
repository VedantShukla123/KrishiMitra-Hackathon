# Krishimitra – Project Structure

A farmer-facing trust score app for agricultural loans. Farmers earn a Trust Score (0–100) by completing tasks; lenders use it for loan decisions.

**Build order (push / read top to bottom):** See [BUILD_ORDER.md](BUILD_ORDER.md). Folders are listed below in that same order so the repo reads like it was built step by step. **Backend and frontend stay at top level**—use `cd backend` and `cd frontend` to run them.

## Folder Layout

```
krishimitra/
├── README.md
├── STRUCTURE.md
├── BUILD_ORDER.md          # Order to push/read (root → backend → frontend → database → docs)
├── PUSH_ORDER.md           # Exact order to push to GitHub (step-by-step commits)
├── .gitignore
│
├── backend/                # 1. Flask API (run: cd backend → venv → pip install -r requirements.txt → python app.py)
│   ├── requirements.txt
│   ├── .env.example        # copy to .env
│   ├── krishimitra_knowledge.py
│   ├── app.py              # Bank, sensor, crop, chat
│   └── uploads/             # User uploads (runtime)
│
├── frontend/               # 2. React + Vite (run: cd frontend → npm install → npm run dev)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.jsx, App.jsx, index.css
│   │   ├── components/     # Layout, Sidebar, Chatbot, Quiz
│   │   ├── pages/          # Home, Login, Settings, etc.
│   │   ├── context/        # AuthContext, LanguageContext
│   │   ├── config/         # firebase.js
│   │   ├── lib/            # translations.js
│   │   └── utils/          # storageKeys.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/               # Firestore & rules
│   └── firestore.rules     # Deploy to Firebase Console
│
└── docs/
    ├── ARCHITECTURE.md
    ├── FIREBASE_SETUP.md
    ├── CHATBOT_SETUP.md
    └── MASTER_PROMPT.md
```

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Flask (bank statement, sensor, crop analysis APIs)
- **Database**: Firebase Auth + Firestore
- **i18n**: English, Hindi (हिंदी), Marathi (मराठी)

## Run Locally

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (optional – for bank/sensor/crop uploads)
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python app.py
```

## Key Paths

- `frontend/src/config/firebase.js` – Firebase config (Auth, Firestore)
- `frontend/src/lib/translations.js` – All UI strings (EN/HI/MR)
- `frontend/src/context/AuthContext.jsx` – Login, register, trust score
- `database/firestore.rules` – Deploy to Firebase Console
