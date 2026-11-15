export type ToolMode = 'vocal_remover' | 'acapella_extractor';
export type OutputFormat = 'wav' | 'mp3' | 'flac';

export type JobStatus =
  | 'waiting'
  | 'uploading'
  | 'preparing'
  | 'separating'
  | 'exporting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface StemFile {
  id: string;
  stem_type: 'vocals' | 'instrumental';
  file_name: string;
  file_size_bytes: number;
  format: string;
  mime_type: string;
  duration_seconds: number;
  download_url: string;
}

export interface Job {
  id: string;
  original_filename: string;
  file_size_bytes: number;
  duration_seconds: number;
  tool_mode: ToolMode;
  model_name: string;
  output_format: OutputFormat;
  status: JobStatus;
  progress: number;
  status_message: string;
  error_message?: string | null;
  processing_duration_seconds: number;
  created_at: string;
  completed_at?: string | null;
  stems: StemFile[];
  zip_download_url?: string | null;
  original_audio_url?: string | null;
}

export interface ModelInfo {
  id: string;
  name: string;
  architecture: string;
  version: string;
  description: string;
  quality: string;
  device_requirement: string;
  current_device: string;
  speed_characteristic?: string;
  is_default: boolean;
  installed: boolean;
}

export interface SystemHealth {
  status: string;
  app_name: string;
  tagline: string;
  device: string;
  ffmpeg_available: boolean;
  ffmpeg_path: string;
  active_jobs: number;
  queued_jobs?: number;
  default_model: string;
}

export interface AppSettings {
  default_output_format: OutputFormat;
  default_model: string;
  default_playback_rate: number;
  max_upload_size_mb: number;
  max_concurrent_jobs: number;
  retention_days: number;
}

export interface HistoryData {
  jobs: Job[];
  total_count: number;
  completed_count: number;
  total_processing_seconds: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}
