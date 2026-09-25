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
# torch.set_num_threads(2)  # moved to load_models()

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

translation_tokenizer = None
translation_model = None
whisper_model = None
_models_loaded = False

OPUS_MT_MAP = {
    ("eng_Latn", "swh_Latn"): "Helsinki-NLP/opus-mt-en-sw",
    ("swh_Latn", "eng_Latn"): "Helsinki-NLP/opus-mt-sw-en",
    ("eng_Latn", "fra_Latn"): "Helsinki-NLP/opus-mt-en-fr",
    ("fra_Latn", "eng_Latn"): "Helsinki-NLP/opus-mt-fr-en",
    ("eng_Latn", "spa_Latn"): "Helsinki-NLP/opus-mt-en-es",
    ("spa_Latn", "eng_Latn"): "Helsinki-NLP/opus-mt-es-en",
    ("eng_Latn", "deu_Latn"): "Helsinki-NLP/opus-mt-en-de",
    ("deu_Latn", "eng_Latn"): "Helsinki-NLP/opus-mt-de-en",
    ("eng_Latn", "fra_Latn"): "Helsinki-NLP/opus-mt-en-fr",
    ("eng_Latn", "ita_Latn"): "Helsinki-NLP/opus-mt-en-it",
    ("ita_Latn", "eng_Latn"): "Helsinki-NLP/opus-mt-it-en",
    ("eng_Latn", "por_Latn"): "Helsinki-NLP/opus-mt-en-pt",
    ("por_Latn", "eng_Latn"): "Helsinki-NLP/opus-mt-pt-en",
    ("eng_Latn", "rus_Cyrl"): "Helsinki-NLP/opus-mt-en-ru",
    ("rus_Cyrl", "eng_Latn"): "Helsinki-NLP/opus-mt-ru-en",
    ("eng_Latn", "arb_Arab"): "Helsinki-NLP/opus-mt-en-ar",
    ("arb_Arab", "eng_Latn"): "Helsinki-NLP/opus-mt-ar-en",
    ("eng_Latn", "hin_Deva"): "Helsinki-NLP/opus-mt-en-hi",
    ("hin_Deva", "eng_Latn"): "Helsinki-NLP/opus-mt-hi-en",
    ("eng_Latn", "zho_Hans"): "Helsinki-NLP/opus-mt-en-zh",
    ("zho_Hans", "eng_Latn"): "Helsinki-NLP/opus-mt-zh-en",
}

_light_cache = {}

def _translate_light(text, source_lang, target_lang):
    from transformers import MarianMTModel, MarianTokenizer
    repo = OPUS_MT_MAP.get((source_lang, target_lang))
    if repo is None:
        return text
    if repo not in _light_cache:
        print(f"Loading {repo}...", flush=True)
        tok = MarianTokenizer.from_pretrained(repo)
        mdl = MarianMTModel.from_pretrained(repo)
        _light_cache[repo] = (tok, mdl)
        print(f"Loaded {repo}", flush=True)
    tok, mdl = _light_cache[repo]
    batch = tok([text], return_tensors="pt")
    gen = mdl.generate(**batch, max_length=256)
    return tok.batch_decode(gen, skip_special_tokens=True)[0]

def load_models():
    global translation_tokenizer, translation_model
    if os.getenv("USE_LIGHT_MODELS", "0") == "1":
        return
    if translation_model is None:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        import torch as _torch
        _torch.set_num_threads(1)
        print("Loading NLLB-200 distilled 600M...", flush=True)
        translation_tokenizer = AutoTokenizer.from_pretrained("facebook/nllb-200-distilled-600M")
        translation_model = AutoModelForSeq2SeqLM.from_pretrained(
            "facebook/nllb-200-distilled-600M",
            torch_dtype=_torch.float16,
            low_cpu_mem_usage=True,
        )
        print("NLLB-200 loaded", flush=True)

