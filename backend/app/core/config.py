import os
import sys
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Set, List

@dataclass
class Settings:
    PROJECT_NAME: str = "Marhaba Vox"
    TAGLINE: str = "Every Voice. Every Detail."
    PARENT_BRAND: str = "MarhabaPrinters"
    OWNER: str = "Abdul Rasheed Anjum"
    EMAIL: str = "marhabapress@gmail.com"
    LOCATION: str = "Hujra Shah Muqeem, Punjab, Pakistan"
    API_V1_STR: str = "/api/v1"
    
    # Base and user directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    USER_DATA_DIR: Path = field(default_factory=lambda: Path.home() / "AppData" / "Local" / "MarhabaVox")
    DEFAULT_MUSIC_DIR: Path = field(default_factory=lambda: Path.home() / "Music" / "Marhaba Vox")
    STORAGE_DIR: Path = field(default_factory=lambda: Path(__file__).resolve().parent.parent.parent.parent / "storage")
    UPLOAD_DIR: Path = field(init=False)
    OUTPUT_DIR: Path = field(init=False)
    TEMP_DIR: Path = field(init=False)
    LOGS_DIR: Path = field(init=False)
    
    # Limits & Supported formats
    MAX_UPLOAD_SIZE_MB: int = 100
    MAX_BATCH_FILES: int = 5
    SUPPORTED_INPUT_EXTENSIONS: Set[str] = field(default_factory=lambda: {
        ".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".wma", ".aiff", ".mp4", ".mkv"
    })
    SUPPORTED_OUTPUT_FORMATS: List[str] = field(default_factory=lambda: ["mp3", "wav", "flac"])
    DEFAULT_OUTPUT_FORMAT: str = "mp3"
    DEFAULT_MODEL: str = "htdemucs"
    
    # Audio Processing Settings
    AUDIO_SAMPLE_RATE: int = 44100
    FFMPEG_PATH: str = ""

    def __post_init__(self):
        if getattr(sys, "frozen", False):
            storage_env = os.environ.get("MARHABA_VOX_STORAGE")
            if storage_env:
                self.STORAGE_DIR = Path(storage_env)
            else:
                self.STORAGE_DIR = self.USER_DATA_DIR / "storage"

        self.UPLOAD_DIR = self.STORAGE_DIR / "uploads"
        self.OUTPUT_DIR = self.STORAGE_DIR / "outputs"
        self.TEMP_DIR = self.STORAGE_DIR / "temp"
        self.LOGS_DIR = self.USER_DATA_DIR / "logs"
        
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.TEMP_DIR.mkdir(parents=True, exist_ok=True)
        self.LOGS_DIR.mkdir(parents=True, exist_ok=True)
        self.DEFAULT_MUSIC_DIR.mkdir(parents=True, exist_ok=True)
        
        # Locate ffmpeg
        ffmpeg_bin = ""
        if getattr(sys, "frozen", False):
            meipass = getattr(sys, "_MEIPASS", "")
            exe_dir = Path(sys.executable).parent
            candidates = [
                Path(meipass) / "ffmpeg.exe",
                exe_dir / "ffmpeg.exe",
                exe_dir / "_internal" / "ffmpeg.exe"
            ]
            for cand in candidates:
                if cand.exists():
                    ffmpeg_bin = str(cand)
                    break

        if not ffmpeg_bin:
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
