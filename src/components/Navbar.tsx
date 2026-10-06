import React from 'react';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';
import { LanguageSelector } from './LanguageSelector';
import { Brain, Play, BarChart3, BookOpen, Zap, Settings, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';

export type NavTab = 'play' | 'analysis' | 'puzzles' | 'tutorials' | 'stats' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  lang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  lang,
  onLanguageChange,
  soundEnabled,
  onToggleSound,
  isOnline,
}) => {
  const t = translations[lang] || translations.es;

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'play', label: t.navPlay, icon: <Play className="w-4 h-4" /> },
    { id: 'analysis', label: t.navAnalysis, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'puzzles', label: t.navPuzzles, icon: <Zap className="w-4 h-4" /> },
    { id: 'tutorials', label: t.navTutorials, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'stats', label: t.navStats, icon: <Brain className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 px-4 lg:px-8 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('play')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Brain className="w-5 h-5 text-stone-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-stone-100 flex items-center gap-1.5">
              CogniChess
            </h1>
            <span className="hidden sm:block text-[10px] font-medium text-amber-400/90 tracking-wide">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-900/90 p-1 rounded-2xl border border-stone-800 shadow-inner">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Offline/Online Status Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isOnline
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
            }`}
            title={isOnline ? t.synced : t.offlineMode}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? t.onlineMode : t.offlineMode}</span>
          </div>

          <LanguageSelector currentLang={lang} onLanguageChange={onLanguageChange} />

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={onToggleSound}
            className="p-2 text-stone-300 hover:text-amber-400 bg-stone-800 hover:bg-stone-700 rounded-xl border border-stone-700 transition"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          {/* Settings Modal Button */}
          <button
            id="settings-tab-btn"
            onClick={() => onTabChange('settings')}
            className={`p-2 rounded-xl border transition ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
            }`}
            title={t.navSettings}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Tabs Bar */}
      <div className="flex md:hidden items-center justify-around mt-2 pt-2 border-t border-stone-800/80">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold transition ${
                isActive ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
