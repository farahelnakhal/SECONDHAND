import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Clock } from '@/components/game/Clock';
import { AuthorityClock } from '@/components/game/AuthorityClock';
import { Narrative } from '@/components/game/Narrative';
import { GlitchOverlay } from '@/components/game/GlitchOverlay';
import { PUZZLES, GameState, Act, PuzzleId, PUZZLE_SEQUENCE } from '@/lib/game';
import { soundManager } from '@/lib/sound';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Watch, Volume2, VolumeX, Bug } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { IntroSequence } from '@/components/game/IntroSequence';
import { Objectives } from '@/components/game/Objectives';

export default function Home() {
  // --- State ---
  const [realTime, setRealTime] = useState(dayjs());
  const [offset, setOffset] = useState(0); // Offset in ms
  const [gameState, setGameState] = useState<GameState>({
    act: 1,
    puzzlesSolved: [],
    glitchLevel: 0,
    cheatCount: 0,
    lastSolvedAt: 0,
    hasCheatedInAct1: false,
    hasCheatedInAct2: false
  });
  
  const [narrative, setNarrative] = useState({
    text: "Observe.",
    subtext: "Time flows forward. Watch closely."
  });

  const [isMuted, setIsMuted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [introComplete, setIntroComplete] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const { toast } = useToast();
  const lastIdleCheck = useRef(Date.now());
  const idleTime = useRef(0);
  const lastTick = useRef(0);

  // --- Derived State ---
  const authorityTime = realTime.add(offset, 'ms');
  const isAuthorityUnlocked = true; // Always unlocked now
  const isCheating = Math.abs(offset) > 1000;

  // --- Preparation Timer ---
  useEffect(() => {
    if (introComplete && !gameReady) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameReady(true);
      }
    }
  }, [introComplete, gameReady, countdown]);

  // --- Game Loop (1s tick) ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = dayjs();
      setRealTime(now);
      
      // Play tick sound if seconds changed
      if (now.second() !== lastTick.current && introComplete && gameReady) {
        lastTick.current = now.second();
        soundManager.playTick();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [introComplete, gameReady]);

  // --- High Frequency Loop (Game Logic) ---
  useEffect(() => {
    if (!introComplete || !gameReady) return;

    let animationFrameId: number;
    
    const loop = () => {
      const now = Date.now();
      const delta = now - lastIdleCheck.current;
      lastIdleCheck.current = now;

      // Idle detection (mouse movement resets this in event listener)
      idleTime.current += delta;

      checkPuzzles();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    const resetIdle = () => { idleTime.current = 0; };
    const onUserInteraction = () => {
      resetIdle();
      soundManager.resume(); // Ensure AudioContext is resumed on user gesture
    };

    window.addEventListener('mousemove', onUserInteraction);
    window.addEventListener('keydown', onUserInteraction);
    window.addEventListener('click', onUserInteraction);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
      window.removeEventListener('click', onUserInteraction);
    };
  }, [realTime, offset, gameState]); 

  // --- Logic ---
  const checkPuzzles = () => {
    // Only check if we haven't solved it yet
    const currentPuzzles = Object.values(PUZZLES).filter(p => p.act === gameState.act && !gameState.puzzlesSolved.includes(p.id as PuzzleId));
    const activePuzzleIds = currentPuzzles.map(p => p.id as PuzzleId);

    const h = authorityTime.hour();
    const m = authorityTime.minute();
    const s = authorityTime.second();

    for (const puzzle of currentPuzzles) {
      let isSolved = false;

      // Special metadata checks
      if (puzzle.id === 'stillness') {
        // Handled in handleAdjust
        continue; 
      } else if (puzzle.id === 'split') {
        isSolved = puzzle.check(h, m, s, { offset });
      } else if (puzzle.id === 'let_go') {
        isSolved = puzzle.check(h, m, s, { idleTime: idleTime.current });
      } else if (puzzle.id === 'echo_of_the_hour') {
        // Just check condition, no cheat restriction
        isSolved = puzzle.check(h, m, s);
      } else if (puzzle.id === 'mini_paradox') {
         if (gameState.hasCheatedInAct2) {
            isSolved = puzzle.check(h, m, s, { offset });
         }
      } else if (puzzle.id === 'fractured_moments') {
         if (gameState.cheatCount > 10) { 
            isSolved = puzzle.check(h, m, s, { cheatCount: gameState.cheatCount });
         }
      } else {
        isSolved = puzzle.check(h, m, s);
      }

      if (isSolved) {
        solvePuzzle(puzzle.id as PuzzleId);
      }
    }
  };

  const solvePuzzle = (id: PuzzleId) => {
    if (gameState.puzzlesSolved.includes(id)) return;

    soundManager.playSolve();
    
    setGameState(prev => {
      const newSolved = [...prev.puzzlesSolved, id];
      const newAct = determineAct(newSolved);
      
      return {
        ...prev,
        puzzlesSolved: newSolved,
        act: newAct,
        lastSolvedAt: Date.now(),
        glitchLevel: Math.min(prev.cheatCount * 0.1, 1)
      };
    });

    const puzzle = PUZZLES[id as keyof typeof PUZZLES];
    toast({
      title: "Puzzle Solved",
      description: puzzle.prompt,
      duration: 3000,
      className: "bg-black text-white border-white/20 font-mono"
    });

    // Flavor text updates
    if (id === 'agreement') setNarrative({ text: "Harmony found.", subtext: "The numbers align." });
    if (id === 'reflection') setNarrative({ text: "Symmetry observed.", subtext: "Time reflects itself." });
    if (id === 'imbalance') setNarrative({ text: "Imbalance corrected.", subtext: "Oddity accepted." });
    if (id === 'precision') setNarrative({ text: "Perfect precision.", subtext: "The moment is exact." });
    if (id === 'outside_time') setNarrative({ text: "Beyond the boundary.", subtext: "You stepped outside." });
    if (id === 'split') setNarrative({ text: "Convergence.", subtext: "Two timelines become one." });
    if (id === 'let_go') setNarrative({ text: "Released.", subtext: "You stopped fighting the flow." });
    
    // Secret texts
    if (id === 'echo_of_the_hour') setNarrative({ text: "Pure Time.", subtext: "You respected the flow. The Timekeeper nods." });
    if (id === 'mini_paradox') setNarrative({ text: "A small fracture.", subtext: "You bent the rules." });
    if (id === 'fractured_moments') setNarrative({ text: "REALITY BREAK.", subtext: "You broke the simulator." });
  };

  const determineAct = (solved: PuzzleId[]): Act => {
    // Only upgrade Act if sufficient puzzles in current act are solved
    const act1Count = solved.filter(id => PUZZLES[id as keyof typeof PUZZLES].act === 1).length;
    const act2Count = solved.filter(id => PUZZLES[id as keyof typeof PUZZLES].act === 2).length;

    // Need 3 from Act 1 to go to Act 2
    // Need 2 from Act 2 to go to Act 3
    
    // Logic: 
    // If we are in Act 1 and have >= 3 Act 1 puzzles -> Act 2
    // If we are in Act 2 and have >= 2 Act 2 puzzles -> Act 3
    
    // However, user might skip order if using dev tools. 
    // Safest:
    if (act2Count >= 2 && act1Count >= 3) return 3;
    if (act1Count >= 3) return 2;
    return 1;
  };

  // --- Handlers ---
  const handleAdjust = (unit: 'hour' | 'minute', amount: number) => {
    if (!isAuthorityUnlocked) return;

    soundManager.playGlitch(0.2);

    const msAmount = unit === 'hour' ? amount * 3600000 : amount * 60000;
    setOffset(prev => prev + msAmount);
    
    setGameState(prev => ({
      ...prev,
      cheatCount: prev.cheatCount + 1,
      glitchLevel: Math.min((prev.cheatCount + 1) * 0.05, 1),
      hasCheatedInAct1: prev.act === 1 ? true : prev.hasCheatedInAct1,
      hasCheatedInAct2: prev.act === 2 ? true : prev.hasCheatedInAct2
    }));

    // Reset idle
    idleTime.current = 0;

    // Check stillness puzzle (moved backward)
    if (amount < 0 && gameState.act === 2 && !gameState.puzzlesSolved.includes('stillness')) {
      solvePuzzle('stillness');
    }
  };

  const handleReset = () => {
    setOffset(0);
    setGameState(prev => ({ ...prev, glitchLevel: 0 })); 
    soundManager.playGlitch(0.5);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    soundManager.toggleMute();
  };

  // --- Act Transitions ---
  useEffect(() => {
    // Only update narrative if we just entered the act (simple check via puzzle count, or we could track prev act)
    // For now, rely on render checks
    if (gameState.act === 1 && gameState.puzzlesSolved.length === 0) {
       // Keep Observe
    } else if (gameState.act === 2 && !gameState.puzzlesSolved.some(id => PUZZLES[id as keyof typeof PUZZLES].act === 2)) {
      setNarrative({ text: "Act II: Control", subtext: "You have already seized the power." });
    } else if (gameState.act === 3 && !gameState.puzzlesSolved.some(id => PUZZLES[id as keyof typeof PUZZLES].act === 3)) {
      setNarrative({ text: "Act III: Resistance", subtext: "The timelines are fracturing." });
    }
  }, [gameState.act]);


  // --- Dev Tools ---
  const unlockAll = () => {
    setGameState(prev => ({
       ...prev, 
       act: 3,
       puzzlesSolved: ['agreement', 'reflection', 'imbalance', 'stillness', 'precision', 'outside_time'] as PuzzleId[]
    }));
    soundManager.playSolve();
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center">
      <AnimatePresence>
        {!introComplete && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-[100]"
          >
            <IntroSequence onComplete={() => setIntroComplete(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      <GlitchOverlay intensity={gameState.glitchLevel} />
      
      {/* UI Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-50">
        <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white/50 hover:text-white">
          {isMuted ? <VolumeX /> : <Volume2 />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowDebug(!showDebug)} className="text-white/50 hover:text-white">
          <Bug />
        </Button>
      </div>

      {/* Dev Menu */}
      <AnimatePresence>
        {showDebug && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-16 right-4 bg-zinc-900 border border-zinc-800 p-4 rounded-lg z-50 flex flex-col gap-2 w-48"
          >
            <span className="text-xs font-mono text-muted-foreground mb-1">DEV OVERRIDE</span>
            <Button size="sm" variant="outline" onClick={unlockAll} className="w-full text-xs">Unlock All Acts</Button>
            <Button size="sm" variant="outline" onClick={() => setGameState(p => ({ ...p, glitchLevel: p.glitchLevel + 0.2 }))} className="w-full text-xs">Increase Glitch</Button>
            <div className="text-[10px] text-zinc-500 font-mono mt-2">
              Act: {gameState.act}<br/>
              Solved: {gameState.puzzlesSolved.length}<br/>
              Offset: {offset}ms
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timekeeper Icon */}
      <AnimatePresence>
        {isAuthorityUnlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            whileHover={{ opacity: 1, textShadow: "0 0 8px #fff" }}
            className="absolute top-8 right-16 text-white/50 cursor-help z-40"
          >
             <Watch className="w-6 h-6 animate-pulse text-clock-yellow" />
          </motion.div>
        )}
      </AnimatePresence>

      <Narrative 
        text={narrative.text} 
        subtext={narrative.subtext} 
        act={gameState.act} 
      />

      <Objectives 
        isVisible={gameReady}
        availablePuzzles={(() => {
          // Filter for current Act and not solved
          const actPuzzles = PUZZLE_SEQUENCE.filter(pid => {
            const p = PUZZLES[pid as keyof typeof PUZZLES];
            return p.act === gameState.act && !gameState.puzzlesSolved.includes(pid);
          });
          // Return only the first one (Sequential)
          return actPuzzles.slice(0, 1);
        })()}
      />

      {introComplete && !gameReady && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-50">
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-white/30 font-mono text-sm tracking-widest mb-4"
           >
             INITIALIZING SIMULATOR
           </motion.div>
           <motion.div 
             key={countdown}
             initial={{ scale: 1.5, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.8, opacity: 0 }}
             className="text-4xl font-mono text-white/50"
           >
             {countdown}
           </motion.div>
           <Button 
             variant="link" 
             className="text-white/20 mt-8 text-xs hover:text-white"
             onClick={() => setGameReady(true)}
           >
             START NOW
           </Button>
        </div>
      )}

      <div className="z-10 relative">
        <motion.div
          animate={{ opacity: gameReady ? 1 : 0, filter: gameReady ? 'blur(0px)' : 'blur(20px)' }}
          transition={{ duration: 1 }}
        >
          <Clock 
            time={authorityTime} 
            isGlitching={isCheating || gameState.glitchLevel > 0.3} 
          />
        </motion.div>
        
        {/* Real Time Ghost (visible only in Act 3 or high glitch) */}
        {(gameState.act === 3 || gameState.glitchLevel > 0.5) && offset !== 0 && gameReady && (
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none blur-sm mix-blend-difference scale-110">
             <Clock time={realTime} showSeconds={true} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {/* Always visible Authority Clock once game is ready */}
        {gameReady && (
          <AuthorityClock 
            isLocked={false} 
            onAdjust={handleAdjust}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
      
      <Toaster />
    </div>
  );
}
