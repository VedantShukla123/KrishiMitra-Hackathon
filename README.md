# Krishimitra

Farmer's Friend – lend farmers loans based on a trust score built from multiple attributes.

## For evaluators / hackathon

**Do not commit or share real API keys or secrets.** This repo does not include `.env` files. To run the full app (backend, chatbot, crop analysis):

1. Copy `backend/.env.example` to `backend/.env`.
2. Add your own [Gemini API key](https://aistudio.google.com/app/apikey) and generate `SECRET_KEY` / `JWT_SECRET_KEY` as described in *Environment variables and secrets* below.

Frontend runs without the backend; backend features (chatbot, uploads, crop analysis) need the env vars above.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## What's included

- **Login / Register** – Firebase Auth (email/password)
- **Home** – Trust score (0–100) with grade, tips, and feature tiles
- **Settings** – Profile, nominee, transaction history
- **Bank Statement** – Upload CSV/Excel/JSON/PDF
- **Sensor Readings** – Upload sensor data (pH, moisture, nitrogen)
- **Crop Analysis** – AI image analysis
- **Financial Quests** – Video + quiz, +20 Trust Score
- **Weather Insurance** – Parametric (rainfall from sensor)
- **Pay-as-you-Grow** – Milestone-based loan stages
- **Vouchers** – QR/PIN at partner Agro-Dealers
- **i18n** – English, Hindi, Marathi

## Project structure

See [STRUCTURE.md](STRUCTURE.md) for folder layout and tech stack. To push to GitHub so the history looks like a step-by-step build, use [PUSH_ORDER.md](PUSH_ORDER.md). Backend and frontend stay at top level—use `cd backend` and `cd frontend` to run them.

## Backend (optional)

For bank statement, sensor, crop uploads, and the **support chatbot**:

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python app.py
```

**Support chatbot (customer care):** The in-app chat uses **Google Gemini** with full Krishimitra product knowledge so it can answer questions about Trust Score, uploads, Weather Insurance, Vouchers, Pay-as-you-Grow, and contact info. Set `GEMINI_API_KEY` in `backend/.env` (get a key from [Google AI Studio](https://aistudio.google.com/apikey)); the same key is used for Crop Analysis and the chatbot.

### Environment variables and secrets

Use `backend/.env.example` as a template: copy it to `backend/.env` and set real values.

- **Keys you GET from a service**
  - **GEMINI_API_KEY** – From [Google AI Studio](https://aistudio.google.com/app/apikey). Used for the chatbot and crop image analysis.
- **Keys you GENERATE yourself** (no website gives these to you)
  - **SECRET_KEY** – Used by Flask for session signing. Must be a long random string.
  - **JWT_SECRET_KEY** – Used to sign JWT tokens. Must be a different long random string.

**How to generate secret keys:** Run one of these and paste the output into `.env` (use two different outputs for `SECRET_KEY` and `JWT_SECRET_KEY`):

```bash
# Option 1: Python (from backend folder with venv active)
python -c "import secrets; print(secrets.token_hex(32))"
```

Or use [OpenSSL](https://www.openssl.org/): `openssl rand -hex 32`. Or any password generator that gives a long random string (32+ characters). Never commit `.env` or share these values.

## Firebase setup

See [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) for Firestore rules and setup.
