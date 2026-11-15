# Marhaba Vox — System Architecture Specification

## 1. Architectural Philosophy

Marhaba Vox is architected as an **independent, modular audio separation platform** adhering to modern clean architecture principles. It separates domain logic (AI inference & audio processing) from infrastructure (storage, database, FFmpeg) and delivery (REST API & React UI).

---

## 2. Component Diagram

```
+---------------------------------------------------------------------------------+
|                                 USER BROWSER                                    |
|  [Vocal Remover]  [Acapella Extractor]  [WaveSurfer.js Dual Player]  [History]  |
+----------------------------------------+----------------------------------------+
                                         | HTTP / REST API (port 8000)
                                         v
+---------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                  |
|                                                                                 |
|   +-----------------------+     +--------------------+     +----------------+   |
|   |  Jobs & Files Router  |     |   Models Router    |     | History/Config |   |
|   +-----------+-----------+     +---------+----------+     +--------+-------+   |
|               |                           |                         |           |
|               +---------------------+-----+-------------------------+           |
|                                     |                                           |
|                                     v                                           |
|                     +-------------------------------+                           |
|                     |   Async Job Queue & Worker    |                           |
|                     +---------------+---------------+                           |
+-------------------------------------|-------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         v                                                         v
+-----------------------------------+             +-------------------------------+
|       AI AUDIO ENGINE             |             |    STORAGE & PERSISTENCE      |
|                                   |             |                               |
| - FFmpeg Audio Ingest & Converter |             | - StorageManager (UUID-safe)  |
| - Demucs v4 (Hybrid Transformer)  |             | - SQLite Database (Jobs/Stems)|
| - Vocal/Instrumental Stem Split   |             | - Output Encoders (WAV/MP3)   |
| - Memory Caching & Peak Limiter   |             | - Automated Cache Pruning     |
+-----------------------------------+             +-------------------------------+
```

---

## 3. Detailed Data Flow

1. **Ingest Phase**:
   - The user selects or drags up to 5 audio or video files into the frontend uploader.
   - Files are POSTed to `/api/v1/jobs` with form fields: `tool_mode`, `model_name`, and `output_format`.
   - `StorageManager` assigns an RFC-4122 UUID, sanitizes the original filename to prevent path traversal (`../../`), checks MIME types and size boundaries (<100MB), and writes chunks directly to disk.
   - An initial `Job` row is created in SQLite with state `waiting`.

2. **Scheduling Phase**:
   - The API enqueues the job onto an asynchronous worker thread pool using `asyncio.to_thread` or executor loop.
   - HTTP response returns immediately with the job ID and initial status (non-blocking).

3. **Audio Pre-processing**:
   - `AudioProcessor` probes the file using `soundfile` and `FFmpeg` to determine sample rate, channels, and length.
   - If input is video (e.g. `.mp4`) or non-WAV, FFmpeg extracts the audio stream and normalizes it to 44.1kHz stereo 16-bit PCM WAV.

4. **Neural Separation Phase**:
   - `DemucsSeparator` fetches the pre-cached `htdemucs` PyTorch model (cached in memory to avoid reload latency).
   - Audio is converted to float32 tensor of shape `[1, 2, samples]`.
   - `apply_model()` processes the audio through the Hybrid Transformer layers.
   - The output tensor has shape `[1, 4, 2, samples]` containing stems: `drums`, `bass`, `other`, `vocals`.
   - **Vocal Stem**: extracted directly at `sources_list.index("vocals")`.
   - **Instrumental Stem**: synthesized by summing all non-vocal stems: `drums + bass + other`.

5. **Post-processing & Encoding Phase**:
   - Both stems undergo peak amplitude verification to prevent digital clipping (`max_val <= 0.99`).
   - Stems are exported according to the user's selected format:
     - `WAV`: uncompressed 16-bit PCM via `soundfile`.
     - `FLAC`: lossless compression via `soundfile`.
     - `MP3`: 320 kbps CBR LAME encoding via FFmpeg.
   - A pre-bundled ZIP archive containing both stems is generated for single-click "Download All".

6. **Delivery & Playback Phase**:
   - The frontend polls `/api/v1/jobs/{id}` every 1.5 seconds.
   - Upon `completed` status, `WaveSurfer.js` streams the audio via `/api/v1/files/{file_id}/download` with HTTP `Accept-Ranges: bytes` support.
   - Real audio waveform dynamics are decoded and drawn inside the canvas element.

---

## 4. Security Architecture

- **Path Traversal Protection**: User filenames are never used as on-disk file paths. Stored files are named strictly with randomly generated UUIDs.
- **Directory Traversal Prevention**: Safe Path resolution ensures all operations are constrained within `storage/uploads` and `storage/outputs`.
- **MIME & Format Sanitization**: Extensions are verified against an explicit whitelist (`.mp3`, `.wav`, `.flac`, `.m4a`, `.aac`, `.ogg`, `.wma`, `.mp4`).
- **Resource Limits**: Requests above `MAX_UPLOAD_SIZE_MB` (default: 100MB) are rejected with HTTP 413 prior to memory buffering.
