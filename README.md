# Marhaba Vox — AI-Powered Vocal Separation Platform

> **"Every Voice. Every Detail."**  
> *Parent Brand: MarhabaPrinters*

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.15+-EE4C2C.svg)](https://pytorch.org)
[![React](https://img.shields.io/badge/React-19.3-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC.svg)](https://tailwindcss.com)

---

## 🎧 Overview

**Marhaba Vox** is an independent, high-performance web application designed for state-of-the-art AI audio vocal separation and acapella extraction. Built with a laser focus on audio quality and workflow simplicity, Marhaba Vox strictly provides **two dedicated primary tools**:

1. **Vocal Remover**: Separates full music tracks into studio-grade **Instrumental (Backing Track)** and **Vocals**.
2. **Acapella Extractor**: Extracts pristine, isolated vocal lines and harmonies from mixed audio.

Unlike clunky multi-purpose audio editors, Marhaba Vox focuses solely on vocal separation precision using deep neural networks (Meta's Demucs v4 Hybrid Transformer architecture), delivering real-time waveform visualization with WaveSurfer.js and lossless audio downloads.

---

## ✨ Key Features

- **Genuine Deep Learning Separation**: Powered by Meta's `htdemucs` (Demucs v4 Hybrid Transformer), running locally on CPU or NVIDIA CUDA GPU. No phase cancellation or lossy EQ tricks.
- **Dual Processing Tools**:
  - **Vocal Remover**: Generates both Instrumental and Vocal stems. Instrumental stem is primary.
  - **Acapella Extractor**: Extracts clean vocal performances with harmonic preservation.
- **WaveSurfer.js Dual Player**: Real-time waveform scrubbing, responsive seek bar, duration tracking, and volume controls for each stem.
- **Multi-Format Lossless & High-Bitrate Export**:
  - `WAV`: 16-bit PCM uncompressed studio master.
  - `FLAC`: Level 5 lossless compression.
  - `MP3`: 320 kbps high-bitrate LAME encoding via FFmpeg.
- **Batch Processing**: Upload up to 5 audio tracks simultaneously with drag-and-drop support.
- **Supports Audio & Video Containers**: MP3, WAV, FLAC, M4A, AAC, OGG, WMA, and MP4 (automatic audio stream extraction).
- **Recent History**: Locally stored SQLite database tracking jobs, audio statistics, processing times, and instant re-downloads.
- **Unified ZIP Archive**: Download all separated stems in a single zipped package.
- **Linear & Stripe Inspired Light Theme**: Custom commercial aesthetic with `#6558D9` brand purple, `#F6F7FB` background, and clean typography.
- **Startup Animation**: Smooth Framer Motion intro revealing the brand mark and audio equalizer.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ (Tested on Python 3.12)
- Node.js 18+ (Tested on Node.js 24)
- FFmpeg (automatically detected via winget, PATH, or system binaries)

### 1. Launch the Application
Run the root launcher script with Python:
```bash
python run.py
```

Open your browser at:
- **Web App**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Repository Structure

```
Marhaba Vox/
├── backend/
│   ├── app/
│   │   ├── api/          # REST API endpoints (jobs, files, models, history, settings)
│   │   ├── audio/        # Demucs AI separation engine & FFmpeg processor
│   │   ├── core/         # Settings, directory configs, limits
│   │   ├── database/     # SQLAlchemy SQLite models and sessions
│   │   ├── schemas/      # Pydantic validation schemas
│   │   └── storage/      # Secure upload/output file manager
│   ├── tests/            # Automated test suite (API, pipeline, e2e AI separation)
│   └── requirements.txt  # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # Logo, WaveSurfer player, uploader, sidebar, cards
│   │   ├── pages/        # Vocal Remover, Acapella Extractor, History, Settings
│   │   ├── services/     # Typed API client
│   │   └── types/        # TypeScript interfaces
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── storage/
│   ├── uploads/          # Temporary incoming uploads
│   └── outputs/          # Separated stems and ZIP bundles
├── docs/                 # Detailed architecture and API documentation
├── run.py                # Single-command application launcher
├── README.md
├── INSTALLATION.md
├── ARCHITECTURE.md
├── API_DOCUMENTATION.md
├── MODEL_SETUP.md
└── TROUBLESHOOTING.md
```

---

## 🧪 Testing

Run the automated backend test suite (including the real AI source separation E2E test):

```bash
python -m pytest backend/tests -v
```

All 8 unit, API, audio pipeline, and real AI separation tests run and pass locally.

---

## 📄 License & Attribution

- **Parent Brand**: MarhabaPrinters
- **Product**: Marhaba Vox
- **AI Core**: Meta Demucs v4 (MIT License)
- **Audio Decoding**: FFmpeg (LGPL / GPL)
