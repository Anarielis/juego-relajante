import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

// Slime color presets
const SLIME_COLORS = [
  { id: 'pink', name: 'Rose', fill: '#FDA4AF', stroke: '#F43F5E', gradStart: '#FAD3DC', gradEnd: '#FDA4AF' },
  { id: 'mint', name: 'Mint', fill: '#A7F3D0', stroke: '#10B981', gradStart: '#CBEFDC', gradEnd: '#A7F3D0' },
  { id: 'purple', name: 'Lavender', fill: '#C7D2FE', stroke: '#6366F1', gradStart: '#E8E5F6', gradEnd: '#C7D2FE' },
  { id: 'peach', name: 'Peach', fill: '#FED7AA', stroke: '#F97316', gradStart: '#FAD8CC', gradEnd: '#FED7AA' },
  { id: 'blue', name: 'Sky', fill: '#BAE6FD', stroke: '#0EA5E9', gradStart: '#CBE5F5', gradEnd: '#BAE6FD' }
];

const Slime = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(SLIME_COLORS[0]);
  const [glitterEnabled, setGlitterEnabled] = useState(true);
  const [activeTexture, setActiveTexture] = useState('default'); // default, fluffy, metallic
  const [playTime, setPlayTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  // Drag physics states
  const pointsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, down: false, px: 0, py: 0 });
  const glittersRef = useRef([]);
  const animationFrameId = useRef(null);

  // Time tracker
  useEffect(() => {
    trackPageView('Slime Simulator Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      recordGameSession('slime', playTime);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [playTime]);

  // Canvas Physics Loop Initializer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight || 450;
    canvas.width = width;
    canvas.height = height;

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.28;
    const numPoints = 12;

    // Build control points array
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        ox: cx + radius * Math.cos(angle), // original x anchor
        oy: cy + radius * Math.sin(angle), // original y anchor
        vx: 0,
        vy: 0,
        angle
      });
    }
    pointsRef.current = points;

    // Seed glitter particles
    const glitters = [];
    for (let i = 0; i < 40; i++) {
      const dist = Math.random() * (radius - 20);
      const angle = Math.random() * Math.PI * 2;
      glitters.push({
        rx: dist * Math.cos(angle), // relative x to center
        ry: dist * Math.sin(angle), // relative y
        color: ['#FFF', '#FFD700', '#FF69B4', '#00FFFF', '#ADFF2F'][Math.floor(Math.random() * 5)],
        size: Math.random() * 3 + 1,
        angle: Math.random() * Math.PI
      });
    }
    glittersRef.current = glitters;

    // Physics constants
    const k = 0.055; // spring constant
    const damping = 0.88; // friction

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const dx = mouse.x - mouse.px;
      const dy = mouse.y - mouse.py;
      const speed = Math.sqrt(dx * dx + dy * dy);

      // Save previous mouse coords
      mouse.px = mouse.x;
      mouse.py = mouse.y;

      // Update control points physics
      points.forEach((pt) => {
        // 1. Return-to-anchor spring force
        const fx = k * (pt.ox - pt.x);
        const fy = k * (pt.oy - pt.y);

        pt.vx = (pt.vx + fx) * damping;
        pt.vy = (pt.vy + fy) * damping;

        // 2. Mouse drag pull force
        if (mouse.down) {
          const mDist = Math.hypot(mouse.x - pt.x, mouse.y - pt.y);
          if (mDist < 120) {
            const pullPower = (1 - mDist / 120) * 0.45;
            pt.vx += (mouse.x - pt.x) * pullPower * 0.25;
            pt.vy += (mouse.y - pt.y) * pullPower * 0.25;
            
            // Triggers dynamic squash sounds on fast swipes
            if (speed > 4.5 && Math.random() > 0.85) {
              const frequencyScale = 0.7 + (pt.y / height) * 0.6;
              const playSpeed = 0.65 + (1 / speed);
              audioSynth.playSlimeSquish(playSpeed, frequencyScale);
            }
          }
        }

        // Apply velocities
        pt.x += pt.vx;
        pt.y += pt.vy;
      });

      // Compute dynamic center of mass
      let sumX = 0, sumY = 0;
      points.forEach(pt => {
        sumX += pt.x;
        sumY += pt.y;
      });
      const curCx = sumX / points.length;
      const curCy = sumY / points.length;

      // Draw Slime Shape
      ctx.save();
      
      // Dynamic textures style injection
      if (activeTexture === 'fluffy') {
        ctx.shadowColor = selectedColor.fill;
        ctx.shadowBlur = 18;
      } else if (activeTexture === 'metallic') {
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;
      }

      // Create Gradient
      const gradient = ctx.createRadialGradient(curCx - 20, curCy - 20, 10, curCx, curCy, radius * 1.5);
      gradient.addColorStop(0, selectedColor.gradStart);
      gradient.addColorStop(1, selectedColor.gradEnd);
      ctx.fillStyle = gradient;
      
      ctx.strokeStyle = selectedColor.stroke;
      ctx.lineWidth = activeTexture === 'metallic' ? 5 : 3;

      // Draw smooth Bezier outline connects
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length; i++) {
        const nextPt = points[(i + 1) % points.length];
        const xc = (points[i].x + nextPt.x) / 2;
        const yc = (points[i].y + nextPt.y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Render sparkles (glitter) inside bounds
      if (glitterEnabled) {
        ctx.save();
        // Clip so glitters don't draw outside slime body
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length; i++) {
          const nextPt = points[(i + 1) % points.length];
          const xc = (points[i].x + nextPt.x) / 2;
          const yc = (points[i].y + nextPt.y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.closePath();
        ctx.clip();

        // Draw glitter stars
        glittersRef.current.forEach((gl) => {
          // Adjust glitter location relative to shifting center of mass
          const gx = curCx + gl.rx;
          const gy = curCy + gl.ry;
          
          ctx.save();
          ctx.translate(gx, gy);
          ctx.rotate(gl.angle);
          ctx.fillStyle = gl.color;
          
          if (activeTexture === 'metallic') {
            ctx.shadowColor = '#FFF';
            ctx.shadowBlur = 4;
          }

          // Draw small star shape
          ctx.beginPath();
          ctx.moveTo(0, -gl.size * 1.5);
          ctx.lineTo(gl.size * 0.4, -gl.size * 0.4);
          ctx.lineTo(gl.size * 1.5, 0);
          ctx.lineTo(gl.size * 0.4, gl.size * 0.4);
          ctx.lineTo(0, gl.size * 1.5);
          ctx.lineTo(-gl.size * 0.4, gl.size * 0.4);
          ctx.lineTo(-gl.size * 1.5, 0);
          ctx.lineTo(-gl.size * 0.4, -gl.size * 0.4);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
          
          // Slowly rotate sparkle
          gl.angle += 0.005;
        });
        ctx.restore();
      }

      // Draw a soft gel reflection sheen on top
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      // An oval positioned on the upper-left of the slime body
      ctx.ellipse(curCx - radius * 0.3, curCy - radius * 0.3, radius * 0.4, radius * 0.25, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animationFrameId.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [selectedColor, glitterEnabled, activeTexture]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    mouseRef.current.x = clientX - rect.left;
    mouseRef.current.y = clientY - rect.top;
  };

  const handleMouseDown = (e) => {
    mouseRef.current.down = true;
    handleMouseMove(e);
    audioSynth.playSlimeSquish(1.0, 0.9 + Math.random() * 0.2);
  };

  const handleMouseUp = () => {
    mouseRef.current.down = false;
    // Release squish
    audioSynth.playSlimeSquish(1.2, 1.1 + Math.random() * 0.2);
  };

  const resetSlimeShape = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.28;

    pointsRef.current.forEach((pt, i) => {
      const angle = pt.angle;
      pt.x = cx + radius * Math.cos(angle);
      pt.y = cy + radius * Math.sin(angle);
      pt.vx = 0;
      pt.vy = 0;
    });

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

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-white/80 transition-colors"
            title={language === 'es' ? 'Mostrar Instrucciones' : 'Show Guide'}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          <button
            onClick={resetSlimeShape}
            className="p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-white/80 transition-colors"
            title={language === 'es' ? 'Restablecer Slime' : 'Reset Slime'}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Guide details bubble */}
      {showInstructions && (
        <div className="glass p-4 rounded-2xl border border-white/20 dark:border-white/5 text-xs md:text-sm font-nunito text-slate-600 dark:text-slate-300 leading-relaxed flex justify-between items-start">
          <div>
            <p className="font-bold font-poppins text-slate-800 dark:text-slate-100 mb-1">
              {language === 'es' ? 'Slime Simulator' : 'Slime Guide'}
            </p>
            <p>
              {language === 'es'
                ? 'Arrastra el mouse o tu dedo sobre el slime para estirarlo, amasar y liberar sonidos ASMR. Cambia colores, brillantinas y texturas abajo.'
                : 'Drag your finger or cursor on the slime to stretch it and release satisfying squishy noises. Toggle colors, glitters, and textures below.'}
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

      {/* Slime Simulator Sandbox */}
      <div className="flex-1 min-h-[380px] bg-slate-100/30 rounded-3xl overflow-hidden relative border border-slate-200/40 dark:border-white/5 shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="absolute inset-0 cursor-pointer w-full h-full block touch-none"
        />
      </div>

      {/* Control Drawer Footer */}
      <div className="glass p-5 rounded-3xl border border-white/20 dark:border-white/5 space-y-4 font-nunito text-sm">
        
        {/* Colors and texture selectors row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Color selector pills */}
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider font-poppins text-slate-500">
              {t('slime_color')}:
            </span>
            <div className="flex items-center space-x-1.5">
              {SLIME_COLORS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedColor(col)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    selectedColor.id === col.id 
                      ? 'border-indigo-600 dark:border-slate-100 scale-110 shadow' 
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: col.fill }}
                  title={col.name}
                />
              ))}
            </div>
          </div>

          {/* Texture selector pills */}
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider font-poppins text-slate-500">
              {t('slime_texture')}:
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-950/40 p-0.5 rounded-xl border border-slate-200/40 dark:border-white/5">
              {[
                { id: 'default', text_es: 'Estándar', text_en: 'Standard' },
                { id: 'fluffy', text_es: 'Esponjoso', text_en: 'Fluffy' },
                { id: 'metallic', text_es: 'Metálico', text_en: 'Metallic' }
              ].map((tex) => (
                <button
                  key={tex.id}
                  onClick={() => setActiveTexture(tex.id)}
                  className={`px-3 py-1 text-2xs font-bold rounded-lg transition-all ${
                    activeTexture === tex.id
                      ? 'bg-white dark:bg-white/10 shadow-sm text-indigo-600 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {language === 'es' ? tex.text_es : tex.text_en}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Glitter toggle switch */}
        <div className="flex items-center justify-between border-t border-slate-200/20 dark:border-white/5 pt-3">
          <span className="text-xs text-slate-500">{t('slime_sparkle')}</span>
          <input
            type="checkbox"
            checked={glitterEnabled}
            onChange={(e) => setGlitterEnabled(e.target.checked)}
            className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none checked:bg-indigo-600 transition-colors relative before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-transform cursor-pointer"
          />
        </div>

      </div>

    </div>
  );
};

export default Slime;
