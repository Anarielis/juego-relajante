import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, Eye, Sparkles, CloudRain, Edit3, Image, Grid } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

const COLOR_PALETTE = [
  { id: 'emerald', label: 'Esmeralda', hex: '#10B981', hsl: 'hsla(150, 100%, 70%, opacity)' },
  { id: 'amethyst', label: 'Amatista', hex: '#A855F7', hsl: 'hsla(270, 100%, 75%, opacity)' },
  { id: 'gold', label: 'Oro', hex: '#F59E0B', hsl: 'hsla(45, 100%, 65%, opacity)' },
  { id: 'rose', label: 'Rosa Coral', hex: '#F43F5E', hsl: 'hsla(345, 100%, 70%, opacity)' }
];

const TEMPLATES = [
  { id: 'free', label_es: 'Lienzo Libre', label_en: 'Free Canvas' },
  { id: 'mandala', label_es: 'Mandala Zen', label_en: 'Zen Mandala' },
  { id: 'lotus', label_es: 'Flor de Loto', label_en: 'Lotus Flower' }
];

const LightRain = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [activeMode, setActiveMode] = useState('rain'); // 'rain' or 'paint'
  const [activeColor, setActiveColor] = useState('emerald');
  const [activeTemplate, setActiveTemplate] = useState('free');
  const [brushSize, setBrushSize] = useState(6);
  const [playTime, setPlayTime] = useState(0);
  const [splashesCount, setSplashesCount] = useState(0);

  const particlesRef = useRef([]);
  const splashesRef = useRef([]);
  const strokesRef = useRef([]); // Persistent drawings
  const activeStrokeRef = useRef(null);

  const mouseRef = useRef({ x: 0, y: 0, active: false, prevX: 0, lastActiveTime: 0 });
  const animationFrameId = useRef(null);

  // Synchronize state values for rendering loop refs
  const activeModeRef = useRef(activeMode);
  const activeColorRef = useRef(activeColor);
  const activeTemplateRef = useRef(activeTemplate);

  useEffect(() => {
    activeModeRef.current = activeMode;
    activeColorRef.current = activeColor;
    activeTemplateRef.current = activeTemplate;
  }, [activeMode, activeColor, activeTemplate]);

  // Page tracking & session timer
  useEffect(() => {
    trackPageView('Light Rain Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      recordGameSession('light-rain', playTime);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [playTime]);

  // Setup Canvas and loop
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

    // Spawn 120 raindrops
    const maxParticles = 120;
    particlesRef.current = Array.from({ length: maxParticles }).map(() => spawnDrop(canvas.clientWidth || 600, canvas.clientHeight || 450, true));

    function spawnDrop(width, height, randomY = false) {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -20,
        vy: Math.random() * 3 + 3,
        vx: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 1.2,
        alpha: Math.random() * 0.45 + 0.45,
        length: Math.random() * 12 + 10
      };
    }

    const tick = () => {
      const width = parseFloat(canvas.style.width) || canvas.width;
      const height = parseFloat(canvas.style.height) || canvas.height;
      const mode = activeModeRef.current;
      const tId = activeTemplateRef.current;
      const colorObj = COLOR_PALETTE.find(c => c.id === activeColorRef.current) || COLOR_PALETTE[0];

      // Draw background (slight transparent black for trails)
      ctx.fillStyle = 'rgba(10, 8, 22, 0.18)';
      ctx.fillRect(0, 0, width, height);

      // Render templates lines under particles
      if (tId !== 'free') {
        drawTemplateBackground(ctx, width, height, tId);
      }

      ctx.globalCompositeOperation = 'lighter';

      // 1. Draw Persistent Paintings
      strokesRef.current.forEach(stroke => {
        if (stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = stroke.size * 1.5;
        ctx.shadowColor = stroke.color;
        
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      });

      // 2. Draw falling drops only if in 'rain' mode
      if (mode === 'rain') {
        particlesRef.current.forEach(p => {
          // Repel from cursor
          if (mouseRef.current.active) {
            const dx = p.x - mouseRef.current.x;
            const dy = p.y - mouseRef.current.y;
            if (dy > -30 && dy < 90) {
              const dist = Math.hypot(dx, dy);
              if (dist < 90) {
                const force = (90 - dist) / 90;
                p.vx += (dx / (dist || 1)) * force * 1.2;
                p.vy = Math.max(1.2, p.vy * 0.75);
              }
            }
          }

          p.vx *= 0.94;
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          if (p.y >= height - 8) {
            // Trigger splash on contact with floor
            splashesRef.current.push({
              id: Math.random(),
              type: 'spark',
              x: p.x,
              y: height - 8,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -Math.random() * 1.5 - 0.5,
              size: Math.random() * 1.5 + 0.8,
              alpha: 0.8,
              decay: 0.035,
              color: colorObj.hsl
            });

            setSplashesCount(c => c + 1);

            const reset = spawnDrop(width, height, false);
            Object.assign(p, reset);
          }

          ctx.beginPath();
          ctx.strokeStyle = colorObj.hsl.replace('opacity', p.alpha);
          ctx.lineWidth = p.size;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
          ctx.stroke();
        });
      }

      // 3. Draw active splashes
      for (let i = splashesRef.current.length - 1; i >= 0; i--) {
        const s = splashesRef.current[i];
        s.x += s.vx || 0;
        s.y += s.vy || 0;
        if (s.gravity) s.vy += s.gravity;
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
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          ctx.arc(s.x, s.y, s.size || 1.5, 0, Math.PI * 2);
          ctx.fillStyle = s.color.replace('opacity', s.alpha);
          ctx.fill();
        }
      }

      // 4. Cursor glow spot
      if (mouseRef.current.active) {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(mouseRef.current.x, mouseRef.current.y, 0, mouseRef.current.x, mouseRef.current.y, 40);
        grad.addColorStop(0, colorObj.hsl.replace('opacity', 0.22));
        grad.addColorStop(1, colorObj.hsl.replace('opacity', 0));
        ctx.fillStyle = grad;
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 40, 0, Math.PI * 2);
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

  // Draws outline guidelines for coloring templates (Mandala / Lotus)
  const drawTemplateBackground = (ctx, width, height, type) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.2;
    const cx = width / 2;
    const cy = height / 2;

    if (type === 'mandala') {
      // Concentric circles
      for (let r = 30; r <= 150; r += 30) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Rays
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
        ctx.lineTo(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160);
        ctx.stroke();
      }
      // Inner flower petals
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * 45, cy + Math.sin(a) * 45, 25, 12, a, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (type === 'lotus') {
      // Center bud
      ctx.beginPath();
      ctx.ellipse(cx, cy + 20, 20, 45, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Side petals
      for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.ellipse(cx + side * 28, cy + 24, 18, 40, side * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(cx + side * 50, cy + 32, 14, 32, side * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Pool ripple underneath
      ctx.beginPath();
      ctx.ellipse(cx, cy + 70, 70, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Pointer event handlers (mouse & touch)
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

    if (activeMode === 'paint') {
      // Start a new drawing stroke path
      const colorObj = COLOR_PALETTE.find(c => c.id === activeColor) || COLOR_PALETTE[0];
      const newStroke = {
        color: colorObj.hex,
        size: brushSize,
        points: [{ x: mx, y: my }]
      };
      
      strokesRef.current.push(newStroke);
      activeStrokeRef.current = newStroke;

      // Play soft scratch sound
      audioSynth.playZenScratch(0.3);
    } else {
      // Direct click sparkles emission in rain mode
      audioSynth.playRaindropChime(1.0);
      spawnBurst(mx, my);
    }
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

    if (activeMode === 'paint' && activeStrokeRef.current) {
      activeStrokeRef.current.points.push({ x: mx, y: my });

      // Scratch brush ASMR sound intermittently
      if (Math.random() > 0.88) {
        audioSynth.playZenScratch(0.2);
      }
    } else if (activeMode === 'rain') {
      // Emit soft chimes on rapid drag gestures
      const speedX = Math.abs(mx - mouseRef.current.prevX);
      if (speedX > 14 && Date.now() - mouseRef.current.lastActiveTime > 180) {
        const pitch = 0.6 + (1.0 - (my / rect.height)) * 0.8;
        audioSynth.playRaindropChime(pitch);
        mouseRef.current.lastActiveTime = Date.now();
      }
    }

    mouseRef.current.prevX = mx;
  };

  const handlePointerUp = () => {
    mouseRef.current.active = false;
    activeStrokeRef.current = null;
  };

  const spawnBurst = (x, y) => {
    const colorObj = COLOR_PALETTE.find(c => c.id === activeColor) || COLOR_PALETTE[0];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.2 + 0.8;
      splashesRef.current.push({
        id: Math.random(),
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        alpha: 1.0,
        decay: Math.random() * 0.035 + 0.02,
        color: colorObj.hsl
      });
    }
  };

  // FULL RESET BUTTON HANDLER (100% Functional)
  const handleFullReset = () => {
    // Clear drawings
    strokesRef.current = [];
    // Clear particles splashes
    splashesRef.current = [];
    // Reset counter
    setSplashesCount(0);
    // Unselect drawing path
    activeStrokeRef.current = null;
    setSelectedPieceId && setSelectedPieceId(null);
    
    // Play soothing bell chime
    audioSynth.playBreathingBell();
  };

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
          {activeMode === 'rain' && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-nunito font-semibold mr-1">
              <CloudRain className="w-4 h-4 text-sky-500" />
              <span>{language === 'es' ? 'Gotas' : 'Drops'}:</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold font-poppins">{splashesCount}</span>
            </div>
          )}

          <button
            onClick={handleFullReset}
            className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 transition-all flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider font-poppins active:scale-95 pointer-events-auto"
            title={language === 'es' ? 'Limpiar Todo' : 'Clear Canvas'}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{language === 'es' ? 'Reiniciar' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-[380px] bg-[#090714] rounded-3xl overflow-hidden relative border border-slate-900 shadow-2xl"
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
          {activeMode === 'rain' ? <CloudRain className="w-4 h-4 text-sky-400" /> : <Edit3 className="w-4 h-4 text-emerald-400" />}
          <div>
            <span className="font-bold text-2xs uppercase tracking-wider font-poppins text-white block">
              {activeMode === 'rain' ? (language === 'es' ? 'Lluvia de Luz' : 'Rain of Light') : (language === 'es' ? 'Lienzo de Dibujo' : 'Coloring Paint')}
            </span>
            <span className="text-3xs text-slate-400 block">
              {activeMode === 'rain'
                ? (language === 'es' ? 'Usa tu cursor como un escudo para la lluvia.' : 'Use your cursor as an umbrella shield.')
                : (language === 'es' ? 'Arrastra tu dedo para pintar con luz de neón.' : 'Drag to paint glowing neon paths.')}
            </span>
          </div>
        </div>

        {/* Soft help overlay */}
        <div className="absolute bottom-4 right-4 p-2 px-3 rounded-lg bg-white/5 dark:bg-slate-950/40 border border-white/5 pointer-events-none text-3xs font-semibold text-slate-400 uppercase tracking-widest font-poppins">
          {activeMode === 'rain'
            ? (language === 'es' ? 'Desliza para desviar la lluvia' : 'Swipe to deflect rain')
            : (language === 'es' ? 'Dibuja en la pantalla' : 'Draw on screen')}
        </div>
      </div>

      {/* Control Drawer Footer */}
      <div className="glass p-4 rounded-3xl border border-white/20 dark:border-white/5 space-y-4 font-nunito shadow-sm">
        
        {/* Toggle Mode and Palette Selection Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Active Mode Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveMode('rain');
                audioSynth.playPopSound(1.0);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all duration-150 flex items-center space-x-1.5 ${
                activeMode === 'rain'
                  ? 'bg-indigo-600 text-white border-transparent shadow'
                  : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>{language === 'es' ? 'Modo Lluvia' : 'Rain Mode'}</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('paint');
                audioSynth.playPopSound(1.0);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all duration-150 flex items-center space-x-1.5 ${
                activeMode === 'paint'
                  ? 'bg-indigo-600 text-white border-transparent shadow'
                  : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{language === 'es' ? 'Modo Colorear' : 'Paint Mode'}</span>
            </button>
          </div>

          {/* Color choice palette */}
          <div className="flex items-center space-x-2.5">
            <span className="text-3xs text-slate-400 font-bold uppercase font-poppins">
              {language === 'es' ? 'Color' : 'Color'}:
            </span>
            <div className="flex items-center space-x-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    setActiveColor(color.id);
                    audioSynth.playPopSound(1.3);
                  }}
                  className={`w-6 h-6 rounded-full border transition-all duration-150 transform hover:scale-105 active:scale-95 ${
                    activeColor === color.id
                      ? 'border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-900 scale-110'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sub settings drawer: template picker and brush size (only for coloring mode) */}
        {activeMode === 'paint' && (
          <div className="pt-3 border-t border-slate-200/20 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
            {/* Template Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-3xs text-slate-400 font-bold uppercase font-poppins">
                {language === 'es' ? 'Plantillas' : 'Templates'}:
              </span>
              <div className="flex items-center space-x-1">
                {TEMPLATES.map((temp) => (
                  <button
                    key={temp.id}
                    onClick={() => {
                      setActiveTemplate(temp.id);
                      audioSynth.playPopSound(0.9);
                    }}
                    className={`px-3 py-1.5 text-2xs font-bold rounded-lg border transition-all ${
                      activeTemplate === temp.id
                        ? 'bg-white/80 dark:bg-slate-900 border-indigo-200 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'bg-white/20 dark:bg-white/5 border-slate-200/20 dark:border-white/5 text-slate-500 hover:bg-white/40'
                    }`}
                  >
                    {language === 'es' ? temp.label_es : temp.label_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Brush size slider */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <span className="text-3xs text-slate-400 font-bold uppercase font-poppins flex-shrink-0">
                {language === 'es' ? 'Tamaño Pincel' : 'Brush Size'}:
              </span>
              <input
                type="range"
                min="3"
                max="15"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full md:w-32 accent-indigo-600 bg-slate-200/50 dark:bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <span className="text-2xs text-slate-500 w-4 text-right font-poppins font-bold">{brushSize}px</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default LightRain;
