# 🗳️ Election Voting System

A Firebase-backed election system with two apps:

- **📱 Voter mobile app** (`MobileApp/`, React Native + Expo + TypeScript): voters log in with their NIC and a 6-digit code emailed to them, then cast up to **3 votes** for candidates in their constituency during the election's voting hours. Everything on screen updates live.
- **💻 Admin web app** (`Admin_App/election-admin-app/`, React + Vite): live dashboard with turnout and leaderboard; manage elections, candidates and voters; live results.
- *(Legacy)* `Mobile_App/` is the previous native Java Android app, kept for reference; the React Native app replaces it.
- **☁️ Cloud Functions** (`functions/`, Node 22): send/verify login codes and record votes. All voting rules are enforced here, not in the app.

```
Voter app ──requestOtp / verifyOtp──▶ Cloud Functions ──▶ Brevo (OTP email)
     │              ◀── custom token ──┘      │
     ├──castVote────────────────────────────▶ │ (transaction: window, constituency,
     │                                         │  duplicate & 3-vote checks)
     └──reads (rules-restricted)──▶ Firestore ◀── Admin web app (admins only)
```

## Features

| | |
|---|---|
| Login | NIC → one-time 6-digit code emailed to the voter (5 min expiry, 5 attempts, 1/min resend) |
| Voting | Up to 3 votes per voter per election, one per candidate, own constituency only; confirmation before each vote |
| Voting hours | Per election (default 09:00–16:00), interpreted in **Asia/Colombo** time |
| Results | Live per-candidate counts, ranking and percentages, filter by district / constituency |
| Real time | Both apps use Firestore listeners: edits in the admin panel (names, photos, elections) and new votes appear on phones within seconds |
| Admin | Elections (with voting hours), candidates (photo + party symbol), voters, results |

## Repository layout

```
firebase.json            Firebase config (Firestore rules, functions, hosting, emulators)
firestore.rules          Security rules
functions/               Cloud Functions (requestOtp, verifyOtp, castVote) + tests
Admin_App/election-admin-app/   React admin panel (Vite)
MobileApp/               Voter app (React Native 0.88, Expo SDK 58, Expo Router, TypeScript)
Mobile_App/              Legacy native Android app (Java) — superseded by MobileApp/
```

## Firestore data model

| Collection | Written by | Notes |
|---|---|---|
| `elections` | admin | `name` (unique), `date` (`YYYY-MM-DD`), `startTime`, `endTime` (`HH:mm`) |
| `candidates` | admin (+ `votes` counter by `castVote`) | `candidateId`, `candidateName`, `candidateParty`, `district`, `constituency`, `electionName`, base64 images |
| `voters` | admin | `nic` (unique, upper-case), `name`, `email`, `address`, `district`, `constituency` |
| `results` | `castVote` only | One ballot per vote, id `<electionId>_<voterId>_<candidateDocId>` |
| `voterVotes` | `castVote` only | Per-voter tally, id `<electionId>_<voterId>` |
| `otps` | functions only | Hashed login codes |
| `admins` | Firebase console only | A document `admins/<uid>` makes that account an admin |

## Setup

### Prerequisites

- Node.js 22, Firebase CLI (`npm i -g firebase-tools`)
- Android Studio (or JDK 17+ and the Android SDK, platform 36)
- The Firebase project on the **Blaze plan** (Cloud Functions and outbound email require it)

### 1. Firebase project (`electionnew-app`)

1. **Authentication → Sign-in method:** enable **Email/Password** (for admins).
2. **Create an admin:** add a user in *Authentication → Users*, copy its UID, then in *Firestore* create a document `admins/<that UID>` (any content, e.g. `{ "email": "…" }`).
3. **Allow custom tokens:** in Google Cloud Console → IAM, give the Cloud Functions runtime service account (`<project-number>-compute@developer.gserviceaccount.com`) the **Service Account Token Creator** role. `verifyOtp` needs it to sign voters in.

### 2. Cloud Functions

