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
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#6558D9] to-[#9185F5] shadow-sm shadow-[#6558D9]/20 p-2 ${iconSizes[size]}`}>
        {/* Vector SVG combining Microphone Capsule + Symmetric Waveform Bars + AI Spark Star */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Audio Waveform Bars radiating around center */}
          <rect x="4" y="16" width="3" height="8" rx="1.5" fill="currentColor" fillOpacity="0.75" />
          <rect x="10" y="11" width="3" height="18" rx="1.5" fill="currentColor" fillOpacity="0.85" />
          <rect x="27" y="11" width="3" height="18" rx="1.5" fill="currentColor" fillOpacity="0.85" />
          <rect x="33" y="16" width="3" height="8" rx="1.5" fill="currentColor" fillOpacity="0.75" />
          
          {/* Central Vocal Capsule / Microphone */}
          <rect x="16" y="8" width="8" height="15" rx="4" fill="currentColor" />
          <path
            d="M13 18C13 22 16 25 20 25C24 25 27 22 27 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M20 25V31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 31H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* AI Sparkle Node at Top-Right */}
          <circle cx="28" cy="8" r="2" fill="#F0EDFF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-bold tracking-tight text-[#171923] ${textSizes[size]}`}>
              Marhaba
            </span>
            <span className={`font-extrabold tracking-tight text-[#6558D9] ${textSizes[size]}`}>
              Vox
            </span>
          </div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#777D8C] mt-0.5">
            AI Audio Workspace
          </span>
        </div>
      )}
    </div>
  );
};
