from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header
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
    import base64
    try:
        decoded = base64.b64decode(authorization[6:]).decode()
        username, password = decoded.split(":", 1)
        if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return True

# ===== LANGUAGE DETECTION (lightweight, free) =====
# Simple heuristic: match common words and character ranges per language.
# Not perfect, but works well enough for common phrases.

LANG_HINTS = {
    "swh_Latn": ["habari", "asante", "karibu", "ndiyo", "hapana", "jambo", "nzuri", "tafadhali", "sana", "kwaheri"],
    "eng_Latn": ["the", "and", "you", "hello", "yes", "no", "please", "thank", "how", "what", "where", "good", "morning"],
    "fra_Latn": ["bonjour", "merci", "oui", "non", "s'il", "vous", "comment", "ça", "très", "bien", "au revoir"],
    "spa_Latn": ["hola", "gracias", "sí", "no", "por", "cómo", "está", "buenos", "días", "adiós", "qué"],
    "deu_Latn": ["hallo", "danke", "ja", "nein", "wie", "geht", "guten", "morgen", "bitte", "tschüss"],
    "ita_Latn": ["ciao", "grazie", "sì", "no", "come", "stai", "buongiorno", "per favore", "arrivederci"],
    "por_Latn": ["olá", "obrigado", "sim", "não", "como", "está", "bom", "dia", "por favor", "tchau"],
    "yor_Latn": ["bawo", "pele", "oṣe", "bẹẹni", "rara", "jọwọ", "o dabo", "ẹ ku"],
    "hau_Latn": ["sannu", "na gode", "eh", "a'a", "yaya", "kaka", "ban kwana"],
    "zul_Latn": ["sawubona", "ngiyabonga", "yebo", "cha", "unjani", "hamba kahle"],
    "xho_Latn": ["molo", "enkosi", "ewe", "hayi", "unjani", "hamba kakuhle"],
    "lug_Latn": ["oli otya", "weebale", "yee", "nedda", "ki", "gyendi"],
    "kin_Latn": ["muraho", "murakoze", "yego", "oya", "amakuru", "bite"],
    "som_Latn": ["salaam", "mahadsanid", "haa", "maya", "sidee", "tahay"],
    "amh_Ethi": ["ሰላም", "አመሰግናለሁ", "አዎ", "አይ"],
}

CHAR_RANGES = {
    "arb_Arab": (0x0600, 0x06FF),
    "hin_Deva": (0x0900, 0x097F),
    "zho_Hans": (0x4E00, 0x9FFF),
    "jpn_Jpan": (0x3040, 0x30FF),
    "kor_Kore": (0xAC00, 0xD7AF),
    "rus_Cyrl": (0x0400, 0x04FF),
    "amh_Ethi": (0x1200, 0x137F),
}

def detect_language(text: str) -> str:
    """Return a best-guess language code using character ranges + keyword hints."""
    if not text or not text.strip():
        return "eng_Latn"
    
    # 1. Check character ranges first (CJK, Arabic, Cyrillic, etc.)
    for code, (start, end) in CHAR_RANGES.items():
        count = sum(1 for c in text if start <= ord(c) <= end)
        if count > len(text) * 0.3:
            return code
    
    # 2. Check keyword hints
    lower = text.lower()
    scores = {}
    for lang, keywords in LANG_HINTS.items():
        score = sum(1 for kw in keywords if kw in lower)
        if score > 0:
            scores[lang] = score
    
    if scores:
        return max(scores, key=scores.get)
    
    # 3. Default: assume English
    return "eng_Latn"

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

class DetectRequest(BaseModel):
    text: str

class AdminLoginRequest(BaseModel):
    username: str
    password: str

@app.get("/")
async def root():
    return {"Hello": "LingoLink AI Backend is running"}

@app.post("/detect_language/")
async def detect_language_endpoint(request: DetectRequest):
    detected = detect_language(request.text)
    return {
        "detected_lang": detected,
        "text": request.text
    }

