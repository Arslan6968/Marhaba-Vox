import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Clock, Sparkles, RotateCw, XCircle, Trash2 } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#16A36A]/10 text-[#16A36A]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Separation Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E5484D]/10 text-[#E5484D]">
            <AlertCircle className="w-3.5 h-3.5" />
            Separation Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            In Queue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0EDFF] text-[#6558D9]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        );
    }
  };

  const isWorking = ['waiting', 'uploading', 'preparing', 'separating', 'exporting'].includes(job.status);
  const isFailedOrCancelled = ['failed', 'cancelled'].includes(job.status);

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAF0] rounded-2xl p-5 shadow-xs mb-4 hover:border-[#6558D9]/30 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#777D8C]">
              {job.tool_mode === 'vocal_remover' ? 'Vocal Remover' : 'Acapella Extractor'}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-medium text-[#777D8C]">{job.model_name}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-bold uppercase text-[#6558D9]">{job.output_format}</span>
          </div>
          <h3 className="text-base font-extrabold text-[#171923] truncate mt-0.5" title={job.original_filename}>
            {job.original_filename}
          </h3>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Progress Bar & Status Text */}
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[#171923] flex items-center gap-1.5">
            {isWorking && <Sparkles className="w-3.5 h-3.5 text-[#6558D9] animate-spin" />}
            {job.status_message}
          </span>
          <span className="font-mono text-[#6558D9]">{job.progress}%</span>
        </div>

        <div className="w-full bg-[#E8EAF0] h-2.5 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              job.status === 'failed'
                ? 'bg-[#E5484D]'
                : job.status === 'cancelled'
                ? 'bg-slate-400'
                : job.status === 'completed'
                ? 'bg-[#16A36A]'
                : 'bg-gradient-to-r from-[#6558D9] to-[#9185F5]'
            }`}
            style={{ width: `${Math.max(job.progress, 5)}%` }}
          />
        </div>
      </div>

      {/* Error Details */}
      {job.error_message && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#E5484D] leading-relaxed">
          <strong>Error details:</strong> {job.error_message}
        </div>
      )}

      {/* Time & Action Toolbar */}
      <div className="mt-4 pt-3 border-t border-[#E8EAF0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#777D8C]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {job.processing_duration_seconds > 0
              ? `Processing time: ${job.processing_duration_seconds}s`
              : job.status === 'waiting'
              ? 'Waiting in queue...'
              : 'Processing in real-time...'}
          </span>
          {job.duration_seconds > 0 && (
            <span>Audio length: {Math.round(job.duration_seconds)}s</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onRetry && isFailedOrCancelled && (
            <button
              type="button"
              onClick={() => onRetry(job.id)}
              className="flex items-center gap-1 text-xs font-semibold text-[#6558D9] hover:underline"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Job</span>
            </button>
          )}

          {onCancel && isWorking && (
            <button
              type="button"
              onClick={() => onCancel(job.id)}
              className="text-xs font-semibold text-[#E5484D] hover:underline"
            >
              Cancel Job
            </button>
          )}

          {onRemove && (job.status === 'completed' || isFailedOrCancelled) && (
            <button
              type="button"
              onClick={() => onRemove(job.id)}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-[#E5484D] transition-colors"
              title="Remove from list"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
