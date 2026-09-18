from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import shutil
import time
import edge_tts
import os
import hashlib
import base64
import tempfile
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional

from app.models import get_db, User, TranslationRecord, engine, Base

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
app.mount("/data/audio", StaticFiles(directory="data/audio"), name="audio")

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "lingolink256"

translation_tokenizer = None
translation_model = None
whisper_model = None

def load_models():
    global translation_tokenizer, translation_model
    if translation_model is None:
        print("Loading NLLB-200 model...")
        translation_tokenizer = AutoTokenizer.from_pretrained("facebook/nllb-200-distilled-600M")
        translation_model = AutoModelForSeq2SeqLM.from_pretrained("facebook/nllb-200-distilled-600M")
        print("NLLB-200 loaded!")

def load_whisper():
    global whisper_model
    if whisper_model is None:
        print("Loading Whisper model...")
        import whisper
        whisper_model = whisper.load_model("base")
        print("Whisper loaded!")

VOICE_MAP = {
    "eng_Latn": "en-US-AriaNeural",
    "swh_Latn": "sw-KE-ZuriNeural",
    "fra_Latn": "fr-FR-DeniseNeural",
    "deu_Latn": "de-DE-KatjaNeural",
    "spa_Latn": "es-ES-ElviraNeural",
    "ita_Latn": "it-IT-ElsaNeural",
    "por_Latn": "pt-BR-FranciscaNeural",
    "arb_Arab": "ar-SA-ZariyahNeural",
    "zho_Hans": "zh-CN-XiaoxiaoNeural",
    "jpn_Jpan": "ja-JP-NanamiNeural",
    "kor_Kore": "ko-KR-SunHiNeural",
    "hin_Deva": "hi-IN-SwaraNeural",
    "rus_Cyrl": "ru-RU-SvetlanaNeural",
    "nld_Latn": "nl-NL-ColetteNeural",
}

def get_voice(lang_code):
    return VOICE_MAP.get(lang_code, "en-US-AriaNeural")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_admin(authorization: Optional[str] = Header(None)):
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

# ===== WEBSOCKET FOR AGENT CONSOLE =====

WHISPER_TO_NLLB = {
    "en": "eng_Latn", "sw": "swh_Latn", "fr": "fra_Latn", "de": "deu_Latn",
    "es": "spa_Latn", "it": "ita_Latn", "pt": "por_Latn", "ar": "arb_Arab",
    "zh": "zho_Hans", "ja": "jpn_Jpan", "ko": "kor_Kore", "hi": "hin_Deva",
    "ru": "rus_Cyrl", "nl": "nld_Latn", "tr": "tur_Latn", "vi": "vie_Latn",
    "ur": "urd_Arab", "yo": "yor_Latn", "ha": "hau_Latn", "ig": "ibo_Latn",
    "zu": "zul_Latn", "xh": "xho_Latn", "af": "afr_Latn", "so": "som_Latn"
}

class AgentConnectionManager:
    def __init__(self):
        self.active = []
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

agent_manager = AgentConnectionManager()

async def safe_send(ws: WebSocket, data: dict):
    try:
        await ws.send_json(data)
    except Exception:
        pass

