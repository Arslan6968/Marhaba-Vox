import React, { useState, useEffect } from 'react';
import { Music2, Sparkles, AlertCircle, Wand2, Disc3, ShieldCheck } from 'lucide-react';
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
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-[#F0EDFF]/90 via-white to-[#F6F7FB] border border-[#E8EAF0] rounded-3xl p-6 sm:p-8 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative background blur glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#6558D9]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6558D9]/10 text-[#6558D9] text-xs font-bold mb-3 border border-[#6558D9]/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Music Source Separation</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171923] tracking-tight">
            Vocal Remover Studio
          </h2>
          <p className="text-sm text-[#777D8C] mt-2 font-medium leading-relaxed">
            Separate any song into high-fidelity isolated vocal and instrumental tracks using deep learning hybrid transformers. Engineered for pristine karaoke, acoustic remixing, and professional music production.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold text-[#171923]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E8EAF0] shadow-2xs">
              <Disc3 className="w-3.5 h-3.5 text-[#6558D9]" />
              Dual Stems: Vocals + Instrumental
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E8EAF0] shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A36A]" />
              Studio Grade SDR ~9.0 dB
            </span>
          </div>
        </div>

        {/* Real-time Visualizer Card */}
        <div className="relative z-10 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8EAF0] shadow-xs flex flex-col gap-2 shrink-0 self-start md:self-auto min-w-[200px]">
          <div className="flex items-center justify-between text-xs font-bold text-[#171923]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16A36A] animate-pulse" />
              Engine Online
            </span>
            <span className="text-[10px] text-[#6558D9] bg-[#F0EDFF] px-2 py-0.5 rounded font-extrabold">HTDemucs</span>
          </div>

          <div className="h-6 flex items-end justify-between gap-1 py-0.5 px-1 bg-[#F6F7FB] rounded-lg">
            <span className="w-1 bg-[#6558D9] rounded-full eq-bar-1" />
            <span className="w-1 bg-[#9185F5] rounded-full eq-bar-2" />
            <span className="w-1 bg-[#6558D9] rounded-full eq-bar-3" />
            <span className="w-1 bg-[#9185F5] rounded-full eq-bar-4" />
            <span className="w-1 bg-[#6558D9] rounded-full eq-bar-5" />
            <span className="w-1 bg-[#9185F5] rounded-full eq-bar-6" />
            <span className="w-1 bg-[#6558D9] rounded-full eq-bar-2" />
            <span className="w-1 bg-[#9185F5] rounded-full eq-bar-4" />
          </div>

          <span className="text-[10px] text-[#777D8C] text-center font-medium">44.1kHz • Multi-Core CPU Mode</span>
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

      {/* Floating Action Bar */}
      {stagedFiles.length > 0 && (
        <div className="sticky bottom-6 z-30 bg-white/95 backdrop-blur-md border border-[#6558D9]/30 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6558D9] to-[#8678FA] text-white flex items-center justify-center shadow-md">
              <Music2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#171923]">
                {stagedFiles.length} {stagedFiles.length === 1 ? 'audio track' : 'audio tracks'} ready
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
            className="relative overflow-hidden flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#6558D9] via-[#786AF8] to-[#9185F5] hover:opacity-95 text-white text-sm font-extrabold shadow-lg shadow-[#6558D9]/30 transition-all active:scale-95 disabled:opacity-50 shimmer-btn"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Queueing Jobs...' : 'Separate Audio Now'}</span>
          </button>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 text-[#E5484D] rounded-2xl text-xs flex items-center gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* In-Progress Jobs */}
      {workingJobs.length > 0 && (
        <div className="my-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#171923]">
              Active Separation Queue ({workingJobs.length})
            </h3>
            <span className="text-xs text-[#6558D9] bg-[#F0EDFF] px-2 py-0.5 rounded-full font-bold">Live</span>
          </div>

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
            <h3 className="text-base font-extrabold text-[#171923] tracking-tight">
              Separated Results ({completedJobs.length})
            </h3>
            <span className="text-xs text-[#16A36A] font-bold bg-[#16A36A]/10 px-2.5 py-1 rounded-full border border-[#16A36A]/20">
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
