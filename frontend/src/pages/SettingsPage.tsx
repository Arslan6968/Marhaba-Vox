import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Trash2, CheckCircle2, Cpu, Gauge, Layers } from 'lucide-react';
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
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-[#F0EDFF] text-[#6558D9]">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#777D8C]">
            Configuration
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#171923] tracking-tight">
          Application Settings
        </h2>
        <p className="text-sm text-[#777D8C] mt-1 font-medium">
          Manage your AI model preferences, stem output formats, audio preview speed, and background queue limits.
        </p>
      </div>

      <div className="space-y-6">
        {/* System & Hardware Diagnostic Card */}
        <div className="bg-[#FFFFFF] border border-[#E8EAF0] rounded-3xl p-6 shadow-xs">
          <h3 className="text-sm font-extrabold text-[#171923] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#6558D9]" />
            <span>Hardware & AI Engine Diagnostics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-[#F6F7FB] rounded-2xl border border-[#E8EAF0]">
              <span className="text-[#777D8C] block mb-1">Inference Device</span>
              <span className="font-bold text-[#171923] text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                {health?.device || 'CPU Execution Mode'}
              </span>
            </div>

            <div className="p-3.5 bg-[#F6F7FB] rounded-2xl border border-[#E8EAF0]">
              <span className="text-[#777D8C] block mb-1">FFmpeg Engine</span>
              <span className="font-bold text-[#171923] text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                {health?.ffmpeg_available ? 'FFmpeg 9.0 Verified' : 'Checking...'}
              </span>
            </div>

            <div className="p-3.5 bg-[#F6F7FB] rounded-2xl border border-[#E8EAF0]">
              <span className="text-[#777D8C] block mb-1">Queue & Concurrency</span>
              <span className="font-bold text-[#171923] text-sm flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#6558D9]" />
                {health?.active_jobs ?? 0} active • {health?.queued_jobs ?? 0} queued
              </span>
            </div>
          </div>
        </div>

        {/* Form Settings */}
        <form onSubmit={handleSave} className="bg-[#FFFFFF] border border-[#E8EAF0] rounded-3xl p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-extrabold text-[#171923] uppercase tracking-wider mb-2">
            Default Separation Preferences
          </h3>

          {/* Default Output Format */}
          <div>
            <label className="block text-xs font-bold text-[#171923] mb-2 uppercase">
              Default Output Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['wav', 'flac', 'mp3'] as OutputFormat[]).map((fmt) => (
                <button
                  type="button"
                  key={fmt}
                  onClick={() => setDefaultFormat(fmt)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    defaultFormat === fmt
                      ? 'border-[#6558D9] bg-[#F0EDFF]/50 ring-1 ring-[#6558D9] font-bold text-[#6558D9]'
                      : 'border-[#E8EAF0] text-[#171923] hover:border-gray-400 bg-white font-medium'
                  }`}
                >
                  <span className="uppercase text-sm">{fmt}</span>
                  <span className="block text-[10px] text-[#777D8C] mt-0.5">
                    {fmt === 'wav' ? 'Lossless PCM' : fmt === 'flac' ? 'Compressed Lossless' : '320kbps MP3'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Default Model */}
          <div>
            <label className="block text-xs font-bold text-[#171923] mb-2 uppercase">
              Default AI Separation Model
            </label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EAF0] bg-white text-xs font-semibold text-[#171923] focus:outline-hidden focus:ring-2 focus:ring-[#6558D9]"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.architecture}
                </option>
              ))}
            </select>
          </div>

          {/* Default Playback Speed & Concurrency limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171923] mb-2 uppercase flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#6558D9]" />
                <span>Default Player Speed</span>
              </label>
              <select
                value={defaultPlaybackRate}
                onChange={(e) => setDefaultPlaybackRate(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8EAF0] bg-white text-xs font-semibold text-[#171923] focus:outline-hidden focus:ring-2 focus:ring-[#6558D9]"
              >
                <option value={0.75}>0.75x (Slowed)</option>
                <option value={1.0}>1.0x (Normal speed)</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x (Double speed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171923] mb-2 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#6558D9]" />
                <span>Max Concurrent Separations</span>
              </label>
              <select
                value={maxConcurrentJobs}
                onChange={(e) => setMaxConcurrentJobs(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8EAF0] bg-white text-xs font-semibold text-[#171923] focus:outline-hidden focus:ring-2 focus:ring-[#6558D9]"
              >
                <option value={1}>1 Job at a time (Recommended for CPU)</option>
                <option value={2}>2 Parallel Jobs</option>
              </select>
            </div>
          </div>

          {/* Retention period */}
          <div>
            <label className="block text-xs font-bold text-[#171923] mb-2 uppercase">
              File Retention Period (Days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value) || 7)}
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-[#E8EAF0] bg-white text-xs font-semibold text-[#171923] focus:outline-hidden focus:ring-2 focus:ring-[#6558D9]"
            />
            <p className="text-[11px] text-[#777D8C] mt-1.5">
              Temporary uploaded files older than this threshold can be automatically purged.
            </p>
          </div>

          {/* Save button */}
          <div className="pt-4 border-t border-[#E8EAF0] flex items-center justify-between">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6558D9] hover:bg-[#5446C9] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>

        {/* Maintenance / Cache Purge */}
        <div className="bg-[#FFFFFF] border border-[#E8EAF0] rounded-3xl p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#171923] uppercase tracking-wider">
                Storage & Cache Maintenance
              </h3>
              <p className="text-xs text-[#777D8C] mt-1">
                Purge abandoned temporary files and output caches older than {retentionDays} days to reclaim disk space.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunCleanup}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F6F7FB] hover:bg-gray-200 text-[#171923] border border-[#E8EAF0] text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#E5484D]" />
              <span>Run Cleanup Now</span>
            </button>
          </div>

          {cleanupMsg && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{cleanupMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
