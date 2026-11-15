import React, { useState, useEffect } from 'react';
import { Music2, Sparkles, AlertCircle } from 'lucide-react';
import type { ModelInfo, OutputFormat, Job } from '../types';
import { FileUploader } from '../components/FileUploader';
import { ModelSelector } from '../components/ModelSelector';
import { JobProgressCard } from '../components/JobProgressCard';
import { ResultCard } from '../components/ResultCard';
import { createJob, fetchJob, deleteJob, cancelJob, retryJob } from '../services/api';
import { useToast } from '../components/Toast';

interface VocalRemoverPageProps {
  models: ModelInfo[];
  defaultFormat: OutputFormat;
  defaultModel: string;
}

export const VocalRemoverPage: React.FC<VocalRemoverPageProps> = ({
  models,
  defaultFormat,
  defaultModel,
}) => {
  const { toast } = useToast();
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel);
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(defaultFormat);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing and active jobs on initial mount
  useEffect(() => {
    const loadInitialJobs = async () => {
      try {
        const res = await fetch('/api/v1/jobs?tool_mode=vocal_remover&limit=10');
        if (res.ok) {
          const data: Job[] = await res.json();
          if (Array.isArray(data)) {
            setActiveJobs(data);
          }
        }
      } catch (err) {
        console.error('Failed to load initial jobs:', err);
      }
    };
    loadInitialJobs();
  }, []);

  // Poll active jobs
  useEffect(() => {
    const pendingJobs = activeJobs.filter(
      (j) => !['completed', 'failed', 'cancelled'].includes(j.status)
    );
    if (pendingJobs.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const updated = await Promise.all(
          activeJobs.map(async (job) => {
            if (['completed', 'failed', 'cancelled'].includes(job.status)) {
              return job;
            }
            const fresh = await fetchJob(job.id);
            if (job.status !== 'completed' && fresh.status === 'completed') {
              toast.success('Separation Complete!', `${fresh.original_filename} is ready.`);
            } else if (job.status !== 'failed' && fresh.status === 'failed') {
              toast.error('Separation Failed', fresh.error_message || fresh.status_message);
            }
            return fresh;
          })
        );
        setActiveJobs(updated);
      } catch (err) {
        console.error('Error polling jobs:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobs, toast]);

  const handleAddFiles = (newFiles: File[]) => {
    setStagedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartSeparation = async () => {
    if (stagedFiles.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const createdList: Job[] = [];
      for (const file of stagedFiles) {
        const job = await createJob(file, 'vocal_remover', selectedModel, selectedFormat);
        createdList.push(job);
      }
      setActiveJobs((prev) => [...createdList, ...prev]);
      setStagedFiles([]);
      toast.info(
        `${createdList.length} Job${createdList.length > 1 ? 's' : ''} Queued`,
        'Audio source separation started in the background.'
      );
    } catch (err: any) {
      const msg = err.message || 'Failed to start separation job';
      setErrorMessage(msg);
      toast.error('Submission failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
      toast.info('Job cancelled', 'Processing has been stopped.');
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'cancelled', status_message: 'Job cancelled by user' } : j))
      );
    } catch (err: any) {
      toast.error('Cancel failed', err.message);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const retried = await retryJob(jobId);
      toast.info('Job re-enqueued', 'Processing queued again.');
      setActiveJobs((prev) => prev.map((j) => (j.id === jobId ? retried : j)));
    } catch (err: any) {
      toast.error('Retry failed', err.message);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      setActiveJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast.success('Removed', 'Job and generated audio stems deleted.');
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  const completedJobs = activeJobs.filter((j) => j.status === 'completed');
  const workingJobs = activeJobs.filter((j) => j.status !== 'completed');

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Feature Intro Banner */}
      <div className="bg-gradient-to-r from-[#F0EDFF] via-[#FFFFFF] to-[#F6F7FB] border border-[#E8EAF0] rounded-3xl p-6 sm:p-8 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6558D9]/10 text-[#6558D9] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Music Source Separation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171923] tracking-tight">
            Vocal Remover
          </h2>
          <p className="text-sm text-[#777D8C] mt-2 max-w-xl font-medium leading-relaxed">
            Separate any song into high-fidelity isolated vocal and instrumental tracks using deep learning transformers. Perfect for karaoke, remixes, backing tracks, and music production.
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#171923] bg-white px-3 py-2 rounded-xl border border-[#E8EAF0] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
            <span>Real AI Neural Model (Demucs v4)</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#777D8C] bg-white px-3 py-2 rounded-xl border border-[#E8EAF0]">
            <span>Dual Stems: Vocals + Instrumental</span>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="mb-6">
        <FileUploader
          files={stagedFiles}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
          disabled={isSubmitting}
        />
      </div>

      {/* Model & Format Configuration */}
      <ModelSelector
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        selectedFormat={selectedFormat}
        onSelectFormat={setSelectedFormat}
      />

      {/* Action Bar */}
      {stagedFiles.length > 0 && (
        <div className="sticky bottom-6 z-20 bg-[#FFFFFF] border border-[#6558D9]/30 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#F0EDFF] text-[#6558D9]">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#171923]">
                {stagedFiles.length} {stagedFiles.length === 1 ? 'file' : 'files'} selected
              </p>
              <p className="text-xs text-[#777D8C]">
                Ready to separate into Vocals & Instrumental ({selectedFormat.toUpperCase()})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartSeparation}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6558D9] hover:bg-[#5446C9] text-white text-sm font-extrabold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Queueing Jobs...' : 'Separate Audio Now'}</span>
          </button>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 text-[#E5484D] rounded-2xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* In-Progress Jobs */}
      {workingJobs.length > 0 && (
        <div className="my-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#777D8C] mb-4">
            Processing Queue ({workingJobs.length})
          </h3>
          <div className="space-y-4">
            {workingJobs.map((job) => (
              <JobProgressCard
                key={job.id}
                job={job}
                onCancel={handleCancelJob}
                onRetry={handleRetryJob}
                onRemove={handleDeleteJob}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Results */}
      {completedJobs.length > 0 && (
        <div className="my-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#171923]">
              Separated Results ({completedJobs.length})
            </h3>
            <span className="text-xs text-[#16A36A] font-semibold">
              Ready to preview & download
            </span>
          </div>

          <div className="space-y-6">
            {completedJobs.map((job) => (
              <ResultCard
                key={job.id}
                job={job}
                onDelete={handleDeleteJob}
                onProcessAnother={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
