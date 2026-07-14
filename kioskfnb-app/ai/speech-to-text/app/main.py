import os
import tempfile

import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import whisper

app = FastAPI(title="Olivia STT Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model (loaded once)
model = None

def get_config() -> dict[str, str]:
    return {
        "engine": os.getenv("STT_ENGINE", "whisper"),
        "language": os.getenv("STT_LANGUAGE", "id"),
        "wake_word": os.getenv("WAKE_WORD", "hai olivia"),
    }

def load_model():
    global model
    if model is None:
        model_size = os.getenv("WHISPER_MODEL", "small")
        model = whisper.load_model(model_size)

@app.get("/health")
def health():
    config = get_config()

    return {
        "message": "Olivia STT service is running",
        "data": {
            "status": "ok",
            "engine": config["engine"],
            "language": config["language"],
        },
    }

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    config = get_config()

    # Load model if not loaded
    load_model()

    # Save uploaded audio to a temp file
    audio_bytes = await audio.read()
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        audio_path = tmp.name
        tmp.write(audio_bytes)

    print(f"[STT] file saved: {audio_path} ({len(audio_bytes)} bytes)")

    # Load dan normalize audio supaya tidak terlalu pelan
    raw_audio = whisper.load_audio(audio_path)
    max_amp = np.max(np.abs(raw_audio))
    print(f"[STT] max amplitude before normalize: {max_amp:.4f}")
    
    # Cegah Halusinasi Whisper: Jika audio murni silence/noise kecil, lewati transkripsi
    if max_amp < 0.01:
        print(f"[STT] Audio is too quiet (silence/noise). Skipping Whisper to prevent hallucination.")
        os.remove(audio_path)
        return {
            "message": "Transcription completed (Silence)",
            "data": {
                "engine": config["engine"],
                "language": config["language"],
                "wake_word": config["wake_word"],
                "text": "",
                "confidence": 0.0,
                "filename": audio.filename,
                "content_type": audio.content_type,
            },
        }

    if 0.01 <= max_amp < 0.5:
        raw_audio = raw_audio / max_amp * 0.5
        print(f"[STT] audio dinormalize")

    # Transcribe dengan Whisper
    prompt = "Pelanggan memesan menu: paket hemat, burger, ayam goreng, es teh, cola, french fries, nugget."
    result = model.transcribe(raw_audio, language="id", verbose=True, no_speech_threshold=0.8, condition_on_previous_text=False, initial_prompt=prompt)

    text = result["text"].strip()
    segments = result.get("segments", [])
    print(f"[STT] detected language: {result.get('language', '?')}")
    print(f"[STT] segments: {len(segments)}")
    print(f"[STT] text: '{text}'")

    # Clean up
    os.remove(audio_path)

    return {
        "message": "Transcription completed",
        "data": {
            "engine": config["engine"],
            "language": result.get("language", config["language"]),
            "wake_word": config["wake_word"],
            "text": text,
            "confidence": result.get("confidence", 0.9),
            "filename": audio.filename,
            "content_type": audio.content_type,
        },
    }
