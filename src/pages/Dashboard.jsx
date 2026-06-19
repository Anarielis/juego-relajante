import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import MoodSelector from '../components/MoodSelector';
import { Play, Clock, Sparkles } from 'lucide-react';
import { trackPageView } from '../analytics/tracking';

const Dashboard = () => {
  const { t, language } = useApp();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  
  // Track if mood was checked in during this active dashboard session
  const [moodCheckedIn, setMoodCheckedIn] = useState(
    () => sessionStorage.getItem('cs_mood_checked_in') === 'true'
  );

  React.useEffect(() => {
    trackPageView('Dashboard Screen');
  }, []);

  const games = [
    {
      id: 'zen-garden',
      name_es: 'Organizar Estantes',
      name_en: 'Shelf Organizing',
      desc_es: 'Ordena libros, plantas y cristales sobre repisas de madera con chasquidos y sonidos ASMR muy satisfactorios.',
      desc_en: 'Arrange books, plants, and crystals on wooden shelves with highly satisfying ASMR sounds.',
      color: 'from-pastel-peach-light to-pastel-peach border-pastel-peach-hover',
      svg: (
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-85 dark:opacity-75">
          <rect width="100" height="100" fill="#FDF7EE" rx="16" />
          {/* Wooden Shelf */}
          <rect x="10" y="55" width="80" height="8" rx="2" fill="#8B5A2B" />
          <rect x="10" y="55" width="80" height="2" fill="#A0522D" />
          {/* Book */}
          <rect x="20" y="30" width="10" height="25" rx="1" fill="#F87171" />
          <rect x="22" y="30" width="3" height="25" fill="#EF4444" />
          {/* Succulent Plant */}
          <rect x="42" y="43" width="16" height="12" rx="2" fill="#D1A377" />
          <path d="M 45,43 C 42,32 48,29 50,43 C 52,29 58,32 55,43" fill="#34D399" />
          {/* Crystal Gem */}
          <polygon points="75,32 82,42 75,52 68,42" fill="#C084FC" />
        </svg>
      )
    },
    {
      id: 'pop-it',
      name_es: 'Pop It Antiestrés',
      name_en: 'Pop It Anti-stress',
      desc_es: 'Presiona burbujas infinitas en múltiples formas con chasquidos y sonidos ASMR muy satisfactorios.',
      desc_en: 'Press infinite bubble wrap cells in multiple shapes with satisfying clicks and ASMR feedback.',
      color: 'from-pastel-mint-light to-pastel-mint border-pastel-mint-hover',
      svg: (
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-85 dark:opacity-75">
          <rect width="100" height="100" fill="#E5F7EE" rx="16" />
          {/* Pop It Circle Frame */}
          <circle cx="50" cy="50" r="38" fill="#B5EBC8" />
          {/* Bubbles */}
          <circle cx="34" cy="38" r="6" fill="#FAD8CC" />
          <circle cx="50" cy="38" r="6" fill="#E8E5F6" />
          <circle cx="66" cy="38" r="6" fill="#CBE5F5" />
          <circle cx="34" cy="54" r="6" fill="#CBE5F5" />
          <circle cx="50" cy="54" r="6" fill="#FAD3DC" />
          <circle cx="66" cy="54" r="6" fill="#FDEEF2" />
          <circle cx="50" cy="70" r="6" fill="#E5F6EE" />
        </svg>
      )
    },
    {
      id: 'breathing',
      name_es: 'Respiración Guiada',
      name_en: 'Guided Breathing',
      desc_es: 'Encuentra calma y reduce la ansiedad siguiendo el ritmo de expansión y contracción de una esfera zen.',
      desc_en: 'Find calm and reduce anxiety following the rhythmic expand and contract cues of a zen sphere.',
      color: 'from-pastel-sky-light to-pastel-sky border-pastel-sky-hover',
      svg: (
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-85 dark:opacity-75">
          <rect width="100" height="100" fill="#EBF5FB" rx="16" />
          {/* Concentric Breathing circles */}
          <circle cx="50" cy="50" r="36" fill="none" stroke="#C3E4F9" strokeWidth="1" strokeDasharray="4 4" className="animate-spin" style={{ animationDuration: '40s' }} />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#87CDFC" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="22" fill="url(#breathGradient)" />
          <defs>
            <radialGradient id="breathGradient">
              <stop offset="0%" stopColor="#CBE5F5" />
              <stop offset="100%" stopColor="#87CDFC" />
            </radialGradient>
          </defs>
        </svg>
      )
    },
    {
      id: 'slime',
      name_es: 'Slime Simulator',
      name_en: 'Slime Simulator',
      desc_es: 'Amasa, estira y deforma slime gelatinoso cambiando colores, brillantinas y texturas ASMR.',
      desc_en: 'Squash, stretch, and deform a gel slime mesh, customizing pastel colors, glitters, and textures.',
      color: 'from-pastel-rose-light to-pastel-rose border-pastel-rose-hover',
      svg: (
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-85 dark:opacity-75">
          <rect width="100" height="100" fill="#FDF0F3" rx="16" />
          {/* Slime fluid body */}
          <path d="M 30,50 C 30,35 45,30 60,35 C 75,40 80,55 70,70 C 60,80 40,75 30,70 Z" fill="url(#slimeGradient)" />
          {/* Sparkles */}
          <path d="M 45,45 L 47,42 L 49,45 L 47,48 Z" fill="#FFF" />
          <path d="M 62,58 L 64,55 L 66,58 L 64,61 Z" fill="#FFF" />
          <circle cx="38" cy="62" r="1.5" fill="#FFF" opacity="0.8" />
          <circle cx="68" cy="42" r="1.5" fill="#FFF" opacity="0.8" />
          <defs>
            <linearGradient id="slimeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FAD3DC" />
              <stop offset="100%" stopColor="#E6A8C1" />
            </linearGradient>
          </defs>
        </svg>
      )
    },
    {
      id: 'light-rain',
      name_es: 'Lluvia de Luz',
      name_en: 'Light Rain',
      desc_es: 'Genera fluidos luminosos en escenarios interactivos inspirados en la aurora boreal y el cosmos.',
      desc_en: 'Interact with glowing particle streams in scenarios inspired by northern lights and deep cosmos.',
      color: 'from-pastel-lavender-light to-pastel-lavender border-pastel-lavender-hover',
      svg: (
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-85 dark:opacity-75">
          <rect width="100" height="100" fill="#EBE9F8" rx="16" />
          {/* Northern light lines */}
          <path d="M 10,80 C 25,60 45,75 60,50 C 75,25 85,45 95,20" fill="none" stroke="url(#lightGradient)" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
          {/* Shimmering stars */}
          <circle cx="20" cy="30" r="1.5" fill="#FFF" />
          <circle cx="80" cy="70" r="2" fill="#FFF" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="45" cy="20" r="1" fill="#FFF" />
          <defs>
            <linearGradient id="lightGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CBE5F5" />
              <stop offset="50%" stopColor="#D1CBEA" />
              <stop offset="100%" stopColor="#FAD3DC" />
            </linearGradient>
          </defs>
        </svg>
      )
    }
  ];

  const handlePlayClick = (gameId) => {
    if (!moodCheckedIn) {
      setSelectedGameId(gameId);
      setIsMoodOpen(true);
    } else {
      navigate(`/game/${gameId}`);
    }
  };

  const handleMoodCheckIn = (mood) => {
    setMoodCheckedIn(true);
    sessionStorage.setItem('cs_mood_checked_in', 'true');
    if (selectedGameId) {
      navigate(`/game/${selectedGameId}`);
    }
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) {
      return language === 'es' ? 'Buenos días' : 'Good morning';
    } else if (hours < 18) {
      return language === 'es' ? 'Buenas tardes' : 'Good afternoon';
    } else {
      return language === 'es' ? 'Buenas noches' : 'Good evening';
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-8 select-none">
      {/* Soothing Welcome Header */}
      <div className="glass p-6 md:p-8 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-500 dark:text-indigo-400 font-poppins">
            {language === 'es' ? 'Tu espacio de relajación' : 'Your relaxation space'}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-poppins mt-1">
            {getGreeting()}, {profile?.username || 'Amigo'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-nunito text-sm md:text-base mt-2">
            {language === 'es' 
              ? 'Elige una actividad táctil o visual y conecta tus auriculares para disfrutar de la experiencia ASMR.' 
              : 'Choose a visual or tactile activity and connect your headphones to fully enjoy the ASMR experience.'}
          </p>
        </div>
        
        {/* Mood quick status */}
        {profile?.frequentMood && (
          <div className="flex items-center space-x-3 bg-white/50 dark:bg-slate-900/30 px-5 py-3 rounded-2xl border border-slate-200/40 dark:border-white/5 self-start md:self-auto">
            <span className="text-2xl">🧘</span>
            <div className="font-nunito">
              <p className="text-xs text-slate-400">{language === 'es' ? 'Estado habitual' : 'Usual mood'}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.frequentMood}</p>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Interactive Games */}
      <div>
        <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-slate-100 mb-6 flex items-center space-x-2 px-1">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span>{language === 'es' ? 'Experiencias de Relajación' : 'Relaxation Experiences'}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const gameTitle = language === 'es' ? game.name_es : game.name_en;
            const gameDesc = language === 'es' ? game.desc_es : game.desc_en;
            const playtime = profile?.gamePlaytimes?.[game.id] || 0;
            
            // Format playtime
            const formattedTime = playtime > 0
              ? `${playtime} ${t('minutes')}`
              : (language === 'es' ? 'Sin iniciar' : 'Unplayed');

            return (
              <div
                key={game.id}
                className="group flex flex-col bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
              >
                {/* SVG Image container */}
                <div className="relative aspect-video w-full p-4 overflow-hidden bg-slate-100/50 dark:bg-slate-950/40 flex items-center justify-center border-b border-slate-100/40 dark:border-white/5">
                  <div className="w-full h-full max-w-[150px] transform group-hover:scale-105 transition-transform duration-500">
                    {game.svg}
                  </div>
                  
                  {/* Play icon overlay on hover */}
                  <div 
                    onClick={() => handlePlayClick(game.id)}
                    className="absolute inset-0 bg-slate-900/5 dark:bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  >
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-md text-indigo-600 dark:text-indigo-400 transform scale-75 group-hover:scale-100 transition-transform">
                      <Play className="w-6 h-6 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-poppins group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {gameTitle}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito mt-2 leading-relaxed">
                      {gameDesc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/20 dark:border-white/5 flex items-center justify-between">
                    {/* Time spent */}
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-nunito">
                      <Clock className="w-4 h-4" />
                      <span>{formattedTime}</span>
                    </div>

                    <button
                      onClick={() => handlePlayClick(game.id)}
                      className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition-colors font-poppins flex items-center space-x-1"
                    >
                      <span>{t('play')}</span>
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mood prompt overlay */}
      <MoodSelector
        isOpen={isMoodOpen}
        onClose={() => setIsMoodOpen(false)}
        onMoodSelected={handleMoodCheckIn}
      />
    </div>
  );
};

export default Dashboard;
