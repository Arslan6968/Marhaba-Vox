import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw, Gauge, Mic, Music2 } from 'lucide-react';

interface WaveformPlayerProps {
  audioUrl: string;
  stemType: 'vocals' | 'instrumental';
  title: string;
  fileName: string;
  format: string;
  duration?: number;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioUrl,
  stemType,
  title,
  fileName,
  format,
  duration = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Distinct wave colors based on stem type:
  // Vocals: Vivid Purple (#6558D9)
  // Instrumental: Crisp Cobalt Blue (#2563EB)
  const isVocal = stemType === 'vocals';
  const waveColor = isVocal ? '#DDD6FE' : '#BFDBFE';
  const progressColor = isVocal ? '#6558D9' : '#2563EB';

  useEffect(() => {
    if (!containerRef.current) return;

    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: waveColor,
      progressColor: progressColor,
      cursorColor: isVocal ? '#6558D9' : '#2563EB',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 72,
      normalize: true,
      url: audioUrl,
    });

    waveSurferRef.current = ws;

    ws.on('ready', () => {
      setIsReady(true);
      setTotalDuration(ws.getDuration());
      ws.setVolume(volume);
      ws.setPlaybackRate(playbackRate);
    });

    ws.on('play', () => {
      setIsPlaying(true);
      window.dispatchEvent(
        new CustomEvent('marhaba_audio_play', { detail: { url: audioUrl } })
      );
    });

    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => {
      setIsPlaying(false);
      ws.seekTo(0);
    });

    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    const handleOtherPlay = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string }>;
      if (customEvent.detail?.url !== audioUrl && ws.isPlaying()) {
        ws.pause();
      }
    };
    window.addEventListener('marhaba_audio_play', handleOtherPlay);

    return () => {
      window.removeEventListener('marhaba_audio_play', handleOtherPlay);
      ws.destroy();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.playPause();
    }
  };

  const handleRestart = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.seekTo(0);
      waveSurferRef.current.play();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (waveSurferRef.current) {
      waveSurferRef.current.setPlaybackRate(speed);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (waveSurferRef.current) {
      waveSurferRef.current.setVolume(val);
    }
  };

  const toggleMute = () => {
    if (!waveSurferRef.current) return;
    if (isMuted) {
      waveSurferRef.current.setVolume(volume > 0 ? volume : 0.85);
      setIsMuted(false);
    } else {
      waveSurferRef.current.setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs transition-all duration-200 ${
        isVocal
          ? 'border-purple-100 hover:border-[#6558D9]/40 hover:shadow-[#6558D9]/5'
          : 'border-blue-100 hover:border-blue-400/50 hover:shadow-blue-500/5'
      }`}
    >
      {/* Stem Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-[#E8EAF0]">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2.5 rounded-2xl shrink-0 ${
              isVocal ? 'bg-[#F0EDFF] text-[#6558D9]' : 'bg-blue-50 text-blue-600'
            }`}
          >
            {isVocal ? <Mic className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold text-[#171923] tracking-tight truncate">
                {title}
              </h4>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isVocal ? 'bg-[#F0EDFF] text-[#6558D9]' : 'bg-blue-50 text-blue-600'
                }`}
              >
                {stemType}
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-[#777D8C] px-2 py-0.5 rounded-md uppercase">
                {format}
              </span>
            </div>
            <p className="text-[11px] text-[#777D8C] truncate max-w-xs sm:max-w-md mt-0.5 font-medium">
              {fileName}
            </p>
          </div>
        </div>

        {/* Individual Download Button */}
        <a
          href={audioUrl + (audioUrl.includes('?') ? '&' : '?') + 'as_attachment=true'}
          download={fileName}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs border ${
            isVocal
              ? 'bg-[#F0EDFF] hover:bg-[#E4DFFF] text-[#6558D9] border-purple-200 hover:border-[#6558D9]/40'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-400'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download {format.toUpperCase()}</span>
        </a>
      </div>

      {/* Waveform View */}
      <div className="relative my-3.5 bg-[#F6F7FB]/70 rounded-2xl p-3.5 border border-[#E8EAF0]/60">
        {!isReady && (
          <div className="h-18 flex items-center justify-center text-xs font-semibold text-[#777D8C] animate-pulse">
            Rendering high-fidelity waveform...
          </div>
        )}
        <div ref={containerRef} className={isReady ? 'block' : 'hidden'} />
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={!isReady}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-md ${
              isVocal
                ? 'bg-gradient-to-tr from-[#6558D9] to-[#8072FA] text-white hover:shadow-[#6558D9]/30'
                : 'bg-gradient-to-tr from-[#2563EB] to-[#4F86F7] text-white hover:shadow-blue-500/30'
            } ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isPlaying ? 'Pause stem' : 'Play stem'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={handleRestart}
            disabled={!isReady}
            title="Replay from start"
            className="p-2 text-[#777D8C] hover:text-[#171923] hover:bg-[#F6F7FB] rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Time indicator */}
          <div className="text-xs font-mono font-bold text-[#171923] px-2 tabular-nums">
            {formatTime(currentTime)} <span className="text-[#777D8C] font-normal">/</span> {formatTime(totalDuration)}
          </div>
        </div>

        {/* Speed Controls & Volume */}
        <div className="flex items-center gap-4">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#F6F7FB] border border-[#E8EAF0] rounded-xl p-1 shadow-2xs">
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleSpeedChange(rate)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  playbackRate === rate
                    ? 'bg-white text-[#6558D9] shadow-xs'
                    : 'text-[#777D8C] hover:text-[#171923]'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 text-[#777D8C] hover:text-[#171923] transition-colors rounded-lg hover:bg-slate-100"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#E5484D]" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-24 h-1.5 bg-[#E8EAF0] rounded-lg appearance-none cursor-pointer accent-[#6558D9]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
