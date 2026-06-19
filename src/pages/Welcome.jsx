import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Sparkles, Sun, Moon, ArrowRight, ShieldCheck } from 'lucide-react';
import { trackPageView } from '../analytics/tracking';

const Welcome = () => {
  const { theme, toggleTheme, language, t } = useApp();
  const navigate = useNavigate();

  React.useEffect(() => {
    trackPageView('Welcome Screen');
  }, []);

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-10 px-4 text-center max-w-4xl mx-auto select-none">
      {/* Visual floating sphere block */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-tr from-pastel-rose to-pastel-sky blur-2xl rounded-full opacity-60 w-32 h-32 mx-auto animate-pulse-gentle" />
        <div className="relative w-28 h-28 rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/40 dark:border-white/5 animate-float-slow mx-auto">
          <Sparkles className="w-14 h-14 text-indigo-500/80 dark:text-indigo-400/80" />
        </div>
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-poppins text-slate-800 dark:text-slate-100 mb-4">
        {t('welcome_title')}
      </h1>
      
      <p className="text-lg md:text-xl font-nunito text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed">
        {t('welcome_tagline')}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
        <button
          onClick={handleStart}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pastel-rose hover:from-pastel-rose-hover to-pastel-sky hover:to-pastel-sky-hover text-indigo-950 dark:text-indigo-900 font-bold text-lg rounded-2xl shadow-md hover:shadow-lg transform transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center space-x-2 border border-white/20"
        >
          <span>{t('welcome_start')}</span>
          <ArrowRight className="w-5 h-5 text-indigo-900" />
        </button>
      </div>

      {/* Info Badges */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
        <div className="glass p-5 rounded-2xl border border-white/20 dark:border-white/5 text-center">
          <div className="w-10 h-10 rounded-xl bg-pastel-mint-light dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 font-semibold">
            🌱
          </div>
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">
            {language === 'es' ? '100% Satisfactorio' : '100% Satisfying'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-nunito leading-normal">
            {language === 'es' ? 'Interacciones táctiles y sonoras para liberar tensión instantáneamente.' : 'Tactile and audio interactions to instantly release tension.'}
          </p>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/20 dark:border-white/5 text-center">
          <div className="w-10 h-10 rounded-xl bg-pastel-sky-light dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 font-semibold">
            🎵
          </div>
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">
            {language === 'es' ? 'Sonido ASMR Generativo' : 'Generative ASMR Sound'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-nunito leading-normal">
            {language === 'es' ? 'Audio sintetizado en tiempo real para una inmersión completa sin pausas.' : 'Synthesized audio in real-time for full offline immersion.'}
          </p>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/20 dark:border-white/5 text-center">
          <div className="w-10 h-10 rounded-xl bg-pastel-rose-light dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 font-semibold">
            🧘
          </div>
          <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">
            {language === 'es' ? 'Salud Emocional' : 'Emotional Health'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-nunito leading-normal">
            {language === 'es' ? 'Registra tu estado de ánimo y sigue tus hábitos de relajación.' : 'Log your moods and track your positive relaxation habits.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
