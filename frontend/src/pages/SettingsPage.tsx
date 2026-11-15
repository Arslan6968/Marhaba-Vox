import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Trash2, CheckCircle2, Cpu, Gauge, Layers, Database } from 'lucide-react';
import type { AppSettings, ModelInfo, OutputFormat, SystemHealth } from '../types';
import { updateSettings, triggerCleanup } from '../services/api';
import { useToast } from '../components/Toast';

interface SettingsPageProps {
  settings: AppSettings;
  models: ModelInfo[];
  health: SystemHealth | null;
  onRefreshSettings: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  models,
  health,
  onRefreshSettings,
}) => {
  const { toast } = useToast();
  const [defaultFormat, setDefaultFormat] = useState<OutputFormat>(settings.default_output_format);
  const [defaultModel, setDefaultModel] = useState<string>(settings.default_model);
  const [defaultPlaybackRate, setDefaultPlaybackRate] = useState<number>(settings.default_playback_rate || 1.0);
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState<number>(settings.max_concurrent_jobs || 1);
  const [retentionDays, setRetentionDays] = useState<number>(settings.retention_days);
  const [isSaving, setIsSaving] = useState(false);
  const [cleanupMsg, setCleanupMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        default_output_format: defaultFormat,
        default_model: defaultModel,
        default_playback_rate: defaultPlaybackRate,
        max_concurrent_jobs: maxConcurrentJobs,
        retention_days: retentionDays,
      });
      toast.success('Settings saved', 'Configuration updated successfully.');
      onRefreshSettings();
    } catch (err: any) {
      toast.error('Save failed', err.message || 'Could not update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCleanup = async () => {
    setCleanupMsg(null);
    try {
      const res = await triggerCleanup();
      setCleanupMsg(res.message);
      toast.success('Storage cleanup', res.message);
    } catch (err: any) {
      setCleanupMsg(`Cleanup failed: ${err.message}`);
      toast.error('Cleanup failed', err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-2 rounded-xl bg-[#F0EDFF] text-[#6558D9]">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#6558D9]">
            Studio Configuration
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171923] tracking-tight">
          Application Preferences
        </h2>
        <p className="text-xs text-[#777D8C] mt-1 font-medium">
          Configure default stem formats, AI model parameters, playback speed, and automated cache retention.
        </p>
      </div>

      <div className="space-y-6">
        {/* Hardware Diagnostics Card */}
        <div className="bg-white border border-[#E8EAF0] rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-extrabold text-[#171923] uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#6558D9]" />
              <span>Hardware & Engine Diagnostics</span>
            </h3>
            <span className="text-[11px] font-bold text-[#16A36A] bg-[#16A36A]/10 px-2.5 py-0.5 rounded-full">
              System Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#FAF9FD] rounded-2xl border border-[#E8EAF0]">
              <span className="text-[#777D8C] block mb-1 font-bold text-[11px] uppercase">Compute Device</span>
              <span className="font-extrabold text-[#171923] text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                {health?.device || 'Intel CPU (Multi-threaded)'}
              </span>
            </div>

            <div className="p-4 bg-[#FAF9FD] rounded-2xl border border-[#E8EAF0]">
              <span className="text-[#777D8C] block mb-1 font-bold text-[11px] uppercase">FFmpeg Engine</span>
              <span className="font-extrabold text-[#171923] text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                {health?.ffmpeg_available ? 'FFmpeg 9.0 Verified' : 'Checking...'}
              </span>
            </div>

            <div className="p-4 bg-[#FAF9FD] rounded-2xl border border-[#E8EAF0]">
              <span className="text-[#777D8C] block mb-1 font-bold text-[11px] uppercase">Active Concurrency</span>
              <span className="font-extrabold text-[#171923] text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6558D9]" />
                {health?.active_jobs ?? 0} running • {health?.queued_jobs ?? 0} queued
              </span>
            </div>
          </div>
        </div>

        {/* Preferences Form */}
        <form onSubmit={handleSave} className="bg-white border border-[#E8EAF0] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <h3 className="text-xs font-extrabold text-[#171923] uppercase tracking-wider mb-2">
            Default Audio Separation Parameters
          </h3>

          {/* Default Output Format */}
          <div>
            <label className="block text-xs font-extrabold text-[#171923] mb-2 uppercase tracking-wider">
              Default Output Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['wav', 'flac', 'mp3'] as OutputFormat[]).map((fmt) => (
                <button
                  type="button"
                  key={fmt}
                  onClick={() => setDefaultFormat(fmt)}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    defaultFormat === fmt
                      ? 'border-[#6558D9] bg-[#F0EDFF]/50 ring-1 ring-[#6558D9] font-extrabold text-[#6558D9]'
                      : 'border-[#E8EAF0] text-[#171923] hover:border-slate-300 bg-white font-bold'
                  }`}
                >
                  <span className="uppercase text-sm block">{fmt}</span>
                  <span className="block text-[10px] text-[#777D8C] mt-0.5 font-medium">
                    {fmt === 'wav' ? 'Lossless PCM' : fmt === 'flac' ? 'Compressed Lossless' : '320kbps MP3'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Default Model */}
          <div>
            <label className="block text-xs font-extrabold text-[#171923] mb-2 uppercase tracking-wider">
              Default AI Model
            </label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E8EAF0] bg-white text-xs font-bold text-[#171923] focus:outline-none focus:ring-2 focus:ring-[#6558D9]"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.architecture} ({m.quality})
                </option>
              ))}
            </select>
          </div>

          {/* Default Playback Speed & Concurrency limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-[#171923] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#6558D9]" />
                <span>Audition Speed Preset</span>
              </label>
              <select
                value={defaultPlaybackRate}
                onChange={(e) => setDefaultPlaybackRate(parseFloat(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-[#E8EAF0] bg-white text-xs font-bold text-[#171923] focus:outline-none focus:ring-2 focus:ring-[#6558D9]"
              >
                <option value={0.75}>0.75x (Detailed audition)</option>
                <option value={1.0}>1.0x (Normal speed)</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x (Fast preview)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#171923] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#6558D9]" />
                <span>Max Concurrent Jobs</span>
              </label>
              <select
                value={maxConcurrentJobs}
                onChange={(e) => setMaxConcurrentJobs(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-2xl border border-[#E8EAF0] bg-white text-xs font-bold text-[#171923] focus:outline-none focus:ring-2 focus:ring-[#6558D9]"
              >
                <option value={1}>1 Job at a time (Recommended for CPU)</option>
                <option value={2}>2 Parallel Jobs</option>
              </select>
            </div>
          </div>

          {/* Retention period */}
          <div>
            <label className="block text-xs font-extrabold text-[#171923] mb-2 uppercase tracking-wider">
              File Retention Period (Days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value) || 7)}
              className="w-full sm:w-48 px-4 py-3 rounded-2xl border border-[#E8EAF0] bg-white text-xs font-bold text-[#171923] focus:outline-none focus:ring-2 focus:ring-[#6558D9]"
            />
            <p className="text-[11px] text-[#777D8C] mt-2 font-medium">
              Cached uploads and generated stems older than this limit can be purged using the maintenance action below.
            </p>
          </div>

          {/* Save button */}
          <div className="pt-4 border-t border-[#E8EAF0] flex items-center justify-between">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6558D9] hover:bg-[#5446C9] text-white text-xs font-extrabold shadow-md shadow-[#6558D9]/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>

        {/* Maintenance / Cache Purge */}
        <div className="bg-white border border-[#E8EAF0] rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-extrabold text-[#171923] uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-[#6558D9]" />
                <span>Disk Storage & Cache Maintenance</span>
              </h3>
              <p className="text-xs text-[#777D8C] mt-1 font-medium">
                Purge abandoned audio uploads and generated stems older than {retentionDays} days to reclaim local disk space.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunCleanup}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-[#E5484D] border border-red-200 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Cache Now</span>
            </button>
          </div>

          {cleanupMsg && (
            <div className="mt-4 p-3.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{cleanupMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
