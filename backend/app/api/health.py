import os
import shutil
import torch
from fastapi import APIRouter
from ..core.config import settings
from ..audio.worker import active_job_ids, queued_job_ids
from ..schemas.job import SystemHealthResponse

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=SystemHealthResponse)
def check_health():
    device = "CUDA GPU" if torch.cuda.is_available() else "Intel CPU (Multi-threaded)"
    ffmpeg_bin = shutil.which("ffmpeg") or settings.FFMPEG_PATH
    ffmpeg_available = bool(ffmpeg_bin and os.path.exists(ffmpeg_bin)) or bool(shutil.which("ffmpeg"))

    return SystemHealthResponse(
        status="healthy",
        app_name=settings.PROJECT_NAME,
        tagline=settings.TAGLINE,
        device=device,
        ffmpeg_available=ffmpeg_available,
        ffmpeg_path=str(ffmpeg_bin),
        active_jobs=len(active_job_ids),
        queued_jobs=len(queued_job_ids),
        default_model=settings.DEFAULT_MODEL
    )
