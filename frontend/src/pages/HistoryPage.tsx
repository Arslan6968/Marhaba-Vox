import React, { useEffect, useState, useCallback } from 'react';
import { History, Download, Trash2, CheckCircle2, AlertCircle, FileAudio, RotateCw, Search, XCircle, RotateCcw, Clock, Music2 } from 'lucide-react';
import type { Job, HistoryData } from '../types';
import { fetchHistory, clearHistory, deleteJob, retryJob } from '../services/api';
import { ResultCard } from '../components/ResultCard';
import { useToast } from '../components/Toast';

export const HistoryPage: React.FC = () => {
  const { toast } = useToast();
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [toolModeFilter, setToolModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchHistory(0, 50, searchTerm, toolModeFilter, statusFilter);
      setHistoryData(data);
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Failed to load history', 'Unable to retrieve recent audio jobs.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, toolModeFilter, statusFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      if (selectedJob?.id === jobId) setSelectedJob(null);
      toast.success('Job deleted', 'Audio stems and records removed successfully.');
      await loadData();
    } catch (err) {
      console.error('Failed to delete job:', err);
      toast.error('Failed to delete job', 'Could not delete job files.');
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await retryJob(jobId);
      toast.info('Job Re-enqueued', 'Audio processing re-queued in the background.');
      await loadData();
    } catch (err) {
      console.error('Failed to retry job:', err);
      toast.error('Retry failed', 'Could not re-queue this job.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all processing history and delete cached stems?')) {
      return;
    }
    try {
      await clearHistory();
      setSelectedJob(null);
      toast.success('History cleared', 'All separation records have been reset.');
      await loadData();
    } catch (err) {
      console.error('Failed to clear history:', err);
      toast.error('Clear failed', 'Failed to clear history records.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header & KPI Summary Banner */}
      <div className="bg-white border border-[#E8EAF0] rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-2 rounded-xl bg-[#F0EDFF] text-[#6558D9]">
                <History className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#6558D9]">
                Session Archive
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171923] tracking-tight">
              Processing History & Library
            </h2>
            <p className="text-xs text-[#777D8C] mt-1 font-medium">
              Browse previously separated audio sessions, review metrics, and download output stems.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              title="Refresh history"
              className="p-2.5 rounded-xl bg-[#F6F7FB] hover:bg-slate-200 text-[#171923] border border-[#E8EAF0] transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            {historyData && historyData.total_count > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#E5484D] text-xs font-bold transition-colors border border-red-200/60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Archive</span>
              </button>
            )}
          </div>
        </div>

        {/* Aggregate KPI counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#FAF9FE] p-4 sm:p-5 rounded-2xl border border-[#E8EAF0] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#777D8C] block uppercase tracking-wider mb-1">Total Audio Tracks</span>
              <span className="text-2xl sm:text-3xl font-black text-[#171923]">
                {historyData?.total_count || 0}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#E8EAF0] text-[#6558D9] shadow-2xs">
              <Music2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#FAF9FE] p-4 sm:p-5 rounded-2xl border border-[#E8EAF0] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#777D8C] block uppercase tracking-wider mb-1">Completed Stems</span>
              <span className="text-2xl sm:text-3xl font-black text-[#16A36A]">
                {historyData?.completed_count || 0}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#E8EAF0] text-[#16A36A] shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#FAF9FE] p-4 sm:p-5 rounded-2xl border border-[#E8EAF0] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#777D8C] block uppercase tracking-wider mb-1">Total Compute Time</span>
              <span className="text-2xl sm:text-3xl font-black text-[#6558D9]">
                {historyData?.total_processing_seconds || 0}s
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#E8EAF0] text-[#6558D9] shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-5 border-t border-[#E8EAF0]">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by audio filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F6F7FB] border border-[#E8EAF0] rounded-xl text-xs text-[#171923] placeholder-slate-400 focus:outline-none focus:border-[#6558D9] focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tool Mode Filter */}
            <div className="flex items-center gap-1 bg-[#F6F7FB] border border-[#E8EAF0] rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setToolModeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  toolModeFilter === 'all'
                    ? 'bg-white text-[#6558D9] shadow-xs'
                    : 'text-[#777D8C] hover:text-[#171923]'
                }`}
              >
                All Tools
              </button>
              <button
                type="button"
                onClick={() => setToolModeFilter('vocal_remover')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  toolModeFilter === 'vocal_remover'
                    ? 'bg-white text-[#6558D9] shadow-xs'
                    : 'text-[#777D8C] hover:text-[#171923]'
                }`}
              >
                Vocal Remover
              </button>
              <button
                type="button"
                onClick={() => setToolModeFilter('acapella_extractor')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  toolModeFilter === 'acapella_extractor'
                    ? 'bg-white text-[#6558D9] shadow-xs'
                    : 'text-[#777D8C] hover:text-[#171923]'
                }`}
              >
                Acapella
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-[#F6F7FB] border border-[#E8EAF0] rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-[#171923] shadow-xs'
                    : 'text-[#777D8C] hover:text-[#171923]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-white text-[#16A36A] shadow-xs'
                    : 'text-[#777D8C] hover:text-[#171923]'
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('failed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'failed'
                    ? 'bg-white text-[#E5484D] shadow-xs'
                    : 'text-[#777D8C] hover:text-[#171923]'
                }`}
              >
                Failed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Job Expanded Waveform Player */}
      {selectedJob && (
        <div className="mb-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6558D9]">
              Active Player Preview
            </h3>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-xs font-bold text-[#777D8C] hover:text-[#171923] transition-colors"
            >
              Close Preview
            </button>
          </div>
          <ResultCard job={selectedJob} onDelete={handleDelete} />
        </div>
      )}

      {/* History Table */}
      {isLoading ? (
        <div className="p-16 text-center text-sm font-bold text-[#777D8C] bg-white rounded-3xl border border-[#E8EAF0]">
          Loading processing archive...
        </div>
      ) : !historyData || historyData.jobs.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-[#E8EAF0]">
          <div className="w-14 h-14 mx-auto mb-3 rounded-3xl bg-[#F0EDFF] text-[#6558D9] flex items-center justify-center shadow-xs">
            <FileAudio className="w-7 h-7" />
          </div>
          <h4 className="text-base font-extrabold text-[#171923] mb-1">No audio jobs found</h4>
          <p className="text-xs text-[#777D8C] max-w-sm mx-auto">
            {searchTerm || toolModeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search query or filter selections.'
              : 'Upload an audio track in Vocal Remover or Acapella Extractor to see your session results recorded here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8EAF0] rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FD] border-b border-[#E8EAF0] text-[#777D8C] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-5">Audio Track</th>
                  <th className="py-4 px-4">Tool Mode</th>
                  <th className="py-4 px-4">Model & Format</th>
                  <th className="py-4 px-4">Duration / Size</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EAF0]">
                {historyData.jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  const isFailed = job.status === 'failed' || job.status === 'cancelled';

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#F0EDFF]/35' : 'hover:bg-[#FAF9FD]'
                      }`}
                    >
                      <td className="py-4 px-5 font-bold text-[#171923] max-w-xs truncate" title={job.original_filename}>
                        {job.original_filename}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-[#6558D9] bg-[#F0EDFF] px-2.5 py-1 rounded-full text-[10px] uppercase">
                          {job.tool_mode === 'vocal_remover' ? 'Vocal Remover' : 'Acapella Extractor'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-[#171923]">{job.model_name}</span>{' '}
                        <span className="font-extrabold text-[#777D8C] uppercase">({job.output_format})</span>
                      </td>
                      <td className="py-4 px-4 text-[#777D8C] font-medium">
                        {job.duration_seconds > 0 ? `${Math.round(job.duration_seconds)}s` : '-'} • {formatFileSize(job.file_size_bytes)}
                      </td>
                      <td className="py-4 px-4 text-[#777D8C] whitespace-nowrap font-medium">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        {job.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[#16A36A] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Done ({job.processing_duration_seconds}s)
                          </span>
                        ) : job.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-[#E5484D] font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Failed
                          </span>
                        ) : job.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelled
                          </span>
                        ) : (
                          <span className="text-[#6558D9] font-bold capitalize">
                            {job.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {isFailed && (
                            <button
                              type="button"
                              onClick={() => handleRetry(job.id)}
                              title="Retry Job"
                              className="p-2 rounded-xl bg-[#F0EDFF] text-[#6558D9] hover:bg-[#6558D9] hover:text-white transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {job.zip_download_url && (
                            <a
                              href={job.zip_download_url}
                              download
                              title="Download ZIP"
                              className="p-2 rounded-xl bg-[#F0EDFF] text-[#6558D9] hover:bg-[#6558D9] hover:text-white transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(job.id)}
                            title="Delete"
                            className="p-2 rounded-xl text-[#777D8C] hover:text-[#E5484D] hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
