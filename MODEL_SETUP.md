# Marhaba Vox — Model Architecture & Setup Guide

## 1. Selected Model: Demucs v4 (`htdemucs`)

Marhaba Vox uses **Meta's Hybrid Transformer Demucs (HTDemucs v4)**.

### Why HTDemucs was selected:
1. **Separation Quality**: Achieves state-of-the-art SDR (~9.0 dB on vocals, ~12.5 dB on accompaniment).
2. **Computational Balance**: Demucs v4 operates efficiently on multi-core CPUs without requiring dedicated CUDA GPUs, making the platform accessible on consumer laptops and entry-level workstations.
3. **Dual-Stem Coherence**: Generates 4 native stems (`drums`, `bass`, `other`, `vocals`). Summing `drums + bass + other` creates a mathematically aligned instrumental backing track with no phase cancellation artifacts.
4. **License Compatibility**: Meta's Demucs is open-source under the MIT license, permitting commercial and independent deployment.

---

## 2. Model Caching & Local Storage

When first loaded, model weights (~80MB compressed) are automatically downloaded from the official repository and stored in:
- Windows: `%USERPROFILE%\.cache\huggingface\hub\models--adefossez--HTDemucs`
- Linux/macOS: `~/.cache/huggingface/hub/models--adefossez--HTDemucs`

To pre-cache the model manually without running the web server:
```python
from demucs.pretrained import get_model
model = get_model('htdemucs')
print("Model cached successfully!")
```

---

## 3. GPU vs CPU Execution

The AI engine automatically detects available hardware during startup:
```python
device = "cuda" if torch.cuda.is_available() else "cpu"
```

- **CPU Mode (Detected on Intel i3 / i5 / i7 / AMD Ryzen)**:
  - Audio is processed using multi-threaded PyTorch (`torch.set_num_threads`).
  - Shifts parameter is set to `shifts=0` for rapid inference (~15–20s for short samples).
- **GPU Mode (NVIDIA GeForce / RTX / Tesla)**:
  - If CUDA is detected, tensors and model weights are transferred to GPU VRAM automatically.
  - VRAM Consumption: ~1.2 GB to 2.4 GB.

---

## 4. Expanding Model Catalog

To introduce additional UVR/Demucs models:
1. Open `backend/app/audio/separator.py`.
2. Add the model identifier to `get_available_models()`.
3. Support architectures include `htdemucs_ft` (fine-tuned), `mdx_extra_q` (quantized MDX-Net), or custom checkpoints.
