import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, HelpCircle, Sparkles, BookOpen, Flower, Gem, Wind, Flame } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

const ITEMS_DATA = [
  { id: 'book', name_es: 'Libro Antiguo', name_en: 'Ancient Book', color: 'from-amber-200 to-orange-300 dark:from-amber-900/60 dark:to-orange-950/60 text-amber-950 dark:text-amber-200', shape: 'w-12 h-20 rounded-md flex items-center justify-center border border-amber-300 dark:border-amber-900 shadow-sm', icon: BookOpen, slotIndex: 0 },
  { id: 'plant', name_es: 'Maceta Suculenta', name_en: 'Potted Succulent', color: 'from-emerald-200 to-teal-300 dark:from-emerald-900/60 dark:to-teal-950/60 text-emerald-950 dark:text-emerald-200', shape: 'w-16 h-16 rounded-b-2xl rounded-t-lg flex items-center justify-center border border-emerald-300 dark:border-emerald-900 shadow-sm', icon: Flower, slotIndex: 1 },
  { id: 'gem', name_es: 'Cristal de Amatista', name_en: 'Amethyst Crystal', color: 'from-purple-200 to-pink-300 dark:from-purple-900/60 dark:to-pink-950/60 text-purple-950 dark:text-purple-200', shape: 'w-14 h-14 rotate-45 flex items-center justify-center border border-purple-300 dark:border-purple-900 shadow-sm', icon: Gem, slotIndex: 2 },
  { id: 'shell', name_es: 'Caracola de Mar', name_en: 'Sea Shell', color: 'from-pastel-sky to-sky-300 dark:from-slate-900/60 dark:to-sky-950/60 text-sky-950 dark:text-sky-200', shape: 'w-16 h-12 rounded-full flex items-center justify-center border border-sky-300 dark:border-sky-900 shadow-sm', icon: Wind, slotIndex: 3 },
  { id: 'candle', name_es: 'Vela Aromática', name_en: 'Scented Candle', color: 'from-pastel-rose to-rose-300 dark:from-rose-900/60 dark:to-rose-950/60 text-rose-950 dark:text-rose-200', shape: 'w-12 h-16 rounded-t-3xl rounded-b-md flex items-center justify-center border border-rose-300 dark:border-rose-900 shadow-sm', icon: Flame, slotIndex: 4 },
];

const SHELF_SLOTS = [
  { id: 'slot-book', label: 'Book Space', x: 10, y: 15, expectedId: 'book' },
  { id: 'slot-plant', label: 'Plant Corner', x: 30, y: 15, expectedId: 'plant' },
  { id: 'slot-gem', label: 'Crystal Stand', x: 50, y: 15, expectedId: 'gem' },
  { id: 'slot-shell', label: 'Shell Tray', x: 70, y: 15, expectedId: 'shell' },
  { id: 'slot-candle', label: 'Candle Nook', x: 90, y: 15, expectedId: 'candle' },
];

