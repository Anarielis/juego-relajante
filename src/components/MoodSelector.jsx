import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Smile, Heart, Eye, CloudRain, ShieldAlert, Sparkles, Zap, Moon } from 'lucide-react';

const moods = [
  { id: 'Feliz', label_es: 'Feliz', label_en: 'Happy', color: 'bg-pastel-peach text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', icon: Smile },
  { id: 'Relajado', label_es: 'Relajado', label_en: 'Relaxed', color: 'bg-pastel-mint text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', icon: Sparkles },
  { id: 'Ansioso', label_es: 'Ansioso', label_en: 'Anxious', color: 'bg-pastel-sky text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', icon: Zap },
  { id: 'Triste', label_es: 'Triste', label_en: 'Sad', color: 'bg-pastel-lavender text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300', icon: CloudRain },
  { id: 'Estresado', label_es: 'Estresado', label_en: 'Stressed', color: 'bg-pastel-rose text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', icon: ShieldAlert },
  { id: 'Cansado', label_es: 'Cansado', label_en: 'Cansado', color: 'bg-pastel-peach/70 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300', icon: Moon },
];

const MoodSelector = ({ isOpen, onClose, onMoodSelected }) => {
  const { t, language } = useApp();
  const { recordMood } = useAuth();

  if (!isOpen) return null;

  const handleMoodSelect = async (moodId) => {
    await recordMood(moodId);
    if (onMoodSelected) {
      onMoodSelected(moodId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative glass w-full max-w-lg rounded-3xl p-6 md:p-8 animate-fade-in shadow-2xl overflow-hidden border border-white/20 dark:border-white/5">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pastel-rose to-pastel-sky" />
        
        <h3 className="text-2xl font-bold font-poppins text-slate-800 dark:text-slate-100 text-center mb-2 mt-2">
          {t('how_do_you_feel')}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
          {language === 'es' 
            ? 'Cuéntanos cómo te encuentras para adaptar la atmósfera de relajación.'
            : 'Let us know how you feel to adapt the relaxation atmosphere.'}
        </p>

        <div className="grid grid-cols-2 gap-4">
          {moods.map((mood) => {
            const Icon = mood.icon;
            const label = language === 'es' ? mood.label_es : mood.label_en;
            return (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id)}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-300 hover:scale-105 border border-transparent hover:border-slate-300/40 dark:hover:border-white/10 shadow-sm hover:shadow-md ${mood.color}`}
              >
                <Icon className="w-8 h-8 mb-2 stroke-[1.5]" />
                <span className="font-semibold text-base font-nunito">{label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="mt-6 flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-nunito"
          >
            {language === 'es' ? 'Saltar por ahora' : 'Skip for now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoodSelector;
