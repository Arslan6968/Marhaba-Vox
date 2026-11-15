import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw, Gauge } from 'lucide-react';

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
  // Instrumental: Crisp Indigo/Cyan Accent (#3B82F6)
  const isVocal = stemType === 'vocals';
  const waveColor = isVocal ? '#C4B5FD' : '#93C5FD';
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
      cursorColor: '#171923',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 64,
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
      // Notify other players to pause
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

    // Handle global playback coordination
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
    <div className="bg-[#FFFFFF] border border-[#E8EAF0] rounded-2xl p-5 shadow-xs hover:border-[#6558D9]/30 transition-all">
      {/* Stem Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E8EAF0]/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isVocal ? 'bg-[#6558D9]' : 'bg-[#2563EB]'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-[#171923] tracking-tight">
                {title}
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isVocal
                    ? 'bg-[#F0EDFF] text-[#6558D9]'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {stemType}
              </span>
              <span className="text-[10px] font-bold bg-gray-100 text-[#777D8C] px-1.5 py-0.5 rounded uppercase">
                {format}
              </span>
            </div>
            <p className="text-[11px] text-[#777D8C] truncate max-w-xs sm:max-w-md mt-0.5">
              {fileName}
            </p>
          </div>
        </div>

        {/* Individual Download */}
        <a
          href={audioUrl + '&as_attachment=true'}
          download={fileName}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F6F7FB] hover:bg-[#F0EDFF] text-[#171923] hover:text-[#6558D9] border border-[#E8EAF0] hover:border-[#6558D9]/30 text-xs font-bold transition-all shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </a>
      </div>

      {/* Waveform View */}
      <div className="relative my-3 bg-[#F6F7FB]/60 rounded-xl p-3 border border-[#E8EAF0]/50">
        {!isReady && (
          <div className="h-16 flex items-center justify-center text-xs text-[#777D8C] animate-pulse">
            Rendering dynamic waveform...
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
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm ${
              isVocal
                ? 'bg-[#6558D9] hover:bg-[#5446C9] text-white'
                : 'bg-[#2563EB] hover:bg-blue-700 text-white'
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
          <div className="text-xs font-semibold text-[#171923] font-mono px-2">
            {formatTime(currentTime)} <span className="text-[#777D8C]">/</span> {formatTime(totalDuration)}
          </div>
        </div>

        {/* Speed Controls & Volume */}
        <div className="flex items-center gap-4">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#F6F7FB] border border-[#E8EAF0] rounded-lg p-0.5">
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleSpeedChange(rate)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  playbackRate === rate
                    ? 'bg-white text-[#6558D9] shadow-xs font-bold'
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
              className="p-1.5 text-[#777D8C] hover:text-[#171923] transition-colors"
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
