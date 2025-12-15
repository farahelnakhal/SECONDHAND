import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Clock } from '@/components/game/Clock';
import { AuthorityClock } from '@/components/game/AuthorityClock';
import { Narrative } from '@/components/game/Narrative';
import { GlitchOverlay } from '@/components/game/GlitchOverlay';
import { PUZZLES, GameState, Act, PuzzleId } from '@/lib/game';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Watch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const { toast } = useToast();
  const lastIdleCheck = useRef(Date.now());
  const idleTime = useRef(0);

  // --- Derived State ---
  const authorityTime = realTime.add(offset, 'ms');
  const isAuthorityActive = gameState.act >= 2;
  const isCheating = Math.abs(offset) > 1000;

  // --- Game Loop (1s tick) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(dayjs());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // --- High Frequency Loop (Game Logic) ---
  useEffect(() => {
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
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
    };
  }, [realTime, offset, gameState]); // Dependencies for the loop context

  // --- Logic ---
  const checkPuzzles = () => {
    // Only check if we haven't solved it yet
    const currentPuzzles = Object.values(PUZZLES).filter(p => p.act === gameState.act && !gameState.puzzlesSolved.includes(p.id as PuzzleId));
    
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
        // Only if we haven't cheated in Act 1 AND we solved at least 3 other Act 1 puzzles
        const act1SolvedCount = gameState.puzzlesSolved.filter(id => PUZZLES[id as keyof typeof PUZZLES].act === 1).length;
        if (!gameState.hasCheatedInAct1 && act1SolvedCount >= 3) {
          isSolved = puzzle.check(h, m, s);
        }
      } else if (puzzle.id === 'mini_paradox') {
         if (gameState.hasCheatedInAct2) {
            isSolved = puzzle.check(h, m, s, { offset });
         }
      } else if (puzzle.id === 'fractured_moments') {
         if (gameState.cheatCount > 10) { // Check high usage
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
    // Prevent double solve
    if (gameState.puzzlesSolved.includes(id)) return;

    setGameState(prev => {
      const newSolved = [...prev.puzzlesSolved, id];
      const newAct = determineAct(newSolved);
      
      return {
        ...prev,
        puzzlesSolved: newSolved,
        act: newAct,
        lastSolvedAt: Date.now(),
        // Glitch increases with cheat count
        glitchLevel: Math.min(prev.cheatCount * 0.1, 1)
      };
    });

    // Update narrative
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
    // Count main puzzles solved per act to progress
    const act1Count = solved.filter(id => PUZZLES[id as keyof typeof PUZZLES].act === 1).length;
    const act2Count = solved.filter(id => PUZZLES[id as keyof typeof PUZZLES].act === 2).length;
    const act3Count = solved.filter(id => PUZZLES[id as keyof typeof PUZZLES].act === 3).length;

    if (act2Count >= 3) return 3;
    if (act1Count >= 3) return 2;
    return 1;
  };

  // --- Handlers ---
  const handleAdjust = (unit: 'hour' | 'minute', amount: number) => {
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
  };

  // --- Act Transitions ---
  useEffect(() => {
    if (gameState.act === 2 && !gameState.puzzlesSolved.some(id => PUZZLES[id as keyof typeof PUZZLES].act === 2)) {
      setNarrative({ text: "Act II: Control", subtext: "The Authority Clock is now active." });
    } else if (gameState.act === 3 && !gameState.puzzlesSolved.some(id => PUZZLES[id as keyof typeof PUZZLES].act === 3)) {
      setNarrative({ text: "Act III: Resistance", subtext: "The timelines are fracturing." });
    }
  }, [gameState.act]);


  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center">
      <GlitchOverlay intensity={gameState.glitchLevel} />
      
      {/* Timekeeper Icon */}
      <AnimatePresence>
        {isAuthorityActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            whileHover={{ opacity: 1, textShadow: "0 0 8px #fff" }}
            className="absolute top-8 right-8 text-white/50 cursor-help z-50"
          >
             <Watch className="w-6 h-6 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <Narrative 
        text={narrative.text} 
        subtext={narrative.subtext} 
        act={gameState.act} 
      />

      <div className="z-10 relative">
        <Clock 
          time={authorityTime} 
          isGlitching={isCheating || gameState.glitchLevel > 0.3} 
        />
        
        {/* Real Time Ghost (visible only in Act 3 or high glitch) */}
        {(gameState.act === 3 || gameState.glitchLevel > 0.5) && offset !== 0 && (
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none blur-sm mix-blend-difference scale-110">
             <Clock time={realTime} showSeconds={true} />
          </div>
        )}
      </div>

      <AuthorityClock 
        isVisible={isAuthorityActive}
        onAdjust={handleAdjust}
        onReset={handleReset}
      />
      
      <Toaster />
    </div>
  );
}
