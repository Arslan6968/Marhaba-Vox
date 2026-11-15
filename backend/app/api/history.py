from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.session import get_db
from ..database.models import Job
from ..schemas.job import JobResponse
from ..api.jobs import serialize_job
from ..storage.manager import storage_manager

router = APIRouter(prefix="/history", tags=["History"])

@router.get("")
def get_history(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    tool_mode: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    query = db.query(Job)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Job.original_filename.ilike(term))

    if tool_mode and tool_mode.strip():
        query = query.filter(Job.tool_mode == tool_mode.strip())

    if status and status.strip():
        query = query.filter(Job.status == status.strip())

    total_count = query.count()
    completed_count = db.query(Job).filter(Job.status == "completed").count()
    total_processing_time = db.query(func.sum(Job.processing_duration_seconds)).scalar() or 0.0

    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

    base_url = str(request.base_url)
    serialized_jobs = [serialize_job(j, base_url) for j in jobs]

    return {
        "jobs": serialized_jobs,
        "total_count": total_count,
        "completed_count": completed_count,
        "total_processing_seconds": round(total_processing_time, 2)
    }

@router.delete("")
def clear_history(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    for j in jobs:
        storage_manager.delete_job_files(j.id, j.input_file_path)
        db.delete(j)
    db.commit()
    return {"status": "success", "message": "All history and files cleared"}
