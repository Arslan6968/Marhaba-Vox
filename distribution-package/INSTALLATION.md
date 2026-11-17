# Marhaba Vox — Windows Installation Guide

**Product:** Marhaba Vox  
**Tagline:** Every Voice. Every Detail.  
**Publisher:** MarhabaPrinters  
**Owner:** Abdul Rasheed Anjum  
**Contact:** marhabapress@gmail.com | Hujra Shah Muqeem, Punjab, Pakistan  
**Current Release:** v1.0.0 (Windows 10 / 11 64-bit)

---

## 1. System Requirements

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Windows 10 (64-bit build 19041+) or Windows 11 | Windows 11 (64-bit) |
| **Processor (CPU)** | Intel Core i3 / AMD Ryzen 3 (Quad-Core 2.5 GHz+) | Intel Core i7 / AMD Ryzen 7 (8+ Threads) |
| **Memory (RAM)** | 8 GB RAM | 16 GB+ RAM |
| **Graphics (GPU)** | Integrated Graphics (High-speed multi-core CPU mode) | NVIDIA GeForce RTX 3060+ (CUDA Acceleration) |
| **Storage** | 3 GB free disk space (for application & offline AI weights) | High-speed SSD |
| **Runtime Software** | None required (All runtimes & models are 100% pre-bundled) | Microsoft Edge WebView2 (pre-installed on Windows 10/11) |

---

## 2. Installation Steps

### Step 1: Download the Installer
Download `MarhabaVox-Setup.exe` from the official GitHub Releases page.

### Step 2: Verify Checksum (Optional but Recommended)
Open Windows PowerShell and verify the SHA-256 hash:
```powershell
Get-FileHash -Path ".\MarhabaVox-Setup.exe" -Algorithm SHA256
```
Compare the output against `checksums.txt` provided in the release.

### Step 3: Run Setup
1. Double-click `MarhabaVox-Setup.exe`.
2. **Select Installation Mode**:
   - **Install for All Users** (Requires Windows Admin UAC): Installs to `C:\Program Files\Marhaba Vox`.
   - **Install for Me Only** (No Admin rights needed): Installs to `%LocalAppData%\Programs\Marhaba Vox`.
3. Choose whether to create a Desktop shortcut.
4. Click **Install**. The setup will decompress the high-performance AI source separation engine, static FFmpeg binary, and pre-cached neural weights within 10–20 seconds.
5. Click **Finish** to immediately launch Marhaba Vox.

---

## 3. First Launch & Offline Operation

- **Zero Development Tools Required**: You do **not** need Python, Node.js, Git, or FFmpeg installed on your computer.
- **100% Offline AI Processing**: Marhaba Vox comes pre-bundled with Meta's **Demucs v4 (`htdemucs`)** neural model. You can disconnect Wi-Fi and separate vocals anywhere, anytime.
- **Hardware Acceleration**: The application automatically detects available NVIDIA CUDA GPUs. If no compatible GPU is detected, it automatically switches to multi-threaded CPU inference.

---

## 4. Directories & File Storage

Marhaba Vox keeps application binaries strictly separate from your personal audio files:

- **Application Directory:** `C:\Program Files\Marhaba Vox` or `%LocalAppData%\Programs\Marhaba Vox`
- **Application Settings & History:** `%LocalAppData%\MarhabaVox`
- **Default Music Exports:** `%UserProfile%\Music\Marhaba Vox`

---

## 5. Uninstallation

To remove Marhaba Vox:
1. Open Windows **Settings** > **Apps** > **Installed Apps** (or **Control Panel** > **Programs and Features**).
2. Locate **Marhaba Vox** and click **Uninstall**.
3. During uninstallation, the wizard will ask whether you want to keep or delete your local preferences and history log.
4. **Your exported audio files in your Music folder are never deleted.**
