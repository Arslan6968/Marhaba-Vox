import os
import numpy as np
import soundfile as sf
from pathlib import Path
from backend.app.audio.processor import audio_processor
from backend.app.storage.manager import storage_manager
from backend.app.core.config import settings

def test_storage_sanitize_filename():
    assert storage_manager.sanitize_filename("../../../etc/passwd.mp3") == "passwd.mp3"
    assert storage_manager.sanitize_filename("my track (vocal) [final].wav") == "my_track__vocal___final_.wav"

def test_audio_processor_export_formats(tmp_path):
    # Create sample synthetic 2-channel audio
    sr = 44100
    duration = 1.0 # 1 second
    samples = int(sr * duration)
    t = np.linspace(0, duration, samples, endpoint=False)
    left = 0.3 * np.sin(2 * np.pi * 440 * t)
    right = 0.3 * np.cos(2 * np.pi * 440 * t)
    audio = np.stack([left, right], axis=0) # [2, samples]

    # Test WAV export
    wav_path = tmp_path / "test.wav"
    res_wav = audio_processor.export_audio(audio, wav_path, "wav", sr)
    assert wav_path.exists()
    assert res_wav["format"] == "wav"
    assert res_wav["size"] > 0
    assert abs(res_wav["duration"] - 1.0) < 0.1

    # Test FLAC export
    flac_path = tmp_path / "test.flac"
    res_flac = audio_processor.export_audio(audio, flac_path, "flac", sr)
    assert flac_path.exists()
    assert res_flac["format"] == "flac"
    assert res_flac["size"] > 0

    # Test MP3 export
    mp3_path = tmp_path / "test.mp3"
    res_mp3 = audio_processor.export_audio(audio, mp3_path, "mp3", sr)
    assert mp3_path.exists()
    assert res_mp3["format"] == "mp3"
    assert res_mp3["size"] > 0

    # Test Audio Probing
    probe = audio_processor.probe_audio(wav_path)
    assert probe["channels"] == 2
    assert probe["samplerate"] == 44100
    assert abs(probe["duration"] - 1.0) < 0.1
