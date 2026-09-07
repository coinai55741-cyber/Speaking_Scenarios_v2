from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import tempfile
from pathlib import Path
import os
import time
import subprocess
import requests
import re
import json
import asyncio
import websockets
from urllib.parse import urlencode

APP_DIR = Path(__file__).resolve().parent
ENV_PATH = APP_DIR / ".env"


def load_local_env():
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_local_env()

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

HAKKA_FILE_ASR_BASE_URL = os.getenv("HAKKA_FILE_ASR_BASE_URL", "https://fileasr.bronci.com.tw").rstrip("/")
HAKKA_API_USERNAME = os.getenv("HAKKA_API_USERNAME", "")
HAKKA_API_PASSWORD = os.getenv("HAKKA_API_PASSWORD", "")
HAKKA_FILE_ASR_TIMEOUT_SECONDS = int(os.getenv("HAKKA_FILE_ASR_TIMEOUT_SECONDS", "90"))
HAKKA_FILE_ASR_POLL_SECONDS = float(os.getenv("HAKKA_FILE_ASR_POLL_SECONDS", "2"))
HAKKA_REALTIME_ASR_BASE_URL = os.getenv("HAKKA_REALTIME_ASR_BASE_URL", "").rstrip("/")
HAKKA_REALTIME_ASR_TIMEOUT_SECONDS = int(os.getenv("HAKKA_REALTIME_ASR_TIMEOUT_SECONDS", "35"))
HAKKA_REALTIME_ASR_TYPE = os.getenv("HAKKA_REALTIME_ASR_TYPE", "file")
HAKKA_REALTIME_ASR_RATE = os.getenv("HAKKA_REALTIME_ASR_RATE", "16000")
HAKKA_REALTIME_ASR_MODEL_NAME = os.getenv("HAKKA_REALTIME_ASR_MODEL_NAME", "")


def payload_data(payload):
    if not isinstance(payload, dict):
        return {}
    data = payload.get("data")
    if isinstance(data, list):
        return data[0] if data and isinstance(data[0], dict) else {}
    return data if isinstance(data, dict) else {}


def hakka_file_asr_enabled():
    return bool(HAKKA_FILE_ASR_BASE_URL and HAKKA_API_USERNAME and HAKKA_API_PASSWORD)

def hakka_realtime_asr_enabled():
    return bool(HAKKA_REALTIME_ASR_BASE_URL and HAKKA_API_USERNAME and HAKKA_API_PASSWORD)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Hakka Speaking Scenarios ASR API",
        "model": MODEL_ID,
        "endpoint": "/api/speech/recognize",
        "providers": {
            "taiwan_tongues": True,
            "hakka_file_asr": hakka_file_asr_enabled(),
            "hakka_realtime_asr": hakka_realtime_asr_enabled()
        }
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "providers": {
            "taiwan_tongues": True,
            "hakka_file_asr": hakka_file_asr_enabled(),
            "hakka_realtime_asr": hakka_realtime_asr_enabled()
        }
    }


async def save_upload_to_temp(audio: UploadFile):
    suffix = Path(audio.filename or "recording.webm").suffix or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
        audio_path = f.name
        f.write(await audio.read())
    return audio_path


async def run_transcription(audio: UploadFile, provider_id: str, language: str, dialect: str = "", recognizer: str = ""):
    # Taiwan-Tongues 模型以 zh runtime 進行客語/華語轉譯
    runtime_language = "zh"
    audio_path = await save_upload_to_temp(audio)

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

    return normalize_speech_response(
        text=text,
        provider="taiwan_tongues",
        provider_id=provider_id,
        dialect=dialect,
        recognizer=recognizer,
        raw={"language": runtime_language, "model": MODEL_ID}
    )


def normalize_speech_response(text="", provider="", provider_id="", dialect="", recognizer="", scene_id="", tokens=None, raw=None):
    return {
        "ok": bool(text or tokens),
        "provider": provider,
        "provider_id": provider_id,
        "dialect": dialect,
        "recognizer": recognizer,
        "scene_id": scene_id,
        "text": text or "",
        "tokens": tokens or [],
        "raw": raw or {}
    }


