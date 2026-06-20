import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, HelpCircle, Sparkles, Edit3, Heart } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

const COLOR_PALETTE = [
  { id: 'emerald', label_es: 'Esmeralda', label_en: 'Emerald', hex: '#10B981', hsl: 'hsla(150, 100%, 70%, opacity)' },
  { id: 'amethyst', label_es: 'Amatista', label_en: 'Amethyst', hex: '#A855F7', hsl: 'hsla(270, 100%, 75%, opacity)' },
  { id: 'gold', label_es: 'Oro', label_en: 'Gold', hex: '#F59E0B', hsl: 'hsla(45, 100%, 65%, opacity)' },
  { id: 'rose', label_es: 'Rosa Coral', label_en: 'Rose Coral', hex: '#F43F5E', hsl: 'hsla(345, 100%, 70%, opacity)' }
];

const TEMPLATES = [
  { id: 'free', label_es: 'Lienzo Libre', label_en: 'Free Canvas', desc_es: 'Dibuja con total libertad sobre un lienzo oscuro.', desc_en: 'Paint with complete freedom on a dark canvas.' },
  { id: 'mandala', label_es: 'Mandala Zen', label_en: 'Zen Mandala', desc_es: 'Colorea las líneas concéntricas de un mandala simétrico.', desc_en: 'Color the concentric lines of a symmetric mandala.' },
  { id: 'lotus', label_es: 'Flor de Loto', label_en: 'Lotus Flower', desc_es: 'Colorea una sagrada flor de loto en su estanque.', desc_en: 'Color a sacred lotus flower sitting in its pond.' }
];

