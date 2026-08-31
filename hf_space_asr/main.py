from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import tempfile
from pathlib import Path
import os

app = FastAPI(title="Hakka Speaking Scenarios ASR API")

# 開放跨來源存取 (CORS)，讓 GitHub Pages 能夠直接呼叫
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# 模型載入 (預設使用 FormosaSpeech/Taiwan-Tongues-ASR-CE-v2.0 或指定模型)
MODEL_ID = os.getenv("MODEL_ID", "FormosaSpeech/Taiwan-Tongues-ASR-CE-v2.0")
print(f"Loading WhisperModel: {MODEL_ID}...")
try:
    model = WhisperModel(MODEL_ID, device="cpu", compute_type="int8")
except Exception as e:
    print(f"Failed to load {MODEL_ID}, falling back to 'base': {e}")
    model = WhisperModel("base", device="cpu", compute_type="int8")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Hakka Speaking Scenarios ASR API",
        "model": MODEL_ID,
        "endpoint": "/transcribe"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    provider_id: str = Form("taiwan_tongues_zh"),
    language: str = Form("zh")
):
    # Taiwan-Tongues 模型以 zh runtime 進行客語/華語轉譯
    runtime_language = "zh"

    suffix = Path(audio.filename or "recording.webm").suffix or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
        audio_path = f.name
        f.write(await audio.read())

    try:
        segments, info = model.transcribe(
            audio_path,
            language=runtime_language,
            task="transcribe",
            vad_filter=True
        )
        text = "".join(segment.text for segment in segments).strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        Path(audio_path).unlink(missing_ok=True)

    return {
        "text": text,
        "language": runtime_language,
        "provider_id": provider_id
    }
