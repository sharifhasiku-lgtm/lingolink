# LingoLink Deployment Progress - Updated Sep 25, 2026

## LIVE URLs
- Frontend (Vercel): https://lingolink-wine.vercel.app
- Backend (Render):  https://lingolink-backend-zur3.onrender.com
- API Docs:          https://lingolink-backend-zur3.onrender.com/docs
- Health:            https://lingolink-backend-zur3.onrender.com/health
- GitHub:            https://github.com/sharifhasiku-lgtm/lingolink

## Credentials
- Test user:  render@test.com / test1234
- Admin:      admin / lingolink256

## Render Postgres
- Host:     dpg-daqh2d7f3r2c73bb65rg-a
- DB:       lingolink_db_kf5j
- User:     lingo
- Password: zCzm0D5bXcjfcqLOtZcA3EgWUQ0hKFKF
- Expires:  October 24, 2026 (SET A REMINDER!)

## Render Env Vars
JWT_SECRET=4_V3QKXqacwJ95dZLpiilyGvaVKT0VgY-OH0ko96T1HnXMG9hqvpiozBN4N7PI9dCCGMhd-RMcWlFLTJ2G5ILg
DATABASE_URL=postgresql+psycopg2://lingo:zCzm0D5bXcjfcqLOtZcA3EgWUQ0hKFKF@dpg-daqh2d7f3r2c73bb65rg-a/lingolink_db_kf5j
ADMIN_PASSWORD=lingolink256
PYTHONUNBUFFERED=1
CORS_ORIGINS=https://lingolink-wine.vercel.app
USE_LIGHT_MODELS=1
SKIP_MODEL_PRELOAD=1
OMP_NUM_THREADS=1
MKL_NUM_THREADS=1
OPENBLAS_NUM_THREADS=1
TOKENIZERS_PARALLELISM=false

## What Works
- Frontend: login, signup, text translation, audio upload (light models), admin panel
- Backend: auth, RBAC, DB, text/audio translation via opus-mt + Whisper tiny
- Mobile: APK installed on phone, points at Render (wss://lingolink-backend-zur3.onrender.com/ws/agent)

## Known Limitations
- Light models = lower translation quality than NLLB
- Audio streaming via WebSocket may OOM on free tier (Whisper tiny load)
- Mobile app only has audio (no text/video tabs yet)

## TODO Tomorrow
1. Test mobile APK end-to-end (landing â†’ mic â†’ connected â†’ translate)
2. Add text translation screen to Flutter app
3. Add audio/video file upload screen to Flutter app
4. Add login flow to Flutter app (needed since backend requires JWT for translate endpoints)

## Notes
- Working tree clean, all changes pushed
- Project size: ~3.4 GB (.git is 2.92 GB - kept as-is)
- Local Docker backend still running (fallback)
- hf_cache was cleared (regenerates on next local run)
---

# Session Complete — Sep 28, 2026 8:00 PM

## LIVE TRANSLATION WORKING
- EN->SW: "Hello friend, good morning" -> "Habari rafiki, habari za asubuhi" ?
- EN->FR: "Hello friend" -> "Bonjour ami" ?
- Backend on Render free tier, no OOM, no rate limits hit

## Commit d4822aa is live on GitHub

## TODO Next Session
- Test mobile APK (login -> Text tab -> Swahili translation)
- Try web app on phone (add to home screen)
- Consider audio translation (may OOM - test carefully)
- Get a dedicated email for MyMemory quota (better than lingolink@example.com)
- Set Oct 24 reminder for Postgres expiry

---

# Sep 29 — PIVOT TRANSLATION WORKING
- Any-to-any translation via English pivot
- SW->YO, FR->SW, HA->FR, IG->ES all working
- Direct pairs still fast (single call)
- Full commit history on GitHub

---

# Sep 29 — FIXED: Login + single male voice + full stack working
- Fixed password_hash -> password (matched models.py)
- Fixed create_access_token/create_refresh_token signatures
- Single male multilingual voice: en-US-AndrewMultilingualNeural
- Any-to-any translation via English pivot
- Login, translation, and TTS all confirmed working on Render

Latest commit: see `git log --oneline -1`
