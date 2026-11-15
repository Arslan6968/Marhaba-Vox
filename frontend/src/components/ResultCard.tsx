import React, { useState } from 'react';
import { Trash2, RotateCcw, Archive, CheckCircle2, Clock, HardDrive, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { Job } from '../types';
import { WaveformPlayer } from './WaveformPlayer';
import { AudioComparisonPlayer } from './AudioComparisonPlayer';

interface ResultCardProps {
  job: Job;
  onDelete?: (jobId: string) => void;
  onProcessAnother?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  job,
  onDelete,
  onProcessAnother,
}) => {
  const [showComparison, setShowComparison] = useState(true);

  const vocalStem = job.stems.find((s) => s.stem_type === 'vocals');
  const instrumentalStem = job.stems.find((s) => s.stem_type === 'instrumental');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isVocalRemover = job.tool_mode === 'vocal_remover';

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-3xl p-6 sm:p-8 shadow-sm mb-8 hover:border-[#6558D9]/30 transition-all duration-300">
      {/* Result Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E8EAF0]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#6558D9] bg-[#F0EDFF] px-3 py-1 rounded-full">
              {isVocalRemover ? 'Vocal Remover' : 'Acapella Extractor'}
            </span>
            <span className="text-xs font-bold text-[#16A36A] bg-[#16A36A]/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#16A36A]/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Separated Successfully
            </span>
            <span className="text-xs text-[#777D8C] font-mono bg-[#F6F7FB] px-2.5 py-1 rounded-md border border-[#E8EAF0]">
              Model: {job.model_name}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-[#171923] tracking-tight" title={job.original_filename}>
            {job.original_filename}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#777D8C] mt-2.5 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Separation time: <strong className="text-[#171923]">{job.processing_duration_seconds}s</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              Source size: {formatFileSize(job.file_size_bytes)}
            </span>
            {job.duration_seconds > 0 && (
              <>
                <span>•</span>
                <span>Track length: {Math.round(job.duration_seconds)}s</span>
              </>
            )}
            <span>•</span>
            <span className="font-extrabold uppercase text-[#6558D9] bg-[#F0EDFF] px-2 py-0.5 rounded">
              {job.output_format}
            </span>
          </div>
        </div>

        {/* Global Result Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
              showComparison
                ? 'bg-[#F0EDFF] text-[#6558D9] border-purple-300 ring-1 ring-[#6558D9]/30'
                : 'bg-[#F6F7FB] text-[#777D8C] border-[#E8EAF0] hover:text-[#171923]'
            }`}
            title="Toggle A/B Audio Comparison Player"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>A/B Audition Console</span>
          </button>

          {job.zip_download_url && (
            <a
              href={job.zip_download_url}
              download
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6558D9] via-[#786AF8] to-[#9185F5] hover:opacity-95 text-white text-xs font-extrabold shadow-md shadow-[#6558D9]/25 transition-all active:scale-95"
            >
              <Archive className="w-4 h-4" />
              <span>Download All (ZIP)</span>
            </a>
          )}

          {onProcessAnother && (
            <button
              type="button"
              onClick={onProcessAnother}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F6F7FB] hover:bg-slate-200 text-[#171923] border border-[#E8EAF0] text-xs font-bold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Process Another</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(job.id)}
              title="Delete result and files"
              className="p-2.5 text-[#777D8C] hover:text-[#E5484D] hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Synchronized A/B Comparison Player */}
      {showComparison && (
        <div className="mt-6">
          <AudioComparisonPlayer
            originalUrl={job.original_audio_url}
            vocalsUrl={vocalStem?.download_url}
            instrumentalUrl={instrumentalStem?.download_url}
            filename={job.original_filename}
          />
        </div>
      )}

      {/* Waveform Player Section */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#6558D9]" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#171923]">
              Individual Stem Waveforms & Downloads
            </h4>
          </div>
          <span className="text-xs text-[#777D8C] font-medium">Click to audition or download stems individually</span>
        </div>

        {/* For Vocal Remover: Show Instrumental first (primary), then Vocals */}
        {isVocalRemover ? (
          <>
            {instrumentalStem && (
              <WaveformPlayer
                audioUrl={instrumentalStem.download_url}
                stemType="instrumental"
                title="Separated Instrumental Backing Track"
                fileName={instrumentalStem.file_name}
                format={instrumentalStem.format}
                duration={instrumentalStem.duration_seconds}
              />
            )}
            {vocalStem && (
              <WaveformPlayer
                audioUrl={vocalStem.download_url}
                stemType="vocals"
                title="Extracted Vocal Stem"
                fileName={vocalStem.file_name}
                format={vocalStem.format}
                duration={vocalStem.duration_seconds}
              />
            )}
          </>
        ) : (
          /* For Acapella Extractor: Show Vocals first (primary), with Instrumental accessible */
          <>
            {vocalStem && (
              <WaveformPlayer
                audioUrl={vocalStem.download_url}
                stemType="vocals"
                title="Isolated Acapella Vocal Performance"
                fileName={vocalStem.file_name}
                format={vocalStem.format}
                duration={vocalStem.duration_seconds}
              />
            )}
            {instrumentalStem && (
              <WaveformPlayer
                audioUrl={instrumentalStem.download_url}
                stemType="instrumental"
                title="Backing Instrumental Stem"
                fileName={instrumentalStem.file_name}
                format={instrumentalStem.format}
                duration={instrumentalStem.duration_seconds}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
