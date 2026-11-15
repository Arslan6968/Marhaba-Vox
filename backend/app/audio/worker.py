import os
import time
import asyncio
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Set, Optional
from ..database.session import SessionLocal
from ..database.models import Job, StemFile
from ..storage.manager import storage_manager
from .processor import audio_processor
from .separator import demucs_separator
from ..core.config import settings

# In-memory tracking of currently running and queued jobs
active_job_ids: Set[str] = set()
queued_job_ids: Set[str] = set()

# Asynchronous processing queue
job_queue: asyncio.Queue = asyncio.Queue()
_worker_task: Optional[asyncio.Task] = None

def execute_separation_job(job_id: str):
    """Synchronous audio separation pipeline designed to be run in a worker thread."""
    start_time = time.time()
    db = SessionLocal()
    temp_wav_path: Path = None

    try:
        active_job_ids.add(job_id)
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job or job.status == "cancelled":
            return

        def update_job_status(status: str, progress: int, msg: str):
            job.status = status
            job.progress = progress
            job.status_message = msg
            db.commit()

        # Step 1: Preparation & conversion
        update_job_status("preparing", 15, "Preparing audio and validating format...")
        input_path = Path(job.input_file_path)
        if not input_path.exists():
            raise FileNotFoundError(f"Source file not found at: {input_path}")

        temp_wav_path = settings.TEMP_DIR / f"{job_id}_prep.wav"

        audio_processor.convert_to_wav(input_path, temp_wav_path)
        probe_info = audio_processor.probe_audio(temp_wav_path)
        job.duration_seconds = probe_info["duration"]
        db.commit()

        # Step 2: Source Separation
        def progress_cb(prog: int, message: str):
            # Check if job was cancelled while separating
            db.refresh(job)
            if job.status == "cancelled":
                raise InterruptedError("Job cancelled by user")
            update_job_status("separating", prog, message)

        stems_data = demucs_separator.separate(
            temp_wav_path,
            model_name=job.model_name,
            progress_callback=progress_cb
        )

        # Step 3: Export stems
        update_job_status("exporting", 85, f"Exporting stems to {job.output_format.upper()} format...")

        safe_base = storage_manager.sanitize_filename(Path(job.original_filename).stem)
        vocal_out_path = storage_manager.get_output_path(job_id, f"{safe_base}_vocals", job.output_format)
        inst_out_path = storage_manager.get_output_path(job_id, f"{safe_base}_instrumental", job.output_format)

        vocal_res = audio_processor.export_audio(
            stems_data["vocals"],
            vocal_out_path,
            job.output_format,
            sample_rate=stems_data["sample_rate"]
        )

        inst_res = audio_processor.export_audio(
            stems_data["instrumental"],
            inst_out_path,
            job.output_format,
            sample_rate=stems_data["sample_rate"]
        )

        # Step 4: Record StemFile entities in DB
        vocal_stem = StemFile(
            job_id=job_id,
            stem_type="vocals",
            file_name=vocal_out_path.name,
            file_path=str(vocal_out_path),
            file_size_bytes=vocal_res["size"],
            format=job.output_format,
            mime_type=vocal_res["mime_type"],
            duration_seconds=vocal_res["duration"]
        )
        db.add(vocal_stem)
        db.flush()

        inst_stem = StemFile(
            job_id=job_id,
            stem_type="instrumental",
            file_name=inst_out_path.name,
            file_path=str(inst_out_path),
            file_size_bytes=inst_res["size"],
            format=job.output_format,
            mime_type=inst_res["mime_type"],
            duration_seconds=inst_res["duration"]
        )
        db.add(inst_stem)
        db.flush()

        job.vocal_file_id = vocal_stem.id
        job.instrumental_file_id = inst_stem.id
        job.status = "completed"
        job.progress = 100
        job.status_message = "Separation completed successfully!"
        job.processing_duration_seconds = round(time.time() - start_time, 2)
        job.completed_at = datetime.now(timezone.utc)
        db.commit()

        # Step 5: Pre-generate ZIP bundle
        try:
            storage_manager.create_zip_bundle(job_id, [
                (vocal_out_path.name, vocal_out_path),
                (inst_out_path.name, inst_out_path)
            ])
        except Exception:
            pass

    except InterruptedError:
        if job:
            job.status = "cancelled"
            job.status_message = "Processing cancelled"
            db.commit()
    except Exception as e:
        traceback.print_exc()
        if job and job.status != "cancelled":
            job.status = "failed"
            job.progress = 0
            job.status_message = "Separation failed"
            job.error_message = str(e)
            job.processing_duration_seconds = round(time.time() - start_time, 2)
            db.commit()
    finally:
        active_job_ids.discard(job_id)
        queued_job_ids.discard(job_id)
        if temp_wav_path and temp_wav_path.exists():
            try:
                temp_wav_path.unlink()
            except Exception:
                pass
        db.close()

async def queue_worker_loop():
    """Background consumer that processes queued separation jobs sequentially."""
    print("[Marhaba Vox Queue] Worker loop started.")
    while True:
        try:
            job_id = await job_queue.get()
            queued_job_ids.discard(job_id)

            # Check if job was cancelled while waiting in queue
            db = SessionLocal()
            try:
                job = db.query(Job).filter(Job.id == job_id).first()
                if not job or job.status == "cancelled":
                    job_queue.task_done()
                    continue
            finally:
                db.close()

            # Execute separation on worker thread
            await asyncio.to_thread(execute_separation_job, job_id)
            job_queue.task_done()
        except asyncio.CancelledError:
            print("[Marhaba Vox Queue] Worker loop cancelled.")
            break
        except Exception as e:
            print(f"[Marhaba Vox Queue] Error in worker loop: {e}")
            await asyncio.sleep(1)

async def start_queue_worker():
    global _worker_task
    if _worker_task is None or _worker_task.done():
        _worker_task = asyncio.create_task(queue_worker_loop())

async def stop_queue_worker():
    global _worker_task
    if _worker_task and not _worker_task.done():
        _worker_task.cancel()
        try:
            await _worker_task
        except asyncio.CancelledError:
            pass
        _worker_task = None

async def enqueue_job(job_id: str):
    """Adds a job to the processing queue."""
    if job_id in queued_job_ids or job_id in active_job_ids:
        return

    queued_job_ids.add(job_id)
    pos = job_queue.qsize() + 1
    
    # If a job is currently active, mark this job with its position in queue
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job and job.status != "cancelled":
            if len(active_job_ids) > 0 or pos > 1:
                job.status = "waiting"
                job.status_message = f"Queued for processing (Position #{pos})"
                db.commit()
    finally:
        db.close()

    await job_queue.put(job_id)

def cancel_job_in_queue(job_id: str) -> bool:
    """Cancels a job in queue or marks active job for cancellation."""
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return False
        job.status = "cancelled"
        job.status_message = "Cancelled by user"
        db.commit()
        queued_job_ids.discard(job_id)
        return True
    finally:
        db.close()

async def retry_job_execution(job_id: str) -> bool:
    """Re-enqueues a failed or cancelled job."""
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return False
        if not Path(job.input_file_path).exists():
            raise FileNotFoundError("Original uploaded file is no longer available on disk.")
        
        job.status = "waiting"
        job.progress = 0
        job.status_message = "Re-queued for AI processing..."
        job.error_message = None
        db.commit()
    finally:
        db.close()

    await enqueue_job(job_id)
    return True
