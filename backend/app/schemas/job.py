from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class StemFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    stem_type: str
    file_name: str
    file_size_bytes: int
    format: str
    mime_type: str
    duration_seconds: float
    download_url: str

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    original_filename: str
    file_size_bytes: int
    duration_seconds: float
    tool_mode: str
    model_name: str
    output_format: str
    status: str
    progress: int
    status_message: str
    error_message: Optional[str] = None
    processing_duration_seconds: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    stems: List[StemFileResponse] = []
    zip_download_url: Optional[str] = None
    original_audio_url: Optional[str] = None

class ModelInfoResponse(BaseModel):
    id: str
    name: str
    architecture: str
    version: str
    description: str
    quality: str
    device_requirement: str
    current_device: str
    speed_characteristic: str = "Standard CPU (Multi-threaded)"
    is_default: bool
    installed: bool

class SystemHealthResponse(BaseModel):
    status: str
    app_name: str
    tagline: str
    device: str
    ffmpeg_available: bool
    ffmpeg_path: str
    active_jobs: int
    queued_jobs: int = 0
    default_model: str

class SettingsResponse(BaseModel):
    default_output_format: str
    default_model: str
    default_playback_rate: float = 1.0
    max_upload_size_mb: int
    max_concurrent_jobs: int = 1
    retention_days: int

class SettingsUpdate(BaseModel):
    default_output_format: Optional[str] = None
    default_model: Optional[str] = None
    default_playback_rate: Optional[float] = None
    max_upload_size_mb: Optional[int] = None
    max_concurrent_jobs: Optional[int] = None
    retention_days: Optional[int] = None
