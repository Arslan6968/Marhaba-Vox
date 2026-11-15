import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, FileAudio, X, AlertCircle, Film, Clock } from 'lucide-react';

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
      const isDuplicate = files.some(
        (f) => f.name === file.name && f.size === file.size
      ) || valid.some((f) => f.name === file.name && f.size === file.size);

      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!supportedExtensions.includes(ext)) {
        setErrorMsg(`File "${file.name}" has an unsupported format. Supported formats: MP3, WAV, FLAC, M4A, AAC, MP4.`);
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
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-[#6558D9] bg-[#F0EDFF]/50 scale-[1.005]'
            : 'border-[#E8EAF0] hover:border-[#6558D9]/50 hover:bg-[#F6F7FB]/70 bg-[#FFFFFF]'
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
          <div className="w-16 h-16 mb-4 rounded-2xl bg-[#F0EDFF] text-[#6558D9] flex items-center justify-center shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#171923] mb-1">
            Drop your audio files here
          </h3>
          <p className="text-sm font-semibold text-[#6558D9] mb-3">
            or browse from your device
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#777D8C] max-w-md">
            <span className="bg-[#F6F7FB] px-2.5 py-1 rounded-md border border-[#E8EAF0]">
              MP3 • WAV • FLAC • M4A • AAC • MP4
            </span>
            <span className="bg-[#F6F7FB] px-2.5 py-1 rounded-md border border-[#E8EAF0]">
              Max {maxSizeMb}MB per file
            </span>
            <span className="bg-[#F6F7FB] px-2.5 py-1 rounded-md border border-[#E8EAF0]">
              Up to {maxFiles} files batch
            </span>
          </div>
        </div>
      </div>

      {/* Validation alert */}
      {errorMsg && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-[#E5484D] rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Staged file cards */}
      {files.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#777D8C]">
              Files Ready for Processing ({files.length}/{maxFiles})
            </span>
            <button
              type="button"
              onClick={() => {
                for (let i = files.length - 1; i >= 0; i--) onRemoveFile(i);
              }}
              className="text-xs font-medium text-[#E5484D] hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {files.map((file, idx) => {
              const isVideo = file.name.endsWith('.mp4') || file.name.endsWith('.mkv');
              const fileKey = `${file.name}-${file.size}`;
              const durationStr = formatDuration(fileDurations[fileKey]);

              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-3 bg-[#FFFFFF] border border-[#E8EAF0] rounded-xl shadow-2xs group hover:border-[#6558D9]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[#F0EDFF] text-[#6558D9] shrink-0">
                      {isVideo ? <Film className="w-4 h-4" /> : <FileAudio className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#171923] truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#777D8C] mt-0.5">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span className="uppercase">{file.name.split('.').pop()}</span>
                        {durationStr && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 font-medium text-slate-600">
                              <Clock className="w-3 h-3" />
                              {durationStr}
                            </span>
                          </>
                        )}
                        {isVideo && (
                          <span className="text-[10px] text-[#6558D9] bg-[#F0EDFF] px-1.5 rounded">
                            Audio Extract
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
                    className="p-1 rounded-lg text-[#777D8C] hover:text-[#E5484D] hover:bg-red-50 transition-colors ml-2"
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
