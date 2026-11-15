import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import type { NavItemKey } from './components/Sidebar';
import { Header } from './components/Header';
import { StartupAnimation } from './components/StartupAnimation';
import { ToastProvider } from './components/Toast';
import { VocalRemoverPage } from './pages/VocalRemoverPage';
import { AcapellaExtractorPage } from './pages/AcapellaExtractorPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import type { ModelInfo, AppSettings, SystemHealth } from './types';
import { fetchModels, fetchSettings, fetchHealth } from './services/api';

function AppContent() {
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    return sessionStorage.getItem('marhaba_vox_intro_seen') === 'true';
  });

  const [activeTab, setActiveTab] = useState<NavItemKey>('vocal_remover');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global state
  const [models, setModels] = useState<ModelInfo[]>([
    {
      id: 'htdemucs',
      name: 'HTDemucs v4 (Recommended)',
      architecture: 'Hybrid Transformer Demucs',
      version: '4.1.0',
      description: "Meta's flagship Hybrid Transformer architecture for high-precision vocal & instrumental separation.",
      quality: 'Studio Grade (SDR ~9.0 dB)',
      device_requirement: 'CPU or CUDA (Auto-detected)',
      current_device: 'CPU',
      is_default: true,
      installed: true,
    },
  ]);

  const [settings, setSettings] = useState<AppSettings>({
    default_output_format: 'wav',
    default_model: 'htdemucs',
    default_playback_rate: 1.0,
    max_upload_size_mb: 100,
    max_concurrent_jobs: 1,
    retention_days: 7,
  });

  const [health, setHealth] = useState<SystemHealth | null>(null);

  const loadInitialData = async () => {
    try {
      const [modelsData, settingsData, healthData] = await Promise.all([
        fetchModels().catch(() => models),
        fetchSettings().catch(() => settings),
        fetchHealth().catch(() => null),
      ]);
      setModels(modelsData);
      setSettings(settingsData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to load initial application state:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleStartupComplete = () => {
    sessionStorage.setItem('marhaba_vox_intro_seen', 'true');
    setHasStarted(true);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#171923] flex flex-col font-sans">
      {/* Professional Startup Sequence Animation */}
      <AnimatePresence>
        {!hasStarted && <StartupAnimation onComplete={handleStartupComplete} />}
      </AnimatePresence>

      <div className="flex-1 flex min-h-screen">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          deviceInfo={health?.device || 'CPU Mode'}
        />

        {/* Main Application Workspace */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header
            activeTab={activeTab}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onNavigateSettings={() => setActiveTab('settings')}
          />

          <main className="flex-1 pb-16">
            {activeTab === 'vocal_remover' && (
              <VocalRemoverPage
                models={models}
                defaultFormat={settings.default_output_format}
                defaultModel={settings.default_model}
              />
            )}

            {activeTab === 'acapella_extractor' && (
              <AcapellaExtractorPage
                models={models}
                defaultFormat={settings.default_output_format}
                defaultModel={settings.default_model}
              />
            )}

            {activeTab === 'history' && <HistoryPage />}

            {activeTab === 'settings' && (
              <SettingsPage
                settings={settings}
                models={models}
                health={health}
                onRefreshSettings={loadInitialData}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
