import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Wind, Play, Square, AlertCircle, Info } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

// Breathing modes configuration (durations in seconds)
const BREATHING_MODES = {
  relax: {
    id: 'relax',
    label_es: 'Relajación (Caja)',
    label_en: 'Relaxation (Box)',
    desc_es: 'Inhala 4s, mantén 4s, exhala 4s, mantén 4s. Ideal para liberar tensiones rápidamente.',
    desc_en: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Perfect for quickly releasing tension.',
    sequence: [
      { state: 'inhale', duration: 4, text_es: 'Inhala...', text_en: 'Inhale...' },
      { state: 'hold', duration: 4, text_es: 'Mantén el aire...', text_en: 'Hold breath...' },
      { state: 'exhale', duration: 4, text_es: 'Exhala lentamente...', text_en: 'Exhale slowly...' },
      { state: 'hold', duration: 4, text_es: 'Mantén vacío...', text_en: 'Hold empty...' },
    ]
  },
  anxiety: {
    id: 'anxiety',
    label_es: 'Reducir Ansiedad (4-7-8)',
    label_en: 'Reduce Anxiety (4-7-8)',
    desc_es: 'Inhala 4s, mantén 7s, exhala 8s. Método natural probado para relajar el sistema nervioso.',
    desc_en: 'Inhale 4s, hold 7s, exhale 8s. Natural method proven to soothe the nervous system.',
    sequence: [
      { state: 'inhale', duration: 4, text_es: 'Inhala profundo...', text_en: 'Inhale deeply...' },
      { state: 'hold', duration: 7, text_es: 'Mantén el aire...', text_en: 'Hold breath...' },
      { state: 'exhale', duration: 8, text_es: 'Exhala despacio...', text_en: 'Exhale slowly...' },
    ]
  },
  sleep: {
    id: 'sleep',
    label_es: 'Conciliar Sueño (4-4-6-2)',
    label_en: 'Fall Asleep (4-4-6-2)',
    desc_es: 'Inhala 4s, mantén 4s, exhala 6s, mantén 2s. Te ayuda a adormecer la mente activa.',
    desc_en: 'Inhale 4s, hold 4s, exhale 6s, hold 2s. Assists in calming an active mind for sleep.',
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
    desc_es: 'Inhala 4s, exhala 4s de forma continua para centrar tu atención y oxigenar el cerebro.',
    desc_en: 'Inhale 4s, exhale 4s continuously to focus attention and oxygenate the brain.',
    sequence: [
      { state: 'inhale', duration: 4, text_es: 'Inhala y concéntrate...', text_en: 'Inhale and focus...' },
      { state: 'exhale', duration: 4, text_es: 'Exhala y relaja...', text_en: 'Exhale and release...' },
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
  const [sessionCount, setSessionCount] = useState(0);
  const [playTime, setPlayTime] = useState(0);

  const activeHumRef = useRef(null);

  // Track session total play time
  useEffect(() => {
    trackPageView('Breathing Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      recordGameSession('breathing', playTime);
      cleanupSounds();
    };
  }, [playTime]);

  const activeSequence = BREATHING_MODES[activeMode].sequence;
  
  // Safety guard: fallback to step 0 if stepIndex is temporarily out of bounds
  const currentStep = activeSequence[stepIndex] || activeSequence[0];

  // Reset steps and stop playing when switching breathing modes to prevent crashes
  useEffect(() => {
    setStepIndex(0);
    setSecondsRemaining(0);
    setIsPlaying(false);
    cleanupSounds();
  }, [activeMode]);

  // Core guided breathing loop state machine
  useEffect(() => {
    if (!isPlaying || !currentStep) {
      cleanupSounds();
      return;
    }

    // Set duration for this step
    setSecondsRemaining(currentStep.duration);
    
    // Play bell ring at the start of each step
    audioSynth.playBreathingBell();

    // Reset hum
    if (activeHumRef.current) {
      activeHumRef.current.stop();
      activeHumRef.current = null;
    }

    // Start breathing sound hum based on step state
    if (currentStep.state === 'inhale') {
      activeHumRef.current = audioSynth.startBreathingHum('inhale');
    } else if (currentStep.state === 'exhale') {
      activeHumRef.current = audioSynth.startBreathingHum('exhale');
    }

    let remaining = currentStep.duration;

    // Tick interval
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        
        // Move to the next step
        setStepIndex((prevIdx) => {
          const nextIdx = prevIdx + 1;
          if (nextIdx >= activeSequence.length) {
            // Finished a full cycle
            setSessionCount(c => c + 1);
            return 0; // Restart loop
          }
          return nextIdx;
        });
      } else {
        setSecondsRemaining(remaining);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      cleanupSounds();
    };
  }, [isPlaying, stepIndex, activeMode]);

  const cleanupSounds = () => {
    if (activeHumRef.current) {
      try {
        activeHumRef.current.stop();
      } catch (e) {}
      activeHumRef.current = null;
    }
  };

  const startGuide = () => {
    setStepIndex(0);
    setSessionCount(0);
    setIsPlaying(true);
  };

  const stopGuide = () => {
    setIsPlaying(false);
    setSecondsRemaining(0);
    cleanupSounds();
  };

  // Smooth CSS scale transitions triggered on step updates
  const getSphereStyle = () => {
    if (!isPlaying) {
      return {
        transform: 'scale(1.0)',
        transition: 'transform 1.2s ease-in-out'
      };
    }

    if (currentStep.state === 'inhale') {
      return {
        transform: 'scale(1.8)',
        transition: `transform ${currentStep.duration}s cubic-bezier(0.35, 0.1, 0.25, 1.0)`
      };
    } else if (currentStep.state === 'exhale') {
      return {
        transform: 'scale(1.0)',
        transition: `transform ${currentStep.duration}s cubic-bezier(0.35, 0.1, 0.25, 1.0)`
      };
    } else if (currentStep.state === 'hold') {
      // Find if we held empty or held full
      const prevStepIdx = (stepIndex - 1 + activeSequence.length) % activeSequence.length;
      const wasInhaling = activeSequence[prevStepIdx].state === 'inhale';
      const scale = wasInhaling ? 1.8 : 1.0;
      return {
        transform: `scale(${scale})`,
        transition: 'transform 0.4s ease-in-out'
      };
    }
    return {};
  };

  const getStepText = () => {
    if (!isPlaying) return language === 'es' ? 'Listos' : 'Ready';
    return language === 'es' ? currentStep.text_es : currentStep.text_en;
  };

  // Circular progress calculations for the SVG ring meter
  const strokeRadius = 78;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const progressOffset = isPlaying
    ? strokeCircumference - (secondsRemaining / currentStep.duration) * strokeCircumference
    : strokeCircumference;

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

        <div className="flex items-center space-x-2 text-xs font-nunito font-semibold text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-white/5 p-1.5 px-3 rounded-xl border border-slate-200/20">
          <Wind className="w-4 h-4 text-sky-500 animate-pulse" />
          <span>{language === 'es' ? 'Ciclos completados' : 'Cycles completed'}:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm font-poppins">{sessionCount}</span>
        </div>
      </div>

      {/* Main Breathing Center Panel */}
      <div className="flex-1 glass p-8 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden shadow-lg">
        
        {/* Breathing Sphere & SVG Outer Progress Ring */}
        <div className="relative w-52 h-52 flex items-center justify-center">
          
          {/* Progress Ring Ring */}
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 180 180">
            {/* Background static circle */}
            <circle
              cx="90"
              cy="90"
              r={strokeRadius}
              fill="transparent"
              stroke="rgba(195, 228, 249, 0.15)"
              strokeWidth="6"
            />
            {/* Active countdown circle */}
            {isPlaying && (
              <circle
                cx="90"
                cy="90"
                r={strokeRadius}
                fill="transparent"
                stroke="url(#breathRingGrad)"
                strokeWidth="6"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 linear"
              />
            )}
            <defs>
              <linearGradient id="breathRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#87CDFC" />
                <stop offset="100%" stopColor="#CBE5F5" />
              </linearGradient>
            </defs>
          </svg>

          {/* Glowing expanding visual ball */}
          <div 
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-pastel-sky via-pastel-lavender to-pastel-rose opacity-80 shadow-2xl transition-all duration-1000 flex items-center justify-center"
            style={getSphereStyle()}
          >
            {/* Inner details */}
            <div className="w-16 h-16 rounded-full bg-white/25 dark:bg-black/15 backdrop-blur-xs flex flex-col items-center justify-center text-center">
              <span className="font-poppins font-extrabold text-lg text-indigo-950 dark:text-slate-100 animate-pulse-gentle">
                {isPlaying ? `${secondsRemaining}s` : '🧘'}
              </span>
            </div>
          </div>
        </div>

        {/* Breathing instructions and label cues */}
        <div className="mt-10 text-center space-y-1 z-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 dark:text-indigo-400 font-poppins">
            {isPlaying ? (language === 'es' ? currentStep.state.toUpperCase() : currentStep.state.toUpperCase()) : 'READY'}
          </span>
          <h3 className="text-2xl font-extrabold font-poppins text-slate-800 dark:text-slate-100 h-8">
            {getStepText()}
          </h3>
          <p className="text-xs text-slate-400 font-nunito max-w-sm mx-auto">
            {isPlaying 
              ? (language === 'es' ? 'Encuentra tu ritmo natural, inhala y exhala con la esfera' : 'Find your natural rhythm, breath along with the sphere')
              : (language === 'es' ? 'Selecciona una técnica debajo y presiona iniciar' : 'Select a breathing technique below and press start')}
          </p>
        </div>

        {/* Start / Pause control button */}
        <div className="mt-8 z-10">
          {!isPlaying ? (
            <button
              onClick={startGuide}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow hover:shadow-lg transition-all duration-150 flex items-center space-x-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{language === 'es' ? 'Iniciar Respiración' : 'Start Breathing'}</span>
            </button>
          ) : (
            <button
              onClick={stopGuide}
              className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-2xl shadow hover:shadow-lg transition-all duration-150 flex items-center space-x-2 active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{language === 'es' ? 'Pausar Guía' : 'Pause Session'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode selection footer drawer */}
      <div className="glass p-4 rounded-3xl border border-white/20 dark:border-white/5 space-y-3 font-nunito shadow-sm">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-poppins block px-1">
          {language === 'es' ? 'Selecciona una Técnica' : 'Select a Technique'}
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {Object.values(BREATHING_MODES).map((mode) => {
            const label = language === 'es' ? mode.label_es : mode.label_en;
            const desc = language === 'es' ? mode.desc_es : mode.desc_en;
            const isSelected = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  if (isPlaying) stopGuide();
                  setActiveMode(mode.id);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300'
                    : 'bg-white/40 border-slate-200/50 dark:bg-white/5 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10'
                }`}
              >
                <p className="text-xs font-bold font-poppins">{label}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Breathing;