```bash
cd functions
npm install
npm test                                       # unit tests

# Brevo API key used to email login codes (Brevo → SMTP & API → API keys).
firebase functions:secrets:set BREVO_API_KEY
# Sender: synccertsolution@gmail.com by default (must be a verified sender in Brevo).
# To change it, add EMAIL_SENDER=... / EMAIL_SENDER_NAME=... to functions/.env

cd ..
firebase deploy --only functions,firestore:rules
```

Functions are deployed to `asia-south1`. If you change the region, update `FUNCTIONS_REGION` in `Mobile_App/.../Session.java`.

### 3. Admin web app

```bash
cd Admin_App/election-admin-app
cp .env.example .env.local        # fill in the web app config from Firebase console
npm install
npm run dev                       # http://localhost:3000
npm run build                     # production build in dist/
firebase deploy --only hosting    # optional: host it on Firebase Hosting
```

### 4. Voter mobile app (React Native)

```bash
cd MobileApp
cp .env.example .env.local        # Firebase web config; EXPO_PUBLIC_USE_EMULATORS=false for production
npm install
npx expo run:android              # builds the native app and starts Metro
# or, for an installable build in the cloud: npx eas-cli@latest build -p android
```

Checks: `npx tsc --noEmit` and `npx expo lint`.

## Local testing with emulators and fake data

Everything can run locally against the Firebase emulators (needs Java 21+), with no deployment or real email:

```bash
# 1. functions/.secret.local (git-ignored) must exist:
#      BREVO_API_KEY=xkeysib-...      (any value works if you don't send real email locally)
#    Optional, functions/.env.local (git-ignored): EMULATOR_SEND_EMAIL=true to really email codes
#    via Brevo from the emulator — only for voters with real addresses (fake voters use example.com).
firebase emulators:start --project electionnew-app --only auth,firestore,functions

# 2. Load fake elections, voters, candidates and an admin (only works against emulators)
cd functions && npm run seed

# 3. Admin web app against the emulators → http://localhost:3000
cd Admin_App/election-admin-app && npm run dev:emulators

# 4. Voter app against the emulators: set EXPO_PUBLIC_USE_EMULATORS=true in MobileApp/.env.local
cd MobileApp && npx expo run:android          # Android emulator reaches the host at 10.0.2.2
```

| Fake data | |
|---|---|
| Admin | `admin@example.com` / `Admin@123` |
| Voters (NIC) | `199012345678` Amal (Colombo North), `856789012V` Nimali (Colombo North), `199834567890` Kasun (Colombo North), `927654321V` Dilani (Kandy Central), `200145678901` Ruwan (Kandy Central), `199556781234` Sanduni (Galle Town) |
| Elections | Parliamentary Election 2026 (today, open all day), Provincial Council Election 2025 (closed, with past results), Local Government Election 2027 (upcoming) |
| OTP | Not emailed under the emulator: it is printed in the emulator log as `[EMULATOR] OTP for NIC … : 123456` |

Emulator mode is opt-in: the admin app uses it only with `npm run dev:emulators`, and the voter app only when `EXPO_PUBLIC_USE_EMULATORS=true`.

**Low-memory machines (≤16 GB):** the Android emulator, a first native build and VS Code's Java extension together can exhaust RAM. Build first (`cd MobileApp/android && ./gradlew assembleDebug -PreactNativeArchitectures=x86_64`), then start the emulator. `.vscode/settings.json` excludes `MobileApp/android` from the Java extension's Gradle import for the same reason.

## Security notes

- No credentials live in the apps. The Brevo API key is a Cloud Functions secret (never in git).
- Voters can read only their own voter record and tally. Ballots can't be written by any client, including admins.
- The Firebase web config in `.env.local` / `google-services.json` is not secret; access is controlled by `firestore.rules`.

## Upgrading from v1

- v1 Android builds sent email and wrote votes directly. They **stop working** once the new rules are deployed, so install the new APK.
- Admins must be added to `admins/` before they can log in to the new admin panel.
- Ballots cast with v1 still show in the admin **Results** page (it counts `results` documents). The Android results screen uses the `candidates.votes` counter, which only counts votes cast through `castVote`.