def _do_translate(text, source_lang, target_lang):
    if os.getenv("USE_LIGHT_MODELS", "0") == "1":
        return _translate_light(text, source_lang, target_lang)
    load_models()
    if source_lang == target_lang:
        return text
    translation_tokenizer.src_lang = source_lang
    enc = translation_tokenizer(text, return_tensors="pt")
    tokens = translation_model.generate(
        **enc,
        forced_bos_token_id=translation_tokenizer.convert_tokens_to_ids(target_lang),
        max_length=256,
    )
    return translation_tokenizer.batch_decode(tokens, skip_special_tokens=True)[0]

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
        print("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Preloading NLLB-200...", flush=True)
        load_models()
    except Exception as e:
        print(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ NLLB preload error: {e}", flush=True)
    try:
        print("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Preloading Whisper base...", flush=True)
        load_whisper()
    except Exception as e:
        print(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Whisper preload error: {e}", flush=True)
    _models_loaded = True
    print("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ All models preloaded. Backend ready.", flush=True)

@app.on_event("startup")
async def preload_on_startup():
    if os.getenv("SKIP_MODEL_PRELOAD", "0") == "1":
        print("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  SKIP_MODEL_PRELOAD=1 ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â models will load lazily on first request", flush=True)
    else:
        print("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Startup: kicking off background model preload", flush=True)
        threading.Thread(target=_preload_models, daemon=True).start()

    try:
        db = SessionLocal()
        seed_rbac(db)
        db.close()
        print("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ RBAC seeded", flush=True)
    except Exception as e:
        print(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ RBAC seed failed: {e}", flush=True)


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
    import numpy as np  # lazy import
    await ws.accept()
    print(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Agent connected", flush=True)
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
                    await safe_send(ws, {"type": "system", "text": "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ready."})
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
                            print(f"Translation error: {e}", flush=True)
                except Exception as e:
                    print(f"Whisper error: {e}", flush=True)
                finally:
                    if tmp_path and os.path.exists(tmp_path):
                        try:
                            os.remove(tmp_path)
                        except:
                            pass
    except WebSocketDisconnect:
        print("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Agent disconnected", flush=True)
    except Exception as e:
        print(f"WebSocket error: {e}", flush=True)

# ===== DUBBING =====

def run_ffmpeg_extract_audio(video_path: str, audio_out: str) -> bool:
    try:
        cmd = ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", audio_out]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return result.returncode == 0
    except Exception:
        return False

def run_ffmpeg_mux(video_path: str, dubbed_audio: str, output_path: str) -> bool:
    try:
        cmd = ["ffmpeg", "-y", "-i", video_path, "-i", dubbed_audio,
               "-c:v", "copy", "-c:a", "aac",
               "-map", "0:v:0", "-map", "1:a:0", "-shortest", output_path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        return result.returncode == 0
    except Exception:
        return False

@app.post("/dubbing/start")
async def dubbing_start(
    file: UploadFile = File(...),
    target_lang: str = "eng_Latn",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("dubbing")),
):
    job_id = str(uuid.uuid4())[:8]
    start_time = time.time()

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp4", ".webm", ".mov", ".mkv", ".avi"]:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    video_path = f"data/videos/{job_id}{ext}"
    with open(video_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    audio_path = f"data/audio/{job_id}_extracted.wav"
    if not run_ffmpeg_extract_audio(video_path, audio_path):
        raise HTTPException(status_code=500, detail="Failed to extract audio")

    try:
        load_whisper()
        result = whisper_model.transcribe(audio_path, fp16=False, language=None, task="transcribe")
        source_text = result.get("text", "").strip()
        detected_lang = result.get("language", "en")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)[:200]}")

    if not source_text:
        raise HTTPException(status_code=400, detail="No speech detected")

    source_nllb = WHISPER_TO_NLLB.get(detected_lang, "eng_Latn")
    if source_nllb == target_lang:
        translated_text = source_text
    else:
        try:
            translated_text = _do_translate(source_text, source_nllb, target_lang)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)[:200]}")

    dubbed_audio = f"data/audio/{job_id}_dubbed.mp3"
    try:
        voice = get_voice(target_lang)
        communicate = edge_tts.Communicate(translated_text, voice)
        await communicate.save(dubbed_audio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)[:200]}")

    output_video = f"data/dubbed/{job_id}_dubbed.mp4"
    if not run_ffmpeg_mux(video_path, dubbed_audio, output_video):
        raise HTTPException(status_code=500, detail="Failed to mux")

    latency = round(time.time() - start_time, 2)
    return {
        "job_id": job_id, "source_lang": source_nllb, "target_lang": target_lang,
        "source_text": source_text, "translated_text": translated_text,
        "output_url": f"/data/dubbed/{job_id}_dubbed.mp4",
        "original_url": f"/data/videos/{job_id}{ext}",
        "latency_seconds": latency,
        "message": f"Dubbed video ready ({latency}s)"
    }

# ===== REQUEST MODELS =====

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class UpdateProfileRequest(BaseModel):
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

class AssignRoleRequest(BaseModel):
    user_id: int
    role: str

