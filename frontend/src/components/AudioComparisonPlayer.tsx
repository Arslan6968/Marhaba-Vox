import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Gauge, Music2, Mic, Radio } from 'lucide-react';

interface AudioComparisonPlayerProps {
  originalUrl?: string | null;
  vocalsUrl?: string | null;
  instrumentalUrl?: string | null;
  filename: string;
}

type TrackSource = 'original' | 'vocals' | 'instrumental';

export const AudioComparisonPlayer: React.FC<AudioComparisonPlayerProps> = ({
  originalUrl,
  vocalsUrl,
  instrumentalUrl,
  filename,
}) => {
  const [activeSource, setActiveSource] = useState<TrackSource>(() => {
    if (vocalsUrl) return 'vocals';
    if (instrumentalUrl) return 'instrumental';
    return 'original';
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isSeeking, setIsSeeking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Determine current active URL
  const currentUrl = React.useMemo(() => {
    if (activeSource === 'original') return originalUrl;
    if (activeSource === 'vocals') return vocalsUrl;
    if (activeSource === 'instrumental') return instrumentalUrl;
    return originalUrl;
  }, [activeSource, originalUrl, vocalsUrl, instrumentalUrl]);

  // Handle source switching with seamless timestamp synchronization
  const handleSwitchSource = (newSource: TrackSource) => {
    if (newSource === activeSource) return;
    if (audioRef.current) {
      const savedTime = audioRef.current.currentTime;
      const wasPlaying = !audioRef.current.paused;

      setActiveSource(newSource);

      // Re-apply saved timestamp and playback state once loaded
      const handleLoadedData = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = savedTime;
          audioRef.current.playbackRate = playbackRate;
          if (wasPlaying) {
            audioRef.current.play().catch(() => {});
          }
        }
      };

      // Set listener once
      audioRef.current.addEventListener('loadeddata', handleLoadedData, { once: true });
    } else {
      setActiveSource(newSource);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 shadow-sm space-y-4">
      {/* Hidden audio element */}
      {currentUrl && (
        <audio
          ref={audioRef}
          src={currentUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              audioRef.current.playbackRate = playbackRate;
              audioRef.current.volume = isMuted ? 0 : volume;
            }
          }}
        />
      )}

      {/* Header & Source A/B Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#6558D9]" />
            <h4 className="text-sm font-bold text-[#171923]">Synchronized A/B Comparison</h4>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0EDFF] text-[#6558D9]">
              Instant Audition
            </span>
          </div>
          <p className="text-xs text-[#777D8C] mt-0.5">
            Switch smoothly between audio channels while maintaining identical playback position.
          </p>
        </div>

        {/* Channel Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F6F7FB] border border-[#E8EAF0] rounded-xl self-start sm:self-auto">
          {originalUrl && (
            <button
              onClick={() => handleSwitchSource('original')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSource === 'original'
                  ? 'bg-white text-[#171923] shadow-sm border border-[#E8EAF0]'
                  : 'text-[#777D8C] hover:text-[#171923]'
              }`}
            >
              <Music2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Original Audio</span>
            </button>
          )}

          {vocalsUrl && (
            <button
              onClick={() => handleSwitchSource('vocals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSource === 'vocals'
                  ? 'bg-[#6558D9] text-white shadow-sm'
                  : 'text-[#777D8C] hover:text-[#6558D9]'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Extracted Vocals</span>
            </button>
          )}

          {instrumentalUrl && (
            <button
              onClick={() => handleSwitchSource('instrumental')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSource === 'instrumental'
                  ? 'bg-[#6558D9] text-white shadow-sm'
                  : 'text-[#777D8C] hover:text-[#6558D9]'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>Instrumental</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Audio Progress Track */}
      <div className="space-y-1.5">
        <div className="relative w-full h-8 flex items-center group cursor-pointer">
          {/* Waveform-like background bars */}
          <div className="absolute inset-0 flex items-center justify-between gap-0.5 pointer-events-none opacity-40">
            {Array.from({ length: 48 }).map((_, i) => {
              const heightPercent = 25 + Math.sin(i * 0.4) * 20 + ((i % 5) * 10);
              const isActive = (i / 48) * 100 <= progressPercent;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isActive ? 'bg-[#6558D9] opacity-90' : 'bg-slate-200'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            className="w-full h-2 appearance-none bg-slate-200 rounded-lg cursor-pointer accent-[#6558D9] z-10 opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Timestamps */}
        <div className="flex justify-between text-xs font-medium text-[#777D8C] tabular-nums px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[11px] font-semibold text-[#6558D9] uppercase tracking-wider">
            Auditioning: {activeSource === 'original' ? 'Original Mix' : activeSource === 'vocals' ? 'Isolated Vocals' : 'Instrumental Backing'}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls & Utility Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Play/Pause & Fast Seek */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={!currentUrl}
            className="w-10 h-10 rounded-full bg-[#6558D9] hover:bg-[#5245c4] active:scale-95 text-white flex items-center justify-center shadow-md transition-all disabled:opacity-50"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <span className="text-xs font-medium text-[#171923] truncate max-w-[200px]" title={filename}>
            {filename}
          </span>
        </div>

        {/* Speed Controls & Volume */}
        <div className="flex items-center gap-4">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#F6F7FB] border border-[#E8EAF0] rounded-lg p-0.5">
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  playbackRate === rate
                    ? 'bg-white text-[#6558D9] shadow-sm font-bold'
                    : 'text-[#777D8C] hover:text-[#171923]'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-700 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 appearance-none bg-slate-200 rounded-lg accent-[#6558D9] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
