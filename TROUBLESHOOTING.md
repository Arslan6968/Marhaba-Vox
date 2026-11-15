# Marhaba Vox — Troubleshooting & Diagnostic Guide

This guide addresses common questions, error states, and diagnostic remedies.

---

## 1. Missing DLL or PyTorch Import Errors on Windows

### Symptom:
```
OSError: [WinError 126] The specified module could not be found. Error loading "shm.dll" or "torch_cpu.dll"
```
or missing `vcruntime140_threads.dll`.

### Cause:
Modern PyTorch builds (2.x) on Windows require the MSVC 2015–2022 C++ runtime.

### Solution:
Install the Visual C++ Redistributable:
```powershell
winget install Microsoft.VCRedist.2015+.x64 --accept-source-agreements --accept-package-agreements
```
Or download directly from Microsoft:
[https://aka.ms/vs/17/release/vc_redist.x64.exe](https://aka.ms/vs/17/release/vc_redist.x64.exe)

---

## 2. FFmpeg Not Recognized

### Symptom:
```
RuntimeError: FFmpeg conversion failed: The term 'ffmpeg' is not recognized
```

### Solution:
Install FFmpeg using Winget:
```powershell
winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
```
The backend automatically searches `%LOCALAPPDATA%\Microsoft\WinGet\Packages` for `ffmpeg.exe` if not found in the standard system PATH. You can also specify the path manually in `backend/app/core/config.py` under `FFMPEG_PATH`.

---

## 3. High CPU / RAM Usage During Separation

### Symptom:
System slows down while processing audio tracks.

### Solution:
1. Audio source separation is a computationally intensive neural network calculation. On dual-core CPUs (e.g. Intel Core i3), allow ~15-20 seconds per 10-15 seconds of music.
2. In `backend/app/audio/separator.py`, `shifts` is set to `0` to optimize for speed on CPU.
3. For heavy production batches, run on an NVIDIA GPU with CUDA enabled.

---

## 4. WaveSurfer Audio Playback Fails

### Symptom:
Waveform fails to load or shows "Error loading audio".

### Solution:
1. Ensure the backend server is running and accessible.
2. Check that the browser supports audio streaming over HTTP range requests (`Accept-Ranges: bytes`).
3. For custom production reverse proxies (Nginx/Caddy), ensure proxy buffering is enabled and large buffer headers (`proxy_buffer_size 128k`) are permitted.

---

## 5. Port 8000 or 3000 Already in Use

### Symptom:
```
[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)
```

### Solution:
Find and terminate the process holding the port:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
```
Or start Marhaba Vox on an alternate port:
```powershell
python -m uvicorn backend.app.main:app --port 8080
```
