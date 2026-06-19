import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Home, User, Settings, LogOut, Flame, Sparkles, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import audioSynth from '../utils/audioSynth';

const MainLayout = ({ children }) => {
  const { theme, toggleTheme, language, t } = useApp();
  const { user, profile, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeToast, setActiveToast] = useState(null);
  const [sparkles, setSparkles] = useState([]);

  // Initialize audio context on click
  const handleInteraction = () => {
    audioSynth.init();
  };

  useEffect(() => {
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Listen to achievements unlocked
  useEffect(() => {
    const handleAchievement = (e) => {
      const { id, title } = e.detail;
      
      // Play transition chime
      audioSynth.playBreathingBell();

      // Show toast
      setActiveToast({ id, title });

      // Generate sparkles
      const newSparkles = Array.from({ length: 15 }).map((_, idx) => ({
        id: idx + Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 12 + 6,
        delay: Math.random() * 0.8
      }));
      setSparkles(newSparkles);

      // Auto dismiss
      setTimeout(() => {
        setActiveToast(null);
        setSparkles([]);
      }, 5000);
    };

    window.addEventListener('achievement-unlocked', handleAchievement);
    return () => {
      window.removeEventListener('achievement-unlocked', handleAchievement);
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <div className="gradient-bg min-h-screen flex flex-col transition-all duration-700 relative">
      {/* Decorative Blur Spheres (Zen atmosphere) */}
      <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-pastel-mint-light/40 dark:bg-pastel-mint-dark/10 blur-[100px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-pastel-sky-light/40 dark:bg-pastel-sky-dark/10 blur-[120px] pointer-events-none animate-float-slow" style={{ animationDelay: '-4s' }} />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-200/40 dark:border-white/5 py-4 px-4 md:px-8 flex justify-between items-center transition-all duration-300">
        <Link 
          to="/dashboard" 
          className="flex items-center space-x-2 group hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pastel-rose via-pastel-lavender to-pastel-sky flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse-gentle" />
          </div>
          <span className="font-poppins font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100 bg-clip-text">
            CalmSpace
          </span>
        </Link>

        {/* Action Panel */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Active streak */}
          {profile && (
            <div 
              title={language === 'es' ? 'Racha de días relajados' : 'Calm streak days'}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-orange-100/60 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-xs md:text-sm font-semibold font-nunito border border-orange-200/30"
            >
              <Flame className="w-4 h-4 fill-current text-orange-500 animate-bounce" style={{ animationDuration: '2s' }} />
              <span>{profile.consecutiveDays || 1} {language === 'es' ? 'días' : 'days'}</span>
            </div>
          )}

          {/* Quick theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/30 dark:border-white/5 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold font-nunito transition-all ${
                  location.pathname === '/dashboard' 
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/30' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/5'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{language === 'es' ? 'Panel' : 'Dashboard'}</span>
              </Link>
              <Link
                to="/profile"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold font-nunito transition-all ${
                  location.pathname === '/profile' 
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/30' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{t('profile')}</span>
              </Link>
              <Link
                to="/settings"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold font-nunito transition-all ${
                  location.pathname === '/settings' 
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/30' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/5'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>{t('settings')}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold font-nunito text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col z-10">
        {children}
      </main>

      {/* Mobile Navigation bar */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 glass border-t border-slate-200/40 dark:border-white/5 py-2 px-6 flex justify-around items-center">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center p-1 font-nunito text-xs transition-colors ${
              location.pathname === '/dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>{language === 'es' ? 'Inicio' : 'Home'}</span>
          </Link>
          <Link
            to="/profile"
            className={`flex flex-col items-center p-1 font-nunito text-xs transition-colors ${
              location.pathname === '/profile' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>{t('profile')}</span>
          </Link>
          <Link
            to="/settings"
            className={`flex flex-col items-center p-1 font-nunito text-xs transition-colors ${
              location.pathname === '/settings' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span>{t('settings')}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center p-1 font-nunito text-xs text-rose-500"
          >
            <LogOut className="w-5 h-5 mb-0.5" />
            <span>{language === 'es' ? 'Salir' : 'Exit'}</span>
          </button>
        </nav>
      )}

      {/* Added bottom padding on mobile layout to avoid overlap with bottom nav */}
      {user && <div className="h-16 md:hidden pointer-events-none" />}

      {/* Achievement Unlocked Floating Toast Overlay */}
      {activeToast && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in pointer-events-none">
          {/* Confetti/Sparkles canvas overlays */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {sparkles.map(sp => (
              <span
                key={sp.id}
                className="absolute text-yellow-400 font-bold leading-none animate-ping"
                style={{
                  left: `${sp.x}%`,
                  top: `${sp.y}%`,
                  fontSize: `${sp.size}px`,
                  animationDuration: '1.5s',
                  animationDelay: `${sp.delay}s`
                }}
              >
                ✦
              </span>
            ))}
          </div>

          <div className="glass border border-amber-300 dark:border-amber-500/30 p-5 rounded-2xl shadow-xl max-w-sm flex items-center space-x-4 bg-gradient-to-r from-amber-500/10 to-indigo-500/5 backdrop-blur-xl">
            <div className="p-3 bg-amber-400 rounded-xl text-white shadow-sm flex-shrink-0 animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 font-poppins">
                {language === 'es' ? '¡Logro Desbloqueado!' : 'Achievement Unlocked!'}
              </span>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 font-poppins text-base">
                {activeToast.title}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 font-nunito text-xs mt-0.5">
                {language === 'es' ? '¡Sigue relajándote!' : 'Keep relaxing!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