def hakka_login(base_url):
    response = requests.post(
        f"{base_url}/api/v1/login",
        json={
            "username": HAKKA_API_USERNAME,
            "password": HAKKA_API_PASSWORD,
            "rememberMe": 0
        },
        timeout=20
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("error") or (payload.get("code") and not payload.get("token")):
        message = payload.get("error") or payload.get("message") or payload.get("msg") or payload.get("code")
        raise HTTPException(status_code=401, detail=f"客委會 API 登入失敗：{message}")
    token = payload.get("token") or payload_data(payload).get("token")
    if not token:
        raise HTTPException(status_code=502, detail="客委會 API 登入成功但沒有取得 token。")
    return token, payload


def unwrap_task_payload(payload):
    data = payload.get("data") if isinstance(payload, dict) else None
    if isinstance(data, list) and data:
        return data[0]
    if isinstance(data, dict):
        return data
    return payload


def find_first_text(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return "".join(find_first_text(item) for item in value).strip()
    if isinstance(value, dict):
        preferred_keys = ["text", "transcript", "sentence", "content", "subtitle", "result", "description"]
        for key in preferred_keys:
            found = find_first_text(value.get(key))
            if found:
                return found
        return "".join(find_first_text(item) for item in value.values()).strip()
    return ""


def task_is_finished(payload):
    task = unwrap_task_payload(payload)
    status = str(task.get("taskStatus") or task.get("status") or task.get("state") or "").lower()
    if any(word in status for word in ["finish", "finished", "complete", "completed", "success", "done", "ended"]):
        return True
    if task.get("resultSubtitleFileExist") or task.get("result") or task.get("text") or task.get("transcript"):
        return True
    return False


def task_failed(payload):
    task = unwrap_task_payload(payload)
    status = str(task.get("taskStatus") or task.get("status") or task.get("state") or "").lower()
    return any(word in status for word in ["fail", "failed", "error", "cancel"])





def subtitle_to_text(file_text: str):
    lines = []
    for raw_line in file_text.splitlines():
        line = raw_line.strip().lstrip("\ufeff")
        if not line:
            continue
        if line.isdigit() or line.startswith("WEBVTT"):
            continue
        if "-->" in line or "--＞" in line:
            continue
        if re.fullmatch(r"[\d:：,\.\-\>\s]+", line):
            continue
        if not re.search(r"[\u3400-\u9fff\U00020000-\U0002a6df\U0002a700-\U0002b73f\U0002b740-\U0002b81f\U0002b820-\U0002ceaf\w]", line):
            continue
        lines.append(line)
    return "".join(lines).strip()

def download_hakka_subtitle(task_id, headers, token):
    path_response = requests.get(
        f"{HAKKA_FILE_ASR_BASE_URL}/api/v1/subtitle/tasks/{task_id}/file-path",
        headers=headers,
        params={"target": "resultSubtitleFilePath"},
        timeout=30
    )
    path_response.raise_for_status()
    path_payload = path_response.json()
    path_data = payload_data(path_payload)
    url = path_payload.get("url") or path_data.get("url")
    ticket = path_payload.get("ticket") or path_data.get("ticket")
    if not url:
        return "", {"file_path": path_payload}
    separator = "&" if "?" in url else "?"
    if ticket:
        download_url = f"{url}{separator}{urlencode({'ticket': ticket})}"
    else:
        download_url = f"{url}{separator}{urlencode({'token': token})}"
    file_response = requests.get(download_url, timeout=30)
    file_response.raise_for_status()
    file_response.encoding = "utf-8"
    file_text = file_response.text.strip()
    subtitle_text = subtitle_to_text(file_text)
    return subtitle_text, {"file_path": path_payload, "subtitle": file_text}

def convert_audio_for_hakka_api(source_path: str):
    target_path = str(Path(source_path).with_suffix(".hakka.wav"))
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", source_path, "-ac", "1", "-ar", "16000", "-sample_fmt", "s16", target_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return target_path, "recording.wav", "audio/wav"
    except Exception as e:
        raise HTTPException(status_code=415, detail=f"音檔轉成 WAV 失敗，請確認本機可執行 ffmpeg：{e}")

def run_hakka_file_asr(audio_path: str, filename: str, dialect: str, recognizer: str, scene_id: str):
    if not hakka_file_asr_enabled():
        raise HTTPException(
            status_code=503,
            detail="客委會檔案辨識尚未設定，請在 hf_space_asr/.env 填入 HAKKA_API_USERNAME 與 HAKKA_API_PASSWORD。"
        )

    try:
        token, login_payload = hakka_login(HAKKA_FILE_ASR_BASE_URL)
        headers = {"Authorization": f"Bearer {token}"}
        upload_path, upload_name, upload_type = convert_audio_for_hakka_api(audio_path)
        try:
            with open(upload_path, "rb") as audio_file:
                files = {"audio": (upload_name, audio_file, upload_type)}
                data = {
                    "sourceType": "2",
                    "title": f"speaking-scenarios-{scene_id or 'speech'}-{int(time.time())}",
                    "description": f"dialect={dialect}; recognizer={recognizer}",
                    "audioChannel": "0"
                }
                create_response = requests.post(
                    f"{HAKKA_FILE_ASR_BASE_URL}/api/v1/subtitle/tasks",
                    headers=headers,
                    files=files,
                    data=data,
                    timeout=60
                )
        finally:
            Path(upload_path).unlink(missing_ok=True)
        create_response.raise_for_status()
        create_payload = create_response.json()
        create_data = payload_data(create_payload)
        task_id = create_payload.get("id") or create_payload.get("taskId") or create_data.get("id") or create_data.get("taskId")
        if not task_id:
            text = find_first_text(create_payload)
            return normalize_speech_response(text, "hakka_file_asr", "hakka_api_hak", dialect, recognizer, scene_id, raw={"create": create_payload})

        deadline = time.time() + HAKKA_FILE_ASR_TIMEOUT_SECONDS
        last_payload = create_payload
        while time.time() < deadline:
            time.sleep(HAKKA_FILE_ASR_POLL_SECONDS)
            poll_response = requests.get(
                f"{HAKKA_FILE_ASR_BASE_URL}/api/v1/subtitle/tasks/{task_id}",
                headers=headers,
                timeout=30
            )
            poll_response.raise_for_status()
            last_payload = poll_response.json()
            if task_failed(last_payload):
                raise RuntimeError("客委會檔案辨識回傳失敗狀態。")
            if task_is_finished(last_payload):
                break

        task_payload = unwrap_task_payload(last_payload)
        text = find_first_text(task_payload)
        file_raw = {}
        if task_payload.get("resultSubtitleFileExist"):
            downloaded_text, file_raw = download_hakka_subtitle(task_id, headers, token)
            text = downloaded_text or text
        elif task_is_finished(last_payload) and not text:
            text = ""
            file_raw = {"notice": "客委會任務已完成，但尚未取得字幕文字。", "result": last_payload}
        return normalize_speech_response(
            text=text,
            provider="hakka_file_asr",
            provider_id="hakka_api_hak",
            dialect=dialect,
            recognizer=recognizer,
            scene_id=scene_id,
            raw={"task_id": task_id, "create": create_payload, "result": last_payload, **file_raw}
        )
    except HTTPException:
        raise
    except requests.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 502
        body = e.response.text[:500] if e.response is not None else ""
        raise HTTPException(status_code=status_code, detail=f"客委會檔案辨識 API 回應失敗：{status_code} {body}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))



async def run_hakka_realtime_asr(audio_path: str, filename: str, dialect: str, recognizer: str, scene_id: str):
    if not hakka_realtime_asr_enabled():
        raise HTTPException(
            status_code=503,
            detail="客委會即時辨識尚未設定，請在 hf_space_asr/.env 填入 HAKKA_API_USERNAME 與 HAKKA_API_PASSWORD。"
        )

    upload_path = ""
    try:
        token, login_payload = hakka_login(HAKKA_REALTIME_ASR_BASE_URL)
        headers = {"Authorization": f"Bearer {token}"}
        access_response = requests.get(
            f"{HAKKA_REALTIME_ASR_BASE_URL}/api/v1/streaming/transcript/access-info",
            headers=headers,
            timeout=20
        )
        access_response.raise_for_status()
        access_payload = access_response.json()
        access_data = payload_data(access_payload)
        ws_url = access_payload.get("url") or access_data.get("url")
        ticket = access_payload.get("ticket") or access_data.get("ticket")
        if not ws_url or not ticket:
            raise HTTPException(status_code=502, detail="客委會即時辨識沒有回傳 WebSocket URL 或 ticket。")

        upload_path, upload_name, upload_type = convert_audio_for_hakka_api(audio_path)
        query = {
            "ticket": ticket,
            "type": HAKKA_REALTIME_ASR_TYPE,
            "title": f"speaking-scenarios-{scene_id or 'speech'}-{int(time.time())}"
        }
        if HAKKA_REALTIME_ASR_TYPE == "raw":
            query["rate"] = HAKKA_REALTIME_ASR_RATE
            query["channel"] = "1"
        if HAKKA_REALTIME_ASR_MODEL_NAME:
            query["modelName"] = HAKKA_REALTIME_ASR_MODEL_NAME
        separator = "&" if "?" in ws_url else "?"
        websocket_url = f"{ws_url}{separator}{urlencode(query)}"

        messages = []
        segments = {}
        async with websockets.connect(websocket_url, open_timeout=10, close_timeout=5, max_size=8 * 1024 * 1024) as websocket:
            deadline = time.time() + HAKKA_REALTIME_ASR_TIMEOUT_SECONDS
            ready = False
            while time.time() < deadline:
                message = await asyncio.wait_for(websocket.recv(), timeout=max(1, deadline - time.time()))
                payload = json.loads(message) if isinstance(message, str) else {"binary": True}
                messages.append(payload)
                code = str(payload.get("code", ""))
                if code == "180":
                    ready = True
                    break
                if code.startswith(("4", "5")):
                    raise RuntimeError(payload.get("message") or payload.get("msg") or f"客委會即時辨識連線失敗：{code}")
            if not ready:
                raise TimeoutError("客委會即時辨識等待服務準備逾時。")

            with open(upload_path, "rb") as audio_file:
                while True:
                    chunk = audio_file.read(256 * 1024)
                    if not chunk:
                        break
                    await websocket.send(chunk)
            await websocket.send("EOS")

            while time.time() < deadline:
                message = await asyncio.wait_for(websocket.recv(), timeout=max(1, deadline - time.time()))
                payload = json.loads(message) if isinstance(message, str) else {"binary": True}
                messages.append(payload)
                code = str(payload.get("code", ""))
                if code == "200":
                    for item in payload.get("result") or []:
                        transcript = str(item.get("transcript") or "").strip()
                        if transcript:
                            segments[str(item.get("segment", len(segments)))] = transcript
                    if any((item.get("end") == 1 or item.get("end") == "1") for item in payload.get("result") or []):
                        break
                elif code in {"202", "204"}:
                    break
                elif code.startswith(("4", "5")):
                    raise RuntimeError(payload.get("message") or payload.get("msg") or f"客委會即時辨識回傳失敗：{code}")

        text = clean_subtitle_like_text("".join(segments[key] for key in sorted(segments, key=lambda value: int(value) if value.isdigit() else value)))
        return normalize_speech_response(
            text=text,
            provider="hakka_realtime_asr",
            provider_id="hakka_api_hak",
            dialect=dialect,
            recognizer=recognizer,
            scene_id=scene_id,
            raw={"access": access_payload, "messages": messages[-20:]}
        )
    except HTTPException:
        raise
    except requests.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 502
        body = e.response.text[:500] if e.response is not None else ""
        raise HTTPException(status_code=status_code, detail=f"客委會即時辨識 API 回應失敗：{status_code} {body}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        if upload_path:
            Path(upload_path).unlink(missing_ok=True)


def clean_subtitle_like_text(text: str):
    return subtitle_to_text(text) or text.strip()

@app.post("/api/speech/recognize")
async def speech_recognize(
    audio: UploadFile = File(...),
    dialect: str = Form("mandarin"),
    recognizer: str = Form("mandarin"),
    provider_id: str = Form("taiwan_tongues_zh"),
    provider: str = Form("taiwan_tongues"),
    language: str = Form("zh"),
    scene_id: str = Form(""),
    recognition_mode: str = Form("file")
):
    use_hakka_api = provider == "hakka_api" or provider_id == "hakka_api_hak" or language == "hak" or recognizer.startswith("hakka")
    if use_hakka_api:
        audio_path = await save_upload_to_temp(audio)
        try:
            if recognition_mode == "realtime":
                return await run_hakka_realtime_asr(audio_path, audio.filename or "recording.webm", dialect, recognizer, scene_id)
            return run_hakka_file_asr(audio_path, audio.filename or "recording.webm", dialect, recognizer, scene_id)
        finally:
            Path(audio_path).unlink(missing_ok=True)

    return await run_transcription(audio, provider_id, language, dialect, recognizer)


@app.post("/recognize")
async def recognize(
    audio: UploadFile = File(...),
    dialect: str = Form("mandarin"),
    recognizer: str = Form("mandarin"),
    provider_id: str = Form("taiwan_tongues_zh"),
    language: str = Form("zh")
):
    return await run_transcription(audio, provider_id, language, dialect, recognizer)


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    provider_id: str = Form("taiwan_tongues_zh"),
    language: str = Form("zh")
):
    return await run_transcription(audio, provider_id, language)
















