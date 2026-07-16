import datetime
import io
import sys
import os
import uuid
from pathlib import Path
import json
import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Request
from transformers import pipeline
from dotenv import load_dotenv
from openai import OpenAI
from typing import List, Optional, Tuple
from contextlib import asynccontextmanager
import asyncio



# Change this env var if you want to swap models without editing code:
#   ASR_MODEL_ID="openai/whisper-medium" python server.py
MODEL_ID = os.environ.get("ASR_MODEL_ID", "Abdul145/whisper-medium-urdu-custom")

DEFAULT_API_KEY_ENV = "BAZARLINK_API_KEY"


def load_environment() -> None:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(env_path)


def get_api_key(env_name: str) -> Optional[str]:
    load_environment()
    return os.getenv(env_name)


def create_client(api_key: str) -> OpenAI:
    return OpenAI(api_key=api_key, base_url="https://bazaarlink.ai/api/v1")


def classify_message(client: OpenAI, message: str) -> dict:

    response = client.chat.completions.create(
        model="openai/gpt-4.1",
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": """
You are an Urdu assistant.
Correct the urdu sentence if wrong.
Extract NOTES and TASKS.

Return ONLY JSON.

Example:

{
    "corrected": "..."
    "notes":[
        "...",
        "..."
    ],
    "tasks":[
        "...",
        "..."
    ]
}
"""
            },
            {
                "role": "user",
                "content": message
            }
        ]
    )

    return json.loads(response.choices[0].message.content)


device = 0 if torch.cuda.is_available() else -1
print(f"Loading model '{MODEL_ID}' on {'GPU' if device == 0 else 'CPU'} ...")

api_key = get_api_key("BAZARLINK_API_KEY")
if not api_key:
    sys.exit(1)


def build_asr_pipeline(model_id: str, device_index: int):
    """
    Builds the ASR pipeline and makes sure the generation config actually
    supports timestamp-based decoding. This custom checkpoint's
    generation_config.json ships without the timestamp token ids, which is
    what causes:

        "You are trying to return timestamps, but the generation config is
        not properly set..."

    This happens because any audio longer than Whisper's 30s window forces
    the pipeline into its chunked long-form decoding path, which requires
    return_timestamps internally to stitch chunks back together.
    """
    asr = pipeline(
        "automatic-speech-recognition",
        model=model_id,
        device=device_index,
        chunk_length_s=30,   # enables long-form/chunked decoding explicitly
        stride_length_s=5,   # overlap between chunks so words aren't cut off
    )

    # Patch the generation config so timestamp decoding actually works.
    gen_config = asr.model.generation_config
    tokenizer = asr.tokenizer

    if getattr(gen_config, "no_timestamps_token_id", None) is None:
        try:
            gen_config.no_timestamps_token_id = tokenizer.convert_tokens_to_ids(
                "<|notimestamps|>"
            )
        except Exception:
            pass

    # Make sure forced_decoder_ids isn't left over from an incompatible
    # config -- it conflicts with passing language/task via generate_kwargs.
    gen_config.forced_decoder_ids = None

    # This checkpoint is a fine-tune trained specifically for Urdu, so we
    # do NOT force `language="urdu"` at generate() time. Passing `language`
    # requires the generation_config to carry multilingual mappings
    # (lang_to_id / task_to_id / is_multilingual=True); many fine-tuned
    # checkpoints ship without these, which triggers:
    #   "The generation config is outdated and is thus not compatible
    #    with the `language` argument to `generate`."
    #
    # Fallback: if you DO need to force the language (e.g. this checkpoint
    # is actually multilingual), repair the config by pulling the
    # multilingual mappings from the matching base Whisper checkpoint:
    #
    #   from transformers import GenerationConfig
    #   base_gen_config = GenerationConfig.from_pretrained("openai/whisper-medium")
    #   gen_config.lang_to_id = base_gen_config.lang_to_id
    #   gen_config.task_to_id = base_gen_config.task_to_id
    #   gen_config.is_multilingual = True
    #
    # then it's safe to pass generate_kwargs={"language": "urdu", "task": "transcribe"}
    # again in the /transcribe endpoint below.

    return asr


@asynccontextmanager
async def lifespan(app):

    app.state.asr = build_asr_pipeline(
        MODEL_ID,
        0 if torch.cuda.is_available() else -1,
    )

    app.state.client = create_client(api_key)

    print("Model loaded.")

    yield

    del app.state.asr
    del app.state.client

    if torch.cuda.is_available():
        torch.cuda.empty_cache()


print("Model loaded. Server ready.")

app = FastAPI(title="Urdu ASR Server", lifespan=lifespan)

# Wide-open CORS for local development. Tighten this if you expose the
# server beyond your own machine.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Where uploaded/recorded audio gets saved before transcription.
RECORDINGS_DIR = Path(os.environ.get("RECORDINGS_DIR", "recordings")).resolve()
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/recordings", StaticFiles(directory=str(RECORDINGS_DIR)), name="recordings")
print(f"Storing audio in: {RECORDINGS_DIR}")


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_ID, "device": "cuda" if device == 0 else "cpu"}


@app.post("/transcribe")
async def transcribe(request: Request, file: UploadFile = File(...)):
    """
    Saves the uploaded audio to RECORDINGS_DIR first, then transcribes
    from that stored file. Expects mono 16kHz WAV (the frontend encodes
    audio to this format client-side before uploading).
    """
    try:
        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=400, detail="Empty audio upload.")

        # --- store first ---
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        unique = uuid.uuid4().hex[:8]
        original_ext = Path(file.filename or "").suffix or ".wav"
        stored_name = f"{timestamp}_{unique}{original_ext}"
        stored_path = RECORDINGS_DIR / stored_name
        stored_path.write_bytes(raw)

        # --- then transcribe from the stored file ---
        audio, sr = sf.read(str(stored_path), dtype="float32")

        if audio.ndim > 1:
            audio = audio.mean(axis=1)

        if sr != 16000:
            import librosa
            audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)

        print("STORED PATH = ", stored_path)
        rpath = os.path.join(RECORDINGS_DIR, stored_name)
        print("RPATH = ", rpath)

        result = await asyncio.to_thread(
            request.app.state.asr,
            rpath,
            return_timestamps=True,
        )

        classification = await asyncio.to_thread(
            classify_message,
            request.app.state.client,
            result["text"]
        )

        return {
            "text": classification.get("corrected", []),
            "filename": stored_name,
            "url": f"/recordings/{stored_name}",
            "classified_by": "ai",
            "notes": classification.get("notes", []),
            "tasks": classification.get("tasks", [])
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recordings-list")
def list_recordings():
    """Returns stored recordings, most recent first."""
    files = sorted(RECORDINGS_DIR.glob("*"), key=lambda p: p.stat().st_mtime, reverse=True)
    return {
        "recordings": [
            {"filename": f.name, "url": f"/recordings/{f.name}", "size_bytes": f.stat().st_size}
            for f in files if f.is_file()
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3400)