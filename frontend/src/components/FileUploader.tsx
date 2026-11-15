import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, FileAudio, X, AlertCircle, Film, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

interface FileUploaderProps {
  files: File[];
  onAddFiles: (newFiles: File[]) => void;
  onRemoveFile: (index: number) => void;
  maxFiles?: number;
  maxSizeMb?: number;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  maxFiles = 5,
  maxSizeMb = 100,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileDurations, setFileDurations] = useState<{ [key: string]: number }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const supportedExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma', '.mp4', '.mkv'];

  // Detect audio duration using native browser Audio element
  useEffect(() => {
    files.forEach((file) => {
      const fileKey = `${file.name}-${file.size}`;
      if (fileDurations[fileKey] === undefined) {
        try {
          const url = URL.createObjectURL(file);
          const audio = new Audio();
          audio.src = url;
          audio.addEventListener('loadedmetadata', () => {
            if (audio.duration && !isNaN(audio.duration)) {
              setFileDurations((prev) => ({ ...prev, [fileKey]: audio.duration }));
            }
            URL.revokeObjectURL(url);
          });
          audio.addEventListener('error', () => {
            URL.revokeObjectURL(url);
          });
        } catch {
          // Ignore pre-fetch failures
        }
      }
    });
  }, [files]);

  const validateAndFilter = (incoming: FileList | File[]): File[] => {
    setErrorMsg(null);
    const valid: File[] = [];
    const currentCount = files.length;
    let duplicateCount = 0;

    for (let i = 0; i < incoming.length; i++) {
      const file = incoming[i];
      if (currentCount + valid.length >= maxFiles) {
        setErrorMsg(`Batch limit reached: Maximum ${maxFiles} files can be processed at once.`);
        break;
      }

      // Check duplicates against currently staged files
      const isDuplicate =
        files.some((f) => f.name === file.name && f.size === file.size) ||
        valid.some((f) => f.name === file.name && f.size === file.size);

      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!supportedExtensions.includes(ext)) {
        setErrorMsg(
          `File "${file.name}" has an unsupported format. Supported formats: MP3, WAV, FLAC, M4A, AAC, MP4.`
        );
        continue;
      }

      if (file.size > maxSizeMb * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the ${maxSizeMb}MB size limit.`);
        continue;
      }

      valid.push(file);
    }

    if (duplicateCount > 0 && valid.length === 0) {
      setErrorMsg(`${duplicateCount} duplicate file(s) were skipped.`);
    } else if (duplicateCount > 0) {
      setErrorMsg(`${duplicateCount} duplicate file(s) were skipped from the batch.`);
    }

    return valid;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const valid = validateAndFilter(e.dataTransfer.files);
      if (valid.length > 0) {
        onAddFiles(valid);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const valid = validateAndFilter(e.target.files);
      if (valid.length > 0) {
        onAddFiles(valid);
      }
      e.target.value = '';
    }
  };

  // Generate demo audio sample directly in browser memory
  const handleLoadSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    try {
      // Create a 4-second synthetic WAV file with stereo tone
      const sampleRate = 44100;
      const numSeconds = 4;
      const numChannels = 2;
      const numSamples = sampleRate * numSeconds;
      const buffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
      const view = new DataView(buffer);

      // WAV Header
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * numChannels * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true); // PCM format
      view.setUint16(20, 1, true); // Linear quantization
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true);
      view.setUint16(34, 16, true); // 16-bit
      writeString(36, 'data');
      view.setUint32(40, numSamples * numChannels * 2, true);

      // Audio waveform: Melodic harmonics (Acoustic chords + Vocal frequencies)
      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const melody =
          0.3 * Math.sin(2 * Math.PI * 440 * t) +
          0.2 * Math.sin(2 * Math.PI * 880 * t) +
          0.15 * Math.sin(2 * Math.PI * 220 * t);
        const sampleVal = Math.max(-1, Math.min(1, melody)) * 0x7fff;
        view.setInt16(offset, sampleVal, true);
        view.setInt16(offset + 2, sampleVal, true);
        offset += 4;
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const sampleFile = new File([blob], 'Marhaba_Vox_Studio_Sample.wav', { type: 'audio/wav' });

      const valid = validateAndFilter([sampleFile]);
      if (valid.length > 0) {
        onAddFiles(valid);
      }
    } catch (err) {
      console.error('Error generating sample:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      {/* Dropzone container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && inputRef.current) inputRef.current.click();
        }}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group ${
          isDragOver
            ? 'border-[#6558D9] bg-[#F0EDFF]/70 shadow-lg scale-[1.008]'
            : 'border-[#E8EAF0] hover:border-[#6558D9]/60 hover:bg-white bg-white/70 shadow-xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".mp3,.wav,.flac,.m4a,.aac,.ogg,.wma,.mp4,.mkv,audio/*,video/mp4"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          {/* Animated Waveform Icon Circle */}
          <div className="relative mb-4">
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#F0EDFF] to-[#FAF8FF] text-[#6558D9] flex items-center justify-center shadow-md border border-[#6558D9]/15 group-hover:scale-105 transition-transform duration-200">
              <UploadCloud className="w-8 h-8" />
            </div>

            {/* Subtle floating wave visualizer badge */}
            <div className="absolute -bottom-1.5 -right-1.5 bg-white border border-[#E8EAF0] rounded-xl px-2 py-0.5 shadow-sm flex items-center gap-0.5 h-5">
              <span className="w-0.5 h-2 rounded-full bg-[#6558D9] eq-bar-1" />
              <span className="w-0.5 h-3 rounded-full bg-[#9185F5] eq-bar-2" />
              <span className="w-0.5 h-1.5 rounded-full bg-[#6558D9] eq-bar-3" />
              <span className="w-0.5 h-2.5 rounded-full bg-[#9185F5] eq-bar-4" />
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-[#171923] tracking-tight mb-1">
            Drag & drop your audio or video file here
          </h3>
          <p className="text-sm font-semibold text-[#6558D9] mb-4 group-hover:underline">
            or browse files from your computer
          </p>

          {/* Quick Sample Trigger */}
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0EDFF] hover:bg-[#E4DFFF] text-[#6558D9] text-xs font-bold transition-all shadow-2xs border border-[#6558D9]/20"
              title="Test separation without having to locate an audio file"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Audio Track</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#777D8C] max-w-lg">
            <span className="bg-[#F6F7FB] px-2.5 py-1 rounded-lg border border-[#E8EAF0] font-medium">
              MP3 • WAV • FLAC • M4A • AAC • MP4
            </span>
            <span className="bg-[#F6F7FB] px-2.5 py-1 rounded-lg border border-[#E8EAF0] font-medium">
              Up to {maxSizeMb} MB
            </span>
            <span className="bg-[#F6F7FB] px-2.5 py-1 rounded-lg border border-[#E8EAF0] font-medium">
              Max {maxFiles} files batch
            </span>
          </div>
        </div>
      </div>

      {/* Validation alert */}
      {errorMsg && (
        <div className="mt-3 p-3.5 bg-red-50 border border-red-200 text-[#E5484D] rounded-2xl text-xs flex items-center gap-2.5 shadow-2xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Staged file cards */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#171923]">
                Staged For Separation ({files.length}/{maxFiles})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                for (let i = files.length - 1; i >= 0; i--) onRemoveFile(i);
              }}
              className="text-xs font-bold text-[#E5484D] hover:underline transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map((file, idx) => {
              const isVideo = file.name.endsWith('.mp4') || file.name.endsWith('.mkv');
              const fileKey = `${file.name}-${file.size}`;
              const durationStr = formatDuration(fileDurations[fileKey]);
              const ext = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';

              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-3.5 bg-white border border-[#E8EAF0] hover:border-[#6558D9]/50 rounded-2xl shadow-xs transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isVideo ? 'bg-indigo-50 text-indigo-600' : 'bg-[#F0EDFF] text-[#6558D9]'
                      }`}
                    >
                      {isVideo ? <Film className="w-4 h-4" /> : <FileAudio className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#171923] truncate leading-snug" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#777D8C] mt-0.5">
                        <span className="font-semibold text-slate-700">{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span className="font-extrabold uppercase text-[#6558D9]">{ext}</span>
                        {durationStr && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-slate-600">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {durationStr}
                            </span>
                          </>
                        )}
                        {isVideo && (
                          <span className="text-[10px] text-[#6558D9] bg-[#F0EDFF] px-1.5 py-0.5 rounded font-bold">
                            Audio Demux
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(idx);
                    }}
                    title="Remove file"
                    className="p-1.5 rounded-xl text-[#777D8C] hover:text-[#E5484D] hover:bg-red-50 transition-colors ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
