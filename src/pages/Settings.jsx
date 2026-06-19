import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Volume2, VolumeX, Sun, Moon, Languages, Sliders, Trash2, Check } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView, trackEvent } from '../analytics/tracking';

const Settings = () => {
  const {
    theme,
    toggleTheme,
    language,
    changeLanguage,
    soundEnabled,
    setSoundEnabled,
    ambientMusicEnabled,
    setAmbientMusicEnabled,
    soundVolume,
    setSoundVolume,
    ambientVolume,
    setAmbientVolume,
    resetPreferences,
    t
  } = useApp();

  const [toastMessage, setToastMessage] = useState('');

  React.useEffect(() => {
    trackPageView('Settings Screen');
  }, []);

  const handleSoundToggle = (e) => {
    const val = e.target.checked;
    setSoundEnabled(val);
    trackEvent('settings_sound_toggled', { enabled: val });
  };

  const handleAmbientToggle = (e) => {
    const val = e.target.checked;
    setAmbientMusicEnabled(val);
    trackEvent('settings_ambient_toggled', { enabled: val });
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setSoundVolume(val);
    
    // Play a gentle pop sound to preview the volume level
    if (soundEnabled) {
      audioSynth.playPopSound();
    }
  };

  const handleAmbientVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setAmbientVolume(val);
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    showToast(lang === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English');
  };

  const handleReset = () => {
    if (window.confirm(language === 'es' ? '¿Estás seguro de restablecer tus preferencias?' : 'Are you sure you want to reset your preferences?')) {
      resetPreferences();
      showToast(t('reset_success'));
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 max-w-2xl mx-auto w-full select-none relative">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 glass border border-indigo-200/50 px-6 py-3 rounded-full text-indigo-700 dark:text-indigo-300 font-bold font-nunito shadow-md flex items-center space-x-2 animate-bounce">
          <Check className="w-5 h-5 text-indigo-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header title */}
      <div>
        <h2 className="text-3xl font-extrabold font-poppins text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <Sliders className="w-7 h-7 text-indigo-500" />
          <span>{t('settings')}</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-nunito mt-1 text-sm">
          {language === 'es' ? 'Personaliza tu entorno de meditación y sonidos CalmSpace.' : 'Personalize your CalmSpace meditation and sound environments.'}
        </p>
      </div>

      <div className="space-y-6">
        
        {/* SECTION 1: SOUND & MUSIC */}
        <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-6">
          <h3 className="text-lg font-bold font-poppins text-slate-800 dark:text-slate-100 flex items-center space-x-2 border-b border-slate-200/20 dark:border-white/5 pb-3">
            <Volume2 className="w-5 h-5 text-indigo-500" />
            <span>{t('sound_settings')}</span>
          </h3>

          <div className="space-y-5 font-nunito">
            {/* Toggle sound effects */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{t('enable_sounds')}</p>
                <p className="text-xs text-slate-400">{language === 'es' ? 'Crujidos de arena, burbujas pop, vibraciones slime.' : 'Sand scratches, pop bubbles, slime vibration clicks.'}</p>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={handleSoundToggle}
                className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none checked:bg-indigo-600 transition-colors relative before:absolute before:h-5 before:w-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 before:transition-transform cursor-pointer"
              />
            </label>

            {/* Toggle ambient music */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{t('ambient_music')}</p>
                <p className="text-xs text-slate-400">{language === 'es' ? 'Acordes de sintetizador lentos que inducen un estado meditativo.' : 'Slow synthesizer chord drones that induce a meditative state.'}</p>
              </div>
              <input
                type="checkbox"
                checked={ambientMusicEnabled}
                onChange={handleAmbientToggle}
                className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none checked:bg-indigo-600 transition-colors relative before:absolute before:h-5 before:w-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 before:transition-transform cursor-pointer"
              />
            </label>

            {/* Volume general */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>{t('volume')}</span>
                <span>{Math.round(soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={handleVolumeChange}
                disabled={!soundEnabled}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Volume music */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>{t('ambient_volume')}</span>
                <span>{Math.round(ambientVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={ambientVolume}
                onChange={handleAmbientVolumeChange}
                disabled={!soundEnabled || !ambientMusicEnabled}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: LOOK & FEEL */}
        <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-6">
          <h3 className="text-lg font-bold font-poppins text-slate-800 dark:text-slate-100 flex items-center space-x-2 border-b border-slate-200/20 dark:border-white/5 pb-3">
            <Sun className="w-5 h-5 text-indigo-500" />
            <span>{t('theme_settings')}</span>
          </h3>

          <div className="flex items-center justify-between font-nunito">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{t('dark_mode')}</p>
              <p className="text-xs text-slate-400">{language === 'es' ? 'Adapta la pantalla a ambientes con poca luz.' : 'Adapt the screen for dim light environments.'}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2.5 px-4 rounded-xl flex items-center space-x-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-white/5 transition-colors font-bold text-sm"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{theme === 'dark' ? (language === 'es' ? 'Oscuro' : 'Dark') : (language === 'es' ? 'Claro' : 'Light')}</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: LANGUAGE */}
        <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-6">
          <h3 className="text-lg font-bold font-poppins text-slate-800 dark:text-slate-100 flex items-center space-x-2 border-b border-slate-200/20 dark:border-white/5 pb-3">
            <Languages className="w-5 h-5 text-indigo-500" />
            <span>{t('language_settings')}</span>
          </h3>

          <div className="flex items-center justify-between font-nunito">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{t('select_language')}</p>
              <p className="text-xs text-slate-400">{language === 'es' ? 'Cambia el idioma global de la interfaz.' : 'Change the application UI language.'}</p>
            </div>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-950/40 rounded-xl border border-slate-200/40 dark:border-white/5">
              <button
                onClick={() => handleLanguageChange('es')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  language === 'es' 
                    ? 'bg-white dark:bg-white/10 shadow-sm text-indigo-600 dark:text-slate-100' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Español
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  language === 'en' 
                    ? 'bg-white dark:bg-white/10 shadow-sm text-indigo-600 dark:text-slate-100' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: RESET / CLEANUP PREFERENCES */}
        <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-6">
          <h3 className="text-lg font-bold font-poppins text-rose-600 dark:text-rose-400 flex items-center space-x-2 border-b border-rose-100/20 dark:border-rose-900/10 pb-3">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>{language === 'es' ? 'Zona Peligrosa' : 'Danger Zone'}</span>
          </h3>

          <div className="flex items-center justify-between font-nunito">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{t('reset_pref')}</p>
              <p className="text-xs text-slate-400">{language === 'es' ? 'Restablece el volumen, temas e idioma de la aplicación.' : 'Resets volume, theme, and language back to standard.'}</p>
            </div>
            <button
              onClick={handleReset}
              className="p-2.5 px-4 rounded-xl flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-200/25 dark:border-rose-950/20 transition-colors font-bold text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>{language === 'es' ? 'Restablecer' : 'Reset'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
