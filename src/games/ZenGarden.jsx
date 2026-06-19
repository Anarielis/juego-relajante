import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Trash2, HelpCircle } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

const stonesList = [
  { id: 'basalt', name_es: 'Basalto', name_en: 'Basalt', color: '#3A3837', stroke: '#222', rx: 16, ry: 10, shadow: 'rgba(0,0,0,0.4)' },
  { id: 'river', name_es: 'Río', name_en: 'River Stone', color: '#888481', stroke: '#686461', rx: 20, ry: 14, shadow: 'rgba(0,0,0,0.3)' },
  { id: 'quartz', name_es: 'Cuarzo', name_en: 'Quartz', color: '#ECE8E5', stroke: '#C8C4C1', rx: 12, ry: 10, shadow: 'rgba(0,0,0,0.2)' },
  { id: 'terracotta', name_es: 'Terracota', name_en: 'Terracotta', color: '#D98263', stroke: '#A6553B', rx: 14, ry: 9, shadow: 'rgba(0,0,0,0.35)' },
  { id: 'jade', name_es: 'Jade', name_en: 'Jade', color: '#82AB8A', stroke: '#567A5D', rx: 15, ry: 11, shadow: 'rgba(0,0,0,0.25)' },
];

const ZenGarden = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const [selectedStone, setSelectedStone] = useState(stonesList[0]);
  const [placedStones, setPlacedStones] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  // Time tracker
  useEffect(() => {
    trackPageView('Zen Garden Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      // Record session duration on unmount
      recordGameSession('zen-garden', playTime);
    };
  }, [playTime]);

  // Canvas Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Fit canvas size to bounding box
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight || 500;
    canvas.width = width;
    canvas.height = height;

    // Set sand background
    ctx.fillStyle = '#F5EFE6';
    ctx.fillRect(0, 0, width, height);

    // Apply soft sand noise texture overlay
    for (let i = 0; i < width; i += 3) {
      for (let j = 0; j < height; j += 3) {
        if (Math.random() > 0.88) {
          ctx.fillStyle = 'rgba(215, 203, 185, 0.25)';
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }

    // Redraw initial state
    redrawGarden(ctx, width, height, placedStones);
  }, []);

  // Redraw loop for placed stones
  const redrawGarden = (ctx, width, height, stones) => {
    // We only redraw stones here because the sand raking is drawn persistently
    stones.forEach(stone => {
      ctx.save();
      // Drop Shadow for stones
      ctx.shadowColor = stone.shadow;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 5;

      ctx.fillStyle = stone.color;
      ctx.strokeStyle = stone.stroke;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(stone.x, stone.y, stone.rx, stone.ry, stone.rotation, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    // If double tapping/clicking with stone tool, place a stone
    if (selectedStone) {
      const coords = getCanvasCoords(e);
      placeStone(coords.x, coords.y);
      return;
    }
    
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    drawRakeMark(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing || selectedStone) return;
    const coords = getCanvasCoords(e);
    drawRakeMark(coords.x, coords.y);
    
    // Play ASMR sand scratch
    if (Math.random() > 0.82) {
      audioSynth.playZenScratch(0.4 + Math.random() * 0.4);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const drawRakeMark = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    // Multi-prong rake simulation
    const prongs = 4;
    const spacing = 4;
    
    ctx.lineWidth = 2.5;
    
    for (let i = 0; i < prongs; i++) {
      const offset = (i - (prongs - 1) / 2) * spacing;
      
      // Shadow for rake groove
      ctx.shadowColor = 'rgba(120, 110, 95, 0.2)';
      ctx.shadowBlur = 1;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1.5;
      
      // Inside Rake Line (darker sand groove)
      ctx.strokeStyle = '#E2D8C9';
      ctx.beginPath();
      ctx.arc(x + offset, y + offset, 2.5, 0, Math.PI * 2);
      ctx.stroke();

      // Highlight line (lighter sand ridge next to it)
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + offset - 1, y + offset - 1, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const placeStone = (x, y) => {
    if (!selectedStone) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const newStone = {
      ...selectedStone,
      x,
      y,
      rotation: Math.random() * Math.PI,
      idInstance: Date.now() + Math.random()
    };

    const updatedStones = [...placedStones, newStone];
    setPlacedStones(updatedStones);

    // Redraw the stone immediately on top of the raked sand
    ctx.save();
    ctx.shadowColor = newStone.shadow;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = newStone.color;
    ctx.strokeStyle = newStone.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, newStone.rx, newStone.ry, newStone.rotation, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Soft chime when placing stone
    audioSynth.playBreathingBell();
  };

  const clearGarden = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear sand background
    ctx.fillStyle = '#F5EFE6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw noise
    for (let i = 0; i < canvas.width; i += 3) {
      for (let j = 0; j < canvas.height; j += 3) {
        if (Math.random() > 0.88) {
          ctx.fillStyle = 'rgba(215, 203, 185, 0.25)';
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }
    
    setPlacedStones([]);
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
            onClick={clearGarden}
            className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 transition-colors"
            title={language === 'es' ? 'Reiniciar Jardín' : 'Reset Garden'}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Guide details bubble */}
      {showInstructions && (
        <div className="glass p-4 rounded-2xl border border-white/20 dark:border-white/5 text-xs md:text-sm font-nunito text-slate-600 dark:text-slate-300 leading-relaxed flex justify-between items-start">
          <div>
            <p className="font-bold font-poppins text-slate-800 dark:text-slate-100 mb-1">
              {language === 'es' ? 'Guía del Jardín Zen' : 'Zen Garden Guide'}
            </p>
            <p>
              {language === 'es'
                ? '1. Selecciona "Arena" para rastrillar líneas sobre la arena con el dedo o mouse.'
                : '1. Select "Sand" to rake patterns on the sand with your finger or cursor.'}
            </p>
            <p>
              {language === 'es'
                ? '2. Elige una piedra de colores y haz clic sobre el jardín para colocarla de forma meditativa.'
                : '2. Select a pebble and tap on the garden to place it meditatively.'}
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

      {/* Main Sandbox Box */}
      <div className="flex-1 min-h-[400px] bg-slate-100/30 rounded-3xl overflow-hidden relative border border-slate-200/40 dark:border-white/5 shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 cursor-crosshair w-full h-full block touch-none"
        />
      </div>

      {/* Control Drawer Footer */}
      <div className="glass p-4 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 font-nunito">
        
        {/* Tool type Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedStone(null)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              !selectedStone
                ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80'
            }`}
          >
            🌾 {language === 'es' ? 'Arena (Rastrillar)' : 'Sand (Rake)'}
          </button>
          <span className="text-slate-300 dark:text-white/10">|</span>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider font-poppins">
            {language === 'es' ? 'Piedras:' : 'Pebbles:'}
          </span>
        </div>

        {/* Stones selector list */}
        <div className="flex items-center space-x-2 overflow-x-auto max-w-full pb-1">
          {stonesList.map((stone) => {
            const stoneName = language === 'es' ? stone.name_es : stone.name_en;
            const isSelected = selectedStone?.id === stone.id;
            return (
              <button
                key={stone.id}
                onClick={() => setSelectedStone(stone)}
                className={`p-2 rounded-xl flex items-center space-x-2 border transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300 font-semibold'
                    : 'bg-white/20 border-slate-200/30 text-slate-500 dark:border-white/5 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full border shadow-inner"
                  style={{ backgroundColor: stone.color, borderColor: stone.stroke }}
                />
                <span className="text-xs">{stoneName}</span>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default ZenGarden;
