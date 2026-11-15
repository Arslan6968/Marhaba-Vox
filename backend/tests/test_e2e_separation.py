import io
import time
import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.database.models import Job

def test_real_ai_source_separation_end_to_end():
    # Clean any stale waiting test jobs so our test runs immediately
    db = SessionLocal()
    try:
        db.query(Job).filter(Job.status == "waiting").delete()
        db.commit()
    finally:
        db.close()

    with TestClient(app) as client:
        # 1. Generate a small test audio file (1.5 seconds)
        sr = 44100
        duration = 1.5
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        signal = 0.4 * np.sin(2 * np.pi * 220 * t) + 0.3 * np.sin(2 * np.pi * 880 * t)
        audio = np.stack([signal, signal], axis=1)

        wav_io = io.BytesIO()
        sf.write(wav_io, audio, sr, format="WAV")
        wav_bytes = wav_io.getvalue()

        # 2. Upload and submit job to API
        upload_file = ("e2e_short_test.wav", wav_bytes, "audio/wav")
        create_res = client.post(
            "/api/v1/jobs",
            files={"file": upload_file},
            data={
                "tool_mode": "vocal_remover",
                "model_name": "htdemucs",
                "output_format": "wav"
            }
        )
        assert create_res.status_code == 200, f"Job creation failed: {create_res.text}"
        job_data = create_res.json()
        job_id = job_data["id"]
        assert job_id is not None

        # 3. Poll for genuine AI processing completion (timeout at 90s)
        max_wait = 90
        start = time.time()
        final_status = None
        final_job = None

        while time.time() - start < max_wait:
            poll_res = client.get(f"/api/v1/jobs/{job_id}")
            assert poll_res.status_code == 200
            final_job = poll_res.json()
            final_status = final_job["status"]
            if final_status in ["completed", "failed", "cancelled"]:
                break
            time.sleep(2)

        assert final_status == "completed", f"Job failed or timed out: {final_job}"
        assert final_job["progress"] == 100
        assert len(final_job["stems"]) == 2

        # 4. Verify both stems exist: Vocals and Instrumental
        vocal_stem = next((s for s in final_job["stems"] if s["stem_type"] == "vocals"), None)
        inst_stem = next((s for s in final_job["stems"] if s["stem_type"] == "instrumental"), None)
        assert vocal_stem is not None, "Vocal stem missing from job results"
        assert inst_stem is not None, "Instrumental stem missing from job results"

        # 5. Verify downloading individual stems produces valid audio
        vocal_dl = client.get(f"/api/v1/files/{vocal_stem['id']}/download")
        assert vocal_dl.status_code == 200
        assert len(vocal_dl.content) > 1000

        inst_dl = client.get(f"/api/v1/files/{inst_stem['id']}/download")
        assert inst_dl.status_code == 200
        assert len(inst_dl.content) > 1000

        # 6. Verify ZIP bundle download
        zip_dl = client.get(f"/api/v1/jobs/{job_id}/zip")
        assert zip_dl.status_code == 200
        assert len(zip_dl.content) > 1000

        # 7. Clean up test job
        del_res = client.delete(f"/api/v1/jobs/{job_id}")
        assert del_res.status_code == 200
