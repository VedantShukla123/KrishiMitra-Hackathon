# Krishimitra – Master Prompt for v0 / Rebuild

Use this prompt to generate or rebuild the Krishimitra app from scratch.

---

## Master Prompt (copy this)

```
Build "Krishimitra" – a farmer-facing trust score app for agricultural loans. Farmers earn a Trust Score (0–100) by completing tasks; lenders use it for loan decisions.

## Tech Stack
- React 18 + Vite
- React Router 6
- Firebase Auth (email/password)
- Firestore (users, transactions, login history)
- CSS variables, responsive layout

## Design
- Agrarian theme: greens (#0f5c0e, #1e7c1c, #2d9d2a), earth tones (#8b6914, #c9a227), wheat/field background
- Font: Outfit or similar
- Cards with soft shadows, rounded corners (14px)
- Mobile-first, sidebar for nav

## Pages & Features

### 1. Auth (Login / Register)
- Email + password
- Register: name, email, phone (optional), password, confirm password
- Protected routes redirect to /login
- Public-only routes (login, register) redirect to / when logged in

### 2. Home (/)
- Welcome: "Hello, [Name]!"
- "Start earning" button to unlock feature tiles
- Progress list: Profile, Bank Statement, Sensor Readings, Crop Analysis, Financial Quiz, Weather Insurance (checkmarks when done)
- Trust score circle: 0–100 with grade (Excellent 80+, Good 60+, Fair 40+, Needs improvement)
- "Evaluate my score" button: sums points from completed tasks, saves total
- Feature tiles (6): Weather Insurance, Crop Analysis, Financial Quests, Pay-as-you-Grow, Vouchers, Sensor Readings
- Tips section

### 3. Settings (/settings)
- Profile: name, email, phone, address, weather zone
- Nominee, DOB, address, phone form – Save gives +10 Trust Score (once per session)
- Transaction history table: date, description, change (+/- points)
- Loan section: status, amount, stage (mock: $100, Stage 2)

### 4. Bank Statement (/bank-statement)
- File upload: CSV, Excel, JSON, PDF
- Backend parses and returns: trustDelta, smallTransactions, totalTransactions
- +20 if active, -15 if inactive (once per session)
- Shows result

### 5. Sensor Readings (/sensor-readings)
- File upload: JSON, CSV, Excel, PDF
- Parses pH, moisture, nitrogen, rainfall, location
- Rule-based score 0–30: pH 6–7.5 (10), moisture 20–60% (10), nitrogen in range (10)
- Displays score, grade (excellent/good/fair/needs improvement), location
- Stores last sensor data (with rainfall) for Weather Insurance

### 6. Crop Analysis (/crop-analysis)
- Image upload for crop photo
- AI (Gemini/OpenAI) analysis: qualityScore 0–10, summary, issues, recommendations
- +qualityScore Trust Score (0–10) once per session

### 7. Financial Quests (/financial-literacy)
- Quest 1: Watch video (EMI/interest), then 4-question quiz
- 5 points per correct answer (max 20)
- Shows earned points, new total

### 8. Weather Insurance (/weather-insurance)
- Uses rainfall from last uploaded sensor file (not external API)
- Shows location, rainfall (mm), threshold (10 mm)
- Badge: "Monitoring" or "Payout triggered"
- +10 if rainfall 25–75 mm; -10 if &lt;10 (drought) or &gt;100 (flood)
- If no sensor data: message "Upload sensor file with rainfall first"

### 9. Pay-as-you-Grow / Smart Milestones (/smart-milestones)
- 3 stages: Seeds, Labor (unlock with moisture &gt;40%), Harvest (unlock with crop photo)
- Loan start date picker
- Moisture % input for Stage 2
- Crop photo upload for Stage 3
- Locked until Trust Score ≥80

### 10. Vouchers (/vouchers)
- Stage-based vouchers: $50 Seeds, $30 Labor, $20 Harvest
- QR code + 6-digit PIN per voucher
- Locked until Trust Score ≥80 and evaluation done

## Auth & Data
- Firebase Auth: signIn, signUp, signOut
- Firestore: users/{uid} (name, email, phone, trustScore); users/{uid}/transactions; users/{uid}/loginHistory
- All progress flags user-scoped (e.g. km_started_{userId}) so different users see their own data

## Routing
- / (Home), /login, /register
- /settings, /bank-statement, /sensor-readings, /crop-analysis, /financial-literacy
- /weather-insurance, /smart-milestones, /vouchers
- Protected + "RequireStarted" (must click "Start earning" first) for feature routes

## Layout
- Header: logo "Krishimitra", language selector (EN/HI/MR), user name, Logout
- Sidebar (mobile: hamburger): nav links, Settings, Logout
- Footer: "Made by AlgroithmX"

## i18n
- English, Hindi (हिंदी), Marathi (मराठी)
- All UI strings via translation keys

## Trust Score Sources (sum for "Evaluate")
- Profile: +10
- Bank (active): +20; Bank (inactive): -15
- Sensor: 0–30 (rule-based)
- Crop: 0–10 (AI quality)
- Quiz: 0–20 (5 per correct)
- Weather (25–75 mm): +10; &lt;10 mm: -10; &gt;100 mm: -10
- Clamp total 0–100
```

---

## Short Version (for v0)

```
Krishimitra – farmer trust score app for ag loans. React + Vite + Firebase (Auth, Firestore). Pages: Login/Register, Home (trust score 0–100, progress checklist, feature tiles), Settings (profile, transaction history), Bank Statement (file upload), Sensor Readings (pH/moisture/nitrogen file), Crop Analysis (AI image), Financial Quiz (video + 4 Qs), Weather Insurance (rainfall from sensor), Pay-as-you-Grow (3-stage milestones), Vouchers (QR+PIN). Green/earth theme, Outfit font, sidebar nav. Multi-language EN/HI/MR. User-scoped data so each user sees only their score and transactions.
```
