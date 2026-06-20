import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, HelpCircle, Sparkles, Paintbrush, Check } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

// 7 Gorgeous Relaxing Pastel/Neon Colors
const COLOR_PALETTE = [
  { id: 'rose', label_es: 'Rosa Coral', label_en: 'Coral Pink', hex: '#F43F5E', hsl: 'hsla(345, 100%, 70%, 1.0)' },
  { id: 'orange', label_es: 'Naranja Atardecer', label_en: 'Sunset Orange', hex: '#FB923C', hsl: 'hsla(25, 95%, 65%, 1.0)' },
  { id: 'gold', label_es: 'Oro Brillante', label_en: 'Bright Gold', hex: '#F59E0B', hsl: 'hsla(45, 100%, 60%, 1.0)' },
  { id: 'emerald', label_es: 'Verde Esmeralda', label_en: 'Emerald Green', hex: '#10B981', hsl: 'hsla(150, 100%, 65%, 1.0)' },
  { id: 'sky', label_es: 'Azul Cielo', label_en: 'Sky Blue', hex: '#38BDF8', hsl: 'hsla(195, 95%, 65%, 1.0)' },
  { id: 'amethyst', label_es: 'Violeta Amatista', label_en: 'Amethyst Purple', hex: '#A855F7', hsl: 'hsla(270, 100%, 70%, 1.0)' },
  { id: 'white', label_es: 'Blanco Zen', label_en: 'Zen White', hex: '#F8FAFC', hsl: 'hsla(210, 120%, 98%, 1.0)' }
];

const TEMPLATES = [
  { id: 'mandala', label_es: 'Mandala Zen', label_en: 'Zen Mandala', desc_es: 'Colorea pétalos y círculos simétricos concéntricos.', desc_en: 'Color symmetrical concentric circles and flower petals.' },
  { id: 'lotus', label_es: 'Flor de Loto', label_en: 'Lotus Flower', desc_es: 'Colorea pétalos sobre un estanque bajo el sol.', desc_en: 'Color overlapping petals on a quiet pond under the sun.' },
  { id: 'sunset', label_es: 'Atardecer Zen', label_en: 'Zen Sunset', desc_es: 'Colorea el cielo, las montañas y el agua de meditación.', desc_en: 'Color the sky, mountains, and meditation water ripples.' }
];

