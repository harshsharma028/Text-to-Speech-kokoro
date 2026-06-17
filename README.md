# 🎙️ Local Human-Like Text-to-Speech (TTS) Engine

This project is a lightweight, high-performance, and **100% offline** local Text-to-Speech application. It is specifically optimized to run fast on consumer-grade CPUs (such as an Intel Core i3 with 12GB of RAM and integrated graphics) without requiring a dedicated Nvidia/CUDA graphics card.

It is powered by the state-of-the-art **Kokoro-82M** model, executed via **ONNX Runtime** and wrapped in **Sherpa-ONNX** with a custom-built, premium FastAPI web interface.

---

## 🌟 Key Features

- **Human-Like Naturalness:** High-fidelity, expressive phrasing, natural rhythm, and clear prosody.
- **CPU Optimized (Integrated Graphics Friendly):** The 82M parameter model runs significantly faster than real-time (usually 2x-4x speed) on standard consumer CPUs.
- **Offline & Private:** All processing happens locally on your computer. No internet connection, external APIs, or API keys are required.
- **Custom-Built Web UI:** A premium, dark-themed glassmorphism interface served directly from the local FastAPI backend (no heavy external CDNs or React scripts that fail to load).
- **Voice Preset Styles:** Instantly switch between 6 specialized preset roles:
  - 📰 **Classic News Anchor** (Fast, formal British female)
  - 📖 **Late Night Narrator** (Warm, slow American female narrator)
  - 🔥 **Energetic Video Host** (Expressive, upbeat American female)
  - 🎓 **Calm E-Learning Guide** (Steady, clear American female instructor)
  - 🎙️ **Quick-Fire Chat Host** (Casual, rapid British female podcaster)
  - 🧘 **Soft Meditation Teacher** (Very soft, soothing, and slow ASMR/meditation guide)
- **Session Generation History:** Compare different generations side-by-side! A history log cards panel with independent audio players, metadata tags, and performance metrics is displayed below the settings. The history is kept in JavaScript memory and **wipes completely when the browser tab is closed** to protect your privacy.

---

## 📁 Repository structure

```text
├── static/
│   ├── index.html     # Custom, responsive glassmorphic frontend UI
│   ├── style.css      # Custom dark-mode styles and micro-animations
│   └── main.js        # UI logic, presets synchronization, and history stack
├── .env.example       # Template for local environment configurations
├── .env               # Active local environment configurations (git-ignored)
├── .gitignore         # Defines files to exclude from git uploads
├── app.py             # FastAPI backend server and model inference engine
├── download_model.py  # Automation script to download/extract pre-trained models
└── requirements.txt   # Python dependency list
```

---

## 🛠️ Step-by-Step Installation Guide

Follow these steps to set up and run the project locally on your machine:

### Step 1: Clone or Set Up Project Files
Create a local folder or clone this repository to your PC:
```bash
git clone <your-repository-url>
cd local-tts-project
```

### Step 2: Set Up Environment Variables
We use a `.env` file to configure local port bindings and thread limits without modifying the source code.
1. Copy the template `.env.example` file and rename it to `.env`:
   ```bash
   copy .env.example .env
   ```
2. Open `.env` in your text editor. It contains:
   ```ini
   # Local Server Settings
   HOST=127.0.0.1
   PORT=7860

   # Model Performance Settings
   # Number of CPU threads to allocate for TTS generation
   NUM_THREADS=4
   ```
   *(For an i3 CPU, allocating 4 threads is the sweet spot for optimal speed. You can lower this to 2 if you want to save resources for other tasks).*

### Step 3: Install Python Dependencies
Ensure you have Python 3.10+ installed. Install the required libraries via `pip`:
```bash
pip install -r requirements.txt
```

### Step 4: Run the Application
Start the FastAPI server:
```bash
python app.py
```
*💡 **First Run Automation:** On your very first run, the script will notice that the model directory is missing. It will automatically download the 90MB pre-trained Kokoro ONNX model and unpack it for you. In subsequent runs, the server will start up instantly.*

### Step 5: Access the Web Interface
Once the terminal displays `INFO: Uvicorn running on http://127.0.0.1:7860`, open your web browser and navigate to:
👉 **[http://127.0.0.1:7860](http://127.0.0.1:7860)**

---

## 🧹 Git Ignores & Cleanup

The `.gitignore` file is configured to ensure that:
1. **Large Assets are Ignored:** The `kokoro-en-v0_19/` directory (containing the ~90MB ONNX model and token files) is ignored. These files are downloaded automatically on first start, keeping the git repository lightweight.
2. **Secrets are Kept Private:** Your local `.env` configuration file is ignored to prevent pushing host/port configurations.
3. **Cache & Temp Outputs are Ignored:** Local Python `__pycache__` directories and temporary generated audio output files (`static/output_*.wav`) are ignored to prevent repository bloat.

On server startup, `app.py` automatically scans the `static` directory and deletes any residual `output_*.wav` files, keeping your local disk clean between runs.