@app.post("/auth/signup/")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    if not request.name.strip() or not request.email.strip() or not request.password:
        raise HTTPException(status_code=400, detail="All fields are required")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    email_lower = request.email.lower().strip()
    existing = db.query(User).filter(User.email == email_lower).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        name=request.name.strip(),
        email=email_lower,
        password=hash_password(request.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "message": "Account created successfully"
    }

@app.post("/auth/login/")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    if not request.email.strip() or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    email_lower = request.email.lower().strip()
    user = db.query(User).filter(User.email == email_lower).first()
    
    if not user or user.password != hash_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "success": True,
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "message": "Login successful"
    }

@app.post("/auth/update/")
async def update_profile(request: UpdateProfileRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.new_name:
        user.name = request.new_name.strip()
    
    if request.new_email and request.new_email.lower().strip() != user.email:
        existing = db.query(User).filter(User.email == request.new_email.lower().strip()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = request.new_email.lower().strip()
    
    if request.new_password:
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        user.password = hash_password(request.new_password)
    
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "message": "Profile updated"
    }

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
        TranslationRecord.source_lang,
        TranslationRecord.target_lang,
        func.count(TranslationRecord.id).label('count')
    ).group_by(
        TranslationRecord.source_lang,
        TranslationRecord.target_lang
    ).order_by(func.count(TranslationRecord.id).desc()).limit(10).all()
    
    last_24h = db.query(TranslationRecord).filter(
        TranslationRecord.created_at >= datetime.utcnow() - timedelta(hours=24)
    ).count()
    
    last_7d = db.query(TranslationRecord).filter(
        TranslationRecord.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    daily_counts = []
    for i in range(6, -1, -1):
        day_start = (datetime.utcnow() - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = db.query(TranslationRecord).filter(
            TranslationRecord.created_at >= day_start,
            TranslationRecord.created_at < day_end
        ).count()
        daily_counts.append({"date": day_start.strftime("%Y-%m-%d"), "count": count})
    
    return {
        "total_translations": total_translations,
        "total_users": total_users,
        "last_24h": last_24h,
        "last_7d": last_7d,
        "daily_counts": daily_counts,
        "top_language_pairs": [
            {"source": p[0], "target": p[1], "count": p[2]}
            for p in lang_pairs
        ]
    }

@app.get("/admin/users/")
async def admin_users(admin: bool = Depends(verify_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {
        "total": len(users),
        "users": [
            {"id": u.id, "name": u.name, "email": u.email, "created_at": u.created_at.isoformat() if u.created_at else None}
            for u in users
        ]
    }

@app.get("/admin/translations/")
async def admin_translations(
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    records = db.query(TranslationRecord).order_by(
        TranslationRecord.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    return {
        "total": db.query(TranslationRecord).count(),
        "records": [
            {"id": r.id, "source_lang": r.source_lang, "target_lang": r.target_lang,
             "source_text": r.source_text, "translated_text": r.translated_text,
             "created_at": r.created_at.isoformat() if r.created_at else None}
            for r in records
        ]
    }

@app.delete("/admin/translations/{record_id}")
async def admin_delete_translation(
    record_id: int,
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    record = db.query(TranslationRecord).filter(TranslationRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted"}

@app.delete("/admin/translations/")
async def admin_clear_translations(
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    count = db.query(TranslationRecord).delete()
    db.commit()
    return {"message": f"Deleted {count} records"}

@app.post("/translate_text/")
async def translate_text(request: TranslationRequest, db: Session = Depends(get_db)):
    load_models()
    start_time = time.time()

    # Auto-detect if requested
    source_lang = request.source_lang
    detected = False
    if source_lang == "auto":
        source_lang = detect_language(request.text)
        detected = True

    translation_tokenizer.src_lang = source_lang
    encoded_input = translation_tokenizer(request.text, return_tensors="pt")
    generated_tokens = translation_model.generate(
        **encoded_input,
        forced_bos_token_id=translation_tokenizer.convert_tokens_to_ids(request.target_lang),
        max_length=128
    )
    translated_text = translation_tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]

    tts_filename = f"tts_{int(time.time())}.mp3"
    tts_output_path = f"data/audio/{tts_filename}"
    tts_url = None
    try:
        voice = get_voice(request.target_lang)
        communicate = edge_tts.Communicate(translated_text, voice)
        await communicate.save(tts_output_path)
        tts_url = f"/data/audio/{tts_filename}"
    except Exception as e:
        print(f"TTS error: {e}")

    record = TranslationRecord(
        source_lang=source_lang,
        target_lang=request.target_lang,
        source_text=request.text,
        translated_text=translated_text
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "source_text": request.text,
        "translated_text": translated_text,
        "source_lang": source_lang,
        "detected": detected,
        "tts_file_path": tts_url,
        "latency_seconds": round(time.time() - start_time, 2),
        "message": "Text translation successful"
    }

@app.post("/translate_audio/")
async def translate_audio(
    file: UploadFile = File(...),
    source_lang: str = "eng_Latn",
    target_lang: str = "swh_Latn",
    db: Session = Depends(get_db)
):
    load_models()
    load_whisper()
    start_time = time.time()

    file_location = f"data/audio/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Whisper auto-detects language
    stt_result = whisper_model.transcribe(file_location)
    source_text = stt_result["text"].strip()
    whisper_detected = stt_result.get("language", "en")
    
    # Map Whisper's language code to NLLB code
    WHISPER_TO_NLLB = {
        "en": "eng_Latn", "sw": "swh_Latn", "fr": "fra_Latn", "de": "deu_Latn",
        "es": "spa_Latn", "it": "ita_Latn", "pt": "por_Latn", "ar": "arb_Arab",
        "zh": "zho_Hans", "ja": "jpn_Jpan", "ko": "kor_Kore", "hi": "hin_Deva",
        "ru": "rus_Cyrl", "nl": "nld_Latn", "tr": "tur_Latn", "vi": "vie_Latn",
        "ur": "urd_Arab", "yo": "yor_Latn", "ha": "hau_Latn", "ig": "ibo_Latn",
        "zu": "zul_Latn", "xh": "xho_Latn", "af": "afr_Latn", "so": "som_Latn"
    }
    
    detected = False
    if source_lang == "auto":
        source_lang = WHISPER_TO_NLLB.get(whisper_detected, "eng_Latn")
        detected = True

    translation_tokenizer.src_lang = source_lang
    encoded_input = translation_tokenizer(source_text, return_tensors="pt")
    generated_tokens = translation_model.generate(
        **encoded_input,
        forced_bos_token_id=translation_tokenizer.convert_tokens_to_ids(target_lang),
        max_length=128
    )
    translated_text = translation_tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]

    tts_filename = f"{file.filename}_translated_{int(time.time())}.mp3"
    tts_output_path = f"data/audio/{tts_filename}"
    tts_url = None
    try:
        voice = get_voice(target_lang)
        communicate = edge_tts.Communicate(translated_text, voice)
        await communicate.save(tts_output_path)
        tts_url = f"/data/audio/{tts_filename}"
    except Exception as e:
        print(f"TTS error: {e}")

    record = TranslationRecord(
        source_lang=source_lang,
        target_lang=target_lang,
        source_text=source_text,
        translated_text=translated_text
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "source_text": source_text,
        "translated_text": translated_text,
        "source_lang": source_lang,
        "detected": detected,
        "tts_file_path": tts_url,
        "latency_seconds": round(time.time() - start_time, 2),
        "message": "Audio translation successful"
    }

@app.get("/history/")
async def get_history(db: Session = Depends(get_db), limit: int = 10):
    records = db.query(TranslationRecord).order_by(TranslationRecord.created_at.desc()).limit(limit).all()
    return [
        {"id": r.id, "source_lang": r.source_lang, "target_lang": r.target_lang,
         "source_text": r.source_text, "translated_text": r.translated_text,
         "created_at": r.created_at.isoformat() if r.created_at else None}
        for r in records
    ]

@app.delete("/history/{record_id}")
async def delete_history(record_id: int, db: Session = Depends(get_db)):
    record = db.query(TranslationRecord).filter(TranslationRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted"}