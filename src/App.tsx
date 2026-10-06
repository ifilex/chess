import React, { useState, useEffect } from 'react';
import { GameRecord, LanguageCode } from './types';
import {
  loadSettings,
  saveSettings,
  loadUserStats,
  saveUserStats,
  loadGameRecords,
  resetAllData,
  AppSettings,
} from './utils/storage';
import { soundFX } from './utils/audio';

import { Navbar, NavTab } from './components/Navbar';
import { GameView } from './components/GameView';
import { AnalysisBoard } from './components/AnalysisBoard';
import { PuzzleTrainer } from './components/PuzzleTrainer';
import { TutorialsModal } from './components/TutorialsModal';
import { CognitiveStats } from './components/CognitiveStats';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('play');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [stats, setStats] = useState(() => loadUserStats());
  const [gameRecords, setGameRecords] = useState<GameRecord[]>(() => loadGameRecords());
  const [selectedAnalysisRecord, setSelectedAnalysisRecord] = useState<GameRecord | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Sync sound setting
  useEffect(() => {
    soundFX.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    const updated = { ...settings, language: lang };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleGameFinished = (record: GameRecord) => {
    const updatedRecords = [record, ...gameRecords];
    setGameRecords(updatedRecords);
    setStats(loadUserStats());
  };

  const handleOpenAnalysisForRecord = (record: GameRecord) => {
    setSelectedAnalysisRecord(record);
    setActiveTab('analysis');
  };

  const handleResetData = () => {
    resetAllData();
    setSettings(loadSettings());
    setStats(loadUserStats());
    setGameRecords([]);
    setSelectedAnalysisRecord(null);
  };

  // If entering analysis tab and no specific record selected, default to most recent record
  const currentAnalysisRecord = selectedAnalysisRecord || (gameRecords.length > 0 ? gameRecords[0] : null);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Header Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lang={settings.language}
        onLanguageChange={handleLanguageChange}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
        isOnline={isOnline}
      />

      {/* Main Container View */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'play' && (
          <GameView
            settings={settings}
            lang={settings.language}
            onGameFinished={handleGameFinished}
            onOpenAnalysis={handleOpenAnalysisForRecord}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisBoard
            gameRecord={currentAnalysisRecord}
            lang={settings.language}
          />
        )}

        {activeTab === 'puzzles' && (
          <PuzzleTrainer
            lang={settings.language}
            onPuzzleSolved={() => setStats(loadUserStats())}
          />
        )}

        {activeTab === 'tutorials' && (
          <TutorialsModal
            lang={settings.language}
            completedLessons={stats.lessonsCompleted}
            onLessonComplete={() => setStats(loadUserStats())}
          />
        )}

        {activeTab === 'stats' && (
          <CognitiveStats
            stats={stats}
            lang={settings.language}
            onResetStats={handleResetData}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            lang={settings.language}
            onLanguageChange={handleLanguageChange}
            onResetAllData={handleResetData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-stone-900 text-center text-xs text-stone-500">
        CogniChess © 2026 • Estimulación Cognitiva, Ajedrez con IA y Almacenamiento Local
      </footer>
    </div>
  );
}
