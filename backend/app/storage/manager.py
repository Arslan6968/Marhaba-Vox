import os
import re
import uuid
import zipfile
import shutil
from pathlib import Path
from typing import Optional, Tuple, List
from fastapi import UploadFile, HTTPException
from ..core.config import settings

class StorageManager:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.output_dir = settings.OUTPUT_DIR
        self.temp_dir = settings.TEMP_DIR

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        # Strip path traversal attempts and keep safe characters
        base = os.path.basename(filename)
        sanitized = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
        return sanitized if sanitized else "audio_file"

    def validate_file(self, file: UploadFile) -> Tuple[bool, str]:
        ext = Path(file.filename or "").suffix.lower()
        if ext not in settings.SUPPORTED_INPUT_EXTENSIONS:
            return False, f"Unsupported file extension '{ext}'. Supported: {', '.join(sorted(settings.SUPPORTED_INPUT_EXTENSIONS))}"
        return True, ""

    async def save_upload(self, file: UploadFile) -> Tuple[str, Path, int]:
        valid, msg = self.validate_file(file)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)

        file_id = str(uuid.uuid4())
        safe_name = self.sanitize_filename(file.filename or "upload")
        ext = Path(safe_name).suffix.lower()
        stored_filename = f"{file_id}{ext}"
        destination = self.upload_dir / stored_filename

        # Write stream and track size
        size_bytes = 0
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

        with open(destination, "wb") as buffer:
            while chunk := await file.read(1024 * 1024): # 1MB chunks
                size_bytes += len(chunk)
                if size_bytes > max_bytes:
                    buffer.close()
                    if destination.exists():
                        destination.unlink()
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB}MB"
                    )
                buffer.write(chunk)

        return file_id, destination, size_bytes

    def get_output_path(self, job_id: str, stem_type: str, ext: str) -> Path:
        output_folder = self.output_dir / job_id
        output_folder.mkdir(parents=True, exist_ok=True)
        return output_folder / f"{stem_type}.{ext.lstrip('.')}"

    def create_zip_bundle(self, job_id: str, stem_files: List[Tuple[str, Path]]) -> Path:
        zip_path = self.output_dir / job_id / f"marhaba_vox_{job_id[:8]}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for display_name, file_path in stem_files:
                if file_path.exists():
                    zipf.write(file_path, arcname=display_name)
        return zip_path

    def delete_job_files(self, job_id: str, input_path: Optional[str] = None):
        # Remove input file
        if input_path and os.path.exists(input_path):
            try:
                os.unlink(input_path)
            except Exception:
                pass
        # Remove outputs folder
        job_output_dir = self.output_dir / job_id
        if job_output_dir.exists():
            try:
                shutil.rmtree(job_output_dir)
            except Exception:
                pass

    def cleanup_old_files(self, max_age_days: int = 7):
        import time
        now = time.time()
        cutoff = now - (max_age_days * 86400)
        
        for folder in [self.upload_dir, self.output_dir, self.temp_dir]:
            if not folder.exists():
                continue
            for item in folder.iterdir():
                try:
                    if item.stat().st_mtime < cutoff:
                        if item.is_dir():
                            shutil.rmtree(item)
                        else:
                            item.unlink()
                except Exception:
                    pass

storage_manager = StorageManager()
