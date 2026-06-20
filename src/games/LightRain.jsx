import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, Eye, Sparkles, CloudRain, ShieldAlert, Award } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

const SCENARIOS = [
  { 
    id: 'aurora', 
    name_es: 'Lluvia Aurora', 
    name_en: 'Aurora Rain', 
    desc_es: 'Lluvia verde y esmeralda. El agua crea ondas concéntricas al tocar el suelo.',
    desc_en: 'Emerald and teal drops. Water creates glowing ripples upon contact.',
    colorClass: 'from-emerald-950 to-slate-950', 
    icon: '💚',
    particleColor: 'hsla(150, 100%, 70%, opacity)',
    splashType: 'ripple'
  },
  { 
    id: 'galaxy', 
    name_es: 'Lluvia Cósmica', 
    name_en: 'Cosmic Rain', 
    desc_es: 'Gotas violetas y magenta con estrellas fugaces. Crea destellos celestes.',
    desc_en: 'Violet and magenta drops with shooting stars. Spawns stardust on impact.',
    colorClass: 'from-purple-950 to-slate-950', 
    icon: '🌌',
    particleColor: 'hsla(290, 100%, 75%, opacity)',
    splashType: 'starburst'
  },
  { 
    id: 'gold', 
    name_es: 'Lluvia de Oro', 
    name_en: 'Golden Rain', 
    desc_es: 'Gotas de oro líquido y bronce. Al chocar, saltan chispas de luz brillante.',
    desc_en: 'Liquid gold and amber drops. Bounces golden sparks upwards upon impact.',
    colorClass: 'from-amber-950 to-slate-950', 
    icon: '✨',
    particleColor: 'hsla(45, 100%, 65%, opacity)',
    splashType: 'sparks'
  },
  { 
    id: 'sunset', 
    name_es: 'Lluvia Atardecer', 
    name_en: 'Sunset Breeze', 
    desc_es: 'Gotas suaves coral y naranja que caen con el viento. Ondas tenues al caer.',
    desc_en: 'Soft coral and peach drops swaying with wind. Elegant waves on bottom.',
    colorClass: 'from-rose-950 to-slate-950', 
    icon: '🌅',
    particleColor: 'hsla(15, 100%, 70%, opacity)',
    splashType: 'ripple'
  }
];

