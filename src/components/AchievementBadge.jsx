import React from 'react';
import { useApp } from '../contexts/AppContext';
import { LogIn, Heart, Calendar, Clock, Compass, Wind, Lock } from 'lucide-react';

export const achievementDefs = {
  first_login: {
    id: 'first_login',
    title_es: 'Primer Despertar',
    title_en: 'First Awakening',
    desc_es: 'Registrarse e iniciar sesión por primera vez en CalmSpace.',
    desc_en: 'Register and log into CalmSpace for the first time.',
    icon: LogIn,
    color: 'from-blue-200 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-900/40 text-indigo-600 dark:text-indigo-400'
  },
  first_session: {
    id: 'first_session',
    title_es: 'Primer Encuentro',
    title_en: 'First Encounter',
    desc_es: 'Completar tu primer registro emocional y sesión de relajación.',
    desc_en: 'Complete your first emotional check-in and relaxation session.',
    icon: Heart,
    color: 'from-rose-200 to-orange-200 dark:from-rose-900/40 dark:to-orange-900/40 text-rose-600 dark:text-rose-400'
  },
  seven_days: {
    id: 'seven_days',
    title_es: 'Hábito de Paz',
    title_en: 'Habit of Peace',
    desc_es: 'Mantener una racha de 7 días consecutivos utilizando CalmSpace.',
    desc_en: 'Maintain a streak of 7 consecutive days on CalmSpace.',
    icon: Calendar,
    color: 'from-emerald-200 to-teal-200 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-400'
  },
  hundred_minutes: {
    id: 'hundred_minutes',
    title_es: 'Maestro de la Calma',
    title_en: 'Calm Master',
    desc_es: 'Acumular un total de 100 minutos de relajación interactiva.',
    desc_en: 'Accumulate a total of 100 minutes of interactive relaxation.',
    icon: Clock,
    color: 'from-amber-200 to-rose-200 dark:from-amber-900/40 dark:to-rose-900/40 text-amber-600 dark:text-amber-400'
  },
  all_games: {
    id: 'all_games',
    title_es: 'Explorador Zen',
    title_en: 'Zen Explorer',
    desc_es: 'Experimentar los cinco juegos ASMR relajantes.',
    desc_en: 'Experience all five calming ASMR games.',
    icon: Compass,
    color: 'from-purple-200 to-pink-200 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-600 dark:text-purple-400'
  },
  fifty_breathing: {
    id: 'fifty_breathing',
    title_es: 'Respiración Vital',
    title_en: 'Vital Breath',
    desc_es: 'Completar 50 ejercicios de respiración guiada.',
    desc_en: 'Complete 50 guided breathing sessions.',
    icon: Wind,
    color: 'from-teal-200 to-sky-200 dark:from-teal-900/40 dark:to-sky-900/40 text-teal-600 dark:text-teal-400'
  }
};

const AchievementBadge = ({ id, isUnlocked }) => {
  const { language } = useApp();
  const def = achievementDefs[id];
  
  if (!def) return null;
  const Icon = def.icon;
  const title = language === 'es' ? def.title_es : def.title_en;
  const description = language === 'es' ? def.desc_es : def.desc_en;

  return (
    <div 
      className={`relative flex items-center p-4 rounded-2xl border transition-all duration-300 ${
        isUnlocked 
          ? 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/10 shadow-sm hover:shadow-md hover:scale-[1.02]' 
          : 'bg-slate-100/40 dark:bg-slate-900/10 border-slate-200/20 dark:border-white/5 opacity-60 filter grayscale'
      }`}
    >
      {/* Icon frame */}
      <div className={`p-3 rounded-xl bg-gradient-to-tr ${isUnlocked ? def.color : 'from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 text-slate-400'} mr-4`}>
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 font-poppins text-sm md:text-base leading-snug">
          {title}
        </h4>
        <p className="text-slate-500 dark:text-slate-400 font-nunito text-xs md:text-sm mt-0.5 leading-relaxed truncate-2-lines">
          {description}
        </p>
      </div>

      {!isUnlocked && (
        <div className="ml-2 p-1 bg-slate-200/50 dark:bg-white/5 rounded-full text-slate-400">
          <Lock className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;