class CreateRoleRequest(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

# ===== ROUTES =====

@app.get("/")
async def root():
    return {"Hello": "LingoLink AI Backend is running"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models_loaded": _models_loaded,
        "whisper": whisper_model is not None,
        "nllb": translation_model is not None,
    }

# ===== AUTH =====

@app.post("/auth/signup/")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    if not request.name.strip() or not request.email.strip() or not request.password:
        raise HTTPException(status_code=400, detail="All fields required")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 chars")
    email_lower = request.email.lower().strip()
    if db.query(User).filter(User.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(name=request.name.strip(), email=email_lower,
                password=hash_password(request.password), role="user")
    db.add(user); db.commit(); db.refresh(user)

    access_token = create_access_token(user.id, user.email, user.role)
    refresh_token = create_refresh_token(user.id, db)

    return {
        "success": True,
        "access_token": access_token, "refresh_token": refresh_token,
        "token_type": "bearer", "expires_in": 30 * 60,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
        "message": "Account created successfully"
    }

@app.post("/auth/login/")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    if not request.email.strip() or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    access_token = create_access_token(user.id, user.email, user.role)
    refresh_token = create_refresh_token(user.id, db)
    return {
        "success": True,
        "access_token": access_token, "refresh_token": refresh_token,
        "token_type": "bearer", "expires_in": 30 * 60,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
        "message": "Login successful"
    }

@app.post("/auth/refresh/")
async def refresh(request: RefreshRequest, db: Session = Depends(get_db)):
    rt = verify_refresh_token(request.refresh_token, db)
    if not rt:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = db.query(User).filter(User.id == rt.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    rt.revoked = True
    db.commit()
    new_access = create_access_token(user.id, user.email, user.role)
    new_refresh = create_refresh_token(user.id, db)
    return {"success": True, "access_token": new_access, "refresh_token": new_refresh,
            "token_type": "bearer", "expires_in": 30 * 60}

@app.post("/auth/logout/")
async def logout(request: LogoutRequest, db: Session = Depends(get_db)):
    revoke_refresh_token(request.refresh_token, db)
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
        if db.query(User).filter(User.email == request.new_email.lower().strip()).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = request.new_email.lower().strip()
    if request.new_password:
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 chars")
        current_user.password = hash_password(request.new_password)
        revoke_all_user_tokens(current_user.id, db)
    db.commit(); db.refresh(current_user)
    return {"success": True,
            "user": {"id": current_user.id, "name": current_user.name,
                     "email": current_user.email, "role": current_user.role},
            "message": "Profile updated"}

# ===== RBAC ENDPOINTS =====

@app.get("/rbac/me/permissions/")
async def my_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "user_id": current_user.id,
        "role": current_user.role,
        "permissions": get_user_permissions(current_user, db),
    }

@app.get("/rbac/roles/")
async def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = db.query(Role).all()
    return [
        {"id": r.id, "name": r.name, "description": r.description,
         "permissions": [p.name for p in r.permissions]}
        for r in roles
    ]

@app.get("/rbac/permissions/")
async def list_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perms = db.query(Permission).all()
    return [{"id": p.id, "name": p.name, "description": p.description} for p in perms]

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
    role = db.query(Role).filter(Role.name == request.role).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role '{request.role}' not found")
    target.role = role.name
    db.commit()
    return {"success": True, "user_id": target.id, "new_role": role.name}

@app.post("/rbac/create-role/")
async def create_role(
    request: CreateRoleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("manage_roles")),
):
    if db.query(Role).filter(Role.name == request.name).first():
        raise HTTPException(status_code=400, detail="Role already exists")
    role = Role(name=request.name, description=request.description)
    db.add(role); db.commit(); db.refresh(role)
    if request.permissions:
        for perm_name in request.permissions:
            perm = db.query(Permission).filter(Permission.name == perm_name).first()
            if perm:
                role.permissions.append(perm)
        db.commit()
    return {"success": True, "role": role.name,
            "permissions": [p.name for p in role.permissions]}

# ===== ADMIN (Basic auth, unchanged) =====

@app.post("/admin/login/")
async def admin_login(request: AdminLoginRequest):
    if request.username == ADMIN_USERNAME and request.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/admin/stats/")
async def admin_stats(admin: bool = Depends(verify_admin_basic), db: Session = Depends(get_db)):
    total_translations = db.query(TranslationRecord).count()
    total_users = db.query(User).count()
    lang_pairs = db.query(TranslationRecord.source_lang, TranslationRecord.target_lang,
        func.count(TranslationRecord.id).label('count')).group_by(
        TranslationRecord.source_lang, TranslationRecord.target_lang).order_by(
        func.count(TranslationRecord.id).desc()).limit(10).all()
    last_24h = db.query(TranslationRecord).filter(TranslationRecord.created_at >= datetime.utcnow() - timedelta(hours=24)).count()
    last_7d = db.query(TranslationRecord).filter(TranslationRecord.created_at >= datetime.utcnow() - timedelta(days=7)).count()
    daily_counts = []
    for i in range(6, -1, -1):
        ds = (datetime.utcnow() - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        de = ds + timedelta(days=1)
        c = db.query(TranslationRecord).filter(TranslationRecord.created_at >= ds, TranslationRecord.created_at < de).count()
        daily_counts.append({"date": ds.strftime("%Y-%m-%d"), "count": c})
    return {"total_translations": total_translations, "total_users": total_users,
        "last_24h": last_24h, "last_7d": last_7d, "daily_counts": daily_counts,
        "top_language_pairs": [{"source": p[0], "target": p[1], "count": p[2]} for p in lang_pairs]}

@app.get("/admin/users/")
async def admin_users(admin: bool = Depends(verify_admin_basic), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {"total": len(users), "users": [
        {"id": u.id, "name": u.name, "email": u.email, "role": u.role,
         "created_at": u.created_at.isoformat() if u.created_at else None} for u in users]}

@app.get("/admin/translations/")
async def admin_translations(admin: bool = Depends(verify_admin_basic), db: Session = Depends(get_db), limit: int = 50, offset: int = 0):
    records = db.query(TranslationRecord).order_by(TranslationRecord.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": db.query(TranslationRecord).count(), "records": [
        {"id": r.id, "source_lang": r.source_lang, "target_lang": r.target_lang,
         "source_text": r.source_text, "translated_text": r.translated_text,
         "created_at": r.created_at.isoformat() if r.created_at else None} for r in records]}

@app.delete("/admin/translations/{record_id}")
async def admin_delete_translation(record_id: int, admin: bool = Depends(verify_admin_basic), db: Session = Depends(get_db)):
    r = db.query(TranslationRecord).filter(TranslationRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(r); db.commit()
    return {"message": "Record deleted"}

@app.delete("/admin/translations/")
async def admin_clear_translations(admin: bool = Depends(verify_admin_basic), db: Session = Depends(get_db)):
    c = db.query(TranslationRecord).delete(); db.commit()
    return {"message": f"Deleted {c} records"}

# ===== TRANSLATION (requires translate permission) =====

@app.post("/translate_text/")
async def translate_text(
    request: TranslationRequest,
    db: Session = Depends(get_db),
):
    start = time.time()
    translated = _do_translate(request.text, request.source_lang, request.target_lang)
    tts_filename = f"tts_{int(time.time())}.mp3"
    tts_url = None
    try:
        voice = get_voice(request.target_lang)
        communicate = edge_tts.Communicate(translated, voice)
        await communicate.save(f"data/audio/{tts_filename}")
        tts_url = f"/data/audio/{tts_filename}"
    except Exception as e:
        print(f"TTS error: {e}", flush=True)
    rec = TranslationRecord(source_lang=request.source_lang, target_lang=request.target_lang,
                            source_text=request.text, translated_text=translated)
    db.add(rec); db.commit(); db.refresh(rec)
    return {"id": rec.id, "source_text": request.text, "translated_text": translated,
            "tts_file_path": tts_url, "latency_seconds": round(time.time() - start, 2),
            "message": "Text translation successful"}

@app.post("/translate_audio/")
async def translate_audio(
    file: UploadFile = File(...),
    source_lang: str = "eng_Latn", target_lang: str = "eng_Latn",
    db: Session = Depends(get_db),
):
    load_models(); load_whisper()
    start = time.time()
    fl = f"data/audio/{file.filename}"
    with open(fl, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    stt = whisper_model.transcribe(fl, fp16=False)
    src_text = stt["text"].strip()
    translated = _do_translate(src_text, source_lang, target_lang)
    tts_filename = f"{file.filename}_translated_{int(time.time())}.mp3"
    tts_url = None
    try:
        voice = get_voice(target_lang)
        communicate = edge_tts.Communicate(translated, voice)
        await communicate.save(f"data/audio/{tts_filename}")
        tts_url = f"/data/audio/{tts_filename}"
    except Exception as e:
        print(f"TTS error: {e}", flush=True)
    rec = TranslationRecord(source_lang=source_lang, target_lang=target_lang,
                            source_text=src_text, translated_text=translated)
    db.add(rec); db.commit(); db.refresh(rec)
    return {"id": rec.id, "source_text": src_text, "translated_text": translated,
            "tts_file_path": tts_url, "latency_seconds": round(time.time() - start, 2),
            "message": "Audio translation successful"}

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
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(r); db.commit()
    return {"message": "Record deleted"}

