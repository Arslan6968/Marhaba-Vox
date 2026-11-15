import pytest
import io
import wave
import struct
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

client = TestClient(app)

def create_synthetic_wav_bytes(duration_sec=0.5, sample_rate=44100):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        num_frames = int(duration_sec * sample_rate)
        frames = []
        for i in range(num_frames):
            val = int(1000 * (i % 50) / 50.0)
            frames.append(struct.pack('<hh', val, val))
        wav.writeframes(b''.join(frames))
    buf.seek(0)
    return buf.read()

def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "Marhaba Vox"
    assert data["tagline"] == "Every Voice. Every Detail."
    assert "device" in data
    assert data["ffmpeg_available"] is True
    assert "active_jobs" in data
    assert "queued_jobs" in data

def test_models_endpoint():
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    models = res.json()
    assert len(models) >= 1
    htdemucs = models[0]
    assert htdemucs["id"] == "htdemucs"
    assert htdemucs["installed"] is True
    assert "Hybrid Transformer" in htdemucs["architecture"]

def test_settings_flow():
    # Read settings
    res = client.get("/api/v1/settings")
    assert res.status_code == 200
    data = res.json()
    assert "default_output_format" in data
    assert "max_upload_size_mb" in data

    # Update settings
    res_update = client.post("/api/v1/settings", json={"default_output_format": "flac", "default_playback_rate": 1.25})
    assert res_update.status_code == 200
    updated = res_update.json()
    assert updated["default_output_format"] == "flac"
    assert updated["default_playback_rate"] == 1.25

    # Reset back to wav
    client.post("/api/v1/settings", json={"default_output_format": "wav", "default_playback_rate": 1.0})

def test_reject_unsupported_file_extension():
    fake_file = ("script.py", b"print('hello')", "text/x-python")
    res = client.post(
        "/api/v1/jobs",
        files={"file": fake_file},
        data={"tool_mode": "vocal_remover", "model_name": "htdemucs", "output_format": "wav"}
    )
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]

def test_job_cancellation_and_original_audio():
    wav_bytes = create_synthetic_wav_bytes(0.5)
    file_payload = ("test_track.wav", io.BytesIO(wav_bytes), "audio/wav")

    # Create job
    create_res = client.post(
        "/api/v1/jobs",
        files={"file": file_payload},
        data={"tool_mode": "vocal_remover", "model_name": "htdemucs", "output_format": "wav"}
    )
    assert create_res.status_code == 200
    job = create_res.json()
    job_id = job["id"]
    assert job["status"] in ["waiting", "preparing", "separating", "completed"]

    # Stream original audio
    orig_res = client.get(f"/api/v1/jobs/{job_id}/original")
    assert orig_res.status_code == 200
    assert len(orig_res.content) > 0

    # Cancel job
    cancel_res = client.post(f"/api/v1/jobs/{job_id}/cancel")
    assert cancel_res.status_code == 200

    # Verify status reflects cancellation or completed if it was instant
    status_res = client.get(f"/api/v1/jobs/{job_id}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] in ["cancelled", "completed"]

def test_history_endpoint_and_filters():
    res = client.get("/api/v1/history?tool_mode=vocal_remover")
    assert res.status_code == 200
    data = res.json()
    assert "jobs" in data
    assert "total_count" in data
    assert isinstance(data["jobs"], list)
