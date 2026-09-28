from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
import shutil
import time
import edge_tts
import os
import hashlib
import base64
import tempfile
import subprocess
import uuid
import threading
import wave
from datetime import datetime, timedelta

from app.models import (
    get_db, User, TranslationRecord, RefreshToken, engine, Base,
    Role, Permission, SessionLocal,
)
from app.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    verify_refresh_token, revoke_refresh_token, revoke_all_user_tokens,
    get_current_user, require_admin,
)
from app.permissions import (
    seed_rbac, require_permission,
    get_user_permissions, user_has_permission,
)

os.environ["OMP_NUM_THREADS"] = "2"
os.environ["MKL_NUM_THREADS"] = "2"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OPENBLAS_NUM_THREADS"] = "2"

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("data/audio", exist_ok=True)
os.makedirs("data/videos", exist_ok=True)
os.makedirs("data/dubbed", exist_ok=True)
app.mount("/data/audio", StaticFiles(directory="data/audio"), name="audio")
app.mount("/data/videos", StaticFiles(directory="data/videos"), name="videos")
app.mount("/data/dubbed", StaticFiles(directory="data/dubbed"), name="dubbed")

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "lingolink256"

whisper_model = None
_models_loaded = False

# NLLB codes → 2-letter language codes
NLLB_TO_GOOGLE = {
    "eng_Latn": "en", "swh_Latn": "sw", "yor_Latn": "yo", "hau_Latn": "ha",
    "ibo_Latn": "ig", "zul_Latn": "zu", "amh_Ethi": "am", "som_Latn": "so",
    "lin_Latn": "ln", "fra_Latn": "fr", "deu_Latn": "de", "spa_Latn": "es",
    "ita_Latn": "it", "por_Latn": "pt", "arb_Arab": "ar", "zho_Hans": "zh-CN",
    "jpn_Jpan": "ja", "kor_Kore": "ko", "hin_Deva": "hi", "rus_Cyrl": "ru",
    "nld_Latn": "nl", "tur_Latn": "tr", "vie_Latn": "vi", "urd_Arab": "ur",
    "afr_Latn": "af",
}

# 2-letter codes → MyMemory region codes
MM_MAP = {
    "en": "en-GB", "sw": "sw-KE", "yo": "yo-NG", "ha": "ha-NE",
    "ig": "ig-NG", "zu": "zu-ZA", "am": "am-ET", "so": "so-SO",
    "ln": "ln-LIN", "fr": "fr-FR", "de": "de-DE", "es": "es-ES",
    "it": "it-IT", "pt": "pt-PT", "ar": "ar-SA", "zh-CN": "zh-CN",
    "ja": "ja-JP", "ko": "ko-KR", "hi": "hi-IN", "ru": "ru-RU",
    "nl": "nl-NL", "tr": "tr-TR", "vi": "vi-VN", "ur": "ur-PK",
    "af": "af-ZA",
}


def load_models():
    """No-op — translation handled by MyMemory API."""
    return


def _do_translate(text, source_lang, target_lang):
    """Translate via MyMemory REST API directly (no deep-translator library)."""
    import requests

    if source_lang == target_lang:
        return text

    src = NLLB_TO_GOOGLE.get(source_lang, "en")
    tgt = NLLB_TO_GOOGLE.get(target_lang, "en")

    src_mm = MM_MAP.get(src, "en-GB")
    tgt_mm = MM_MAP.get(tgt, "sw-KE")

    url = "https://api.mymemory.translated.net/get"
    params = {"q": text, "langpair": f"{src_mm}|{tgt_mm}"}

    print(f"[TRANSLATE] src={src_mm}, tgt={tgt_mm}, text={text[:50]}", flush=True)

    try:
        resp = requests.get(url, params=params, timeout=20)
        if resp.status_code != 200:
            print(f"[TRANSLATE] HTTP {resp.status_code}: {resp.text[:200]}", flush=True)
            return text

        data = resp.json()
        translated = data.get("responseData", {}).get("translatedText", "")
        print(f"[TRANSLATE] result: {translated[:80]}", flush=True)

        if translated and translated.lower() != text.lower():
            return translated
        return text
    except Exception as e:
        print(f"[TRANSLATE] error: {e}", flush=True)
        return text


