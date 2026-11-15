import os
import subprocess
import json
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional
from ..core.config import settings

class AudioProcessor:
    def __init__(self):
        self.ffmpeg = settings.FFMPEG_PATH

    def probe_audio(self, file_path: Path) -> Dict[str, Any]:
        """Reads audio duration, channels, sample rate using soundfile with FFmpeg fallback."""
        try:
            info = sf.info(str(file_path))
            return {
                "duration": float(info.duration),
                "samplerate": int(info.samplerate),
                "channels": int(info.channels),
                "format": info.format
            }
        except Exception:
            # Fallback to ffmpeg / ffprobe
            return self._probe_with_ffmpeg(file_path)

    def _probe_with_ffmpeg(self, file_path: Path) -> Dict[str, Any]:
        cmd = [
            self.ffmpeg,
            "-i", str(file_path),
            "-hide_banner"
        ]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False)
            output = res.stderr
            duration = 0.0
            # Look for Duration: 00:01:23.45
            for line in output.splitlines():
                if "Duration:" in line:
                    parts = line.split("Duration:")[1].split(",")[0].strip()
                    h, m, s = parts.split(":")
                    duration = float(h) * 3600 + float(m) * 60 + float(s)
                    break
            return {
                "duration": duration,
                "samplerate": 44100,
                "channels": 2,
                "format": file_path.suffix.lstrip(".").upper()
            }
        except Exception:
            return {
                "duration": 0.0,
                "samplerate": 44100,
                "channels": 2,
                "format": "AUDIO"
            }

    def convert_to_wav(self, input_path: Path, output_wav_path: Path, sample_rate: int = 44100) -> bool:
        """Converts any supported input format or video track to 44.1kHz stereo WAV."""
        cmd = [
            self.ffmpeg,
            "-y",
            "-i", str(input_path),
            "-vn", # disable video if video container
            "-ac", "2", # force stereo
            "-ar", str(sample_rate), # sample rate 44.1kHz
            "-acodec", "pcm_s16le", # 16-bit PCM WAV
            str(output_wav_path)
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"FFmpeg conversion failed: {res.stderr}")
        return True

    def export_audio(
        self,
        audio_data: np.ndarray,
        output_path: Path,
        output_format: str,
        sample_rate: int = 44100
    ) -> Dict[str, Any]:
        """
        Exports a 2-channel numpy array [2, samples] to the requested format (wav, mp3, flac).
        """
        output_format = output_format.lower().strip()
        temp_wav = output_path.with_suffix(".temp.wav")
        
        # Audio array shape is [channels, samples], sf.write expects [samples, channels]
        if audio_data.ndim == 2 and audio_data.shape[0] == 2:
            data_to_write = audio_data.T
        else:
            data_to_write = audio_data

        # Peak normalization check to avoid clipping
        max_val = np.max(np.abs(data_to_write))
        if max_val > 0.99:
            data_to_write = data_to_write * (0.99 / max_val)

        if output_format == "wav":
            sf.write(str(output_path), data_to_write, sample_rate, subtype="PCM_16")
        elif output_format == "flac":
            sf.write(str(output_path), data_to_write, sample_rate, format="FLAC")
        elif output_format == "mp3":
            # Write temp wav first, then encode to high-quality 320k MP3 using FFmpeg
            sf.write(str(temp_wav), data_to_write, sample_rate, subtype="PCM_16")
            cmd = [
                self.ffmpeg,
                "-y",
                "-i", str(temp_wav),
                "-codec:a", "libmp3lame",
                "-b:a", "320k",
                "-q:a", "0",
                str(output_path)
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if temp_wav.exists():
                temp_wav.unlink()
            if res.returncode != 0:
                raise RuntimeError(f"FFmpeg MP3 encoding failed: {res.stderr}")
        else:
            # Default to WAV
            sf.write(str(output_path), data_to_write, sample_rate, subtype="PCM_16")

        file_size = output_path.stat().st_size
        duration = data_to_write.shape[0] / sample_rate

        mime_types = {
            "wav": "audio/wav",
            "mp3": "audio/mpeg",
            "flac": "audio/flac"
        }

        return {
            "path": output_path,
            "size": file_size,
            "duration": duration,
            "mime_type": mime_types.get(output_format, "audio/wav"),
            "format": output_format
        }

audio_processor = AudioProcessor()
