import React from 'react';
import { Music2, Mic, History, Settings as SettingsIcon, Cpu, type LucideIcon } from 'lucide-react';
import { MarhabaLogo } from './MarhabaLogo';

export type NavItemKey = 'vocal_remover' | 'acapella_extractor' | 'history' | 'settings';

interface NavItem {
  id: NavItemKey;
  name: string;
  icon: LucideIcon;
  badge?: string;
  description: string;
}

interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
  deviceInfo?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  deviceInfo = 'CPU Mode'
}) => {
  const vocalTools: NavItem[] = [
    {
      id: 'vocal_remover',
      name: 'Vocal Remover',
      icon: Music2,
      badge: '2-Stem',
      description: 'Separate vocals & backing track'
    },
    {
      id: 'acapella_extractor',
      name: 'Acapella Extractor',
      icon: Mic,
      badge: 'Vocal',
      description: 'Isolate vocal performances'
    },
  ];

  const libraryTools: NavItem[] = [
    {
      id: 'history',
      name: 'Recent History',
      icon: History,
      description: 'Saved stems & processing log'
    },
  ];

  const settingsTools: NavItem[] = [
    {
      id: 'settings',
      name: 'Settings',
      icon: SettingsIcon,
      description: 'Model & export configuration'
    },
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-[#777D8C] uppercase">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#F0EDFF] text-[#6558D9] shadow-xs'
                  : 'text-[#777D8C] hover:text-[#171923] hover:bg-[#F6F7FB]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#6558D9] text-white shadow-xs'
                      : 'bg-transparent text-[#777D8C] group-hover:text-[#171923]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-left leading-tight">{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#6558D9]/15 text-[#6558D9]'
                      : 'bg-gray-100 text-[#777D8C] group-hover:bg-gray-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#FFFFFF] border-r border-[#E8EAF0] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 border-b border-[#E8EAF0] flex items-center justify-between">
          <MarhabaLogo size="md" />
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5">
          {renderNavGroup('VOCAL TOOLS', vocalTools)}
          {renderNavGroup('LIBRARY', libraryTools)}
          {renderNavGroup('SETTINGS', settingsTools)}
        </div>

        {/* System & Hardware Status Card */}
        <div className="p-4 border-t border-[#E8EAF0] bg-[#F6F7FB]/50">
          <div className="p-3 bg-[#FFFFFF] border border-[#E8EAF0] rounded-xl flex items-center gap-3 shadow-2xs">
            <div className="p-2 rounded-lg bg-[#F0EDFF] text-[#6558D9]">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] animate-pulse" />
                <span className="text-xs font-bold text-[#171923] truncate">AI Engine Active</span>
              </div>
              <p className="text-[11px] text-[#777D8C] truncate font-medium">
                HTDemucs • {deviceInfo}
              </p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-[10px] text-[#777D8C]">
              Parent Brand: <strong className="text-[#171923]">MarhabaPrinters</strong>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