def load_whisper():
    global whisper_model
    if whisper_model is None:
        size = "tiny" if os.getenv("USE_LIGHT_MODELS", "0") == "1" else "base"
        print(f"Loading Whisper '{size}'...", flush=True)
        import whisper
        whisper_model = whisper.load_model(size)
        print(f"Whisper '{size}' loaded", flush=True)


def _preload_models():
    global _models_loaded
    try:
        print("Preloading Whisper base...", flush=True)
        load_whisper()
    except Exception as e:
        print(f"Whisper preload error: {e}", flush=True)
    _models_loaded = True
    print("All models preloaded. Backend ready.", flush=True)


@app.on_event("startup")
async def preload_on_startup():
    if os.getenv("SKIP_MODEL_PRELOAD", "0") == "1":
        print("SKIP_MODEL_PRELOAD=1 — models will load lazily on first request", flush=True)
    else:
        print("Startup: kicking off background model preload", flush=True)
        threading.Thread(target=_preload_models, daemon=True).start()

    try:
        db = SessionLocal()
        seed_rbac(db)
        db.close()
        print("RBAC seeded", flush=True)
    except Exception as e:
        print(f"RBAC seed failed: {e}", flush=True)


@app.get("/health")
def health():
    return {"status": "ok"}


VOICE_MAP = {
    "eng_Latn": "en-US-AriaNeural", "swh_Latn": "sw-KE-ZuriNeural",
    "fra_Latn": "fr-FR-DeniseNeural", "deu_Latn": "de-DE-KatjaNeural",
    "spa_Latn": "es-ES-ElviraNeural", "ita_Latn": "it-IT-ElsaNeural",
    "por_Latn": "pt-BR-FranciscaNeural", "arb_Arab": "ar-SA-ZariyahNeural",
    "zho_Hans": "zh-CN-XiaoxiaoNeural", "jpn_Jpan": "ja-JP-NanamiNeural",
    "kor_Kore": "ko-KR-SunHiNeural", "hin_Deva": "hi-IN-SwaraNeural",
    "rus_Cyrl": "ru-RU-SvetlanaNeural", "nld_Latn": "nl-NL-ColetteNeural",
    "tur_Latn": "tr-TR-EmelNeural", "vie_Latn": "vi-VN-HoaiMyNeural",
    "urd_Arab": "ur-PK-UzmaNeural", "yor_Latn": "yo-NG-EzinneNeural",
    "hau_Latn": "ha-NG-EzinneNeural", "ibo_Latn": "ig-NG-EzinneNeural",
    "zul_Latn": "zu-ZA-LeahNeural", "xho_Latn": "xh-ZA-LeahNeural",
    "afr_Latn": "af-ZA-AdriNeural", "som_Latn": "so-SO-UbaxNeural",
}


def get_voice(lang_code):
    return VOICE_MAP.get(lang_code, "en-US-AriaNeural")


