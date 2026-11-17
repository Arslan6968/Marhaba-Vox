# Marhaba Vox v1.0.0 — Official Windows Release Notes

**Release Date:** November 2026  
**Publisher:** MarhabaPrinters  
**Owner:** Abdul Rasheed Anjum (Hujra Shah Muqeem, Punjab, Pakistan)  
**Package:** `MarhabaVox-Setup.exe`  
**Target Platform:** Windows 10 / Windows 11 (64-bit x64)

---

## Highlights of Release v1.0.0

### 1. Production-Grade Windows Setup Installer
- Packaged using Inno Setup 6 with `lzma2/ultra64` solid compression.
- Dual-mode installation: install for All Users in `C:\Program Files\Marhaba Vox` (Admin) or for Current User in `%LocalAppData%\Programs\Marhaba Vox` (Non-Admin).
- Creates Start Menu entries, Desktop shortcut, and registered Windows Add/Remove Programs entry.
- Clean uninstallation with user prompt to keep or delete local settings and history.

### 2. 100% Offline AI Source Separation
- Meta's **HTDemucs v4** neural model weights (`955717e8.safetensors`) pre-cached and bundled into the distribution.
- Complete offline isolation: operates without an internet connection, cloud APIs, or subscription gates.
- Automatic hardware acceleration: auto-detects NVIDIA CUDA GPUs with graceful fallback to multi-threaded CPU inference.
- VRAM Out-of-Memory failover: seamlessly falls back to CPU if GPU memory limit is reached during large audio files.

### 3. Native Desktop Window & Embedded Services
- Native application window powered by Microsoft Edge WebView2 (`pywebview`).
- Embedded static `ffmpeg.exe` binary for audio transcoding and format conversions (MP3, WAV, FLAC).
- Zero terminal / command-prompt window exposure during normal user operation.
- Graceful shutdown: closes background FastAPI server and queue worker automatically when the window is closed.

### 4. Source Code Protection
- All backend modules compiled into optimized Python bytecode (`optimize=2`) inside the standalone binary PYZ archive.
- Raw `.py` source files excluded from the installer distribution bundle.

### 5. File & Data Architecture
- Application binaries kept strictly isolated in Program Files.
- User data, preferences, and SQLite database stored safely in `%LocalAppData%\MarhabaVox`.
- Default audio exports directed to `%UserProfile%\Music\Marhaba Vox`. User-generated audio files are never deleted during upgrades or uninstalls.
