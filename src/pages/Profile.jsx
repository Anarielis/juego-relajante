import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import AchievementBadge, { achievementDefs } from '../components/AchievementBadge';
import { User, Calendar, Clock, Smile, Sparkles, Gamepad2, Activity, Heart } from 'lucide-react';
import { trackPageView } from '../analytics/tracking';

const Profile = () => {
  const { t, language } = useApp();
  const { profile } = useAuth();

  React.useEffect(() => {
    trackPageView('Profile Screen');
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  // Convert float minutes to readable text (e.g., "1h 15m" or "45m")
  const formatTimeSpent = (mins) => {
    if (!mins) return `0 ${t('minutes')}`;
    const hours = Math.floor(mins / 60);
    const remainingMins = Math.round(mins % 60);

    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${remainingMins} ${t('minutes')}`;
  };

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 'Feliz': return '😊';
      case 'Relajado': return '🧘';
      case 'Ansioso': return '⚡';
      case 'Triste': return '🌧️';
      case 'Estresado': return '🔥';
      case 'Cansado': return '🌙';
      default: return '✨';
    }
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'Feliz': return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40';
      case 'Relajado': return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40';
      case 'Ansioso': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40';
      case 'Triste': return 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/40';
      case 'Estresado': return 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-950/40';
      case 'Cansado': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950/40';
      default: return 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/40';
    }
  };

  const usernameLetter = profile?.username ? profile.username.charAt(0).toUpperCase() : 'C';

  return (
    <div className="flex-1 flex flex-col space-y-8 select-none">
      
      {/* Header Profile Info Card */}
      <div className="glass p-6 md:p-8 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pastel-rose via-pastel-lavender to-pastel-sky" />
        
        {/* Dynamic Pastel SVG Avatar */}
        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl font-extrabold font-poppins shadow-md border border-white/40 dark:border-white/10 bg-gradient-to-tr from-pastel-rose to-pastel-sky-hover text-indigo-900 select-none">
          {usernameLetter}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-full flex items-center justify-center text-sm shadow-sm">
            🌱
          </div>
        </div>

        {/* User identification */}
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-poppins">
            {profile?.username || 'Cargando...'}
          </h2>
          <p className="text-sm font-nunito text-indigo-500/80 dark:text-indigo-400/80 mt-1 font-semibold">
            @{profile?.username}
          </p>
          <div className="flex items-center justify-center md:justify-start space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3 font-nunito bg-slate-100/50 dark:bg-slate-950/20 px-3 py-1.5 rounded-full w-fit">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{language === 'es' ? 'Miembro desde' : 'Member since'} {formatDate(profile?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Grid statistics items */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass p-5 rounded-2xl border border-white/20 dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start text-indigo-500">
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-poppins">
              {language === 'es' ? 'Preferido' : 'Favorite'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xs font-nunito text-slate-400">{t('favorite_game')}</p>
            <h4 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 font-poppins truncate mt-0.5">
              {profile?.favoriteGame || 'Ninguno'}
            </h4>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/20 dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start text-sky-500">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-poppins">
              {language === 'es' ? 'Inversión' : 'Playtime'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xs font-nunito text-slate-400">{t('total_time')}</p>
            <h4 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 font-poppins mt-0.5">
              {formatTimeSpent(profile?.totalTimeSpent)}
            </h4>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/20 dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start text-rose-500">
            <Activity className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-poppins">
              {language === 'es' ? 'Hábitos' : 'Habits'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xs font-nunito text-slate-400">{t('sessions_count')}</p>
            <h4 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 font-poppins mt-0.5">
              {profile?.sessionCount || 0} {language === 'es' ? 'sesiones' : 'sessions'}
            </h4>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/20 dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start text-emerald-500">
            <Smile className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-poppins">
              {language === 'es' ? 'Frecuencia' : 'Mood'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xs font-nunito text-slate-400">{t('mood_frequent')}</p>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-lg">{getMoodEmoji(profile?.frequentMood)}</span>
              <h4 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 font-poppins">
                {profile?.frequentMood || 'Relajado'}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main achievements layout block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Achievements Grid (Left/Center col span 2) */}
        <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>{t('achievements')}</span>
            </h3>
            <p className="text-slate-400 dark:text-slate-400 text-xs font-nunito mt-1">
              {language === 'es' ? 'Tus hitos de relajación acumulados.' : 'Your accumulated relaxation milestones.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(achievementDefs).map((key) => {
              const isUnlocked = profile?.achievements?.includes(key);
              return (
                <AchievementBadge 
                  key={key} 
                  id={key} 
                  isUnlocked={isUnlocked} 
                />
              );
            })}
          </div>
        </div>

        {/* Timeline Emotional History Column */}
        <div className="glass p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-6">
          <div>
            <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span>{language === 'es' ? 'Diario Emocional' : 'Emotional Log'}</span>
            </h3>
            <p className="text-slate-400 dark:text-slate-400 text-xs font-nunito mt-1">
              {language === 'es' ? 'Tus últimos registros de estado de ánimo.' : 'Your latest emotional check-ins.'}
            </p>
          </div>

          <div className="relative border-l border-slate-200 dark:border-white/10 ml-3 pl-5 space-y-5 max-h-[350px] overflow-y-auto pr-2">
            {profile?.moodHistory && profile.moodHistory.length > 0 ? (
              [...profile.moodHistory].reverse().map((entry, idx) => {
                const checkDate = new Date(entry.date);
                const timeString = checkDate.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const dateString = checkDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div key={idx} className="relative">
                    {/* Circle bullet node */}
                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-indigo-500 dark:bg-indigo-400 border-2 border-white dark:border-slate-900" />
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold font-nunito ${getMoodColor(entry.mood)}`}>
                        {getMoodEmoji(entry.mood)} {entry.mood}
                      </span>
                      <span className="text-[10px] text-slate-400 font-nunito">
                        {dateString}, {timeString}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm font-nunito text-slate-400 pl-2">
                {language === 'es' ? 'Aún no registraste emociones.' : 'No emotional check-ins logged yet.'}
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