@app.websocket("/ws/agent")
async def agent_websocket(ws: WebSocket):
    await agent_manager.connect(ws)
    print(f"✅ Agent connected. Total: {len(agent_manager.active)}")
    session = {
        "call_active": False,
        "call_id": None,
        "target_lang": "eng_Latn",
        "chunk_count": 0
    }
    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "agent_hello":
                await safe_send(ws, {
                    "type": "welcome",
                    "message": "Connected to LingoLink Agent Console",
                    "agent_id": data.get("agent_id")
                })

            elif msg_type == "call_start":
                session["call_active"] = True
                session["call_id"] = data.get("call_id")
                session["target_lang"] = data.get("target_lang", "eng_Latn")
                session["chunk_count"] = 0
                await safe_send(ws, {"type": "call_started", "call_id": session["call_id"]})
                await safe_send(ws, {
                    "type": "system",
                    "text": "Loading Whisper model (first call only, ~30s)..."
                })
                try:
                    load_whisper()
                    await safe_send(ws, {"type": "system", "text": "🎙️ Ready. Speak into your mic."})
                except Exception as e:
                    await safe_send(ws, {"type": "error", "message": f"Whisper load failed: {e}"})

            elif msg_type == "call_end":
                session["call_active"] = False
                await safe_send(ws, {"type": "call_ended", "call_id": session["call_id"]})
                session["call_id"] = None

            elif msg_type == "audio_chunk":
                if not session["call_active"]:
                    continue

                audio_b64 = data.get("audio")
                speaker = data.get("speaker", "caller")
                mime = data.get("mime", "audio/wav")
                if not audio_b64:
                    continue

                session["chunk_count"] += 1
                chunk_id = session["chunk_count"]

                try:
                    audio_bytes = base64.b64decode(audio_b64)
                    print(f"📦 Chunk {chunk_id}: {len(audio_bytes)} bytes, mime={mime}")
                except Exception as e:
                    print(f"Bad audio chunk: {e}")
                    await safe_send(ws, {"type": "error", "message": f"Bad audio: {e}"})
                    continue

                tmp_path = None
                try:
                    suffix = ".webm" if "webm" in mime else ".wav"
                    tmp_fd, tmp_path = tempfile.mkstemp(suffix=suffix)
                    os.close(tmp_fd)
                    with open(tmp_path, "wb") as f:
                        f.write(audio_bytes)
                    print(f"   saved to {tmp_path}")

                    load_whisper()
                    result = whisper_model.transcribe(
                        tmp_path,
                        fp16=False,
                        language=None,
                        task="transcribe",
                        condition_on_previous_text=False
                    )
                    text = result.get("text", "").strip()
                    detected = result.get("language", "en")

                    if not text or len(text) < 2:
                        print(f"   chunk {chunk_id}: no speech detected")
                        continue

                    print(f"✅ Whisper: {text[:80]} (lang: {detected})")

                    await safe_send(ws, {
                        "type": "transcript",
                        "speaker": speaker,
                        "text": text,
                        "detected_lang": detected,
                        "chunk": chunk_id
                    })

                    source_nllb = WHISPER_TO_NLLB.get(detected, "eng_Latn")
                    target = session["target_lang"]

                    if source_nllb != target and text:
                        try:
                            load_models()
                            translation_tokenizer.src_lang = source_nllb
                            encoded = translation_tokenizer(text, return_tensors="pt")
                            tokens = translation_model.generate(
                                **encoded,
                                forced_bos_token_id=translation_tokenizer.convert_tokens_to_ids(target),
                                max_length=256
                            )
                            translated = translation_tokenizer.batch_decode(tokens, skip_special_tokens=True)[0]

                            await safe_send(ws, {
                                "type": "transcript",
                                "speaker": f"{speaker}_translated",
                                "text": translated,
                                "source_lang": source_nllb,
                                "target_lang": target,
                                "chunk": chunk_id
                            })
                        except Exception as e:
                            print(f"Translation error: {e}")

                except Exception as e:
                    print(f"Whisper error: {e}")
                    await safe_send(ws, {"type": "error", "message": f"Transcription failed: {str(e)[:200]}"})
                finally:
                    if tmp_path and os.path.exists(tmp_path):
                        try:
                            os.remove(tmp_path)
                        except:
                            pass

            else:
                await safe_send(ws, {"type": "error", "message": f"Unknown type: {msg_type}"})

    except WebSocketDisconnect:
        agent_manager.disconnect(ws)
        print(f"❌ Agent disconnected. Total: {len(agent_manager.active)}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        agent_manager.disconnect(ws)

# ===== REQUEST MODELS =====

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

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "eng_Latn"
    target_lang: str = "swh_Latn"

class AdminLoginRequest(BaseModel):
    username: str
    password: str

# ===== ROUTES =====

@app.get("/")
async def root():
    return {"Hello": "LingoLink AI Backend is running"}

@app.post("/auth/signup/")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    if not request.name.strip() or not request.email.strip() or not request.password:
        raise HTTPException(status_code=400, detail="All fields are required")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    email_lower = request.email.lower().strip()
    if db.query(User).filter(User.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=request.name.strip(), email=email_lower, password=hash_password(request.password))
    db.add(user); db.commit(); db.refresh(user)
    return {"success": True, "user": {"id": user.id, "name": user.name, "email": user.email}, "message": "Account created successfully"}

@app.post("/auth/login/")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    if not request.email.strip() or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or user.password != hash_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"success": True, "user": {"id": user.id, "name": user.name, "email": user.email}, "message": "Login successful"}