def verify_admin_basic(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Basic "):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    try:
        decoded = base64.b64decode(authorization[6:]).decode()
        username, password = decoded.split(":", 1)
        if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return True


# ===== WEBSOCKET =====

WHISPER_TO_NLLB = {
    "en": "eng_Latn", "sw": "swh_Latn", "fr": "fra_Latn", "de": "deu_Latn",
    "es": "spa_Latn", "it": "ita_Latn", "pt": "por_Latn", "ar": "arb_Arab",
    "zh": "zho_Hans", "ja": "jpn_Jpan", "ko": "kor_Kore", "hi": "hin_Deva",
    "ru": "rus_Cyrl", "nl": "nld_Latn", "tr": "tur_Latn", "vi": "vie_Latn",
    "ur": "urd_Arab", "yo": "yor_Latn", "ha": "hau_Latn", "ig": "ibo_Latn",
    "zu": "zul_Latn", "xh": "xho_Latn", "af": "afr_Latn", "so": "som_Latn",
}


def pcm_to_float32(pcm_bytes: bytes):
    import numpy as np
    audio_int16 = np.frombuffer(pcm_bytes, dtype=np.int16)
    return audio_int16.astype(np.float32) / 32768.0


def is_silent(audio, threshold: float = 0.008) -> bool:
    import numpy as np
    if len(audio) == 0:
        return True
    rms = float(np.sqrt(np.mean(audio ** 2)))
    return rms < threshold


async def safe_send(ws: WebSocket, data: dict):
    try:
        await ws.send_json(data)
    except Exception:
        pass


@app.websocket("/ws/agent")
async def agent_websocket(ws: WebSocket):
    import numpy as np
    await ws.accept()
    print("Agent connected", flush=True)
    session = {"call_active": False, "call_id": None, "target_lang": "eng_Latn", "chunk_count": 0}
    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "agent_hello":
                await safe_send(ws, {"type": "welcome", "message": "Connected"})

            elif msg_type == "call_start":
                session["call_active"] = True
                session["call_id"] = data.get("call_id")
                session["target_lang"] = data.get("target_lang", "eng_Latn")
                session["chunk_count"] = 0
                await safe_send(ws, {"type": "call_started", "call_id": session["call_id"]})
                await safe_send(ws, {"type": "system", "text": "Loading Whisper (~30s)..."})
                try:
                    load_whisper()
                    await safe_send(ws, {"type": "system", "text": "Ready."})
                except Exception as e:
                    await safe_send(ws, {"type": "error", "message": str(e)})

            elif msg_type == "call_end":
                session["call_active"] = False
                await safe_send(ws, {"type": "call_ended", "call_id": session["call_id"]})

            elif msg_type == "audio_chunk":
                if not session["call_active"]:
                    continue
                audio_b64 = data.get("audio")
                speaker = data.get("speaker", "caller")
                if not audio_b64:
                    continue
                session["chunk_count"] += 1
                chunk_id = session["chunk_count"]
                try:
                    audio_bytes = base64.b64decode(audio_b64)
                except Exception:
                    continue

                pcm_bytes = audio_bytes[44:] if audio_bytes[:4] == b'RIFF' else audio_bytes
                pcm_float = pcm_to_float32(pcm_bytes)
                if is_silent(pcm_float):
                    continue

                tmp_path = None
                try:
                    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".wav")
                    os.close(tmp_fd)
                    with wave.open(tmp_path, 'wb') as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(16000)
                        wf.writeframes((pcm_float * 32767).astype(np.int16).tobytes())

                    load_whisper()
                    result = whisper_model.transcribe(tmp_path, fp16=False, language=None, task="transcribe",
                        condition_on_previous_text=False, no_speech_threshold=0.6)
                    text = result.get("text", "").strip()
                    detected = result.get("language", "en")

                    if not text or len(text) < 3:
                        continue

                    await safe_send(ws, {"type": "transcript", "speaker": speaker, "text": text,
                        "detected_lang": detected, "chunk": chunk_id})

                    source_nllb = WHISPER_TO_NLLB.get(detected)
                    target = session["target_lang"]
                    if source_nllb and source_nllb != target:
                        try:
                            translated = _do_translate(text, source_nllb, target)
                            await safe_send(ws, {"type": "transcript", "speaker": f"{speaker}_translated",
                                "text": translated, "chunk": chunk_id})
                        except Exception as e:
                            print(f"Translate error: {e}", flush=True)
                finally:
                    if tmp_path and os.path.exists(tmp_path):
                        try:
                            os.unlink(tmp_path)
                        except Exception:
                            pass

    except WebSocketDisconnect:
        print("Agent disconnected", flush=True)


# ===== MODELS =====

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "eng_Latn"
    target_lang: str = "swh_Latn"


class AdminLoginRequest(BaseModel):
    username: str
    password: str


# ===== DUBBING =====

