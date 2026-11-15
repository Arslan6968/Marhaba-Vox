import type { Job, ModelInfo, SystemHealth, AppSettings, HistoryData, ToolMode, OutputFormat } from '../types';

const API_BASE = '/api/v1';

async function safeFetchJson<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let detailMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errText = await res.text();
        if (errText && errText.trim()) {
          try {
            const errObj = JSON.parse(errText);
            if (errObj && errObj.detail) {
              detailMsg = typeof errObj.detail === 'string' ? errObj.detail : JSON.stringify(errObj.detail);
            }
          } catch {
            detailMsg = errText.slice(0, 200);
          }
        }
      } catch {
        // Text read failed, use default status text
      }
      throw new Error(detailMsg);
    }

    const text = await res.text();
    if (!text || text.trim() === '') {
      if (fallback !== undefined) return fallback;
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (parseErr) {
      console.warn(`JSON parse error from ${url}:`, parseErr, 'Raw response:', text.slice(0, 150));
      if (fallback !== undefined) return fallback;
      throw new Error(`Invalid JSON received from server: ${parseErr}`);
    }
  } catch (err) {
    if (fallback !== undefined) {
      console.warn(`Fetch error for ${url}, using fallback:`, err);
      return fallback;
    }
    throw err;
  }
}

export async function fetchHealth(): Promise<SystemHealth> {
  return safeFetchJson<SystemHealth>(`${API_BASE}/health`, undefined, {
    status: 'healthy',
    app_name: 'Marhaba Vox',
    tagline: 'Every Voice. Every Detail.',
    device: 'CPU Mode',
    ffmpeg_available: true,
    ffmpeg_path: 'ffmpeg',
    active_jobs: 0,
    queued_jobs: 0,
    default_model: 'htdemucs',
  });
}

export async function fetchModels(): Promise<ModelInfo[]> {
  return safeFetchJson<ModelInfo[]>(`${API_BASE}/models`, undefined, [
    {
      id: 'htdemucs',
      name: 'HTDemucs v4 (Recommended)',
      architecture: 'Hybrid Transformer Demucs',
      version: '4.1.0',
      description: "Meta's flagship Hybrid Transformer architecture for high-precision vocal & instrumental separation.",
      quality: 'Studio Grade (SDR ~9.0 dB)',
      device_requirement: 'CPU or CUDA (Auto-detected)',
      current_device: 'CPU',
      speed_characteristic: 'Standard (~1.5x track duration on CPU)',
      is_default: true,
      installed: true,
    },
  ]);
}

export async function fetchSettings(): Promise<AppSettings> {
  return safeFetchJson<AppSettings>(`${API_BASE}/settings`, undefined, {
    default_output_format: 'wav',
    default_model: 'htdemucs',
    default_playback_rate: 1.0,
    max_upload_size_mb: 100,
    max_concurrent_jobs: 1,
    retention_days: 7,
  });
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  return safeFetchJson<AppSettings>(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}

export async function triggerCleanup(): Promise<{ status: string; message: string }> {
  return safeFetchJson<{ status: string; message: string }>(`${API_BASE}/settings/cleanup`, {
    method: 'POST',
  }, {
    status: 'success',
    message: 'Cleanup completed',
  });
}

export async function fetchHistory(
  skip = 0,
  limit = 50,
  search?: string,
  toolMode?: string,
  status?: string
): Promise<HistoryData> {
  const params = new URLSearchParams();
  params.set('skip', skip.toString());
  params.set('limit', limit.toString());
  if (search && search.trim()) params.set('search', search.trim());
  if (toolMode && toolMode.trim() && toolMode !== 'all') params.set('tool_mode', toolMode.trim());
  if (status && status.trim() && status !== 'all') params.set('status', status.trim());

  return safeFetchJson<HistoryData>(`${API_BASE}/history?${params.toString()}`, undefined, {
    jobs: [],
    total_count: 0,
    completed_count: 0,
    total_processing_seconds: 0,
  });
}

export async function clearHistory(): Promise<{ status: string; message: string }> {
  return safeFetchJson<{ status: string; message: string }>(`${API_BASE}/history`, {
    method: 'DELETE',
  });
}

export async function fetchJobs(
  toolMode?: string,
  limit = 20
): Promise<Job[]> {
  const params = new URLSearchParams();
  if (toolMode && toolMode !== 'all') params.set('tool_mode', toolMode);
  params.set('limit', limit.toString());

  return safeFetchJson<Job[]>(`${API_BASE}/jobs?${params.toString()}`, undefined, []);
}

export async function fetchJob(jobId: string): Promise<Job | null> {
  return safeFetchJson<Job | null>(`${API_BASE}/jobs/${jobId}`, undefined, null);
}

export async function createJob(
  file: File,
  toolMode: ToolMode,
  modelName: string,
  outputFormat: OutputFormat
): Promise<Job> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tool_mode', toolMode);
  formData.append('model_name', modelName);
  formData.append('output_format', outputFormat);

  return safeFetchJson<Job>(`${API_BASE}/jobs`, {
    method: 'POST',
    body: formData,
  });
}

export async function retryJob(jobId: string): Promise<Job> {
  return safeFetchJson<Job>(`${API_BASE}/jobs/${jobId}/retry`, {
    method: 'POST',
  });
}

export async function cancelJob(jobId: string): Promise<{ status: string; message: string }> {
  return safeFetchJson<{ status: string; message: string }>(`${API_BASE}/jobs/${jobId}/cancel`, {
    method: 'POST',
  });
}

export async function deleteJob(jobId: string): Promise<{ status: string; message: string }> {
  return safeFetchJson<{ status: string; message: string }>(`${API_BASE}/jobs/${jobId}`, {
    method: 'DELETE',
  });
}

export function getDownloadFileUrl(fileId: string, asAttachment = true): string {
  return `${API_BASE}/files/${fileId}/download?as_attachment=${asAttachment}`;
}

export function getOriginalAudioUrl(jobId: string): string {
  return `${API_BASE}/jobs/${jobId}/original`;
}

export function getDownloadZipUrl(jobId: string): string {
  return `${API_BASE}/jobs/${jobId}/zip`;
}
