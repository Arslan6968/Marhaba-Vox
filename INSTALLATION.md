# Marhaba Vox — Installation & Setup Guide

This guide walks through step-by-step setup on Windows, macOS, and Linux.

---

## 1. System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **OS** | Windows 10/11 (64-bit), macOS 12+, Ubuntu 20.04+ | Windows 11 / Ubuntu 22.04 |
| **CPU** | Dual-core 2.5 GHz x86_64 or Apple Silicon | Quad-core 3.5 GHz+ |
| **RAM** | 8 GB RAM | 16 GB RAM |
| **GPU (Optional)** | Integrated Graphics (CPU fallback active) | NVIDIA GPU with 4GB+ VRAM (CUDA 11.8 / 12.1) |
| **Storage** | 3 GB free disk space (for model weights & stems) | SSD with 10 GB free space |
| **Python** | Python 3.10 to 3.12 | Python 3.12 |
| **Node.js** | Node.js 18.x+ | Node.js 22.x or 24.x |

---

## 2. Windows Installation (Step-by-Step)

### Step 2.1 — Install FFmpeg
Using Windows Package Manager (Winget):
```powershell
winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
```
Ensure FFmpeg is accessible in your PATH. If installed through Winget, it is typically located at:
`%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-*\bin`

Verify FFmpeg:
```powershell
ffmpeg -version
```

### Step 2.2 — Python Dependencies
Install PyTorch and audio processing libraries:

**For CPU systems (Default):**
```powershell
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r backend/requirements.txt
```

**For NVIDIA CUDA systems:**
```powershell
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r backend/requirements.txt
```

> **Note on Windows Visual C++ Runtime**:
> PyTorch 2.x on Windows requires the Microsoft Visual C++ 2015-2022 Redistributable (`vcruntime140_threads.dll`). If missing, install via `winget install Microsoft.VCRedist.2015+.x64`.

### Step 2.3 — Frontend Dependencies & Build
Install and compile the React + TypeScript frontend:
```powershell
cd frontend
npm install
npm run build
cd ..
```

---

## 3. Running the Application

### Option A: Unified Launcher (Production & Local)
Run the application launcher from the root folder:
```powershell
python run.py
```
This runs the FastAPI backend and serves the compiled frontend at **[http://localhost:8000](http://localhost:8000)**.

### Option B: Development Mode (Hot Reloading)

**Terminal 1 — Backend API:**
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend Dev Server:**
```powershell
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** (requests are automatically proxied to the backend at `:8000`).

---

## 4. Verification

Verify the system health:
```powershell
curl http://localhost:8000/api/v1/health
```

Run test suite:
```powershell
python -m pytest backend/tests -v
```