@app.post("/dubbing/start")
async def dubbing_start(
    file: UploadFile = File(...),
    target_lang: str = "eng_Latn",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("dubbing")),
):
    job_id = str(uuid.uuid4())[:8]
    input_path = f"data/videos/{job_id}_input.mp4"
    with open(input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    output_path = f"data/dubbed/{job_id}_dubbed.mp4"
    audio_path = f"data/audio/{job_id}.wav"

    def process():
        try:
            subprocess.run(["ffmpeg", "-y", "-i", input_path, "-vn", "-acodec", "pcm_s16le",
                "-ar", "16000", "-ac", "1", audio_path], check=True, capture_output=True)
            load_whisper()
            result = whisper_model.transcribe(audio_path, fp16=False)
            source_text = result.get("text", "").strip()
            detected = result.get("language", "en")
            source_nllb = WHISPER_TO_NLLB.get(detected, "eng_Latn")
            translated_text = _do_translate(source_text, source_nllb, target_lang)

            voice = get_voice(target_lang)
            dubbed_audio = f"data/audio/{job_id}_dubbed.mp3"
            import asyncio
            asyncio.run(edge_tts.Communicate(translated_text, voice).save(dubbed_audio))

            subprocess.run(["ffmpeg", "-y", "-i", input_path, "-i", dubbed_audio,
                "-c:v", "copy", "-map", "0:v:0", "-map", "1:a:0", "-shortest", output_path],
                check=True, capture_output=True)

            db_record = TranslationRecord(
                source_lang=source_nllb, target_lang=target_lang,
                source_text=source_text, translated_text=translated_text,
                audio_url=f"/data/dubbed/{job_id}_dubbed.mp4",
            )
            db.add(db_record)
            db.commit()
        except Exception as e:
            print(f"Dubbing error: {e}", flush=True)

    threading.Thread(target=process, daemon=True).start()
    return {"job_id": job_id, "source_lang": "auto", "target_lang": target_lang,
            "status": "processing", "output_url": f"/data/dubbed/{job_id}_dubbed.mp4"}


# ===== AUTH =====

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    email: str
    new_name: Optional[str] = None
    new_email: Optional[str] = None
    new_password: Optional[str] = None


@app.post("/auth/signup/")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    if not request.email.strip() or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    existing = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=request.name.strip() or request.email.split("@")[0],
        email=request.email.lower().strip(),
        password_hash=hash_password(request.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return {"success": True, "access_token": access, "refresh_token": refresh,
            "token_type": "bearer", "expires_in": 1800,
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
            "message": "Account created successfully"}


@app.post("/auth/login/")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    if not request.email.strip() or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return {"success": True, "access_token": access, "refresh_token": refresh,
            "token_type": "bearer", "expires_in": 1800,
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}


@app.post("/auth/refresh/")
async def refresh_token(refresh_token_str: str, db: Session = Depends(get_db)):
    user = verify_refresh_token(db, refresh_token_str)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    new_access = create_access_token(user.id)
    return {"access_token": new_access, "token_type": "bearer", "expires_in": 1800}


@app.post("/auth/logout/")
async def logout(refresh_token_str: str, db: Session = Depends(get_db)):
    revoke_refresh_token(db, refresh_token_str)
    return {"success": True, "message": "Logged out"}


@app.get("/auth/me/")
async def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name,
            "email": current_user.email, "role": current_user.role}


@app.post("/auth/update/")
async def update_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request.new_name:
        current_user.name = request.new_name.strip()
    if request.new_email and request.new_email.lower().strip() != current_user.email:
        existing = db.query(User).filter(User.email == request.new_email.lower().strip()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = request.new_email.lower().strip()
    if request.new_password:
        current_user.password_hash = hash_password(request.new_password)
    db.commit()
    db.refresh(current_user)
    return {"success": True, "user": {"id": current_user.id, "name": current_user.name,
            "email": current_user.email, "role": current_user.role}}


# ===== RBAC =====

@app.get("/rbac/me/permissions/")
async def my_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perms = get_user_permissions(db, current_user)
    return {"user_id": current_user.id, "role": current_user.role, "permissions": perms}


@app.get("/rbac/roles/")
async def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = db.query(Role).all()
    return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]


@app.get("/rbac/permissions/")
async def list_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perms = db.query(Permission).all()
    return [{"id": p.id, "name": p.name, "description": p.description} for p in perms]


class AssignRoleRequest(BaseModel):
    user_id: int
    role: str


@app.post("/rbac/assign-role/")
async def assign_role(
    request: AssignRoleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("manage_roles")),
):
    target = db.query(User).filter(User.id == request.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.role = request.role
    db.commit()
    return {"success": True, "user_id": target.id, "new_role": target.role}


class CreateRoleRequest(BaseModel):
    name: str
    description: Optional[str] = None


@app.post("/rbac/create-role/")
async def create_role(
    request: CreateRoleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("manage_roles")),
):
    if db.query(Role).filter(Role.name == request.name).first():
        raise HTTPException(status_code=400, detail="Role already exists")
    role = Role(name=request.name, description=request.description or "")
    db.add(role)
    db.commit()
    db.refresh(role)
    return {"success": True, "role_id": role.id, "name": role.name}


# ===== ADMIN =====

@app.post("/admin/login/")
async def admin_login(request: AdminLoginRequest):
    if request.username == ADMIN_USERNAME and request.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.get("/admin/stats/")
