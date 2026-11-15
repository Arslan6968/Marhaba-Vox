from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import SettingItem
from ..schemas.job import SettingsResponse, SettingsUpdate
from ..storage.manager import storage_manager
from ..core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    items = {item.key: item.value for item in db.query(SettingItem).all()}
    return SettingsResponse(
        default_output_format=items.get("default_output_format", settings.DEFAULT_OUTPUT_FORMAT),
        default_model=items.get("default_model", settings.DEFAULT_MODEL),
        default_playback_rate=float(items.get("default_playback_rate", "1.0")),
        max_upload_size_mb=int(items.get("max_upload_size_mb", str(settings.MAX_UPLOAD_SIZE_MB))),
        max_concurrent_jobs=int(items.get("max_concurrent_jobs", "1")),
        retention_days=int(items.get("retention_days", "7"))
    )

@router.post("", response_model=SettingsResponse)
def update_settings(update_data: SettingsUpdate, db: Session = Depends(get_db)):
    def set_or_create(key: str, val: str):
        item = db.query(SettingItem).filter(SettingItem.key == key).first()
        if item:
            item.value = val
        else:
            db.add(SettingItem(key=key, value=val))

    if update_data.default_output_format is not None:
        val = update_data.default_output_format.lower()
        if val in settings.SUPPORTED_OUTPUT_FORMATS:
            set_or_create("default_output_format", val)

    if update_data.default_model is not None:
        set_or_create("default_model", update_data.default_model)

    if update_data.default_playback_rate is not None:
        set_or_create("default_playback_rate", str(update_data.default_playback_rate))

    if update_data.max_upload_size_mb is not None:
        set_or_create("max_upload_size_mb", str(update_data.max_upload_size_mb))

    if update_data.max_concurrent_jobs is not None:
        set_or_create("max_concurrent_jobs", str(update_data.max_concurrent_jobs))

    if update_data.retention_days is not None:
        set_or_create("retention_days", str(update_data.retention_days))

    db.commit()
    return get_settings(db)

@router.post("/cleanup")
def trigger_cleanup(db: Session = Depends(get_db)):
    item = db.query(SettingItem).filter(SettingItem.key == "retention_days").first()
    days = int(item.value) if item else 7
    storage_manager.cleanup_old_files(max_age_days=days)
    return {"status": "success", "message": f"Cleaned up temporary and cache files older than {days} days"}
