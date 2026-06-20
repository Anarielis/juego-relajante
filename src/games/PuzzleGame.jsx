import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, HelpCircle, Sparkles, Image, Check } from 'lucide-react';
import audioSynth from '../utils/audioSynth';
import { trackPageView } from '../analytics/tracking';

// Total grid items for a 3x3 puzzle (9 pieces)
const GRID_SIZE = 3;
const TOTAL_PIECES = GRID_SIZE * GRID_SIZE;

const PuzzleGame = () => {
  const { t, language } = useApp();
  const { recordGameSession } = useAuth();
  const navigate = useNavigate();

  const [pieces, setPieces] = useState([]);
  const [boardSlots, setBoardSlots] = useState(Array(TOTAL_PIECES).fill(null));
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [sparkles, setSparkles] = useState([]);
  const [showInstructions, setShowInstructions] = useState(true);

  // Initial tracking
  useEffect(() => {
    trackPageView('Jigsaw Puzzle Game');
    const interval = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      recordGameSession('slime', playTime); // Kept under 'slime' key for backward-compatibility with session metrics
    };
  }, [playTime]);

  useEffect(() => {
    initializePuzzle();
  }, []);

  const initializePuzzle = () => {
    setIsCompleted(false);
    setSelectedPieceId(null);
    setSparkles([]);
    setBoardSlots(Array(TOTAL_PIECES).fill(null));

    // Create 9 pieces
    const newPieces = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const id = r * GRID_SIZE + c;
        newPieces.push({
          id,
          row: r,
          col: c,
          correctSlot: id,
          placed: false,
        });
      }
    }

    // Shuffle the pieces randomly
    const shuffled = [...newPieces].sort(() => Math.random() - 0.5);
    setPieces(shuffled);
    audioSynth.playWhoosh(0.5);
  };

  // Selection/Placement handlers (works perfectly on touch & desktop)
  const handlePieceSelect = (pieceId) => {
    if (isCompleted) return;
    const piece = pieces.find(p => p.id === pieceId);
    if (piece?.placed) return;

    audioSynth.playPopSound(1.2);
    setSelectedPieceId(selectedPieceId === pieceId ? null : pieceId);
  };

  const handleSlotClick = (slotIdx) => {
    if (isCompleted || selectedPieceId === null) return;

    // Check if slot already has a piece
    if (boardSlots[slotIdx] !== null) {
      // Return that piece to the tray
      const returningPieceId = boardSlots[slotIdx].id;
      setPieces(prev => prev.map(p => p.id === returningPieceId ? { ...p, placed: false } : p));
    }

    const currentPieceId = selectedPieceId;
    const activePiece = pieces.find(p => p.id === currentPieceId);
    if (!activePiece) return;

    const isCorrect = activePiece.correctSlot === slotIdx;

    // Update board slots state
    const nextSlots = [...boardSlots];
    nextSlots[slotIdx] = activePiece;
    setBoardSlots(nextSlots);

    // Update pieces state
    setPieces(prev => prev.map(p => p.id === currentPieceId ? { ...p, placed: true } : p));
    setSelectedPieceId(null);

    if (isCorrect) {
      audioSynth.playWoodSnap(); // Satisfying wood click sound when placed correctly
    } else {
      audioSynth.playWhoosh(0.4); // Soft whoosh if placed incorrectly
    }

    // Verify completion
    const allPlaced = nextSlots.every(slot => slot !== null);
    if (allPlaced) {
      const allCorrect = nextSlots.every((slotPiece, idx) => slotPiece && slotPiece.correctSlot === idx);
      if (allCorrect) {
        triggerVictory();
      }
    }
  };

  // Remove a piece from the board slot and put it back in the tray
  const handleRemovePieceFromBoard = (slotIdx) => {
    if (isCompleted) return;
    const piece = boardSlots[slotIdx];
    if (!piece) return;

    // Correct pieces cannot be removed once locked in correctly
    if (piece.correctSlot === slotIdx) return;

    const nextSlots = [...boardSlots];
    nextSlots[slotIdx] = null;
    setBoardSlots(nextSlots);

    setPieces(prev => prev.map(p => p.id === piece.id ? { ...p, placed: false } : p));
    audioSynth.playWhoosh(0.5);
  };

  const triggerVictory = () => {
    setIsCompleted(true);
    audioSynth.playBreathingBell();

    const newSparkles = Array.from({ length: 25 }).map((_, idx) => ({
      id: idx,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: Math.random() * 14 + 8,
      delay: Math.random() * 0.7
    }));
    setSparkles(newSparkles);
  };

  // Helper to render the puzzle piece image (sunset scene) with coordinates offset
  const renderPieceImage = (row, col, isGhost = false) => {
    const scale = 100 / GRID_SIZE; // percentage size per piece (33.333%)
    const viewBoxX = col * 100;
    const viewBoxY = row * 100;

    return (
      <svg
        viewBox={`${viewBoxX} ${viewBoxY} 100 100`}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isGhost ? 'opacity-20' : 'opacity-100'}`}
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E1A47" />
            <stop offset="40%" stopColor="#4A3B65" />
            <stop offset="70%" stopColor="#E06C75" />
            <stop offset="100%" stopColor="#E5C07B" />
          </linearGradient>
          <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5B041" />
            <stop offset="100%" stopColor="#EC7063" />
          </linearGradient>
        </defs>

        {/* Vector Background Sky & Mountains */}
        <rect x="0" y="0" width="300" height="300" fill="url(#skyGrad)" />
        
        {/* Glowing Sun */}
        <circle cx="150" cy="170" r="45" fill="url(#sunGrad)" opacity="0.9" filter="drop-shadow(0px 0px 8px rgba(245, 176, 65, 0.4))" />

        {/* Deep background hills */}
        <path d="M 0 250 Q 80 200 160 260 T 300 240 L 300 300 L 0 300 Z" fill="#3B2E56" opacity="0.8" />

        {/* Foreground Zen Stone outlines and hills */}
        <path d="M 0 270 Q 100 220 200 280 T 300 260 L 300 300 L 0 300 Z" fill="#241B3B" />
        
        {/* Stacked stone towers (Zen stack) */}
        <ellipse cx="150" cy="265" rx="30" ry="12" fill="#1C152E" />
        <ellipse cx="150" cy="245" rx="22" ry="9" fill="#2E2445" />
        <ellipse cx="150" cy="229" rx="16" ry="7" fill="#40335D" />
        <ellipse cx="150" cy="217" rx="11" ry="5" fill="#58487A" />
        <ellipse cx="150" cy="208" rx="6" ry="4" fill="#7866A1" />

        {/* Distant flying birds */}
        <path d="M 50 100 Q 55 95 60 100 Q 65 95 70 100" fill="none" stroke="#2E1A47" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 230 80 Q 234 76 238 80 Q 242 76 246 80" fill="none" stroke="#2E1A47" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
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
            onClick={initializePuzzle}
            className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 transition-colors"
            title={language === 'es' ? 'Reiniciar rompecabezas' : 'Reset Puzzle'}
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
              {language === 'es' ? 'Rompecabezas Zen de Piedras' : 'Zen Stone Puzzle'}
            </p>
            <p>
              {language === 'es'
                ? 'Arma la imagen apilando las piedras zen. Selecciona una pieza de la bandeja inferior y colócala en una ranura. Toca una ranura ocupada incorrectamente para devolver la pieza.'
                : 'Rebuild the sunset zen stones picture. Tap a piece in the bottom tray, then tap a board slot to place it. Tap an incorrectly placed slot to return the piece back.'}
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

      {/* Main Grid Game Canvas Sandbox */}
      <div className="flex-1 bg-slate-100/30 dark:bg-slate-950/25 rounded-3xl p-6 relative border border-slate-200/40 dark:border-white/5 shadow-inner flex flex-col items-center justify-center min-h-[420px] overflow-hidden">
        
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
            
            {/* Victory card */}
            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-indigo-200/50 shadow-2xl text-center max-w-sm pointer-events-auto">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-bounce" />
              <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-slate-100">
                {language === 'es' ? '¡Mente en Armonía!' : 'Mind in Harmony!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito mt-1">
                {language === 'es' ? 'Has completado el rompecabezas. Respira y disfruta el atardecer.' : 'You have completed the jigsaw. Take a breath and enjoy the sunset.'}
              </p>
              <button
                onClick={() => {
                  audioSynth.playBreathingBell();
                  initializePuzzle();
                }}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all duration-150 font-poppins"
              >
                {language === 'es' ? 'Volver a Jugar' : 'Play Again'}
              </button>
            </div>
          </div>
        )}

        {/* 3x3 Puzzle Board */}
        <div className="w-64 h-64 md:w-80 md:h-80 bg-slate-200/50 dark:bg-slate-900/40 rounded-2xl overflow-hidden border border-slate-300/40 dark:border-white/5 grid grid-cols-3 gap-1 p-1.5 shadow-md">
          {boardSlots.map((piece, idx) => {
            const row = Math.floor(idx / GRID_SIZE);
            const col = idx % GRID_SIZE;
            const isCorrect = piece && piece.correctSlot === idx;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (piece) {
                    handleRemovePieceFromBoard(idx);
                  } else {
                    handleSlotClick(idx);
                  }
                }}
                className={`relative rounded-lg overflow-hidden border cursor-pointer transition-all duration-300 ${
                  piece 
                    ? isCorrect
                      ? 'border-emerald-400 shadow-sm pointer-events-none scale-100'
                      : 'border-amber-400/80 shadow-md hover:border-amber-500'
                    : 'border-dashed border-slate-400/40 dark:border-white/10 hover:bg-white/10 dark:hover:bg-white/5 flex items-center justify-center bg-slate-300/10'
                }`}
              >
                {/* Visual piece or empty ghost outline */}
                {piece ? (
                  <>
                    {renderPieceImage(piece.row, piece.col)}
                    {isCorrect && (
                      <div className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow z-10 animate-fade-in">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-slate-300 dark:text-slate-800 text-[10px]">
                    {row + 1}-{col + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Shuffled Tray divider */}
        <div className="w-full border-t border-dashed border-slate-200 dark:border-white/5 my-6" />

        <div className="text-3xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-poppins">
          {language === 'es' ? 'Bandeja de Piezas' : 'Pieces Tray'}
        </div>

        {/* Shuffled Pieces Tray */}
        <div className="flex flex-wrap justify-center gap-2 max-w-lg min-h-[75px] items-center p-2 rounded-2xl bg-slate-500/5 dark:bg-white/5 border border-slate-200/10 w-full">
          {pieces.map((piece) => {
            if (piece.placed) return null;
            const isSelected = selectedPieceId === piece.id;

            return (
              <div
                key={piece.id}
                onClick={() => handlePieceSelect(piece.id)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden cursor-pointer border shadow transition-all transform hover:-translate-y-0.5 ${
                  isSelected 
                    ? 'border-indigo-500 ring-2 ring-indigo-300/50 scale-105 z-10' 
                    : 'border-slate-300/60 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20'
                }`}
              >
                {renderPieceImage(piece.row, piece.col)}
              </div>
            );
          })}

          {pieces.every(p => p.placed) && !isCompleted && (
            <div className="text-xs text-rose-500 font-semibold animate-pulse py-4 font-nunito">
              ⚠️ {language === 'es' ? 'Algunas piezas no coinciden.' : 'Some pieces do not match.'}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default PuzzleGame;
