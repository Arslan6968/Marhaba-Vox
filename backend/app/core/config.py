import os
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Set, List

@dataclass
class Settings:
    PROJECT_NAME: str = "Marhaba Vox"
    TAGLINE: str = "Every Voice. Every Detail."
    PARENT_BRAND: str = "MarhabaPrinters"
    API_V1_STR: str = "/api/v1"
    
    # Base directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = field(default_factory=lambda: Path(__file__).resolve().parent.parent.parent.parent / "storage")
    UPLOAD_DIR: Path = field(init=False)
    OUTPUT_DIR: Path = field(init=False)
    TEMP_DIR: Path = field(init=False)
    
    # Limits & Supported formats
    MAX_UPLOAD_SIZE_MB: int = 100
    MAX_BATCH_FILES: int = 5
    SUPPORTED_INPUT_EXTENSIONS: Set[str] = field(default_factory=lambda: {
        ".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".wma", ".aiff", ".mp4", ".mkv"
    })
    SUPPORTED_OUTPUT_FORMATS: List[str] = field(default_factory=lambda: ["mp3", "wav", "flac"])
    DEFAULT_OUTPUT_FORMAT: str = "wav"
    DEFAULT_MODEL: str = "htdemucs"
    
    # Audio Processing Settings
    AUDIO_SAMPLE_RATE: int = 44100
    FFMPEG_PATH: str = ""

    def __post_init__(self):
        self.UPLOAD_DIR = self.STORAGE_DIR / "uploads"
        self.OUTPUT_DIR = self.STORAGE_DIR / "outputs"
        self.TEMP_DIR = self.STORAGE_DIR / "temp"
        
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.TEMP_DIR.mkdir(parents=True, exist_ok=True)
        
        # Locate ffmpeg
        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            winget_packages = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft/WinGet/Packages"
            found = list(winget_packages.glob("**/ffmpeg.exe"))
            if found:
                ffmpeg_bin = str(found[0])
            else:
                ffmpeg_bin = "ffmpeg"
        self.FFMPEG_PATH = ffmpeg_bin

settings = Settings()