async def admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("admin")),
):
    total_users = db.query(User).count()
    total_translations = db.query(TranslationRecord).count()
    lang_pairs = db.query(TranslationRecord.source_lang, TranslationRecord.target_lang,
        func.count(TranslationRecord.id).label('count')).group_by(
        TranslationRecord.source_lang, TranslationRecord.target_lang).order_by(
        func.count(TranslationRecord.id).desc()).limit(10).all()
    last_24h = db.query(TranslationRecord).filter(TranslationRecord.created_at >= datetime.utcnow() - timedelta(hours=24)).count()
    return {"total_users": total_users, "total_translations": total_translations,
            "translations_24h": last_24h,
            "top_language_pairs": [{"from": r[0], "to": r[1], "count": r[2]} for r in lang_pairs]}


@app.get("/admin/users/")
async def admin_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("admin")),
):
    users = db.query(User).order_by(User.id.desc()).limit(100).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role,
             "created_at": u.created_at.isoformat() if u.created_at else None} for u in users]


@app.get("/admin/records/")
async def admin_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("admin")),
):
    records = db.query(TranslationRecord).order_by(TranslationRecord.id.desc()).limit(100).all()
    return [{"id": r.id, "source_lang": r.source_lang, "target_lang": r.target_lang,
             "source_text": r.source_text, "translated_text": r.translated_text,
             "created_at": r.created_at.isoformat() if r.created_at else None} for r in records]


# ===== TEXT TRANSLATE =====

@app.post("/translate_text/")
async def translate_text(
    request: TranslationRequest,
    db: Session = Depends(get_db),
):
    load_models()
    start = time.time()
    translated = _do_translate(request.text, request.source_lang, request.target_lang)
    tts_filename = f"tts_{int(time.time())}.mp3"
    tts_url = None
    try:
        voice = get_voice(request.target_lang)
        await edge_tts.Communicate(translated, voice).save(f"data/audio/{tts_filename}")
        tts_url = f"/data/audio/{tts_filename}"
    except Exception as e:
        print(f"TTS error: {e}", flush=True)

    rec = TranslationRecord(source_lang=request.source_lang, target_lang=request.target_lang,
                            source_text=request.text, translated_text=translated)
    db.add(rec); db.commit(); db.refresh(rec)
    return {"id": rec.id, "source_text": request.text, "translated_text": translated,
            "source_lang": request.source_lang, "target_lang": request.target_lang,
            "audio_url": tts_url, "elapsed": round(time.time() - start, 2)}


# ===== AUDIO TRANSLATE =====

@app.post("/translate_audio/")
async def translate_audio(
    file: UploadFile = File(...),
    source_lang: str = "eng_Latn", target_lang: str = "eng_Latn",
    db: Session = Depends(get_db),
):
    load_models(); load_whisper()
    start = time.time()
    fl = f"data/audio/{file.filename}"
    with open(fl, "wb") as f:
        shutil.copyfileobj(file.file, f)
    stt = whisper_model.transcribe(fl, fp16=False)
    src_text = stt["text"].strip()
    translated = _do_translate(src_text, source_lang, target_lang)
    tts_filename = f"{file.filename}_translated_{int(time.time())}.mp3"
    tts_url = None
    try:
        voice = get_voice(target_lang)
        await edge_tts.Communicate(translated, voice).save(f"data/audio/{tts_filename}")
        tts_url = f"/data/audio/{tts_filename}"
    except Exception as e:
        print(f"TTS error: {e}", flush=True)

    rec = TranslationRecord(source_lang=source_lang, target_lang=target_lang,
                            source_text=src_text, translated_text=translated)
    db.add(rec); db.commit(); db.refresh(rec)
    return {"id": rec.id, "source_text": src_text, "translated_text": translated,
            "source_lang": source_lang, "target_lang": target_lang,
            "audio_url": tts_url, "elapsed": round(time.time() - start, 2)}


# ===== HISTORY =====

@app.get("/history/")
async def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("history")),
    limit: int = 10,
):
    records = db.query(TranslationRecord).order_by(TranslationRecord.created_at.desc()).limit(limit).all()
    return [{"id": r.id, "source_lang": r.source_lang, "target_lang": r.target_lang,
             "source_text": r.source_text, "translated_text": r.translated_text,
             "created_at": r.created_at.isoformat() if r.created_at else None} for r in records]


@app.delete("/history/{record_id}")
async def delete_history(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("history")),
):
    r = db.query(TranslationRecord).filter(TranslationRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(r)
    db.commit()
    return {"success": True}