from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
from .models import Base, SettingItem

DATABASE_PATH = settings.STORAGE_DIR / "marhaba_vox.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Initialize default settings if not present
    db = SessionLocal()
    try:
        defaults = {
            "default_output_format": settings.DEFAULT_OUTPUT_FORMAT,
            "default_model": settings.DEFAULT_MODEL,
            "max_upload_size_mb": str(settings.MAX_UPLOAD_SIZE_MB),
            "retention_days": "7",
        }
        for k, v in defaults.items():
            item = db.query(SettingItem).filter(SettingItem.key == k).first()
            if not item:
                db.add(SettingItem(key=k, value=v))
        db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
