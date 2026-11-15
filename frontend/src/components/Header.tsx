import React from 'react';
import { Menu, Sparkles, Sliders } from 'lucide-react';
import type { NavItemKey } from './Sidebar';

interface HeaderProps {
  activeTab: NavItemKey;
  onOpenMobileMenu: () => void;
  onNavigateSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onNavigateSettings,
}) => {
  const pageDetails: Record<NavItemKey, { title: string; subtitle: string; tag: string }> = {
    vocal_remover: {
      title: 'Vocal Remover',
      subtitle: 'Create clean instrumental backings and extract pristine vocal stems using deep learning transformers.',
      tag: 'AI Music Separation',
    },
    acapella_extractor: {
      title: 'Acapella Extractor',
      subtitle: 'Isolate crystal-clear acapella vocals, speech, and harmonies from any mixed audio or video track.',
      tag: 'Vocal Isolation',
    },
    history: {
      title: 'Separation History',
      subtitle: 'Manage and replay previously separated audio tracks, inspect stem details, and download stems.',
      tag: 'Audio Library',
    },
    settings: {
      title: 'Studio Settings',
      subtitle: 'Fine-tune AI model defaults, hardware concurrency, output formats, and cache retention rules.',
      tag: 'Configuration',
    },
  };

  const current = pageDetails[activeTab];

  return (
    <header className="h-18 px-6 lg:px-8 bg-white/95 backdrop-blur-md border-b border-[#E8EAF0] flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-4 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-xl text-[#777D8C] hover:text-[#171923] hover:bg-[#F6F7FB] lg:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-extrabold text-[#171923] tracking-tight truncate">
              {current.title}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F0EDFF] text-[#6558D9]">
              <Sparkles className="w-3 h-3" />
              {current.tag}
            </span>
          </div>
          <p className="text-xs text-[#777D8C] hidden sm:block font-medium truncate mt-0.5">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Live Audio Engine indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F6F7FB] border border-[#E8EAF0] text-xs font-semibold text-[#171923] shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A36A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A36A]"></span>
          </span>
          <span className="font-bold text-[#171923]">Demucs v4</span>
          <span className="text-[#777D8C] font-normal">• 44.1kHz Float</span>
        </div>

        {/* Quick Settings Shortcut */}
        <button
          onClick={onNavigateSettings}
          title="Open Studio Settings"
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-[#777D8C] hover:text-[#6558D9] hover:bg-[#F0EDFF]/50 border border-transparent hover:border-[#6558D9]/20 transition-all font-semibold text-xs"
        >
          <Sliders className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Preferences</span>
        </button>
      </div>
    </header>
  );
};
