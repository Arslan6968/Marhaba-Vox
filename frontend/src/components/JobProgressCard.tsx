import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Clock, Sparkles, RotateCw, XCircle, Trash2, Cpu } from 'lucide-react';
import type { Job } from '../types';

interface JobProgressCardProps {
  job: Job;
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
  onRemove?: (jobId: string) => void;
}

export const JobProgressCard: React.FC<JobProgressCardProps> = ({
  job,
  onCancel,
  onRetry,
  onRemove,
}) => {
  const getStatusBadge = () => {
    switch (job.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#16A36A]/10 text-[#16A36A] border border-[#16A36A]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Separation Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E5484D]/10 text-[#E5484D] border border-[#E5484D]/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Separation Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            In Queue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0EDFF] text-[#6558D9] border border-[#6558D9]/25 shadow-2xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {job.status === 'separating' ? 'AI Separating' : job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        );
    }
  };

  const isWorking = ['waiting', 'uploading', 'preparing', 'separating', 'exporting'].includes(job.status);
  const isSeparating = job.status === 'separating';
  const isFailedOrCancelled = ['failed', 'cancelled'].includes(job.status);

  // Determine active stage in pipeline (1-4)
  const getPipelineStage = () => {
    if (job.status === 'completed') return 4;
    if (job.status === 'exporting') return 3;
    if (job.status === 'separating') return 2;
    return 1;
  };
  const currentStage = getPipelineStage();

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-3xl p-5 sm:p-6 shadow-xs mb-4 hover:border-[#6558D9]/40 transition-all duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6558D9] bg-[#F0EDFF] px-2.5 py-0.5 rounded-full">
              {job.tool_mode === 'vocal_remover' ? 'Vocal Remover' : 'Acapella Extractor'}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-semibold text-[#171923] flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-[#6558D9]" />
              {job.model_name}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-extrabold uppercase text-[#777D8C]">{job.output_format}</span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-[#171923] truncate" title={job.original_filename}>
            {job.original_filename}
          </h3>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Processing Pipeline Stages */}
      {isWorking && (
        <div className="grid grid-cols-4 gap-2 mb-4 py-2 border-y border-[#E8EAF0]/70 text-[11px]">
          <div className={`flex items-center gap-1.5 font-bold ${currentStage >= 1 ? 'text-[#6558D9]' : 'text-slate-400'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentStage >= 1 ? 'bg-[#6558D9] text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
            <span className="truncate">Ingest</span>
          </div>
          <div className={`flex items-center gap-1.5 font-bold ${currentStage >= 2 ? 'text-[#6558D9]' : 'text-slate-400'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentStage >= 2 ? 'bg-[#6558D9] text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
            <span className="truncate">Separation</span>
          </div>
          <div className={`flex items-center gap-1.5 font-bold ${currentStage >= 3 ? 'text-[#6558D9]' : 'text-slate-400'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentStage >= 3 ? 'bg-[#6558D9] text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
            <span className="truncate">Synthesis</span>
          </div>
          <div className={`flex items-center gap-1.5 font-bold ${currentStage >= 4 ? 'text-[#6558D9]' : 'text-slate-400'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentStage >= 4 ? 'bg-[#6558D9] text-white' : 'bg-slate-200 text-slate-500'}`}>4</span>
            <span className="truncate">Export</span>
          </div>
        </div>
      )}

      {/* Progress Bar & Status Text */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[#171923] flex items-center gap-2 truncate">
            {isSeparating && (
              <div className="flex items-center gap-0.5 h-3.5 px-1 bg-[#F0EDFF] rounded">
                <span className="w-0.5 h-2 rounded-full bg-[#6558D9] eq-bar-1" />
                <span className="w-0.5 h-3 rounded-full bg-[#9185F5] eq-bar-2" />
                <span className="w-0.5 h-1.5 rounded-full bg-[#6558D9] eq-bar-3" />
                <span className="w-0.5 h-2.5 rounded-full bg-[#9185F5] eq-bar-4" />
              </div>
            )}
            {isWorking && !isSeparating && <Sparkles className="w-3.5 h-3.5 text-[#6558D9] animate-spin" />}
            <span className="font-bold">{job.status_message}</span>
          </span>
          <span className="font-mono text-sm font-extrabold text-[#6558D9]">{job.progress}%</span>
        </div>

        <div className="w-full bg-[#E8EAF0] h-3 rounded-full overflow-hidden relative shadow-inner">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              job.status === 'failed'
                ? 'bg-[#E5484D]'
                : job.status === 'cancelled'
                ? 'bg-slate-400'
                : job.status === 'completed'
                ? 'bg-[#16A36A]'
                : 'bg-gradient-to-r from-[#6558D9] via-[#8577F8] to-[#9185F5]'
            }`}
            style={{ width: `${Math.max(job.progress, 4)}%` }}
          />
        </div>
      </div>

      {/* Error Details */}
      {job.error_message && (
        <div className="mt-3.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-[#E5484D] leading-relaxed shadow-2xs">
          <strong className="font-bold">Error details:</strong> {job.error_message}
        </div>
      )}

      {/* Time & Action Toolbar */}
      <div className="mt-4 pt-3.5 border-t border-[#E8EAF0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#777D8C]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {job.processing_duration_seconds > 0
              ? `Processing time: ${job.processing_duration_seconds}s`
              : job.status === 'waiting'
              ? 'Waiting in queue...'
              : 'Processing in real-time...'}
          </span>
          {job.duration_seconds > 0 && (
            <span className="font-semibold text-slate-700">Audio length: {Math.round(job.duration_seconds)}s</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onRetry && isFailedOrCancelled && (
            <button
              type="button"
              onClick={() => onRetry(job.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0EDFF] hover:bg-[#E4DFFF] text-[#6558D9] text-xs font-bold transition-all shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Job</span>
            </button>
          )}

          {onCancel && isWorking && (
            <button
              type="button"
              onClick={() => onCancel(job.id)}
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#E5484D] text-xs font-bold transition-colors"
            >
              Cancel Job
            </button>
          )}

          {onRemove && (job.status === 'completed' || isFailedOrCancelled) && (
            <button
              type="button"
              onClick={() => onRemove(job.id)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-[#E5484D] hover:bg-red-50 transition-colors"
              title="Remove from list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