@app.post("/auth/update/")
async def update_profile(request: UpdateProfileRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if request.new_name:
        user.name = request.new_name.strip()
    if request.new_email and request.new_email.lower().strip() != user.email:
        if db.query(User).filter(User.email == request.new_email.lower().strip()).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = request.new_email.lower().strip()
    if request.new_password:
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        user.password = hash_password(request.new_password)
    db.commit(); db.refresh(user)
    return {"success": True, "user": {"id": user.id, "name": user.name, "email": user.email}, "message": "Profile updated"}

@app.post("/admin/login/")
async def admin_login(request: AdminLoginRequest):
    if request.username == ADMIN_USERNAME and request.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/admin/stats/")
async def admin_stats(admin: bool = Depends(verify_admin), db: Session = Depends(get_db)):
    total_translations = db.query(TranslationRecord).count()
    total_users = db.query(User).count()
    lang_pairs = db.query(
        TranslationRecord.source_lang, TranslationRecord.target_lang,
        func.count(TranslationRecord.id).label('count')
    ).group_by(TranslationRecord.source_lang, TranslationRecord.target_lang).order_by(
        func.count(TranslationRecord.id).desc()
    ).limit(10).all()
    last_24h = db.query(TranslationRecord).filter(TranslationRecord.created_at >= datetime.utcnow() - timedelta(hours=24)).count()
    last_7d = db.query(TranslationRecord).filter(TranslationRecord.created_at >= datetime.utcnow() - timedelta(days=7)).count()
    daily_counts = []
    for i in range(6, -1, -1):
        ds = (datetime.utcnow() - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        de = ds + timedelta(days=1)
        c = db.query(TranslationRecord).filter(TranslationRecord.created_at >= ds, TranslationRecord.created_at < de).count()
        daily_counts.append({"date": ds.strftime("%Y-%m-%d"), "count": c})
    return {
        "total_translations": total_translations, "total_users": total_users,
        "last_24h": last_24h, "last_7d": last_7d, "daily_counts": daily_counts,
        "top_language_pairs": [{"source": p[0], "target": p[1], "count": p[2]} for p in lang_pairs]
    }

@app.get("/admin/users/")
async def admin_users(admin: bool = Depends(verify_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {"total": len(users), "users": [{"id": u.id, "name": u.name, "email": u.email, "created_at": u.created_at.isoformat() if u.created_at else None} for u in users]}

@app.get("/admin/translations/")
async def admin_translations(admin: bool = Depends(verify_admin), db: Session = Depends(get_db), limit: int = 50, offset: int = 0):
    records = db.query(TranslationRecord).order_by(TranslationRecord.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": db.query(TranslationRecord).count(), "records": [
        {"id": r.id, "source_lang": r.source_lang, "target_lang": r.target_lang,
         "source_text": r.source_text, "translated_text": r.translated_text,
         "created_at": r.created_at.isoformat() if r.created_at else None} for r in records]}

@app.delete("/admin/translations/{record_id}")
async def admin_delete_translation(record_id: int, admin: bool = Depends(verify_admin), db: Session = Depends(get_db)):
    r = db.query(TranslationRecord).filter(TranslationRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(r); db.commit()
    return {"message": "Record deleted"}

@app.delete("/admin/translations/")
async def admin_clear_translations(admin: bool = Depends(verify_admin), db: Session = Depends(get_db)):
    c = db.query(TranslationRecord).delete(); db.commit()
    return {"message": f"Deleted {c} records"}

@app.post("/translate_text/")
async def translate_text(request: TranslationRequest, db: Session = Depends(get_db)):
    load_models()
    start = time.time()
    translation_tokenizer.src_lang = request.source_lang
    enc = translation_tokenizer(request.text, return_tensors="pt")
    tokens = translation_model.generate(**enc, forced_bos_token_id=translation_tokenizer.convert_tokens_to_ids(request.target_lang), max_length=128)
    translated = translation_tokenizer.batch_decode(tokens, skip_special_tokens=True)[0]
    tts_filename = f"tts_{int(time.time())}.mp3"
    tts_url = None
    try:
        voice = get_voice(request.target_lang)
        communicate = edge_tts.Communicate(translated, voice)
        await communicate.save(f"data/audio/{tts_filename}")
        tts_url = f"/data/audio/{tts_filename}"
    except Exception as e:
        print(f"TTS error: {e}")
    rec = TranslationRecord(source_lang=request.source_lang, target_lang=request.target_lang, source_text=request.text, translated_text=translated)
    db.add(rec); db.commit(); db.refresh(rec)
    return {"id": rec.id, "source_text": request.text, "translated_text": translated,
            "tts_file_path": tts_url, "latency_seconds": round(time.time() - start, 2),
            "message": "Text translation successful"}

@app.post("/translate_audio/")
async def translate_audio(file: UploadFile = File(...), source_lang: str = "eng_Latn", target_lang: str = "swh_Latn", db: Session = Depends(get_db)):
    load_models(); load_whisper()
    start = time.time()
    fl = f"data/audio/{file.filename}"
    with open(fl, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    stt = whisper_model.transcribe(fl)
    src_text = stt["text"].strip()
    translation_tokenizer.src_lang = source_lang
    enc = translation_tokenizer(src_text, return_tensors="pt")
    tokens = translation_model.generate(**enc, forced_bos_token_id=translation_tokenizer.convert_tokens_to_ids(target_lang), max_length=128)
    translated = translation_tokenizer.batch_decode(tokens, skip_special_tokens=True)[0]
    tts_filename = f"{file.filename}_translated_{int(time.time())}.mp3"
    tts_url = None
    try:
        voice = get_voice(target_lang)
        communicate = edge_tts.Communicate(translated, voice)
        await communicate.save(f"data/audio/{tts_filename}")
        tts_url = f"/data/audio/{tts_filename}"
    except Exception as e:
        print(f"TTS error: {e}")
    rec = TranslationRecord(source_lang=source_lang, target_lang=target_lang, source_text=src_text, translated_text=translated)
    db.add(rec); db.commit(); db.refresh(rec)
    return {"id": rec.id, "source_text": src_text, "translated_text": translated,
            "tts_file_path": tts_url, "latency_seconds": round(time.time() - start, 2),
            "message": "Audio translation successful"}

@app.get("/history/")
async def get_history(db: Session = Depends(get_db), limit: int = 10):
    records = db.query(TranslationRecord).order_by(TranslationRecord.created_at.desc()).limit(limit).all()
    return [{"id": r.id, "source_lang": r.source_lang, "target_lang": r.target_lang,
             "source_text": r.source_text, "translated_text": r.translated_text,
             "created_at": r.created_at.isoformat() if r.created_at else None} for r in records]

@app.delete("/history/{record_id}")
async def delete_history(record_id: int, db: Session = Depends(get_db)):
    r = db.query(TranslationRecord).filter(TranslationRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(r); db.commit()
    return {"message": "Record deleted"}