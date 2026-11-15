import os
import time
import torch
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import Dict, Any, Callable, Optional, List
from demucs.apply import apply_model
from demucs.pretrained import get_model
from ..core.config import settings

class DemucsSeparator:
    _models: Dict[str, Any] = {}

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.default_model_name = "htdemucs"
        if self.device == "cpu":
            # Utilize all available CPU threads for optimal multi-threaded inference
            num_cpus = os.cpu_count() or 4
            torch.set_num_threads(num_cpus)
            torch.set_num_interop_threads(min(2, num_cpus))

    def get_available_models(self) -> List[Dict[str, Any]]:
        """Returns genuine, installed and compatible AI models."""
        return [
            {
                "id": "htdemucs",
                "name": "HTDemucs v4 (Recommended)",
                "architecture": "Hybrid Transformer Demucs",
                "version": "4.1.0",
                "description": "Meta's flagship Hybrid Transformer architecture for high-precision vocal & instrumental separation.",
                "quality": "Studio Grade (SDR ~9.0 dB)",
                "device_requirement": "CPU or CUDA (Auto-detected)",
                "current_device": self.device.upper(),
                "speed_characteristic": "Fast (~15-20s per min) on GPU / ~2x track duration on CPU",
                "is_default": True,
                "installed": True
            }
        ]

    def load_model(self, model_name: str = "htdemucs"):
        """Loads and caches the model weights in memory."""
        if model_name not in self._models:
            print(f"[Marhaba Vox AI] Loading model '{model_name}' on {self.device}...")
            start_t = time.time()
            model = get_model(model_name)
            model.to(self.device)
            model.eval()
            self._models[model_name] = model
            print(f"[Marhaba Vox AI] Model '{model_name}' ready in {time.time() - start_t:.2f}s")
        return self._models[model_name]

    def separate(
        self,
        audio_wav_path: Path,
        model_name: str = "htdemucs",
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Dict[str, np.ndarray]:
        """
        Executes genuine AI source separation on the input WAV audio.
        Includes live chunk-by-chunk progress tracking and ETA calculations.
        Returns:
            Dict containing 'vocals' and 'instrumental' numpy arrays [2, samples] at 44100Hz.
        """
        if progress_callback:
            progress_callback(15, "Initializing AI separation model...")

        model = self.load_model(model_name)

        if progress_callback:
            progress_callback(25, "Reading and analyzing audio tensors...")

        # Read audio with soundfile
        audio_data, sample_rate = sf.read(str(audio_wav_path))
        
        # Ensure 2D [samples, channels]
        if audio_data.ndim == 1:
            audio_data = np.stack([audio_data, audio_data], axis=1)
        elif audio_data.shape[1] > 2:
            audio_data = audio_data[:, :2]

        # Convert to [channels, samples] for Demucs
        audio_tensor = torch.from_numpy(audio_data.T).float().unsqueeze(0).to(self.device)

        # Calculate exact number of chunks for live granular progress reporting
        length = audio_tensor.shape[-1]
        segment_sec = 7.8
        segment_samples = int(sample_rate * segment_sec)
        overlap = 0.20  # 20% overlap balances smooth segment boundaries with high CPU speed
        stride = int((1 - overlap) * segment_samples)
        offsets = list(range(0, length, stride))
        total_chunks = max(1, len(offsets))

        completed_chunks = 0
        inference_start = time.time()

        if progress_callback:
            progress_callback(35, f"Starting neural separation (0/{total_chunks} chunks)...")

        def demucs_chunk_callback(d: dict):
            nonlocal completed_chunks
            if d.get("state") == "end":
                completed_chunks += 1
                ratio = min(1.0, completed_chunks / total_chunks)
                # Map smoothly from 35% to 85% during neural inference
                current_prog = 35 + int(ratio * 50)
                elapsed = time.time() - inference_start
                if completed_chunks > 0 and ratio < 1.0:
                    avg_per_chunk = elapsed / completed_chunks
                    remaining_s = int(avg_per_chunk * (total_chunks - completed_chunks))
                    mins = remaining_s // 60
                    secs = remaining_s % 60
                    time_msg = f"~{mins}m {secs}s left" if mins > 0 else f"~{secs}s left"
                else:
                    time_msg = "Finalizing"

                if progress_callback:
                    progress_callback(
                        current_prog,
                        f"Separating audio: Chunk {completed_chunks}/{total_chunks} ({int(ratio * 100)}%) • {time_msg}"
                    )

        # Run inference with Demucs apply_model and real-time chunk callbacks
        with torch.no_grad():
            sources = apply_model(
                model,
                audio_tensor,
                device=self.device,
                shifts=0,
                overlap=overlap,
                progress=False,
                callback=demucs_chunk_callback
            )

        # sources shape: [batch=1, sources=4, channels=2, samples]
        # model.sources: ['drums', 'bass', 'other', 'vocals']
        sources_list = model.sources
        vocals_idx = sources_list.index("vocals")

        if progress_callback:
            progress_callback(88, "Synthesizing separated vocal and instrumental stems...")

        # Extract Vocals stem [2, samples]
        vocals_tensor = sources[0, vocals_idx]
        vocals_np = vocals_tensor.cpu().numpy()

        # Extract Instrumental stem by summing all non-vocal stems: drums + bass + other
        non_vocal_indices = [i for i, s in enumerate(sources_list) if s != "vocals"]
        instrumental_tensor = torch.sum(sources[0, non_vocal_indices], dim=0)
        instrumental_np = instrumental_tensor.cpu().numpy()

        if progress_callback:
            progress_callback(95, "Separation complete! Preparing output formats...")

        return {
            "vocals": vocals_np,
            "instrumental": instrumental_np,
            "sample_rate": sample_rate
        }

demucs_separator = DemucsSeparator()