const LightRain = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const [activeTemplate, setActiveTemplate] = useState('mandala');
  const [activeColor, setActiveColor] = useState('rose');
  const [coloredRegions, setColoredRegions] = useState({});
  const [playTime, setPlayTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  // Time tracking
  useEffect(() => {
    trackPageView('Zen Coloring Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      recordGameSession('light-rain', playTime);
    };
  }, [playTime]);

  const handleRegionClick = (regionId) => {
    if (isCompleted) return;

    const selectedColorObj = COLOR_PALETTE.find(c => c.id === activeColor) || COLOR_PALETTE[0];
    
    // Play relaxing brush sweep + crystal chime sound
    audioSynth.playZenScratch(0.4);
    audioSynth.playRaindropChime(0.8 + Math.random() * 0.4);

    setColoredRegions(prev => {
      const next = { ...prev, [regionId]: selectedColorObj.hex };
      
      // Check if template is fully colored
      checkCompletion(next);

      return next;
    });
  };

  const checkCompletion = (regionsMap) => {
    let totalRegions = 0;

    if (activeTemplate === 'mandala') {
      totalRegions = 1 + 8 + 8; // center + 8 inner + 8 outer
    } else if (activeTemplate === 'lotus') {
      totalRegions = 1 + 2 + 2 + 3 + 1; // center + 2 inner + 2 outer + 3 waves + 1 sun
    } else if (activeTemplate === 'sunset') {
      totalRegions = 3 + 1 + 2 + 1; // 3 sky + 1 sun + 2 mountains + 1 water
    }

    const coloredCount = Object.keys(regionsMap).filter(key => key.startsWith(activeTemplate) && regionsMap[key]).length;

    if (coloredCount >= totalRegions) {
      triggerVictory();
    }
  };

  const triggerVictory = () => {
    setIsCompleted(true);
    audioSynth.playBreathingBell();

    const newSparkles = Array.from({ length: 25 }).map((_, idx) => ({
      id: idx,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: Math.random() * 12 + 8,
      delay: Math.random() * 0.7
    }));
    setSparkles(newSparkles);
  };

  const handleReset = () => {
    setColoredRegions({});
    setIsCompleted(false);
    setSparkles([]);
    audioSynth.playBreathingBell();
  };

  // Reset completion state when switching template
  useEffect(() => {
    setIsCompleted(false);
    setSparkles([]);
  }, [activeTemplate]);

  const selectedTemplate = TEMPLATES.find(t => t.id === activeTemplate) || TEMPLATES[0];
  const activeColorHex = COLOR_PALETTE.find(c => c.id === activeColor)?.hex || '#F43F5E';

  return (
    <div className="flex-1 flex flex-col space-y-4 select-none">
      
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
          onClick={handleReset}
          className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 transition-all flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider font-poppins active:scale-95 shadow-sm"
          title={language === 'es' ? 'Limpiar Lienzo' : 'Clear Canvas'}
        >
          <RefreshCw className="w-4 h-4 animate-spin-hover" />
          <span>{language === 'es' ? 'Reiniciar' : 'Reset'}</span>
        </button>
      </div>

      {/* Guide details bubble */}
      {showInstructions && (
        <div className="glass p-4 rounded-2xl border border-white/20 dark:border-white/5 text-xs md:text-sm font-nunito text-slate-600 dark:text-slate-300 leading-relaxed flex justify-between items-start">
          <div>
            <p className="font-bold font-poppins text-slate-800 dark:text-slate-100 mb-1">
              {language === 'es' ? 'Lienzo de Colorear Zen' : 'Zen Coloring Canvas'}
            </p>
            <p>
              {language === 'es'
                ? 'Selecciona un color de neón de la paleta y haz clic en las diferentes secciones del dibujo para colorearlas. Llena todos los espacios para completar la armonía.'
                : 'Select a neon paint color from the palette, and tap the regions of the drawing to color them. Fill all spaces to complete the harmony.'}
            </p>
          </div>
          <button 
            onClick={() => setShowInstructions(false)}
            className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 ml-3 hover:underline"
          >
            {language === 'es' ? 'Cerrar' : 'Close'}
          </button>
        </div>
      )}

      {/* Main Drawing Sandbox Board */}
      <div className="flex-1 bg-[#0A0716] rounded-3xl p-6 relative border border-slate-900 shadow-2xl flex flex-col items-center justify-center min-h-[420px] overflow-hidden">
        
        {/* Victory Sparkles Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {sparkles.map(sp => (
              <span
                key={sp.id}
                className="absolute text-yellow-400 dark:text-amber-300 font-bold leading-none animate-ping"
                style={{
                  left: `${sp.x}%`,
                  top: `${sp.y}%`,
                  fontSize: `${sp.size}px`,
                  animationDuration: '2s',
                  animationDelay: `${sp.delay}s`
                }}
              >
                ✦
              </span>
            ))}
            
            {/* Victory banner */}
            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-indigo-200/50 shadow-2xl text-center max-w-sm pointer-events-auto">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-bounce" />
              <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-slate-100">
                {language === 'es' ? '¡Lienzo Completado!' : 'Art Completed!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito mt-1">
                {language === 'es' ? 'Siente la paz de haber llenado el espacio con color y armonía.' : 'Feel the peace of having filled the canvas with color and harmony.'}
              </p>
              <button
                onClick={handleReset}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all duration-150 font-poppins"
              >
                {language === 'es' ? 'Colorear de Nuevo' : 'Color Again'}
              </button>
            </div>
          </div>
        )}

        {/* Floating guidance label */}
        <div className="absolute top-4 left-4 p-2.5 px-4 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/5 pointer-events-none text-xs text-slate-300 font-nunito flex items-center space-x-2 shadow-md">
          <Paintbrush className="w-4 h-4 text-indigo-400" />
          <div>
            <span className="font-bold text-2xs uppercase tracking-wider font-poppins text-white block">
              {language === 'es' ? selectedTemplate.label_es : selectedTemplate.label_en}
            </span>
            <span className="text-3xs text-slate-400 block">
              {language === 'es' ? selectedTemplate.desc_es : selectedTemplate.desc_en}
            </span>
          </div>
        </div>

        {/* SVG Drawing Canvas Rendering */}
        <div className="w-72 h-72 md:w-[360px] md:h-[360px] p-2 bg-slate-950/40 rounded-2xl border border-white/5 flex items-center justify-center relative">
          
          {/* 1. MANDALA ZEN SVG */}
          {activeTemplate === 'mandala' && (
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Outer corner frame guides */}
              <rect x="5" y="5" width="190" height="190" rx="10" fill="none" stroke="#251E3E" strokeWidth="1" />
              
              {/* 8 Outer diamond petals */}
              {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, idx) => {
                const regionId = `mandala-petalo-${idx}`;
                return (
                  <path
                    key={regionId}
                    id={regionId}
                    d="M 100 100 L 76 42 L 100 10 L 124 42 Z"
                    transform={`rotate(${angle}, 100, 100)`}
                    fill={coloredRegions[regionId] || '#0D091F'}
                    stroke="#4F46E5"
                    strokeWidth="1.2"
                    className="cursor-pointer transition-all duration-300 hover:opacity-80 active:scale-[0.99]"
                    onClick={() => handleRegionClick(regionId)}
                  />
                );
              })}

              {/* 8 Inner rounded leaf petals */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
                const regionId = `mandala-petali-${idx}`;
                return (
                  <path
                    key={regionId}
                    id={regionId}
                    d="M 100 82 C 86 68, 86 52, 100 38 C 114 52, 114 68, 100 82 Z"
                    transform={`rotate(${angle}, 100, 100)`}
                    fill={coloredRegions[regionId] || '#150F30'}
                    stroke="#818CF8"
                    strokeWidth="1.2"
                    className="cursor-pointer transition-all duration-300 hover:opacity-80 active:scale-[0.99]"
                    onClick={() => handleRegionClick(regionId)}
                  />
                );
              })}

              {/* Center sacred circle */}
              <circle
                id="mandala-center"
                cx="100"
                cy="100"
                r="18"
                fill={coloredRegions['mandala-center'] || '#1E1B4B'}
                stroke="#C084FC"
                strokeWidth="1.8"
                className="cursor-pointer transition-all duration-300 hover:opacity-80 active:scale-[0.99]"
                onClick={() => handleRegionClick('mandala-center')}
              />
            </svg>
          )}

          {/* 2. FLOR DE LOTO SVG */}
          {activeTemplate === 'lotus' && (
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Outer border circular frame */}
              <circle cx="100" cy="100" r="95" fill="none" stroke="#251E3E" strokeWidth="1" />
              
              {/* Sun in the background */}
              <circle
                id="lotus-sun"
                cx="100"
                cy="45"
                r="18"
                fill={coloredRegions['lotus-sun'] || '#0D091F'}
                stroke="#C084FC"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('lotus-sun')}
              />

              {/* Water waves in the bottom */}
              <path
                id="lotus-wave-l"
                d="M 20 162 C 45 152, 70 152, 100 162 L 100 185 L 20 185 Z"
                fill={coloredRegions['lotus-wave-l'] || '#0D091F'}
                stroke="#4F46E5"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('lotus-wave-l')}
              />
              <path
                id="lotus-wave-r"
                d="M 100 162 C 130 152, 155 152, 180 162 L 180 185 L 100 185 Z"
                fill={coloredRegions['lotus-wave-r'] || '#0D091F'}
                stroke="#4F46E5"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('lotus-wave-r')}
              />
              <path
                id="lotus-wave-c"
                d="M 50 168 C 75 160, 125 160, 150 168 L 150 190 L 50 190 Z"
                fill={coloredRegions['lotus-wave-c'] || '#150F30'}
                stroke="#818CF8"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('lotus-wave-c')}
              />

              {/* Lotus Left Outer Petal */}
              <path
                id="lotus-left-o"
                d="M 100 150 C 45 130, 48 100, 60 80 C 78 100, 92 130, 100 150 Z"
                fill={coloredRegions['lotus-left-o'] || '#0F0A26'}
                stroke="#6366F1"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('lotus-left-o')}
              />
              {/* Lotus Right Outer Petal */}
              <path
                id="lotus-right-o"
                d="M 100 150 C 108 130, 122 100, 140 80 C 152 100, 155 130, 100 150 Z"
                fill={coloredRegions['lotus-right-o'] || '#0F0A26'}
                stroke="#6366F1"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('lotus-right-o')}
              />

              {/* Lotus Left Inner Petal */}
              <path
                id="lotus-left-i"
                d="M 100 150 C 68 118, 68 82, 80 60 C 92 82, 98 118, 100 150 Z"
                fill={coloredRegions['lotus-left-i'] || '#160F35'}
                stroke="#818CF8"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('lotus-left-i')}
              />
              {/* Lotus Right Inner Petal */}
              <path
                id="lotus-right-i"
                d="M 100 150 C 102 118, 108 82, 120 60 C 132 82, 132 118, 100 150 Z"
                fill={coloredRegions['lotus-right-i'] || '#160F35'}
                stroke="#818CF8"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('lotus-right-i')}
              />

              {/* Lotus Center Main Petal */}
              <path
                id="lotus-center"
                d="M 100 150 C 82 105, 82 65, 100 42 C 118 65, 118 105, 100 150 Z"
                fill={coloredRegions['lotus-center'] || '#1E1B4B'}
                stroke="#C084FC"
                strokeWidth="1.4"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('lotus-center')}
              />
            </svg>
          )}

          {/* 3. ZEN SUNSET SVG */}
          {activeTemplate === 'sunset' && (
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Boundary frame */}
              <rect x="5" y="5" width="190" height="190" rx="10" fill="none" stroke="#251E3E" strokeWidth="1" />

              {/* Sky segment 1 (Top) */}
              <path
                id="sunset-sky-t"
                d="M 10 10 L 190 10 L 190 50 L 10 50 Z"
                fill={coloredRegions['sunset-sky-t'] || '#080516'}
                stroke="#4F46E5"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('sunset-sky-t')}
              />
              {/* Sky segment 2 (Middle) */}
              <path
                id="sunset-sky-m"
                d="M 10 50 L 190 50 L 190 90 L 10 90 Z"
                fill={coloredRegions['sunset-sky-m'] || '#0B071E'}
                stroke="#4F46E5"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('sunset-sky-m')}
              />
              {/* Sky segment 3 (Bottom) */}
              <path
                id="sunset-sky-b"
                d="M 10 90 L 190 90 L 190 130 L 10 130 Z"
                fill={coloredRegions['sunset-sky-b'] || '#0F0B28'}
                stroke="#4F46E5"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('sunset-sky-b')}
              />

              {/* Sun in center horizon */}
              <path
                id="sunset-sun"
                d="M 70 130 C 70 95, 130 95, 130 130 Z"
                fill={coloredRegions['sunset-sun'] || '#1A1235'}
                stroke="#C084FC"
                strokeWidth="1.4"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('sunset-sun')}
              />

              {/* Left Mountain */}
              <path
                id="sunset-mountain-l"
                d="M 10 160 L 65 95 L 120 160 Z"
                fill={coloredRegions['sunset-mountain-l'] || '#120D2C'}
                stroke="#6366F1"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-85"
                onClick={() => handleRegionClick('sunset-mountain-l')}
              />
              {/* Right Mountain */}
              <path
                id="sunset-mountain-r"
                d="M 80 160 L 140 85 L 190 160 Z"
                fill={coloredRegions['sunset-mountain-r'] || '#16113A'}
                stroke="#6366F1"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-85"
                onClick={() => handleRegionClick('sunset-mountain-r')}
              />

              {/* Foreground Water panel */}
              <path
                id="sunset-water"
                d="M 10 160 L 190 160 L 190 190 L 10 190 Z"
                fill={coloredRegions['sunset-water'] || '#1D1A3F'}
                stroke="#818CF8"
                strokeWidth="1.2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleRegionClick('sunset-water')}
              />
            </svg>
          )}

        </div>

      </div>

      {/* Control Drawer Footer */}
      <div className="glass p-4 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 font-nunito shadow-sm">
        
        {/* Template Selectors */}
        <div className="flex flex-col gap-1.5 w-full md:w-auto">
          <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider font-poppins block px-1">
            {language === 'es' ? 'Elige un Dibujo' : 'Choose a Drawing'}
          </span>
          <div className="flex items-center space-x-1.5">
            {TEMPLATES.map((temp) => (
              <button
                key={temp.id}
                onClick={() => {
                  setActiveTemplate(temp.id);
                  audioSynth.playPopSound(0.95);
                }}
                className={`px-3.5 py-2 text-2xs font-bold rounded-xl border transition-all ${
                  activeTemplate === temp.id
                    ? 'bg-indigo-600 text-white border-transparent shadow'
                    : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10'
                }`}
              >
                {language === 'es' ? temp.label_es : temp.label_en}
              </button>
            ))}
          </div>
        </div>

        {/* Colors Selection Palette */}
        <div className="flex flex-col gap-1.5 w-full md:w-auto items-end justify-end">
          <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider font-poppins block w-full text-right px-1">
            {language === 'es' ? 'Paleta de Pintura' : 'Paint Palette'}
          </span>
          <div className="flex items-center space-x-2">
            {COLOR_PALETTE.map((color) => {
              const isSelected = activeColor === color.id;
              return (
                <button
                  key={color.id}
                  onClick={() => {
                    setActiveColor(color.id);
                    audioSynth.playPopSound(1.3);
                  }}
                  className={`w-7 h-7 rounded-full border transition-all duration-150 transform hover:scale-105 active:scale-95 flex items-center justify-center ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-900 scale-110 shadow-md'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={language === 'es' ? color.label_es : color.label_en}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-slate-900/40 dark:bg-white/40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default LightRain;
