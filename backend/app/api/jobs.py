import os
import mimetypes
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import Job, StemFile
from ..storage.manager import storage_manager
from ..schemas.job import JobResponse, StemFileResponse
from ..audio.worker import enqueue_job, cancel_job_in_queue, retry_job_execution, active_job_ids, queued_job_ids
from ..core.config import settings

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def serialize_stem(stem: StemFile, base_url: str) -> StemFileResponse:
    download_url = f"{base_url}api/v1/files/{stem.id}/download"
    return StemFileResponse(
        id=stem.id,
        stem_type=stem.stem_type,
        file_name=stem.file_name,
        file_size_bytes=stem.file_size_bytes,
        format=stem.format,
        mime_type=stem.mime_type,
        duration_seconds=stem.duration_seconds,
        download_url=download_url
    )

def serialize_job(job: Job, base_url: str) -> JobResponse:
    stems_res = [serialize_stem(s, base_url) for s in job.stems]
    zip_url = f"{base_url}api/v1/jobs/{job.id}/zip" if job.status == "completed" else None
    original_url = f"{base_url}api/v1/jobs/{job.id}/original"
    return JobResponse(
        id=job.id,
        original_filename=job.original_filename,
        file_size_bytes=job.file_size_bytes,
        duration_seconds=job.duration_seconds,
        tool_mode=job.tool_mode,
        model_name=job.model_name,
        output_format=job.output_format,
        status=job.status,
        progress=job.progress,
        status_message=job.status_message,
        error_message=job.error_message,
        processing_duration_seconds=job.processing_duration_seconds,
        created_at=job.created_at,
        completed_at=job.completed_at,
        stems=stems_res,
        zip_download_url=zip_url,
        original_audio_url=original_url
    )

@router.post("", response_model=JobResponse)
async def create_job(
    request: Request,
    file: UploadFile = File(...),
    tool_mode: str = Form("vocal_remover"),
    model_name: str = Form("htdemucs"),
    output_format: str = Form("wav"),
    db: Session = Depends(get_db)
):
    if tool_mode not in ["vocal_remover", "acapella_extractor"]:
        tool_mode = "vocal_remover"

    if output_format.lower() not in settings.SUPPORTED_OUTPUT_FORMATS:
        output_format = settings.DEFAULT_OUTPUT_FORMAT

    file_id, input_path, file_size = await storage_manager.save_upload(file)

    new_job = Job(
        original_filename=file.filename or "audio_track",
        file_size_bytes=file_size,
        tool_mode=tool_mode,
        model_name=model_name,
        output_format=output_format.lower(),
        status="waiting",
        progress=0,
        status_message="Audio uploaded. Queued for AI separation.",
        input_file_path=str(input_path)
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Enqueue to background worker
    await enqueue_job(new_job.id)

    base_url = str(request.base_url)
    return serialize_job(new_job, base_url)

@router.get("", response_model=List[JobResponse])
def list_jobs(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    tool_mode: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if tool_mode:
        query = query.filter(Job.tool_mode == tool_mode)
    if status:
        query = query.filter(Job.status == status)
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    base_url = str(request.base_url)
    return [serialize_job(j, base_url) for j in jobs]

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, request: Request, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    base_url = str(request.base_url)
    return serialize_job(job, base_url)

@router.get("/{job_id}/original")
def stream_original_audio(job_id: str, db: Session = Depends(get_db)):
    """Streams original uploaded audio track for A/B comparison."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file_path = Path(job.input_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Original audio file not found on server")

    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = "audio/mpeg" if file_path.suffix.lower() == ".mp3" else "audio/wav"

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Disposition": f'inline; filename="{storage_manager.sanitize_filename(job.original_filename)}"'
    }

    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        headers=headers
    )

@router.post("/{job_id}/retry", response_model=JobResponse)
async def retry_job(job_id: str, request: Request, db: Session = Depends(get_db)):
    """Re-enqueues a failed or cancelled job."""
    success = await retry_job_execution(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found or source file missing")
    
    job = db.query(Job).filter(Job.id == job_id).first()
    base_url = str(request.base_url)
    return serialize_job(job, base_url)

@router.post("/{job_id}/cancel")
def cancel_job(job_id: str, db: Session = Depends(get_db)):
    """Cancels a job in queue or processing."""
    cancelled = cancel_job_in_queue(job_id)
    if not cancelled:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "message": f"Job {job_id} cancelled"}

@router.get("/{job_id}/results", response_model=List[StemFileResponse])
def get_job_results(job_id: str, request: Request, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail=f"Job is not completed yet (current status: {job.status})")
    
    base_url = str(request.base_url)
    return [serialize_stem(s, base_url) for s in job.stems]

@router.get("/{job_id}/zip")
def download_job_zip(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Cannot download zip for incomplete job")

    zip_file = settings.OUTPUT_DIR / job_id / f"marhaba_vox_{job_id[:8]}.zip"
    if not zip_file.exists():
        stem_files = [(s.file_name, Path(s.file_path)) for s in job.stems]
        zip_file = storage_manager.create_zip_bundle(job_id, stem_files)

    safe_stem_name = storage_manager.sanitize_filename(Path(job.original_filename).stem)
    return FileResponse(
        path=str(zip_file),
        filename=f"marhaba_vox_{safe_stem_name}_stems.zip",
        media_type="application/zip"
    )

@router.delete("/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cancel_job_in_queue(job_id)
    storage_manager.delete_job_files(job_id, job.input_file_path)
    db.delete(job)
    db.commit()
    return {"status": "success", "message": f"Job {job_id} deleted successfully"}
