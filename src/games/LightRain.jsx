import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, Eye, Sparkles } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

const SCENARIOS = [
  { id: 'galaxy', name_es: 'Galaxia', name_en: 'Galaxy', color: 'from-purple-900 to-slate-950', icon: '🌌' },
  { id: 'aurora', name_es: 'Aurora Boreal', name_en: 'Northern Lights', color: 'from-teal-950 to-slate-950', icon: '💚' },
  { id: 'magic', name_es: 'Bosque Mágico', name_en: 'Magic Forest', color: 'from-emerald-950 to-slate-950', icon: '🌳' },
  { id: 'night', name_es: 'Cielo Nocturno', name_en: 'Night Sky', color: 'from-indigo-950 to-slate-950', icon: '✨' }
];

const LightRain = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const [activeScenario, setActiveScenario] = useState('galaxy');
  const [playTime, setPlayTime] = useState(0);

  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false, px: 0, py: 0 });
  const animationFrameId = useRef(null);

  // Time tracker
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

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight || 450;
    canvas.width = width;
    canvas.height = height;

    const mouse = mouseRef.current;

    // Reset particles on scenario change
    particlesRef.current = [];

    // Helper to spawn initial particles based on scenario
    const spawnInitial = () => {
      if (activeScenario === 'magic') {
        // Fireflies scattered around
        for (let i = 0; i < 60; i++) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -Math.random() * 0.4 - 0.2,
            size: Math.random() * 3 + 1.5,
            color: `hsla(${60 + Math.random() * 60}, 100%, 70%, ${0.3 + Math.random() * 0.5})`, // yellow-green
            angle: Math.random() * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.02
          });
        }
      } else if (activeScenario === 'night') {
        // Starry sky backgrounds
        for (let i = 0; i < 80; i++) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.75, // only in upper sky
            size: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.8 + 0.2,
            twinkleSpeed: 0.01 + Math.random() * 0.03,
            isStar: true
          });
        }
      }
    };
    spawnInitial();

    const tick = () => {
      // Draw background with slight trail blend for glow effects
      ctx.fillStyle = 'rgba(10, 8, 20, 0.12)';
      ctx.fillRect(0, 0, width, height);

      const particles = particlesRef.current;

      // 1. SCENARIO: GALAXY (Swirling pink/purple trails)
      if (activeScenario === 'galaxy') {
        // Spawn particles around cursor if active, or center of screen
        const targetX = mouse.active ? mouse.x : width / 2;
        const targetY = mouse.active ? mouse.y : height / 2;

        if (Math.random() > 0.3) {
          // Emit a cluster
          for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 15 + 5;
            particles.push({
              x: targetX + Math.cos(angle) * dist,
              y: targetY + Math.sin(angle) * dist,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              size: Math.random() * 2 + 1,
              hue: [280, 320, 200, 340][Math.floor(Math.random() * 4)] + (Math.random() * 20 - 10),
              alpha: 1,
              life: 1.0,
              decay: 0.012 + Math.random() * 0.01
            });
          }
        }

        // Draw and update galaxy particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          
          // Pull towards target (gravitational orbit force)
          const dx = targetX - p.x;
          const dy = targetY - p.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist > 5) {
            // Radial pull
            p.vx += (dx / dist) * 0.12;
            p.vy += (dy / dist) * 0.12;
            
            // Tangential spiral drift force
            p.vx += (-dy / dist) * 0.08;
            p.vy += (dx / dist) * 0.08;
          }

          // Friction dampening
          p.vx *= 0.95;
          p.vy *= 0.95;

          p.x += p.vx;
          p.y += p.vy;

          // Draw
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${p.alpha})`;
          ctx.shadowBlur = p.size * 2;
          ctx.shadowColor = `hsla(${p.hue}, 90%, 75%, 0.8)`;
          ctx.fill();
          ctx.shadowBlur = 0; // reset

          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            particles.splice(i, 1);
          }
        }
      }

      // 2. SCENARIO: AURORA BOREAL (Wavy green/blue glowing sheets)
      else if (activeScenario === 'aurora') {
        const time = Date.now() * 0.0008;
        
        // Draw 3 curtains of aurora waves
        for (let wave = 0; wave < 3; wave++) {
          const hBase = height * 0.4 + (wave * 50);
          const hue = 130 + (wave * 30); // transitions from green to teal
          
          ctx.save();
          ctx.beginPath();
          
          for (let x = 0; x <= width; x += 15) {
            // Wave equation with noise
            let y = hBase + Math.sin(x * 0.005 + time + wave) * 30 + Math.cos(x * 0.01 - time * 0.5) * 15;
            
            // Distort wave near mouse position
            if (mouse.active) {
              const mxDist = Math.abs(mouse.x - x);
              if (mxDist < 150) {
                const strength = (1 - mxDist / 150) * 45;
                // Wave is pushed down/up by mouse
                y += Math.sin((mouse.y - y) * 0.02) * strength;
              }
            }

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            // Draw a vertical glow stripe at each segment
            ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${0.035 - (wave * 0.008)})`;
            ctx.lineWidth = 14;
            ctx.strokeRect(x, y - 60, 2, 120);
          }
          
          ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${0.08 - (wave * 0.02)})`;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        }

        // Draw light wave sparkles
        if (Math.random() > 0.7) {
          particles.push({
            x: Math.random() * width,
            y: height * 0.2 + Math.random() * height * 0.5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 1,
            color: `hsla(${140 + Math.random() * 50}, 100%, 75%, ${0.1 + Math.random() * 0.4})`,
            life: 1.0,
            decay: 0.008 + Math.random() * 0.01
          });
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();

          p.life -= p.decay;
          if (p.life <= 0) particles.splice(i, 1);
        }
      }

      // 3. SCENARIO: MAGIC FOREST (Floating upwards glowing fireflies)
      else if (activeScenario === 'magic') {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          
          // Fireflies drift horizontally with sine wave
          p.angle += p.speed;
          p.x += Math.sin(p.angle) * 0.25 + p.vx;
          p.y += p.vy;

          // React to mouse: push away gently
          if (mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 100) {
              const force = (1 - dist / 100) * 0.5;
              p.x -= (dx / dist) * force;
              p.y -= (dy / dist) * force;
            }
          }

          // Wrap around canvas bounds
          if (p.y < -10) p.y = height + 10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          // Draw firefly glow
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          
          ctx.shadowBlur = p.size * 5;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. SCENARIO: NIGHT SKY (Constellations + Shooting stars)
      else if (activeScenario === 'night') {
        // Draw static starry background
        particles.forEach(p => {
          if (p.isStar) {
            // Slow twinkling pulse
            p.alpha += p.twinkleSpeed;
            if (p.alpha > 0.95 || p.alpha < 0.2) {
              p.twinkleSpeed = -p.twinkleSpeed;
            }
            
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
          }
        });

        // Trigger random shooting stars
        if (Math.random() > 0.985) {
          particles.push({
            x: Math.random() * width * 0.6,
            y: Math.random() * height * 0.4,
            vx: Math.random() * 4 + 4,
            vy: Math.random() * 3 + 2,
            size: Math.random() * 2 + 1.5,
            alpha: 1.0,
            isShootingStar: true
          });
        }

        // Draw and update active shooting stars
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          if (p.isShootingStar) {
            // Draw streak tail line
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 3.5, p.y - p.vy * 3.5);
            ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.lineWidth = p.size;
            ctx.stroke();

            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.035;

            if (p.alpha <= 0 || p.x > width + 10 || p.y > height + 10) {
              particles.splice(i, 1);
            }
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [activeScenario]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    mouseRef.current.x = clientX - rect.left;
    mouseRef.current.y = clientY - rect.top;
    mouseRef.current.active = true;
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  // Clicking on visual screen emits a ripple wave and plays chimes
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // Trigger chimes
    audioSynth.playBreathingBell();

    // Spawn a large ring of particles
    const ringCount = 20;
    const particles = particlesRef.current;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x: clickX,
        y: clickY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.5,
        hue: activeScenario === 'aurora' ? 140 : activeScenario === 'magic' ? 70 : 320,
        alpha: 1,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01
      });
    }
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

        <div className="flex items-center space-x-1 text-xs font-nunito text-slate-400">
          <Eye className="w-4 h-4 text-indigo-400" />
          <span>{language === 'es' ? 'Interactivo' : 'Interactive'}</span>
        </div>
      </div>

      {/* Main Canvas Box */}
      <div className="flex-1 min-h-[380px] bg-[#0A0814] rounded-3xl overflow-hidden relative border border-slate-900 shadow-2xl">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseMove}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseLeave}
          onClick={handleCanvasClick}
          className="absolute inset-0 cursor-pointer w-full h-full block touch-none"
        />

        {/* Dynamic header label inside canvas */}
        <div className="absolute top-4 left-4 p-2 px-4 rounded-xl bg-slate-950/60 backdrop-blur-xs border border-white/5 pointer-events-none text-2xs font-bold text-slate-300 uppercase tracking-widest font-poppins">
          {SCENARIOS.find(s => s.id === activeScenario)?.[`name_${language}`]}
        </div>
      </div>

      {/* Control Drawer Footer */}
      <div className="glass p-4 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col items-center space-y-3 font-nunito">
        
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-poppins block w-full text-center md:text-left px-1">
          {t('light_scenario')}
        </span>

        {/* Scenario Selection Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {SCENARIOS.map((scen) => {
            const label = language === 'es' ? scen.name_es : scen.name_en;
            const isSelected = activeScenario === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => setActiveScenario(scen.id)}
                className={`p-3 rounded-xl border flex items-center justify-center space-x-2.5 transition-all text-xs font-bold ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-transparent shadow-sm scale-[1.02]'
                    : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80'
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