const LightRain = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [activeScenario, setActiveScenario] = useState('aurora');
  const [playTime, setPlayTime] = useState(0);
  const [splashesCount, setSplashesCount] = useState(0);

  const particlesRef = useRef([]);
  const splashesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false, lastActiveTime: 0 });
  const animationFrameId = useRef(null);
  
  // Keep track of the active scenario ID in a ref for the canvas animation loop
  const activeScenarioRef = useRef(activeScenario);
  useEffect(() => {
    activeScenarioRef.current = activeScenario;
  }, [activeScenario]);

  // Track page view and session time
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

  // Initialize and handle canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set display size and take into account high DPI screens
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

    // Initialize rain drops (limit to 120 for optimal performance on mobile)
    const maxParticles = 120;
    particlesRef.current = Array.from({ length: maxParticles }).map(() => spawnDrop(canvas.clientWidth || 600, canvas.clientHeight || 450, true));
    splashesRef.current = [];

    function spawnDrop(width, height, randomY = false) {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -20,
        vy: Math.random() * 3.5 + 3.5, // vertical velocity (rain speed)
        vx: (Math.random() - 0.5) * 0.4, // wind deviation
        size: Math.random() * 1.5 + 1.2, // size thickness
        alpha: Math.random() * 0.45 + 0.5,
        length: Math.random() * 12 + 10 // visual rain stretch length
      };
    }

    function createSplash(x, y, scenario) {
      const type = scenario.splashType;
      const baseColor = scenario.particleColor;
      
      if (type === 'ripple') {
        splashesRef.current.push({
          id: Math.random(),
          type: 'ripple',
          x,
          y,
          radius: 1,
          maxRadius: Math.random() * 15 + 15,
          alpha: 0.8,
          speed: Math.random() * 0.8 + 0.8,
          color: baseColor
        });
      } else if (type === 'starburst') {
        const count = 4;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
          const speed = Math.random() * 1.5 + 0.5;
          splashesRef.current.push({
            id: Math.random(),
            type: 'spark',
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5, // pull slightly up
            size: Math.random() * 1.5 + 1,
            alpha: 1.0,
            decay: Math.random() * 0.04 + 0.03,
            color: baseColor
          });
        }
      } else if (type === 'sparks') {
        const count = 5;
        for (let i = 0; i < count; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2; // fountain shape pointing upwards
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
            decay: Math.random() * 0.03 + 0.02,
            gravity: 0.12, // physics gravity pulls sparks back down
            color: baseColor
          });
        }
      }
      
      // Limit splashes count in buffer
      if (splashesRef.current.length > 80) {
        splashesRef.current.shift();
      }
    }

    const tick = () => {
      const width = canvas.style.width ? parseFloat(canvas.style.width) : canvas.width;
      const height = canvas.style.height ? parseFloat(canvas.style.height) : canvas.height;
      const scenId = activeScenarioRef.current;
      const scenario = SCENARIOS.find(s => s.id === scenId) || SCENARIOS[0];

      // Draw backdrop with trails (alpha controls trail length)
      ctx.fillStyle = 'rgba(10, 8, 22, 0.22)';
      ctx.fillRect(0, 0, width, height);

      // Glow effect configuration
      ctx.globalCompositeOperation = 'lighter';

      const mouse = mouseRef.current;
      const particles = particlesRef.current;
      const splashes = splashesRef.current;

      // 1. Update and draw rain drops
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Wind drift in Sunset scenario
        if (scenId === 'sunset') {
          p.vx += Math.sin(Date.now() * 0.001 + p.x * 0.01) * 0.015;
          p.vx = Math.max(-1.5, Math.min(1.5, p.vx));
        }

        // Apply mouse force field (umbrella repelling effect)
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          // Only repel if the rain drop is above or close to the cursor vertically
          if (dy > -30 && dy < 90) {
            const dist = Math.hypot(dx, dy);
            const umbrellaRadius = 90;
            if (dist < umbrellaRadius) {
              const force = (umbrellaRadius - dist) / umbrellaRadius;
              // Push horizontally
              p.vx += (dx / (dist || 1)) * force * 1.4;
              // Slow down vertical fall
              p.vy = Math.max(1.2, p.vy * 0.75);
            }
          }
        }

        // Add standard friction
        p.vx *= 0.94;

        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Wrap horizontal edges
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Splashing condition (hits the bottom floor)
        if (p.y >= height - 8) {
          createSplash(p.x, height - 8, scenario);
          setSplashesCount(prev => prev + 1);

          // Reset drop back to top
          const newDrop = spawnDrop(width, height, false);
          p.x = newDrop.x;
          p.y = newDrop.y;
          p.vx = newDrop.vx;
          p.vy = newDrop.vy;
          p.size = newDrop.size;
          p.alpha = newDrop.alpha;
        }

        // Draw raindrop streak
        ctx.beginPath();
        ctx.strokeStyle = scenario.particleColor.replace('opacity', p.alpha);
        ctx.lineWidth = p.size;
        ctx.moveTo(p.x, p.y);
        // Draw angled line based on velocities for realistic motion blur
        ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
        ctx.stroke();
      }

      // 2. Update and draw splashes (Ripples & Sparks)
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        
        if (s.type === 'ripple') {
          s.radius += s.speed;
          s.alpha -= 0.024;
          
          if (s.alpha <= 0 || s.radius >= s.maxRadius) {
            splashes.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.strokeStyle = s.color.replace('opacity', s.alpha);
          ctx.lineWidth = 1.6;
          ctx.stroke();
        } else if (s.type === 'spark') {
          // Physics updates
          if (s.gravity) s.vy += s.gravity;
          s.x += s.vx;
          s.y += s.vy;
          s.alpha -= s.decay;

          if (s.alpha <= 0) {
            splashes.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = s.color.replace('opacity', s.alpha);
          ctx.fill();
        }
      }

      // 3. Draw a glowing indicator at the cursor coordinates (soft light spot)
      if (mouse.active) {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 45);
        grad.addColorStop(0, scenario.particleColor.replace('opacity', 0.25));
        grad.addColorStop(1, scenario.particleColor.replace('opacity', 0));
        ctx.fillStyle = grad;
        ctx.arc(mouse.x, mouse.y, 45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset composite operation to normal
      ctx.globalCompositeOperation = 'source-over';

      animationFrameId.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Update mouse state and coordinates
  const updateMouseCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    mouseRef.current.x = mx;
    mouseRef.current.y = my;
    mouseRef.current.active = true;

    // Trigger subtle, quick rain chime when cursor moves fast
    const speedX = Math.abs(mx - mouseRef.current.prevX || 0);
    if (speedX > 15 && Date.now() - mouseRef.current.lastActiveTime > 200) {
      // Scale pitch with cursor vertical position: higher up = higher pitch
      const normalizedY = 1.0 - (my / rect.height);
      const pitch = 0.6 + (normalizedY * 0.7) + (Math.random() * 0.1 - 0.05);
      audioSynth.playRaindropChime(pitch);
      mouseRef.current.lastActiveTime = Date.now();
    }
    
    mouseRef.current.prevX = mx;
  };

  const handlePointerLeave = () => {
    mouseRef.current.active = false;
  };

  // Clicking/Tapping triggers a larger manual ripple burst and chime sound
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const normalizedY = 1.0 - (clickY / rect.height);
    const pitch = 0.7 + (normalizedY * 0.8);
    audioSynth.playRaindropChime(pitch);

    // Create 15 explosive sparks
    const scenario = SCENARIOS.find(s => s.id === activeScenario) || SCENARIOS[0];
    const baseColor = scenario.particleColor;

    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      splashesRef.current.push({
        id: Math.random(),
        type: 'spark',
        x: clickX,
        y: clickY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.2,
        alpha: 1.0,
        decay: Math.random() * 0.035 + 0.02,
        color: baseColor
      });
    }

    // Trigger a ripple too
    splashesRef.current.push({
      id: Math.random(),
      type: 'ripple',
      x: clickX,
      y: clickY,
      radius: 2,
      maxRadius: 40,
      alpha: 1.0,
      speed: 2.2,
      color: baseColor
    });
  };

  const resetCounter = () => {
    setSplashesCount(0);
    audioSynth.playBreathingBell();
  };

  const scenarioDetails = SCENARIOS.find(s => s.id === activeScenario);

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

        <div className="flex items-center space-x-3 text-xs font-nunito font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1">
            <CloudRain className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span>{language === 'es' ? 'Gotas caídas' : 'Drops fallen'}:</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold font-poppins text-sm">{splashesCount}</span>
          </div>

          <button
            onClick={resetCounter}
            className="p-1 px-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 transition-colors text-3xs font-bold uppercase tracking-wider font-poppins"
            title={language === 'es' ? 'Reiniciar gotero' : 'Reset drip counter'}
          >
            {language === 'es' ? 'Reiniciar' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Main Canvas sandbox container */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-[380px] bg-[#0A0816] rounded-3xl overflow-hidden relative border border-slate-900 shadow-inner"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={updateMouseCoords}
          onMouseLeave={handlePointerLeave}
          onTouchStart={updateMouseCoords}
          onTouchMove={updateMouseCoords}
          onTouchEnd={handlePointerLeave}
          onClick={handleCanvasClick}
          className="absolute inset-0 cursor-crosshair w-full h-full block touch-none"
        />

        {/* Floating guidance overlay */}
        <div className="absolute top-4 left-4 p-2.5 px-4 rounded-2xl bg-slate-950/65 backdrop-blur-md border border-white/5 pointer-events-none font-nunito text-xs text-slate-300 flex items-center space-x-2.5 shadow-md">
          <span className="text-sm">{scenarioDetails?.icon}</span>
          <div>
            <h4 className="font-bold text-2xs text-white uppercase tracking-wider font-poppins">
              {scenarioDetails?.[`name_${language}`]}
            </h4>
            <p className="text-3xs text-slate-400 hidden md:block">
              {scenarioDetails?.[`desc_${language}`]}
            </p>
          </div>
        </div>

        {/* Soft hint overlay */}
        <div className="absolute bottom-4 right-4 p-2 px-3.5 rounded-xl bg-white/5 dark:bg-slate-950/40 border border-white/5 pointer-events-none text-3xs font-semibold text-slate-400 uppercase tracking-widest font-poppins">
          {language === 'es' ? 'Desliza para desviar la lluvia' : 'Swipe to deflect the rain'}
        </div>
      </div>

      {/* Control Drawer Footer */}
      <div className="glass p-4 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col items-center space-y-3 font-nunito shadow-sm">
        
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-poppins block w-full text-center md:text-left px-1">
          {language === 'es' ? 'Escenarios de Lluvia' : 'Rain Scenarios'}
        </span>

        {/* Scenario Selection Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {SCENARIOS.map((scen) => {
            const label = language === 'es' ? scen.name_es : scen.name_en;
            const isSelected = activeScenario === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => {
                  setActiveScenario(scen.id);
                  audioSynth.playRaindropChime(0.9);
                }}
                className={`p-3 rounded-2xl border flex items-center justify-center space-x-2.5 transition-all text-xs font-bold ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-transparent shadow-md scale-[1.01]'
                    : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10'
                }`}
              >
                <span className="text-sm">{scen.icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default LightRain;
