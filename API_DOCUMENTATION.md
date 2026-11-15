# Marhaba Vox — REST API Specification

**Base URL**: `http://localhost:8000/api/v1`  
**OpenAPI UI**: `http://localhost:8000/docs`

---

## 1. System & Health

### `GET /health`
Returns system status, active inference engine, hardware acceleration mode, and FFmpeg verification.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "app_name": "Marhaba Vox",
  "tagline": "Every Voice. Every Detail.",
  "device": "Intel CPU (Multi-threaded)",
  "ffmpeg_available": true,
  "ffmpeg_path": "C:\\...\\ffmpeg.exe",
  "active_jobs": 0,
  "default_model": "htdemucs"
}
```

---

## 2. Models Catalog

### `GET /models`
Returns all verified and locally available AI source separation models.

**Response (200 OK):**
```json
[
  {
    "id": "htdemucs",
    "name": "HTDemucs v4 (Recommended)",
    "architecture": "Hybrid Transformer Demucs",
    "version": "4.1.0",
    "description": "Meta's flagship Hybrid Transformer architecture for high-precision vocal & instrumental separation.",
    "quality": "Studio Grade (SDR ~9.0 dB)",
    "device_requirement": "CPU or CUDA (Auto-detected)",
    "current_device": "CPU",
    "is_default": true,
    "installed": true
  }
]
```

---

## 3. Audio Processing Jobs

### `POST /jobs`
Uploads an audio file and initiates asynchronous source separation.

**Form Data Parameters:**
- `file` (File, required): Audio or video file (.mp3, .wav, .flac, .m4a, .aac, .mp4).
- `tool_mode` (string, optional): `"vocal_remover"` or `"acapella_extractor"`. Default: `"vocal_remover"`.
- `model_name` (string, optional): Default: `"htdemucs"`.
- `output_format` (string, optional): `"wav"`, `"mp3"`, or `"flac"`. Default: `"wav"`.

**Response (200 OK):**
```json
{
  "id": "d8a17684-297c-47fc-8f74-32aaec7e3ba2",
  "original_filename": "song.mp3",
  "file_size_bytes": 10485760,
  "duration_seconds": 0.0,
  "tool_mode": "vocal_remover",
  "model_name": "htdemucs",
  "output_format": "wav",
  "status": "waiting",
  "progress": 0,
  "status_message": "Audio uploaded. Queued for AI separation.",
  "error_message": null,
  "processing_duration_seconds": 0.0,
  "created_at": "2026-11-10T15:00:00Z",
  "completed_at": null,
  "stems": [],
  "zip_download_url": null
}
```

### `GET /jobs/{job_id}`
Retrieves live processing status, progress percentage, and stem references upon completion.

**Response (200 OK - In Progress):**
```json
{
  "id": "d8a17684-297c-47fc-8f74-32aaec7e3ba2",
  "status": "separating",
  "progress": 50,
  "status_message": "Executing neural network source separation...",
  ...
}
```

**Response (200 OK - Completed):**
```json
{
  "id": "d8a17684-297c-47fc-8f74-32aaec7e3ba2",
  "status": "completed",
  "progress": 100,
  "status_message": "Separation completed successfully!",
  "processing_duration_seconds": 18.4,
  "completed_at": "2026-11-10T15:00:18Z",
  "stems": [
    {
      "id": "782ca7aa-4856-42d4-bb1f-c43916960b1e",
      "stem_type": "vocals",
      "file_name": "song_vocals.wav",
      "file_size_bytes": 15876044,
      "format": "wav",
      "mime_type": "audio/wav",
      "duration_seconds": 180.0,
      "download_url": "http://localhost:8000/api/v1/files/782ca7aa-4856-42d4-bb1f-c43916960b1e/download"
    },
    {
      "id": "893df8bb-5967-53e5-cc2a-d54027071c2f",
      "stem_type": "instrumental",
      "file_name": "song_instrumental.wav",
      "file_size_bytes": 15876044,
      "format": "wav",
      "mime_type": "audio/wav",
      "duration_seconds": 180.0,
      "download_url": "http://localhost:8000/api/v1/files/893df8bb-5967-53e5-cc2a-d54027071c2f/download"
    }
  ],
  "zip_download_url": "http://localhost:8000/api/v1/jobs/d8a17684-297c-47fc-8f74-32aaec7e3ba2/zip"
}
```

### `GET /jobs`
Returns paginated list of recent processing jobs.
Query parameters: `skip` (int, default: 0), `limit` (int, default: 20), `tool_mode` (string, optional).

### `DELETE /jobs/{job_id}`
Cancels or deletes a job and removes all associated temporary files and separated stems from disk.

---

## 4. File Streaming & Downloads

### `GET /files/{file_id}/download`
Streams audio for playback in WaveSurfer.js or downloads the file to disk.
- Query Parameter: `as_attachment` (`true` triggers browser save dialog; `false` streams inline with `Accept-Ranges: bytes`).

### `GET /jobs/{job_id}/zip`
Downloads a single ZIP archive containing all stems generated for the specified job.

---

## 5. History & Settings

### `GET /history`
Returns aggregated processing summary and historical job records.

### `DELETE /history`
Deletes all job records and purges stored files.

### `GET /settings`
Reads current default format, model, and retention limits.

### `POST /settings`
Updates default user preferences.

### `POST /settings/cleanup`
Manually triggers pruning of expired cache files.
