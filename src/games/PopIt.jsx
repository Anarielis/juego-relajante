import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

// Define layout grids for shapes
const SHAPE_LAYOUTS = {
  square: [
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
  ],
  circle: [
    [0, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 0],
  ],
  heart: [
    [0, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
  ]
};

// Row pastel colors for standard pop it colors
const ROW_COLORS = [
  'bg-red-300 dark:bg-rose-950/60 shadow-red-200 dark:shadow-none',
  'bg-orange-300 dark:bg-orange-950/60 shadow-orange-200 dark:shadow-none',
  'bg-amber-300 dark:bg-amber-950/60 shadow-amber-200 dark:shadow-none',
  'bg-emerald-300 dark:bg-emerald-950/60 shadow-emerald-200 dark:shadow-none',
  'bg-sky-300 dark:bg-blue-950/60 shadow-sky-200 dark:shadow-none',
  'bg-indigo-300 dark:bg-indigo-950/60 shadow-indigo-200 dark:shadow-none',
];

const PopIt = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const [activeShape, setActiveShape] = useState('circle');
  const [bubbleStates, setBubbleStates] = useState({});
  const [sessionPops, setSessionPops] = useState(0);
  const [playTime, setPlayTime] = useState(0);

  // Initialize page view and session timers
  useEffect(() => {
    trackPageView('Pop It Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      recordGameSession('pop-it', playTime);
    };
  }, [playTime]);

  // Load grid layout states whenever shape changes
  useEffect(() => {
    resetPopIt();
  }, [activeShape]);

  const resetPopIt = () => {
    const layout = SHAPE_LAYOUTS[activeShape];
    const initialStates = {};
    layout.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell === 1) {
          initialStates[`${rIdx}-${cIdx}`] = false; // false = not popped, raised
        }
      });
    });
    setBubbleStates(initialStates);
  };

  const handleBubbleClick = (rIdx, cIdx) => {
    const key = `${rIdx}-${cIdx}`;
    const wasPopped = bubbleStates[key];
    
    // Toggle state
    const nextStates = { ...bubbleStates, [key]: !wasPopped };
    setBubbleStates(nextStates);
    setSessionPops(prev => prev + 1);

    // Calculate a physical sound pitch based on grid height
    // Higher bubbles = higher pitch, lower bubbles = lower pitch
    const pitch = 0.75 + (rIdx * 0.12) + (wasPopped ? 0.05 : -0.05);
    audioSynth.playPopSound(pitch);

    // Check if all popped (all true or all false - either side!)
    const vals = Object.values(nextStates);
    const allPopped = vals.every(val => val === true);
    const allRestored = vals.every(val => val === false);

    if (allPopped) {
      // Auto flip / reset back to start with a soft delay
      setTimeout(() => {
        audioSynth.playBreathingBell(); // Satisfying bell chime when completed!
        resetPopIt();
      }, 400);
    }
  };

  const getActivePopsCount = () => {
    return Object.values(bubbleStates).filter(val => val === true).length;
  };

  const getTotalBubbles = () => {
    return Object.values(bubbleStates).length;
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 select-none">
      
      {/* Upper Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-semibold font-nunito"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('welcome_title')}</span>
        </button>

        <button
          onClick={resetPopIt}
          className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 transition-colors flex items-center space-x-2 font-semibold font-nunito text-xs"
        >
          <RefreshCw className="w-4 h-4 animate-spin-hover" />
          <span>{t('reset')}</span>
        </button>
      </div>

      {/* Main Content Play Board */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[350px]">
        {/* Shape Frame Outline */}
        <div 
          className={`glass p-6 md:p-8 rounded-3xl border border-white/40 dark:border-white/5 shadow-xl transition-all duration-500 flex flex-col items-center justify-center ${
            activeShape === 'circle' ? 'rounded-full aspect-square w-72 md:w-96' : ''
          } ${activeShape === 'heart' ? 'w-80 md:w-[420px]' : ''} ${activeShape === 'square' ? 'w-72 md:w-96 aspect-square' : ''}`}
        >
          <div className="flex flex-col space-y-3.5 w-full items-center">
            {SHAPE_LAYOUTS[activeShape].map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center space-x-3.5 w-full">
                {row.map((cell, cIdx) => {
                  if (cell === 0) return <div key={cIdx} className="w-8 h-8 md:w-11 md:h-11 visibility-hidden opacity-0" />;
                  
                  const isPopped = bubbleStates[`${rIdx}-${cIdx}`];
                  const colorClass = ROW_COLORS[rIdx % ROW_COLORS.length];
                  
                  return (
                    <button
                      key={cIdx}
                      onClick={() => handleBubbleClick(rIdx, cIdx)}
                      className={`w-8 h-8 md:w-11 md:h-11 rounded-full border transition-all duration-150 transform hover:scale-105 active:scale-95 flex items-center justify-center relative ${colorClass} ${
                        isPopped
                          ? 'border-black/10 dark:border-white/10 shadow-inner scale-95 opacity-70 translate-y-0.5'
                          : 'border-white/40 dark:border-white/10 shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Inside highlight for pop reflection */}
                      {!isPopped && (
                        <div className="absolute top-0.5 left-1 w-2.5 h-1.5 bg-white/40 rounded-full" />
                      )}
                      {isPopped && (
                        <div className="w-3.5 h-3.5 rounded-full bg-black/10 dark:bg-white/5 border border-black/5 shadow-inner" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Drawer Footer */}
      <div className="glass p-4 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 font-nunito">
        
        {/* Shape selection tabs */}
        <div className="flex items-center space-x-2">
          {['circle', 'square', 'heart'].map((shape) => (
            <button
              key={shape}
              onClick={() => setActiveShape(shape)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all ${
                activeShape === shape
                  ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                  : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80'
              }`}
            >
              {shape === 'circle' ? '🔴 ' : shape === 'square' ? '⬛ ' : '❤️ '}
              {language === 'es' 
                ? (shape === 'circle' ? 'Círculo' : shape === 'square' ? 'Cuadrado' : 'Corazón')
                : (shape === 'circle' ? 'Circle' : shape === 'square' ? 'Square' : 'Heart')}
            </button>
          ))}
        </div>

        {/* Clicks statistics details */}
        <div className="flex items-center space-x-4 text-xs font-poppins font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1">
            <span>{t('clicks')}:</span>
            <span className="text-slate-800 dark:text-slate-200 text-sm font-bold">{sessionPops}</span>
          </div>
          <span className="text-slate-300 dark:text-white/10">|</span>
          <div className="flex items-center space-x-1">
            <span>{language === 'es' ? 'Progreso' : 'Progress'}:</span>
            <span className="text-slate-800 dark:text-slate-200 text-sm font-bold">
              {getActivePopsCount()}/{getTotalBubbles()}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PopIt;
