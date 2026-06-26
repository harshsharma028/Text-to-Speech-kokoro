import os
import time
import sys
import logging
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sherpa_onnx
import soundfile as sf
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

load_dotenv()

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "7860"))
NUM_THREADS = int(os.getenv("NUM_THREADS", "4"))

# Automatic model download on first run
MODEL_DIR = "kokoro-en-v0_19"
if not os.path.exists(MODEL_DIR):
    logger.info("Model not found. Launching download script...")
    try:
        import download_model
        download_model.main()
    except Exception as e:
        logger.error(f"Failed to automatically download the model: {e}")
        logger.info("Please run 'python download_model.py' manually first.")
        sys.exit(1)

# Initialize TTS engine
config = sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=f"{MODEL_DIR}/model.onnx",
            voices=f"{MODEL_DIR}/voices.bin",
            tokens=f"{MODEL_DIR}/tokens.txt",
            data_dir=f"{MODEL_DIR}/espeak-ng-data",
        ),
        provider="cpu",
        num_threads=NUM_THREADS,  # Configured via .env
    )
)

logger.info("Loading Kokoro TTS engine...")
try:
    tts = sherpa_onnx.OfflineTts(config)
    logger.info("TTS engine loaded successfully!")
except Exception as e:
    logger.error(f"Error loading TTS engine: {e}")
    sys.exit(1)

# Speaker mapping dictionary
SPEAKERS = {
    "af": "American Female (af)",
    "af_bella": "American Female - Bella (af_bella)",
    "af_nicole": "American Female - Nicole (af_nicole)",
    "af_sarah": "American Female - Sarah (af_sarah)",
    "af_sky": "American Female - Sky (af_sky)",
    "af_userpark": "American Female - Userpark (af_userpark)",
    "bf_alice": "British Female - Alice (bf_alice)",
    "bf_emma": "British Female - Emma (bf_emma)",
    "bf_isabella": "British Female - Isabella (bf_isabella)",
    "bf_lily": "British Female - Lily (bf_lily)",
    "bf_medium": "British Female - Medium (bf_medium)"
}

SPEAKER_IDS = {
    "af": 0,
    "af_bella": 1,
    "af_nicole": 2,
    "af_sarah": 3,
    "af_sky": 4,
    "af_userpark": 5,
    "bf_alice": 6,
    "bf_emma": 7,
    "bf_isabella": 8,
    "bf_lily": 9,
    "bf_medium": 10
}

import glob

app = FastAPI(title="Local Text-to-Speech Engine")

# Create static directory if not exists
os.makedirs("static", exist_ok=True)

# Clean up old temporary outputs on startup to free space
for f in glob.glob("static/output_*.wav"):
    try:
        os.remove(f)
    except OSError:
        pass

class TTSRequest(BaseModel):
    text: str
    speaker: str
    speed: float

@app.get("/api/speakers")
def get_speakers():
    return [{"id": k, "name": v} for k, v in SPEAKERS.items()]

@app.post("/api/tts")
def generate_tts(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if req.speaker not in SPEAKER_IDS:
        raise HTTPException(status_code=400, detail="Invalid speaker selection")
        
    sid = SPEAKER_IDS[req.speaker]
    
    try:
        start_time = time.time()
        # Generate speech
        logger.info(f"Generating TTS for text length: {len(req.text)} with speaker: {req.speaker}")
        audio = tts.generate(req.text, sid=sid, speed=req.speed)
        generation_time = time.time() - start_time
        
        # Calculate duration
        duration = len(audio.samples) / audio.sample_rate
        rtf = generation_time / duration if duration > 0 else 0
        
        # Save output with unique name to prevent cache overlaps and support concurrent history playback
        filename = f"output_{int(time.time() * 1000)}.wav"
        output_path = os.path.join("static", filename)
        sf.write(output_path, audio.samples, audio.sample_rate)
        logger.info(f"Generated {filename} in {generation_time:.3f}s (RTF: {rtf:.3f})")
        
        return {
            "url": f"/static/{filename}",
            "time_taken": round(generation_time, 3),
            "duration": round(duration, 2),
            "rtf": round(rtf, 3),
            "char_count": len(req.text)
        }
    except Exception as e:
        logger.error(f"Error during TTS generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Fallback route to serve index.html directly
@app.get("/")
def read_root():
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("Static web files are being created...")

# Mount the static directory to serve HTML, CSS, JS and generated audio
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
