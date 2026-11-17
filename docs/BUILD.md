# Marhaba Vox — Windows Build & Packaging Guide

**Product:** Marhaba Vox  
**Publisher:** MarhabaPrinters  
**Author:** Abdul Rasheed Anjum  
**Target:** Windows 10 / 11 64-bit (x64)

This document provides instructions for compiling the standalone Windows desktop application and the Inno Setup installer from source.

---

## 1. Prerequisites

To build Marhaba Vox on a Windows development system:

1. **Windows 10 / 11 (64-bit)**
2. **Python 3.12 (64-bit)** with `pip`
3. **Node.js 18+** with `npm`
4. **Inno Setup 6.7+** (Available via `winget install jrsoftware.InnoSetup` or [jrsoftware.org](https://jrsoftware.org/isdl.php))
5. **Static FFmpeg binary** (`ffmpeg.exe`) placed in PATH or winget cache.

---

## 2. Environment Setup

### 2.1 Python Environment & Dependencies
```powershell
# Create and activate virtual environment (optional)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install PyTorch (CPU or CUDA)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install backend dependencies & PyInstaller
pip install -r backend/requirements.txt
pip install pyinstaller pywebview
```

### 2.2 Download Demucs Offline Model Weights
To ensure offline redistribution without downloading during end-user installation, pre-cache `htdemucs`:
```powershell
python -c "from demucs.pretrained import get_model; get_model('htdemucs')"
```
This stores the `955717e8.safetensors` model weights into:
`%USERPROFILE%\.cache\huggingface\hub\models--adefossez--HTDemucs\`

---

## 3. One-Click Automated Build

Run the automated PowerShell build script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-windows.ps1
```

The script will automatically:
1. Build the React frontend SPA into `frontend/dist`.
2. Invoke PyInstaller with `MarhabaVox.spec` using optimized bytecode (`optimize=2`) and Windows metadata (`version_info.txt`).
3. Enforce source protection by confirming zero raw `.py` files remain in `dist\`.
4. Compile `release\MarhabaVox-Setup.exe` with Inno Setup using solid LZMA2 compression.
5. Generate SHA-256 and MD5 checksums into `release\checksums.txt`.

---

## 4. Verification

After building, run the verification script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify-package.ps1
```

This verifies:
- Setup executable presence and size.
- Windows binary metadata and version info.
- Bundled offline AI weights (`htdemucs`).
- Bundled FFmpeg static binary.
- Front-end SPA compilation.
- Source protection integrity.
- Release checksums.
