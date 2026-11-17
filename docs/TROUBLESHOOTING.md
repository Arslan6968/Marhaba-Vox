# Marhaba Vox — Troubleshooting & FAQ

**Product:** Marhaba Vox  
**Support:** marhabapress@gmail.com  
**Owner:** Abdul Rasheed Anjum (MarhabaPrinters)

---

## 1. Frequently Asked Questions

### Q: Does Marhaba Vox require an internet connection?
**No.** Marhaba Vox operates 100% locally on your computer. All model weights, audio decoders, and user data remain on your machine. No telemetry or audio files are ever uploaded.

### Q: Do I need Python, Node.js, or FFmpeg installed?
**No.** The standalone Windows installer bundles an embedded Python 3.12 runtime, pre-compiled PyTorch libraries, pre-cached neural network weights, and a static FFmpeg binary.

---

## 2. Common Issues & Solutions

### Issue 1: "Windows protected your PC" (SmartScreen prompt)
**Cause:** Marhaba Vox is a freshly built application without commercial code-signing certificates.
**Solution:**
1. Click **More info**.
2. Click **Run anyway**.

### Issue 2: Application window is blank or fails to open
**Cause:** The Microsoft Edge WebView2 runtime is disabled or missing on very old Windows 10 builds (pre-2020).
**Solution:**
1. Windows 10 (20H2+) and Windows 11 include WebView2 out of the box.
2. If running on an outdated Windows build, download the free [Microsoft Edge WebView2 Evergreen Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
3. Alternatively, Marhaba Vox will automatically fallback to opening the studio in your default web browser (`http://127.0.0.1:8000`).

### Issue 3: "GPU Memory Limit Reached" / CUDA Out of Memory
**Cause:** Processing very long tracks (e.g., >10 minutes) on graphics cards with low VRAM (2GB - 4GB).
**Solution:**
Marhaba Vox features automatic failover protection. If VRAM is exceeded, it flushes GPU memory and seamlessly completes separation using your multi-core CPU without aborting your job.

### Issue 4: Antivirus False Positives
**Cause:** PyInstaller bootloaders can occasionally trigger generic heuristic warnings in aggressive antivirus scanners.
**Solution:**
Add an exclusion for `C:\Program Files\Marhaba Vox\MarhabaVox.exe` or `%LocalAppData%\Programs\Marhaba Vox\MarhabaVox.exe`. Marhaba Vox is 100% clean and contains zero telemetry or malware.

---

## 3. Contact Support
If you encounter any other issues, please contact:
- **Email:** marhabapress@gmail.com
- **Publisher:** MarhabaPrinters (Abdul Rasheed Anjum)
- **Location:** Hujra Shah Muqeem, Punjab, Pakistan
- **Repository:** https://github.com/Arslan6968/Marhaba-Vox
