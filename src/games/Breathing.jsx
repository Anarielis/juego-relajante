import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Wind, Play, Square, Info } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

// Breathing modes configuration (durations in seconds)
const BREATHING_MODES = {
  relax: {
    id: 'relax',
    label_es: 'Relajación (Caja)',
    label_en: 'Relaxation (Box)',
    sequence: [
      { state: 'inhale', duration: 4, text_es: 'Inhala...', text_en: 'Inhale...' },
      { state: 'hold', duration: 4, text_es: 'Mantén...', text_en: 'Hold...' },
      { state: 'exhale', duration: 4, text_es: 'Exhala...', text_en: 'Exhale...' },
      { state: 'hold', duration: 4, text_es: 'Mantén...', text_en: 'Hold...' },
    ]
  },
  anxiety: {
    id: 'anxiety',
    label_es: 'Reducir Ansiedad (4-7-8)',
    label_en: 'Reduce Anxiety (4-7-8)',
    sequence: [
      { state: 'inhale', duration: 4, text_es: 'Inhala...', text_en: 'Inhale...' },
      { state: 'hold', duration: 7, text_es: 'Mantén...', text_en: 'Hold...' },
      { state: 'exhale', duration: 8, text_es: 'Exhala...', text_en: 'Exhale...' },
    ]
  },
  sleep: {
    id: 'sleep',
    label_es: 'Conciliar Sueño (4-4-6-2)',
    label_en: 'Fall Asleep (4-4-6-2)',
    sequence: [
      { state: 'inhale', duration: 4, text_es: 'Inhala...', text_en: 'Inhale...' },
      { state: 'hold', duration: 4, text_es: 'Mantén...', text_en: 'Hold...' },
      { state: 'exhale', duration: 6, text_es: 'Exhala...', text_en: 'Exhale...' },
      { state: 'hold', duration: 2, text_es: 'Mantén...', text_en: 'Hold...' },
    ]
  },
  focus: {
    id: 'focus',
    label_es: 'Concentración (4-4)',
    label_en: 'Focus (4-4)',
    sequence: [
      { state: 'inhale', duration: 4, text_es: 'Inhala...', text_en: 'Inhale...' },
      { state: 'exhale', duration: 4, text_es: 'Exhala...', text_en: 'Exhale...' },
    ]
  }
};

