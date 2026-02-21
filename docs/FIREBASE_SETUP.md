# Firebase Setup for Krishimitra

Firebase integration is complete. Follow these steps to finish setup:

## 1. Install dependencies

```bash
npm install
```

(or `npm install firebase` if you prefer)

## 2. Deploy Firestore security rules

You chose **production mode** for Firestore, so you need to add security rules:

1. Open [Firebase Console](https://console.firebase.google.com) → your project **Krishimitra**
2. Go to **Firestore Database** → **Rules** tab
3. Replace the existing rules with the contents of `database/firestore.rules` in this project
4. Click **Publish**

The rules allow each user to read/write only their own data (profile, transactions, login history).

## 3. What's changed

- **Auth**: Login and register now use Firebase Authentication (email/password)
- **User data**: Stored in Firestore `users/{userId}`
- **Transactions**: Stored in Firestore `users/{userId}/transactions`
- **Login history**: Each sign-in is recorded in `users/{userId}/loginHistory`
- **Trust score**: Saved in the user document and synced to Firestore

## 4. Important notes

- **Existing users** from the old localStorage setup will need to **register again** (create a new account with the same or different email). Old accounts cannot be migrated.
- **Session flags** (km_started, km_session_used_*, etc.) stay in localStorage for now
- **Sensor data** (km_last_sensor_*) stays in localStorage

## 5. Run the app

```bash
npm run dev
```

Register a new account and log in. Your data will be stored in Firebase.
