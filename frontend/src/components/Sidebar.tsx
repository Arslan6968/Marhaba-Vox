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
      id: 'acapella_extractor',
      name: 'Acapella Extractor',
      icon: Mic,
      badge: 'Solo',
      description: 'Isolate vocal performance'
    },
    {
      id: 'vocal_remover',
      name: 'Vocal Remover',
      icon: Music2,
      badge: '2-Stem',
      description: 'Separate vocals & instrumental'
    },
  ];

  const libraryTools: NavItem[] = [
    {
      id: 'history',
      name: 'Recent History',
      icon: History,
      description: 'Saved stems & history log'
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
      <div className="px-3 mb-2 text-[10px] font-extrabold tracking-wider text-[#777D8C] uppercase">
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
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 relative ${
                isActive
                  ? 'bg-[#F0EDFF] text-[#6558D9] shadow-2xs font-extrabold'
                  : 'text-[#777D8C] hover:text-[#171923] hover:bg-[#F6F7FB]'
              }`}
            >
              {/* Left active indicator line */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#6558D9] rounded-r-full" />
              )}

              <div className="flex items-center gap-3 pl-1 min-w-0">
                <div
                  className={`p-2 rounded-xl transition-colors shrink-0 ${
                    isActive
                      ? 'bg-[#6558D9] text-white shadow-xs'
                      : 'bg-[#F6F7FB] text-[#777D8C] group-hover:text-[#171923] group-hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <span className="block truncate leading-tight">{item.name}</span>
                  <span className="text-[10px] text-[#777D8C] font-medium block truncate mt-0.5 opacity-80">
                    {item.description}
                  </span>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 ml-1.5 ${
                    isActive
                      ? 'bg-[#6558D9] text-white'
                      : 'bg-slate-100 text-[#777D8C] group-hover:bg-slate-200'
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
          className="fixed inset-0 bg-black/25 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#E8EAF0] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
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
        <div className="p-3.5 border-t border-[#E8EAF0] bg-[#FAF9FD]">
          <div className="p-3 bg-white border border-[#E8EAF0] rounded-2xl flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 rounded-xl bg-[#F0EDFF] text-[#6558D9] shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A36A] animate-pulse" />
                <span className="text-xs font-extrabold text-[#171923] truncate">Neural Engine</span>
              </div>
              <p className="text-[10px] text-[#777D8C] truncate font-semibold mt-0.5">
                HTDemucs v4 • {deviceInfo}
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
