"""
Voice Ledger backend — transcribes Urdu audio with a fine-tuned Whisper model.

Endpoints (matched to the frontend's useBackend / useLedger hooks):
  GET  /health       -> { status, model }
  POST /transcribe    -> { text }   (multipart/form-data, field name "file")
  POST /translate      -> { translated, source_lang, target_lang }  (JSON body: { text, target? })

Run:
  pip install -r requirements.txt
  BAZAARLINK_API_KEY=sk-bl-...   python server.py
"""

import io
import os
import re
from dotenv import load_dotenv
import numpy as np
import requests
import soundfile as sf
import torch
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, GenerationConfig

load_dotenv()

MODEL_ID = "Abdul145/whisper-medium-urdu-custom"
TARGET_SR = 16000

# --- BazaarLink (OpenAI-compatible LLM gateway) config, used only by /translate. ---
# Never hardcode the key here — set it as an environment variable before starting
# the server, e.g.:
#   export BAZAARLINK_API_KEY=sk-bl-...      (macOS/Linux)
#   $env:BAZAARLINK_API_KEY="sk-bl-..."      (Windows PowerShell)
# or put it in a local .env file (git-ignored) and load it with python-dotenv.
BAZAARLINK_API_KEY = os.getenv("BAZAARLINK_API_KEY")
BAZAARLINK_MODEL = os.getenv("BAZAARLINK_MODEL")
BAZAARLINK_URL = "https://bazaarlink.ai/api/v1/chat/completions"

# Matches Arabic-script text (covers Urdu, since Urdu is written in a Perso-Arabic script).
URDU_SCRIPT_RE = re.compile(r"[\u0600-\u06FF]")


def detect_lang(text: str) -> str:
    """Cheap heuristic: any Arabic-script characters -> Urdu, else assume English."""
    return "ur" if URDU_SCRIPT_RE.search(text) else "en"

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

app = FastAPI(title="Voice Ledger Backend")

# The frontend runs on a different origin (e.g. localhost:5173) than the
# backend (localhost:8000), so CORS must be open for local dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"Loading {MODEL_ID} on {device} ({dtype}) ...")
processor = AutoProcessor.from_pretrained(MODEL_ID)
model = AutoModelForSpeechSeq2Seq.from_pretrained(MODEL_ID, torch_dtype=dtype)
model.to(device)
model.eval()

print("Model loaded — ready.")

# This checkpoint's bundled generation_config.json predates the newer
# `language=`/`task=` API in `generate()` — it's missing the `lang_to_id`
# mapping that API needs, which raises a "generation config is outdated"
# error. Swap in a current generation config from the base model this was
# fine-tuned from; the weights are untouched, only the generation settings
# (language list, decoder-start behavior, etc.) are refreshed.
BASE_MODEL_ID = "openai/whisper-medium"
model.generation_config = GenerationConfig.from_pretrained(BASE_MODEL_ID)
model.generation_config.forced_decoder_ids = None
if hasattr(model.config, "forced_decoder_ids"):
    model.config.forced_decoder_ids = None


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_ID}


class TranslateRequest(BaseModel):
    text: str
    target: str | None = None  # "en" or "ur"; auto-detected from `text` if omitted


@app.post("/translate")
def translate(payload: TranslateRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")

    if not BAZAARLINK_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="BAZAARLINK_API_KEY is not set. Export it as an environment "
                   "variable before starting the server.",
        )

    source_lang = detect_lang(text)
    target_lang = payload.target or ("en" if source_lang == "ur" else "ur")
    target_name = "English" if target_lang == "en" else "Urdu"

    try:
        resp = requests.post(
            BAZAARLINK_URL,
            headers={
                "Authorization": f"Bearer {BAZAARLINK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": BAZAARLINK_MODEL,
                "temperature": 0,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            f"You are a translation engine. Translate the user's message into "
                            f"{target_name}. Reply with ONLY the translation — no quotes, no "
                            f"notes, no explanations."
                        ),
                    },
                    {"role": "user", "content": text},
                ],
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach BazaarLink: {exc}") from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"BazaarLink error ({resp.status_code}): {resp.text[:300]}",
        )

    data = resp.json()
    try:
        translated = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError) as exc:
        raise HTTPException(status_code=502, detail="Unexpected BazaarLink response shape") from exc

    return {"translated": translated, "source_lang": source_lang, "target_lang": target_lang}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        audio, sr = sf.read(io.BytesIO(raw), dtype="float32")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read audio: {exc}") from exc

    # Collapse to mono if needed.
    if audio.ndim > 1:
        audio = audio.mean(axis=1)

    # The frontend already resamples to 16kHz mono before upload, but
    # resample here too as a safety net for direct API calls.
    if sr != TARGET_SR:
        try:
            import librosa
            audio = librosa.resample(audio, orig_sr=sr, target_sr=TARGET_SR)
        except ImportError:
            raise HTTPException(
                status_code=400,
                detail=f"Audio sample rate is {sr}Hz, expected {TARGET_SR}Hz, and librosa "
                       "isn't installed to resample it.",
            )

    inputs = processor(audio, sampling_rate=TARGET_SR, return_tensors="pt")
    input_features = inputs.input_features.to(device=device, dtype=dtype)

    with torch.no_grad():
        # Newer `transformers` versions reject `forced_decoder_ids` as a
        # generate() kwarg — pass language/task directly instead, which
        # forces Urdu transcription (not translation) under the hood.
        predicted_ids = model.generate(
            input_features,
            language="urdu",
            task="transcribe",
        )

    text = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()

    return {"text": text}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)