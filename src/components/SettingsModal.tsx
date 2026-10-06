import React from 'react';
import { BoardTheme, LanguageCode } from '../types';
import { translations } from '../i18n/translations';
import { AppSettings } from '../utils/storage';
import { Settings, Volume2, Sparkles, Eye, Globe, RotateCcw, Palette } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  lang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  lang,
  onLanguageChange,
  onResetAllData,
}) => {
  const t = translations[lang] || translations.es;

  const THEMES: Array<{ id: BoardTheme; labelKey: string; previewClass: string }> = [
    { id: 'wood', labelKey: t.themeWood, previewClass: 'from-[#f0d9b5] to-[#b58863]' },
    { id: 'slate', labelKey: t.themeSlate, previewClass: 'from-[#e2e8f0] to-[#64748b]' },
    { id: 'emerald', labelKey: t.themeEmerald, previewClass: 'from-[#eeeed2] to-[#769656]' },
    { id: 'cyber', labelKey: t.themeCyber, previewClass: 'from-[#1e293b] to-[#0284c7]' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-stone-900/90 p-6 rounded-2xl border border-stone-800 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
          <Settings className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-xl font-bold text-stone-100">{t.settingsTitle}</h2>
            <p className="text-xs text-stone-400">Personaliza la interfaz, sonidos y preferencias visuales</p>
          </div>
        </div>

        {/* Board Theme Picker */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-stone-200 flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" /> {t.boardThemeLabel}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map((theme) => {
              const isActive = settings.boardTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onUpdateSettings({ ...settings, boardTheme: theme.id })}
                  className={`p-3 rounded-xl border transition text-left flex flex-col gap-2 ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500 text-stone-100 shadow-md ring-2 ring-amber-500/40'
                      : 'bg-stone-800/80 hover:bg-stone-800 border-stone-700 text-stone-300'
                  }`}
                >
                  <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${theme.previewClass} border border-stone-600`} />
                  <span className="text-xs font-bold">{theme.labelKey}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound & Feedback Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-800 pt-5">
          <div className="flex items-center justify-between p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/60">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-stone-200">{t.soundLabel}</span>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/60">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-stone-200">{t.showLegalMovesLabel}</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showLegalMoves}
              onChange={(e) => onUpdateSettings({ ...settings, showLegalMoves: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Danger Zone: Reset All Data */}
        <div className="border-t border-stone-800 pt-5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-rose-400">Restablecer Datos Locales</h4>
            <p className="text-[11px] text-stone-400">Elimina el historial de partidas y estadísticas almacenadas localmente.</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('¿Seguro que deseas eliminar todos tus datos guardados?')) {
                onResetAllData();
              }
            }}
            className="px-3.5 py-2 text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold rounded-xl border border-rose-500/40 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar Todo
          </button>
        </div>
      </div>
    </div>
  );
};