const SortGame = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showInstructions, setShowInstructions] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [playTime, setPlayTime] = useState(0);

  // Time tracker
  useEffect(() => {
    trackPageView('Sorting Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      recordGameSession('zen-garden', playTime); // Still logged under 'zen-garden' profile stats key
    };
  }, [playTime]);

  // Initial Item Placement
  useEffect(() => {
    initializeItems();
  }, []);

  const initializeItems = () => {
    setIsCompleted(false);
    setSparkles([]);
    
    // Distribute items randomly along the bottom tray
    const initialItems = ITEMS_DATA.map((item, index) => {
      // Scattered coordinates at bottom tray
      const trayWidth = 80; // percent width
      const trayX = 10 + (index * 16) + (Math.random() * 4 - 2);
      const trayY = 70 + (Math.random() * 10 - 5);

      return {
        ...item,
        x: trayX, // percentage x (relative to container)
        y: trayY, // percentage y
        ox: trayX, // original tray positions
        oy: trayY,
        placed: false,
        activeSlotIndex: null
      };
    });
    
    setItems(initialItems);
  };

  const handlePointerDown = (e, item) => {
    if (isCompleted || item.placed) return;
    
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Get mouse/touch coordinate in percentages
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    const pxX = ((clientX - rect.left) / rect.width) * 100;
    const pxY = ((clientY - rect.top) / rect.height) * 100;
    
    setDraggedId(item.id);
    setDragOffset({
      x: pxX - item.x,
      y: pxY - item.y
    });

    audioSynth.playWhoosh(0.5);
  };

  const handlePointerMove = (e) => {
    if (!draggedId || isCompleted) return;
    
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    let pxX = ((clientX - rect.left) / rect.width) * 100;
    let pxY = ((clientY - rect.top) / rect.height) * 100;

    // Bound checks
    pxX = Math.max(2, Math.min(98, pxX));
    pxY = Math.max(2, Math.min(98, pxY));

    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === draggedId) {
          // Play whoosh occasionally on fast drag movements
          if (Math.random() > 0.94) {
            audioSynth.playWhoosh(0.3 + Math.random() * 0.4);
          }
          return {
            ...item,
            x: pxX - dragOffset.x,
            y: pxY - dragOffset.y
          };
        }
        return item;
      })
    );
  };

  const handlePointerUp = () => {
    if (!draggedId || isCompleted) return;

    // Check snapping condition
    setItems(prevItems => {
      let matchedIdx = null;
      let snapSuccess = false;

      const nextItems = prevItems.map(item => {
        if (item.id === draggedId) {
          // Find if item is dropped near its corresponding shelf slot
          const targetSlot = SHELF_SLOTS.find(s => s.expectedId === item.id);
          
          if (targetSlot) {
            // Distance check in percentages
            const dist = Math.hypot(item.x - targetSlot.x, item.y - targetSlot.y);
            
            if (dist < 10) { // Snapping threshold: within 10%
              snapSuccess = true;
              return {
                ...item,
                x: targetSlot.x,
                y: targetSlot.y,
                placed: true
              };
            }
          }

          // If no snap, slide back to its original bottom tray coordinates
          return {
            ...item,
            x: item.ox,
            y: item.oy,
            placed: false
          };
        }
        return item;
      });

      if (snapSuccess) {
        audioSynth.playWoodSnap();
        
        // Trigger completion validation check
        const allPlaced = nextItems.every(it => it.placed);
        if (allPlaced) {
          triggerVictory();
        }
      } else {
        // Soft snap back whoosh
        audioSynth.playWhoosh(0.4);
      }

      return nextItems;
    });

    setDraggedId(null);
  };

  const triggerVictory = () => {
    setIsCompleted(true);
    audioSynth.playBreathingBell();

    // Trigger visual gold sparkles
    const newSparkles = Array.from({ length: 25 }).map((_, idx) => ({
      id: idx,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: Math.random() * 15 + 8,
      delay: Math.random() * 0.8
    }));
    setSparkles(newSparkles);
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
            onClick={initializeItems}
            className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 transition-colors"
            title={language === 'es' ? 'Reiniciar repisa' : 'Reset Shelf'}
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
              {language === 'es' ? 'Organizar Estantes' : 'Shelf Tidy Guide'}
            </p>
            <p>
              {language === 'es'
                ? 'Arrastra los objetos esparcidos de la bandeja inferior y colócalos en su espacio correspondiente sobre la repisa de madera. Cada encaje emitirá un chasquido satisfactorio.'
                : 'Drag the items scattered in the bottom tray and arrange them in their corresponding spaces on the wooden shelf. Each snap emits a satisfying ASMR click.'}
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

      {/* Main Sort Sandbox */}
      <div 
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 min-h-[420px] bg-slate-100/30 dark:bg-slate-950/20 rounded-3xl overflow-hidden relative border border-slate-200/40 dark:border-white/5 shadow-inner touch-none"
      >
        {/* Wooden Shelf representation */}
        <div className="absolute top-[30%] left-[5%] right-[5%] h-8 bg-amber-800 dark:bg-amber-950 rounded-lg shadow-md border-t-2 border-amber-600 flex items-center justify-between pointer-events-none">
          <div className="absolute -bottom-6 left-6 w-3 h-6 bg-amber-900/60 rounded-b" />
          <div className="absolute -bottom-6 right-6 w-3 h-6 bg-amber-900/60 rounded-b" />
        </div>

        {/* Floating Sparkles overlays on victory */}
        {isCompleted && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {sparkles.map(sp => (
              <span
                key={sp.id}
                className="absolute text-yellow-400 dark:text-amber-300 font-bold leading-none animate-ping"
                style={{
                  left: `${sp.x}%`,
                  top: `${sp.y}%`,
                  fontSize: `${sp.size}px`,
                  animationDuration: '1.8s',
                  animationDelay: `${sp.delay}s`
                }}
              >
                ✦
              </span>
            ))}
            
            {/* Victory banner */}
            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-indigo-200/50 shadow-xl text-center z-20 animate-fade-in max-w-sm">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-bounce" />
              <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-slate-100">
                {language === 'es' ? '¡Todo en su Lugar!' : 'Perfectly Tidy!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito mt-1">
                {language === 'es' ? 'Siente el orden y el silencio. Tu mente está despejada.' : 'Feel the order and quietness. Your mind is clear.'}
              </p>
              <button
                onClick={initializeItems}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-colors font-poppins"
              >
                {language === 'es' ? 'Volver a Ordenar' : 'Reset & Play'}
              </button>
            </div>
          </div>
        )}

        {/* Shelf Slots Outlines (Target snaps) */}
        {SHELF_SLOTS.map((slot) => {
          // Adjust vertical centering relative to shelf top (shelf starts at 30% height)
          return (
            <div
              key={slot.id}
              className="absolute transform -translate-x-1/2 -translate-y-full border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl flex items-center justify-center pointer-events-none opacity-40 select-none text-2xs text-slate-400"
              style={{
                left: `${slot.x}%`,
                top: `30%`,
                width: '72px',
                height: '84px',
              }}
            >
              {slot.expectedId === 'book' && '📖'}
              {slot.expectedId === 'plant' && '🪴'}
              {slot.expectedId === 'gem' && '💎'}
              {slot.expectedId === 'shell' && '🐚'}
              {slot.expectedId === 'candle' && '🕯️'}
            </div>
          );
        })}

        {/* Tray line divider */}
        <div className="absolute bottom-[25%] left-0 w-full h-[1px] bg-slate-200 dark:bg-white/5 border-dashed" />
        <div className="absolute bottom-[10%] left-6 p-1 px-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-3xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none font-poppins">
          {language === 'es' ? 'Bandeja de Objetos' : 'Items Tray'}
        </div>

        {/* Draggable Items */}
        {items.map((item) => {
          const Icon = item.icon;
          const isDragged = draggedId === item.id;
          
          return (
            <div
              key={item.id}
              onPointerDown={(e) => handlePointerDown(e, item)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-all select-none z-10 ${
                isDragged ? 'scale-105 z-30 cursor-grabbing' : ''
              } ${item.placed ? 'pointer-events-none shadow-none z-0' : ''}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                // Disable transitional delays during manual dragging
                transition: isDragged ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out, transform 0.2s',
                touchAction: 'none' // Prevents mobile touch dragging conflicts
              }}
            >
              <div className={`bg-gradient-to-tr ${item.color} ${item.shape}`}>
                <Icon className="w-6 h-6 stroke-[1.5] animate-pulse-gentle" />
              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
};

export default SortGame;
