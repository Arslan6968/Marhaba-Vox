import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Gauge, Music2, Mic, Radio, Disc3 } from 'lucide-react';

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

      const handleLoadedData = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = savedTime;
          audioRef.current.playbackRate = playbackRate;
          if (wasPlaying) {
            audioRef.current.play().catch(() => {});
          }
        }
      };

      audioRef.current.addEventListener('loadeddata', handleLoadedData, { once: true });
    } else {
      setActiveSource(newSource);
    }
  };

  // Keyboard navigation for studio workflow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === '1' && originalUrl) {
        handleSwitchSource('original');
      } else if (e.key === '2' && vocalsUrl) {
        handleSwitchSource('vocals');
      } else if (e.key === '3' && instrumentalUrl) {
        handleSwitchSource('instrumental');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

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
    <div className="bg-gradient-to-b from-white to-[#FAF9FF] border border-[#E8EAF0] rounded-3xl p-6 sm:p-7 shadow-md space-y-5">
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-[#F0EDFF] text-[#6558D9]">
              <Radio className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-extrabold text-[#171923] tracking-tight">
              Mastering Studio • Synchronized A/B Comparison
            </h4>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#6558D9] text-white">
              Instant Audition
            </span>
          </div>
          <p className="text-xs text-[#777D8C] font-medium">
            Seamlessly toggle between original mix and separated stems with synchronized playback positions.
          </p>
        </div>

        {/* Channel Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F6F7FB] border border-[#E8EAF0] rounded-2xl self-start lg:self-auto shadow-inner">
          {originalUrl && (
            <button
              onClick={() => handleSwitchSource('original')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSource === 'original'
                  ? 'bg-white text-[#171923] shadow-xs border border-[#E8EAF0]'
                  : 'text-[#777D8C] hover:text-[#171923]'
              }`}
            >
              <Disc3 className={`w-3.5 h-3.5 ${activeSource === 'original' && isPlaying ? 'animate-spin' : ''}`} />
              <span>Original Audio</span>
              <kbd className="hidden sm:inline text-[9px] bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-500">1</kbd>
            </button>
          )}

          {vocalsUrl && (
            <button
              onClick={() => handleSwitchSource('vocals')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSource === 'vocals'
                  ? 'bg-[#6558D9] text-white shadow-md shadow-[#6558D9]/25'
                  : 'text-[#777D8C] hover:text-[#6558D9]'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Extracted Vocals</span>
              <kbd className={`hidden sm:inline text-[9px] px-1 py-0.5 rounded font-mono ${activeSource === 'vocals' ? 'bg-[#5446C9] text-white' : 'bg-slate-100 text-slate-500'}`}>2</kbd>
            </button>
          )}

          {instrumentalUrl && (
            <button
              onClick={() => handleSwitchSource('instrumental')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSource === 'instrumental'
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25'
                  : 'text-[#777D8C] hover:text-[#2563EB]'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>Instrumental</span>
              <kbd className={`hidden sm:inline text-[9px] px-1 py-0.5 rounded font-mono ${activeSource === 'instrumental' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'}`}>3</kbd>
            </button>
          )}
        </div>
      </div>

      {/* Studio Waveform Spectrum Simulation Track */}
      <div className="space-y-2">
        <div className="relative w-full h-14 bg-[#F6F7FB] border border-[#E8EAF0] rounded-2xl flex items-center px-4 overflow-hidden group cursor-pointer">
          {/* Animated Waveform equalizer bars */}
          <div className="absolute inset-0 flex items-center justify-between px-3 gap-0.5 pointer-events-none opacity-45">
            {Array.from({ length: 64 }).map((_, i) => {
              const heightPercent = 20 + Math.sin(i * 0.3) * 25 + ((i % 7) * 8);
              const isActive = (i / 64) * 100 <= progressPercent;
              const isVocalActive = activeSource === 'vocals';
              const isInstActive = activeSource === 'instrumental';

              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isActive
                      ? isVocalActive
                        ? 'bg-[#6558D9]'
                        : isInstActive
                        ? 'bg-[#2563EB]'
                        : 'bg-slate-700'
                      : 'bg-slate-200'
                  }`}
                  style={{
                    height: isPlaying ? `${heightPercent + (Math.sin(i + currentTime * 5) * 15)}%` : `${heightPercent}%`,
                  }}
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
            className="w-full h-3 appearance-none bg-transparent rounded-lg cursor-pointer accent-[#6558D9] z-10"
          />
        </div>

        {/* Timestamps & Active Stem Indicator */}
        <div className="flex justify-between items-center text-xs font-semibold text-[#777D8C] tabular-nums px-1">
          <span className="font-mono text-[#171923] text-sm">{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#E8EAF0] text-[11px] font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                activeSource === 'vocals'
                  ? 'bg-[#6558D9]'
                  : activeSource === 'instrumental'
                  ? 'bg-[#2563EB]'
                  : 'bg-slate-700'
              }`}
            />
            <span className="uppercase text-[#171923]">
              {activeSource === 'original'
                ? 'Original Master'
                : activeSource === 'vocals'
                ? 'Isolated Vocal Stem'
                : 'Instrumental Stem'}
            </span>
          </div>
          <span className="font-mono text-slate-500">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls & Utility Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Play/Pause & Filename */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={!currentUrl}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
              activeSource === 'vocals'
                ? 'bg-gradient-to-tr from-[#6558D9] to-[#8072FA] hover:shadow-[#6558D9]/40'
                : activeSource === 'instrumental'
                ? 'bg-gradient-to-tr from-[#2563EB] to-[#4F86F7] hover:shadow-blue-500/40'
                : 'bg-gradient-to-tr from-slate-800 to-slate-900 hover:shadow-slate-700/40'
            }`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <div>
            <p className="text-xs font-extrabold text-[#171923] truncate max-w-[220px]" title={filename}>
              {filename}
            </p>
            <p className="text-[10px] text-[#777D8C]">Press Space to play/pause</p>
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
                onClick={() => handleSpeedChange(rate)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  playbackRate === rate
                    ? 'bg-white text-[#6558D9] shadow-xs'
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
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1.5 appearance-none bg-slate-200 rounded-lg accent-[#6558D9] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
