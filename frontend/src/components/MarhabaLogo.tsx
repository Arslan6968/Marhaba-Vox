import React from 'react';

interface MarhabaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const MarhabaLogo: React.FC<MarhabaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision Audio Mark: Modern Gradient Tile with Sound Waveform & Studio Mic */}
      <div
        className={`relative flex items-center justify-center bg-gradient-to-tr from-[#6558D9] via-[#786AF8] to-[#9185F5] shadow-md shadow-[#6558D9]/25 p-2 shrink-0 ${iconSizes[size]}`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Audio Waveform Bars radiating around center */}
          <rect x="5" y="15" width="2.5" height="10" rx="1.25" fill="currentColor" fillOpacity="0.75" />
          <rect x="10.5" y="10" width="2.5" height="20" rx="1.25" fill="currentColor" fillOpacity="0.85" />
          <rect x="27" y="10" width="2.5" height="20" rx="1.25" fill="currentColor" fillOpacity="0.85" />
          <rect x="32.5" y="15" width="2.5" height="10" rx="1.25" fill="currentColor" fillOpacity="0.75" />

          {/* Central Studio Vocal Capsule */}
          <rect x="16" y="8" width="8" height="15" rx="4" fill="currentColor" />
          <path
            d="M13 18C13 22 16 25 20 25C24 25 27 22 27 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M20 25V31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 31H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

          {/* AI Neural Sparkle Indicator */}
          <circle cx="28" cy="8" r="1.8" fill="#F0EDFF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-[#171923] ${textSizes[size]}`}>
              Marhaba
            </span>
            <span className={`font-black tracking-tight text-[#6558D9] ${textSizes[size]}`}>
              Vox
            </span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#F0EDFF] text-[#6558D9] tracking-wider border border-[#6558D9]/20 ml-0.5">
              PRO
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#777D8C] mt-1">
            Every Voice. Every Detail.
          </span>
        </div>
      )}
    </div>
  );
};