const Breathing = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const [activeMode, setActiveMode] = useState('relax');
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [sessionCount, setSessionCount] = useState(0); // Tracks completed loops
  const [playTime, setPlayTime] = useState(0);

  const activeHumRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize tracking
  useEffect(() => {
    trackPageView('Breathing Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      // Save game duration on exit
      recordGameSession('breathing', playTime);
      stopGuide();
    };
  }, [playTime]);

  const activeSequence = BREATHING_MODES[activeMode].sequence;
  const currentStep = activeSequence[stepIndex];

  // Core breathing logic controller
  useEffect(() => {
    if (!isPlaying) return;

    // Set duration for current step
    setSecondsRemaining(currentStep.duration);
    
    // Play chime at start of step
    audioSynth.playBreathingBell();

    // Start low sound hum on Inhale/Exhale
    if (activeHumRef.current) {
      activeHumRef.current.stop();
      activeHumRef.current = null;
    }

    if (currentStep.state === 'inhale') {
      activeHumRef.current = audioSynth.startBreathingHum('inhale');
    } else if (currentStep.state === 'exhale') {
      activeHumRef.current = audioSynth.startBreathingHum('exhale');
    }

    let currentSec = currentStep.duration;

    // Step Countdown Timer
    const interval = setInterval(() => {
      currentSec -= 1;
      if (currentSec <= 0) {
        clearInterval(interval);
        
        // Move to next step in sequence
        setStepIndex((idx) => {
          const nextIdx = idx + 1;
          if (nextIdx >= activeSequence.length) {
            // Completed a full breathing cycle!
            setSessionCount(c => c + 1);
            return 0; // Reset back to first step (loop)
          }
          return nextIdx;
        });
      } else {
        setSecondsRemaining(currentSec);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (activeHumRef.current) {
        activeHumRef.current.stop();
        activeHumRef.current = null;
      }
    };
  }, [isPlaying, stepIndex, activeMode]);

  const startGuide = () => {
    setIsPlaying(true);
    setStepIndex(0);
    setSessionCount(0);
  };

  const stopGuide = () => {
    setIsPlaying(false);
    setSecondsRemaining(0);
    if (activeHumRef.current) {
      activeHumRef.current.stop();
      activeHumRef.current = null;
    }
  };

  // Determine sphere scale based on state & remaining seconds
  const getSphereStyle = () => {
    if (!isPlaying) return { transform: 'scale(1.0)', transition: 'all 1s ease-in-out' };
    
    const stepDuration = currentStep.duration;
    const progress = (stepDuration - secondsRemaining) / stepDuration;

    if (currentStep.state === 'inhale') {
      // Scale from 1.0 to 1.8
      const scale = 1.0 + (progress * 0.8);
      return { transform: `scale(${scale})`, transition: 'transform 1s linear' };
    } else if (currentStep.state === 'exhale') {
      // Scale from 1.8 down to 1.0
      const scale = 1.8 - (progress * 0.8);
      return { transform: `scale(${scale})`, transition: 'transform 1s linear' };
    } else if (currentStep.state === 'hold') {
      // Keep static at whatever scale we reached
      const isPostInhale = activeSequence[(stepIndex - 1 + activeSequence.length) % activeSequence.length].state === 'inhale';
      const scale = isPostInhale ? 1.8 : 1.0;
      return { transform: `scale(${scale})`, transition: 'transform 1s ease-in-out' };
    }
    
    return {};
  };

  const getStepText = () => {
    if (!isPlaying) return language === 'es' ? 'Comenzar' : 'Start';
    return language === 'es' ? currentStep.text_es : currentStep.text_en;
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 select-none max-w-2xl mx-auto w-full">
      
      {/* Upper Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-semibold font-nunito"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('welcome_title')}</span>
        </button>

        <div className="flex items-center space-x-1.5 text-xs font-nunito text-slate-500 dark:text-slate-400">
          <Wind className="w-4 h-4 text-sky-500 animate-pulse" />
          <span>{t('active_sessions')}:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{sessionCount}</span>
        </div>
      </div>

      {/* Main Breathing Visual Core */}
      <div className="flex-1 glass p-8 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden shadow-md">
        
        {/* Soft background pulse wave */}
        <div className={`absolute w-72 h-72 rounded-full border border-sky-300/30 dark:border-sky-500/10 pointer-events-none transition-all duration-1000 ${
          isPlaying && currentStep.state === 'inhale' ? 'scale-150 opacity-100' : 'scale-100 opacity-20'
        }`} />

        {/* Expanding Breathing Sphere */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div 
            className="w-full h-full rounded-full bg-gradient-to-tr from-pastel-sky via-pastel-lavender to-pastel-rose opacity-80 shadow-lg"
            style={getSphereStyle()}
          />
          {/* Inner details node */}
          <div className="absolute w-24 h-24 rounded-full bg-white/20 dark:bg-black/10 backdrop-blur-xs flex flex-col items-center justify-center text-center">
            <span className="font-poppins font-bold text-sm text-indigo-950 dark:text-slate-100">
              {isPlaying ? `${secondsRemaining}s` : '🧘'}
            </span>
          </div>
        </div>

        {/* Cues text */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-extrabold font-poppins text-slate-800 dark:text-slate-100 transition-all">
            {getStepText()}
          </h3>
          <p className="text-xs text-slate-400 font-nunito mt-1">
            {isPlaying 
              ? (language === 'es' ? 'Sigue las señales y respira profundo' : 'Follow the cues and breathe deeply')
              : (language === 'es' ? 'Selecciona un modo abajo y presiona iniciar' : 'Select a mode below and press start')}
          </p>
        </div>

        {/* Start / Stop Button */}
        <div className="mt-8">
          {!isPlaying ? (
            <button
              onClick={startGuide}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{language === 'es' ? 'Iniciar Sesión' : 'Start Session'}</span>
            </button>
          ) : (
            <button
              onClick={stopGuide}
              className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{language === 'es' ? 'Pausar' : 'Stop'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode selectors footer */}
      <div className="glass p-4 rounded-3xl border border-white/20 dark:border-white/5 space-y-3 font-nunito">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-poppins block px-1">
          {t('breathing_mode')}
        </span>

        <div className="grid grid-cols-2 gap-2">
          {Object.values(BREATHING_MODES).map((mode) => {
            const label = language === 'es' ? mode.label_es : mode.label_en;
            const isSelected = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  if (isPlaying) stopGuide();
                  setActiveMode(mode.id);
                }}
                className={`p-3 text-xs font-bold rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300'
                    : 'bg-white/40 border-slate-200/50 dark:bg-white/5 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/80'
                }`}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Breathing;
