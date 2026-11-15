import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    
    # tool_mode: 'vocal_remover' or 'acapella_extractor'
    tool_mode = Column(String(50), nullable=False, default="vocal_remover")
    model_name = Column(String(50), nullable=False, default="htdemucs")
    output_format = Column(String(10), nullable=False, default="wav")
    
    # status: waiting, uploading, preparing, separating, exporting, completed, failed, cancelled
    status = Column(String(30), nullable=False, default="waiting")
    progress = Column(Integer, default=0)
    status_message = Column(String(255), default="Job initialized")
    error_message = Column(Text, nullable=True)
    
    input_file_path = Column(String(500), nullable=False)
    
    # Stem file references
    vocal_file_id = Column(String(36), nullable=True)
    instrumental_file_id = Column(String(36), nullable=True)
    
    processing_duration_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=get_utc_now)
    completed_at = Column(DateTime, nullable=True)

    stems = relationship("StemFile", back_populates="job", cascade="all, delete-orphan")


class StemFile(Base):
    __tablename__ = "stem_files"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)
    
    # stem_type: 'vocals' or 'instrumental'
    stem_type = Column(String(30), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    format = Column(String(10), nullable=False)
    mime_type = Column(String(100), nullable=False)
    duration_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=get_utc_now)

    job = relationship("Job", back_populates="stems")


class SettingItem(Base):
    __tablename__ = "settings"

    key = Column(String(50), primary_key=True)
    value = Column(String(255), nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
