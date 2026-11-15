import os
from typing import Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import StemFile

router = APIRouter(prefix="/files", tags=["Files"])

@router.get("/{file_id}/download")
@router.get("/{file_id}/download&as_attachment={val}")
def download_stem_file(
    file_id: str,
    as_attachment: bool = Query(False),
    val: Optional[str] = None,
    db: Session = Depends(get_db)
):
    stem = db.query(StemFile).filter(StemFile.id == file_id).first()
    if not stem:
        raise HTTPException(status_code=404, detail="Stem file not found")

    file_path = Path(stem.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File content not found on server")

    # Content-Disposition: inline allows in-browser audio playback in WaveSurfer.js
    # attachment forces browser download popup
    is_attachment = True if (as_attachment or val is not None) else False
    content_disposition_type = "attachment" if is_attachment else "inline"

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Disposition": f'{content_disposition_type}; filename="{stem.file_name}"'
    }

    return FileResponse(
        path=str(file_path),
        filename=stem.file_name,
        media_type=stem.mime_type,
        headers=headers
    )
