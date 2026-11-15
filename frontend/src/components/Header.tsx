import React from 'react';
import { Menu, Settings as SettingsIcon } from 'lucide-react';
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
  const pageDetails: Record<NavItemKey, { title: string; description: string }> = {
    vocal_remover: {
      title: 'Vocal Remover',
      description: 'Remove vocals from your music and create clean instrumental tracks with AI.',
    },
    acapella_extractor: {
      title: 'Acapella Extractor',
      description: 'Extract isolated vocals from songs using advanced AI source separation.',
    },
    history: {
      title: 'Recent History',
      description: 'Review your separated tracks, duration statistics, and download stems.',
    },
    settings: {
      title: 'Settings',
      description: 'Configure default output formats, AI models, and temporary file retention.',
    },
  };

  const current = pageDetails[activeTab];

  return (
    <header className="h-18 px-6 lg:px-8 bg-[#FFFFFF] border-b border-[#E8EAF0] flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-xl text-[#777D8C] hover:text-[#171923] hover:bg-[#F6F7FB] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg lg:text-xl font-bold text-[#171923] tracking-tight">
            {current.title}
          </h1>
          <p className="text-xs text-[#777D8C] hidden sm:block font-medium">
            {current.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Workspace pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F6F7FB] border border-[#E8EAF0] text-xs font-semibold text-[#171923]">
          <span className="w-2 h-2 rounded-full bg-[#6558D9]" />
          <span>Marhaba Studio</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onNavigateSettings}
          title="Open Settings"
          className="p-2 rounded-xl text-[#777D8C] hover:text-[#171923] hover:bg-[#F6F7FB] border border-transparent hover:border-[#E8EAF0] transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