const LightRain = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [activeColor, setActiveColor] = useState('emerald');
  const [activeTemplate, setActiveTemplate] = useState('free');
  const [brushSize, setBrushSize] = useState(6);
  const [playTime, setPlayTime] = useState(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  const splashesRef = useRef([]); // Click ripples and sparkles
  const strokesRef = useRef([]); // Persistent drawings
  const activeStrokeRef = useRef(null);

  const mouseRef = useRef({ x: 0, y: 0, active: false, prevX: 0, lastActiveTime: 0 });
  const animationFrameId = useRef(null);

  const activeColorRef = useRef(activeColor);
  const activeTemplateRef = useRef(activeTemplate);

  useEffect(() => {
    activeColorRef.current = activeColor;
    activeTemplateRef.current = activeTemplate;
  }, [activeColor, activeTemplate]);

  // Tracking and session timing
  useEffect(() => {
    trackPageView('Coloring Book Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      recordGameSession('light-rain', playTime); // Stored under 'light-rain' key for consistency
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [playTime]);

  // Setup Canvas and rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      const rect = containerRef.current?.getBoundingClientRect() || { width: 600, height: 450 };
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    splashesRef.current = [];
    strokesRef.current = [];

    const tick = () => {
      const width = parseFloat(canvas.style.width) || canvas.width;
      const height = parseFloat(canvas.style.height) || canvas.height;
      const tId = activeTemplateRef.current;
      const colorObj = COLOR_PALETTE.find(c => c.id === activeColorRef.current) || COLOR_PALETTE[0];

      // Draw background (slight alpha overlay for faint light trail blends)
      ctx.fillStyle = 'rgba(10, 8, 22, 0.16)';
      ctx.fillRect(0, 0, width, height);

      // Render outlines of the chosen templates
      if (tId !== 'free') {
        drawTemplateBackground(ctx, width, height, tId);
      }

      ctx.globalCompositeOperation = 'lighter';

      // 1. Draw Persistent custom painting strokes
      strokesRef.current.forEach(stroke => {
        if (stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Add neon glow shadow
        ctx.shadowBlur = stroke.size * 1.6;
        ctx.shadowColor = stroke.color;
        
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      });

      // 2. Draw active click/drag sparkles and ripples
      for (let i = splashesRef.current.length - 1; i >= 0; i--) {
        const s = splashesRef.current[i];
        s.x += s.vx || 0;
        s.y += s.vy || 0;
        s.alpha -= s.decay || 0.02;

        if (s.alpha <= 0) {
          splashesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        if (s.type === 'ripple') {
          s.radius += s.speed || 1.2;
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.strokeStyle = s.color.replace('opacity', s.alpha);
          ctx.lineWidth = 1.3;
          ctx.stroke();
        } else {
          ctx.arc(s.x, s.y, s.size || 1.5, 0, Math.PI * 2);
          ctx.fillStyle = s.color.replace('opacity', s.alpha);
          ctx.fill();
        }
      }

      // 3. Draw subtle cursor indicator spot
      if (mouseRef.current.active) {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(mouseRef.current.x, mouseRef.current.y, 0, mouseRef.current.x, mouseRef.current.y, 35);
        grad.addColorStop(0, colorObj.hsl.replace('opacity', 0.2));
        grad.addColorStop(1, colorObj.hsl.replace('opacity', 0));
        ctx.fillStyle = grad;
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      animationFrameId.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Guidelines outlines for Mandalas or Lotus Flower template
  const drawTemplateBackground = (ctx, width, height, type) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 1.3;
    const cx = width / 2;
    const cy = height / 2;

    if (type === 'mandala') {
      // Concentric circles
      for (let r = 25; r <= 150; r += 25) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Symmetric ray guide lines
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15);
        ctx.lineTo(cx + Math.cos(a) * 165, cy + Math.sin(a) * 165);
        ctx.stroke();
      }
      // Mandala details / petals
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * 55, cy + Math.sin(a) * 55, 25, 14, a, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (type === 'lotus') {
      // Center Bud
      ctx.beginPath();
      ctx.ellipse(cx, cy + 15, 22, 48, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Overlapping petals
      for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.ellipse(cx + side * 28, cy + 20, 20, 44, side * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(cx + side * 52, cy + 28, 16, 35, side * 0.75, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cx + side * 70, cy + 42, 12, 28, side * 1.1, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Floating pond ring
      ctx.beginPath();
      ctx.ellipse(cx, cy + 68, 80, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Touch and pointer drawing mechanics
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    mouseRef.current.x = mx;
    mouseRef.current.y = my;
    mouseRef.current.active = true;

    // Start new stroke
    const colorObj = COLOR_PALETTE.find(c => c.id === activeColor) || COLOR_PALETTE[0];
    const newStroke = {
      color: colorObj.hex,
      size: brushSize,
      points: [{ x: mx, y: my }]
    };
    
    strokesRef.current.push(newStroke);
    activeStrokeRef.current = newStroke;
    setStrokeCount(strokesRef.current.length);

    // Play scratch brush sound
    audioSynth.playZenScratch(0.35);

    // Play drop chime based on height
    const normalizedY = 1.0 - (my / rect.height);
    audioSynth.playRaindropChime(0.6 + normalizedY * 0.8);
    spawnClickRipples(mx, my, colorObj.hsl);
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    mouseRef.current.x = mx;
    mouseRef.current.y = my;
    mouseRef.current.active = true;

    if (activeStrokeRef.current) {
      activeStrokeRef.current.points.push({ x: mx, y: my });

      // Scratch brush sound playing intermittently to sound realistic
      if (Math.random() > 0.88) {
        audioSynth.playZenScratch(0.18);
      }

      // Spawn soft movement sparkles
      if (Math.random() > 0.6) {
        const colorObj = COLOR_PALETTE.find(c => c.id === activeColor) || COLOR_PALETTE[0];
        splashesRef.current.push({
          id: Math.random(),
          type: 'spark',
          x: mx + (Math.random() - 0.5) * 8,
          y: my + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 1.5 + 0.8,
          alpha: 0.8,
          decay: 0.04,
          color: colorObj.hsl
        });
      }
    }
  };

  const handlePointerUp = () => {
    mouseRef.current.active = false;
    activeStrokeRef.current = null;
  };

  const spawnClickRipples = (x, y, hslColor) => {
    // Spawn ripple ring
    splashesRef.current.push({
      id: Math.random(),
      type: 'ripple',
      x,
      y,
      radius: 2,
      maxRadius: 35,
      alpha: 1.0,
      speed: 1.6,
      color: hslColor
    });

    // Spawn sparks
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.8 + 0.5;
      splashesRef.current.push({
        id: Math.random(),
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        alpha: 1.0,
        decay: 0.035,
        color: hslColor
      });
    }
  };

  // Completely clears all persistent drawings and visual feedback
  const handleFullReset = () => {
    strokesRef.current = [];
    splashesRef.current = [];
    setStrokeCount(0);
    activeStrokeRef.current = null;
    audioSynth.playBreathingBell(); // Soothing bell sound feedback
  };

  const selectedTemplateDetails = TEMPLATES.find(t => t.id === activeTemplate) || TEMPLATES[0];

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

        {/* Counter and Full Reset button */}
        <div className="flex items-center space-x-2">
          {strokeCount > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-nunito font-semibold mr-1">
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'es' ? 'Trazos' : 'Strokes'}:</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold font-poppins">{strokeCount}</span>
            </div>
          )}

          <button
            onClick={handleFullReset}
            className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 transition-all flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider font-poppins active:scale-95 pointer-events-auto shadow-sm"
            title={language === 'es' ? 'Limpiar Lienzo' : 'Clear Canvas'}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{language === 'es' ? 'Reiniciar' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Guide details bubble */}
      {showInstructions && (
        <div className="glass p-4 rounded-2xl border border-white/20 dark:border-white/5 text-xs md:text-sm font-nunito text-slate-600 dark:text-slate-300 leading-relaxed flex justify-between items-start">
          <div>
            <p className="font-bold font-poppins text-slate-800 dark:text-slate-100 mb-1">
              {language === 'es' ? 'Lienzo de Dibujo Zen' : 'Zen Coloring Canvas'}
            </p>
            <p>
              {language === 'es'
                ? 'Colorea las líneas guía seleccionando colores de neón de la paleta. Arrastra tu dedo o ratón para pintar y escucha los sonidos ASMR de cepillo y campana cristalina.'
                : 'Color the guide outlines by selecting neon paint from the palette. Drag your finger or mouse to draw and listen to the relaxing ASMR brush and bell chimes.'}
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

      {/* Main Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-[380px] bg-[#080612] rounded-3xl overflow-hidden relative border border-slate-900 shadow-2xl"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="absolute inset-0 w-full h-full block touch-none cursor-crosshair"
        />

        {/* Floating details mode bubble */}
        <div className="absolute top-4 left-4 p-2.5 px-4 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/5 pointer-events-none text-xs text-slate-300 font-nunito flex items-center space-x-2 shadow-md">
          <Edit3 className="w-4 h-4 text-indigo-400 animate-pulse" />
          <div>
            <span className="font-bold text-2xs uppercase tracking-wider font-poppins text-white block">
              {language === 'es' ? 'Lienzo Zen de Pintura' : 'Zen Paint Canvas'}
            </span>
            <span className="text-3xs text-slate-400 block">
              {language === 'es' ? selectedTemplateDetails.desc_es : selectedTemplateDetails.desc_en}
            </span>
          </div>
        </div>

        {/* Soft help overlay */}
        <div className="absolute bottom-4 right-4 p-2 px-3 rounded-lg bg-white/5 dark:bg-slate-950/40 border border-white/5 pointer-events-none text-3xs font-semibold text-slate-400 uppercase tracking-widest font-poppins">
          {language === 'es' ? 'Colorea con tu dedo' : 'Color with your finger'}
        </div>
      </div>

      {/* Control Drawer Footer */}
      <div className="glass p-4 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 font-nunito shadow-sm">
        
        {/* Template selector tab options */}
        <div className="flex flex-col gap-1.5 w-full md:w-auto">
          <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider font-poppins block px-1">
            {language === 'es' ? 'Plantillas Zen' : 'Zen Outlines'}
          </span>
          <div className="flex items-center space-x-1.5">
            {TEMPLATES.map((temp) => (
              <button
                key={temp.id}
                onClick={() => {
                  setActiveTemplate(temp.id);
                  audioSynth.playPopSound(0.95);
                }}
                className={`px-3 py-2 text-2xs font-bold rounded-xl border transition-all ${
                  activeTemplate === temp.id
                    ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                    : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80'
                }`}
              >
                {language === 'es' ? temp.label_es : temp.label_en}
              </button>
            ))}
          </div>
        </div>

        {/* Brush options drawer (colors and size) */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto justify-end">
          
          {/* Color palette */}
          <div className="flex items-center space-x-2">
            <span className="text-3xs text-slate-400 font-bold uppercase font-poppins">
              {language === 'es' ? 'Colores' : 'Paints'}:
            </span>
            <div className="flex items-center space-x-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    setActiveColor(color.id);
                    audioSynth.playPopSound(1.35);
                  }}
                  className={`w-6 h-6 rounded-full border transition-all duration-150 transform hover:scale-105 active:scale-95 ${
                    activeColor === color.id
                      ? 'border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-900 scale-110'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={language === 'es' ? color.label_es : color.label_en}
                />
              ))}
            </div>
          </div>

          {/* Brush size slider */}
          <div className="flex items-center space-x-2 flex-grow md:flex-grow-0">
            <span className="text-3xs text-slate-400 font-bold uppercase font-poppins flex-shrink-0">
              {language === 'es' ? 'Pincel' : 'Brush'}:
            </span>
            <input
              type="range"
              min="3"
              max="15"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24 accent-indigo-600 bg-slate-200/50 dark:bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            <span className="text-2xs text-slate-500 w-4 text-right font-poppins font-bold flex-shrink-0">{brushSize}px</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LightRain;
