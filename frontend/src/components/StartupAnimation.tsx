import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface StartupAnimationProps {
  onComplete: () => void;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  useEffect(() => {
    // Automatically transition to dashboard after 2.2 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
      transition={{ duration: 0.4 }}
      onClick={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F6F7FB] cursor-pointer"
      title="Click anywhere to enter dashboard"
    >
      {/* Subtle radial ambient background light */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#6558D9]/10 via-[#9185F5]/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center z-10 pointer-events-none">
        {/* Animated Waveform Ring around Logo */}
        <div className="relative flex items-center justify-center">
          {/* Animated concentric pulsing waves */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.4, 1.6], opacity: [0, 0.35, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-36 h-36 rounded-full border border-[#6558D9]/40"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [0.9, 1.6, 1.9], opacity: [0, 0.2, 0] }}
            transition={{ duration: 1.8, delay: 0.3, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-36 h-36 rounded-full border border-[#9185F5]/30"
          />

          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#6558D9] to-[#9185F5] shadow-xl shadow-[#6558D9]/25 flex items-center justify-center p-5 z-20"
          >
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-white"
            >
              {/* Animated waveform bars inside */}
              <motion.rect
                x="4" y="16" width="3" height="8" rx="1.5" fill="currentColor" fillOpacity="0.75"
                animate={{ height: [8, 16, 8], y: [16, 12, 16] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.rect
                x="10" y="11" width="3" height="18" rx="1.5" fill="currentColor" fillOpacity="0.85"
                animate={{ height: [18, 24, 18], y: [11, 8, 11] }}
                transition={{ duration: 1.2, delay: 0.15, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.rect
                x="27" y="11" width="3" height="18" rx="1.5" fill="currentColor" fillOpacity="0.85"
                animate={{ height: [18, 24, 18], y: [11, 8, 11] }}
                transition={{ duration: 1.2, delay: 0.15, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.rect
                x="33" y="16" width="3" height="8" rx="1.5" fill="currentColor" fillOpacity="0.75"
                animate={{ height: [8, 16, 8], y: [16, 12, 16] }}
                transition={{ duration: 1.2, delay: 0.3, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Mic Stem */}
              <rect x="16" y="8" width="8" height="15" rx="4" fill="currentColor" />
              <path
                d="M13 18C13 22 16 25 20 25C24 25 27 22 27 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path d="M20 25V31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 31H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>

        {/* Brand Name Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex items-center gap-2"
        >
          <span className="text-3xl font-extrabold tracking-tight text-[#171923]">
            Marhaba
          </span>
          <span className="text-3xl font-black tracking-tight text-[#6558D9]">
            Vox
          </span>
        </motion.div>

        {/* Tagline Reveal */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 text-sm font-medium tracking-wide text-[#777D8C]"
        >
          Every Voice. Every Detail.
        </motion.p>

        {/* Animated Audio Equalizer Bars beneath */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="flex items-center gap-1.5 mt-8 h-6"
        >
          {[0.6, 1.2, 0.8, 1.5, 0.9, 1.3, 0.7].map((heightScale, idx) => (
            <motion.div
              key={idx}
              animate={{
                height: ['4px', `${heightScale * 18}px`, '4px'],
              }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: idx * 0.1,
                ease: 'easeInOut',
              }}
              className="w-1 rounded-full bg-[#6558D9]"
            />
          ))}
        </motion.div>
      </div>

      {/* Skip button indicator */}
      <div className="absolute bottom-8 text-xs font-semibold text-[#777D8C] bg-white/80 backdrop-blur-xs px-4 py-1.5 rounded-full border border-[#E8EAF0] shadow-2xs hover:text-[#6558D9] transition-colors">
        Click anywhere to enter →
      </div>
    </motion.div>
  );
};
