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
import { Watch, Volume2, VolumeX, Bug, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider'; // Need to import or create this if not exists
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
    hasCheatedInAct2: false,
    signalStrength: 0 // Initialize new state
  });
  
  const [narrative, setNarrative] = useState({
    text: "Observe.",
    subtext: "Time flows forward. Watch closely."
  });

  const [isMuted, setIsMuted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [introComplete, setIntroComplete] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const [showClock, setShowClock] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
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
      // Only reset if moved SIGNIFICANTLY to avoid micro-movements breaking the puzzle
      idleTime.current += delta;

      checkPuzzles();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    const resetIdle = () => { idleTime.current = 0; };
    const onUserInteraction = (e: Event) => {
      // For mousemove, maybe add a threshold?
      // For now, let's keep it strict but maybe user needs to be completely hands off
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
    // Only check the NEXT available puzzle in sequence
    let nextPuzzleId = PUZZLE_SEQUENCE.find(pid => {
       const p = PUZZLES[pid as keyof typeof PUZZLES];
       return p.act === gameState.act && !gameState.puzzlesSolved.includes(pid);
    });

    // --- ENDING LOGIC ---
    // If no next puzzle in sequence AND we are in Act 3, determine the Ending Protocol
    if (!nextPuzzleId && gameState.act === 3) {
       // Check if we solved all Act 3 puzzles
       const act3Solved = PUZZLE_SEQUENCE.filter(pid => PUZZLES[pid as keyof typeof PUZZLES].act === 3).every(pid => gameState.puzzlesSolved.includes(pid));
       
       if (act3Solved) {
         // Determine which ending based on playstyle
         if (gameState.cheatCount > 15) {
            nextPuzzleId = 'destruction'; // High Chaos
         } else if (gameState.cheatCount < 2) {
            nextPuzzleId = 'acceptance'; // Purist
         } else if (idleTime.current > 30000) { // If they've been idle a lot recently
            nextPuzzleId = 'departure'; // Ghost
         } else {
            nextPuzzleId = 'alignment'; // Balanced
         }
       }
    }
    
    // Also handle already unlocked Act 4 (Ending)
    if (gameState.act === 4) {
       // First check Judgment
       if (!gameState.puzzlesSolved.includes('judgment')) {
         nextPuzzleId = 'judgment';
       } else {
         // Then check Ending
         if (gameState.cheatCount > 15) nextPuzzleId = 'destruction';
         else if (gameState.cheatCount < 2) nextPuzzleId = 'acceptance';
         else nextPuzzleId = 'alignment'; 
         
         if (idleTime.current > 20000) nextPuzzleId = 'departure';
       }
    }


    if (!nextPuzzleId) return; // No more puzzles in this act or all solved

    // Don't re-solve if already solved
    if (gameState.puzzlesSolved.includes(nextPuzzleId as PuzzleId)) return;

    const puzzle = PUZZLES[nextPuzzleId as keyof typeof PUZZLES];
    if (!puzzle) return;

    const h = authorityTime.hour();
    const m = authorityTime.minute();
    const s = authorityTime.second();

    let isSolved = false;

    // Special metadata checks
    if (puzzle.id === 'stillness') {
      // Handled in handleAdjust
      return; 
    } else if (puzzle.id === 'split') {
      isSolved = puzzle.check(h, m, s, { offset });
    } else if (puzzle.id === 'let_go') {
      isSolved = puzzle.check(h, m, s, { idleTime: idleTime.current });
    } else if (puzzle.id === 'echo_of_the_hour') {
      isSolved = puzzle.check(h, m, s);
    } else if (puzzle.id === 'mini_paradox') {
        if (gameState.hasCheatedInAct2) {
          isSolved = puzzle.check(h, m, s, { offset });
        }
    } else if (puzzle.id === 'fading') {
        isSolved = puzzle.check(h, m, s, { signal: gameState.signalStrength });
    } else if (puzzle.id === 'fractured_moments') {
        if (gameState.cheatCount > 10) { 
          isSolved = puzzle.check(h, m, s, { cheatCount: gameState.cheatCount });
        }
    } else if (puzzle.act === 4) {
        // ENDING PUZZLES
        if (puzzle.id === 'judgment') isSolved = puzzle.check(h, m, s);
        if (puzzle.id === 'acceptance') isSolved = puzzle.check(h, m, s, { offset });
        if (puzzle.id === 'destruction') isSolved = puzzle.check(h, m, s, { rapidClicks });
        if (puzzle.id === 'alignment') isSolved = puzzle.check(h, m, s, { offset });
        if (puzzle.id === 'departure') isSolved = puzzle.check(h, m, s, { idleTime: idleTime.current });
    } else {
      isSolved = puzzle.check(h, m, s);
    }

    if (isSolved) {
      solvePuzzle(puzzle.id as PuzzleId);
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
    if (id === 'sequence') setNarrative({ text: "The path ascends.", subtext: "Order is restored." });
    if (id === 'stagnation') setNarrative({ text: "Uniformity.", subtext: "Everything is the same." });
    if (id === 'precision') setNarrative({ text: "Perfect precision.", subtext: "The moment is exact." });
    if (id === 'outside_time') setNarrative({ text: "Beyond the boundary.", subtext: "You stepped outside." });
    if (id === 'shadow_hour') setNarrative({ text: "The void hour.", subtext: "It does not exist." });
    if (id === 'discord') setNarrative({ text: "Chaos reigns.", subtext: "Nothing matches." });
    if (id === 'split') setNarrative({ text: "Convergence.", subtext: "Two timelines become one." });
    if (id === 'inversion') setNarrative({ text: "Reflected world.", subtext: "The other side." });
    if (id === 'let_go') setNarrative({ text: "Released.", subtext: "You stopped fighting the flow." });
    if (id === 'fading') setNarrative({ text: "Signal found.", subtext: "You tuned into the void." });
    
    // Secret texts
    if (id === 'echo_of_the_hour') setNarrative({ text: "Pure Time.", subtext: "You respected the flow. The Timekeeper nods." });
    if (id === 'mini_paradox') setNarrative({ text: "A small fracture.", subtext: "You bent the rules." });
    if (id === 'fractured_moments') setNarrative({ text: "REALITY BREAK.", subtext: "You broke the simulator." });
    
    // Endings
    if (id === 'judgment') {
       setNarrative({ text: "Verdict delivered.", subtext: "Your path is clear." });
       // Keep clock hidden for a moment, then show for final challenge
       setTimeout(() => setShowClock(true), 4000);
    }
    
    if (['acceptance', 'destruction', 'alignment', 'departure'].includes(id)) {
       setGameEnded(true);
       soundManager.playGlitch(0.8);
    }

    if (id === 'acceptance') setNarrative({ text: "The Custodian.", subtext: "You kept the time pure. The cycle continues." });
    if (id === 'destruction') setNarrative({ text: "The Breaker.", subtext: "Time is broken. You are free." });
    if (id === 'alignment') setNarrative({ text: "The Architect.", subtext: "You built a new moment." });
    if (id === 'departure') setNarrative({ text: "The Ghost.", subtext: "You were never here." });
  };

  const determineAct = (solved: PuzzleId[]): Act => {
    // Only upgrade Act if sufficient puzzles in current act are solved
    const act1Count = solved.filter(id => PUZZLES[id as keyof typeof PUZZLES].act === 1).length;
    const act2Count = solved.filter(id => PUZZLES[id as keyof typeof PUZZLES].act === 2).length;
    const act3Count = solved.filter(id => PUZZLES[id as keyof typeof PUZZLES].act === 3).length;

    // Check if Act 3 is fully done (based on Sequence)
    const totalAct3 = PUZZLE_SEQUENCE.filter(pid => PUZZLES[pid as keyof typeof PUZZLES].act === 3).length;

    if (act3Count >= totalAct3) return 4;
    if (act2Count >= 2 && act1Count >= 3) return 3;
    if (act1Count >= 3) return 2;
    return 1;
  };

  const [rapidClicks, setRapidClicks] = useState(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Handlers ---
  const handleAdjust = (unit: 'hour' | 'minute', amount: number) => {
    if (!isAuthorityUnlocked) return;

    soundManager.playGlitch(0.2);

    // Rapid Click Detection for Destruction Ending
    if (gameState.act === 4 && unit === 'hour') {
       setRapidClicks(prev => prev + 1);
       if (clickTimer.current) clearTimeout(clickTimer.current);
       clickTimer.current = setTimeout(() => setRapidClicks(0), 5000);
    }

    const msAmount = unit === 'hour' ? amount * 3600000 : amount * 60000;
    setOffset(prev => prev + msAmount);
    
    // Increase glitch level aggressively
    // If in Act 4, it gets "horrible" (> 1.0)
    setGameState(prev => {
      const baseGlitch = (prev.cheatCount + 1) * 0.1;
      const horrorMultiplier = prev.act === 4 ? 2.0 : 1.0;
      return {
        ...prev,
        cheatCount: prev.cheatCount + 1,
        glitchLevel: Math.min(baseGlitch * horrorMultiplier, 5.0), // Cap at 5.0 for extreme horror
        hasCheatedInAct1: prev.act === 1 ? true : prev.hasCheatedInAct1,
        hasCheatedInAct2: prev.act === 2 ? true : prev.hasCheatedInAct2
      };
    });

    // Reset idle
    idleTime.current = 0;

    // Check stillness puzzle (moved backward)
    if (amount < 0 && gameState.act === 2 && !gameState.puzzlesSolved.includes('stillness')) {
      solvePuzzle('stillness');
    }
  };

  const handleReset = () => {
    setOffset(0);
    // Don't reset glitch level completely, just reduce it slightly
    setGameState(prev => ({ ...prev, glitchLevel: Math.max(prev.glitchLevel - 0.2, 0) })); 
    soundManager.playGlitch(0.5);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    soundManager.toggleMute();
  };

  // --- Act Transitions ---
  useEffect(() => {
    // Hide clock on ANY act transition to create "The Void" feeling
    if (gameState.act > 1) {
       setShowClock(false);
       // Show it again after a delay, UNLESS it's Act 4 (Judgment) which handles it manually
       if (gameState.act !== 4) {
          setTimeout(() => setShowClock(true), 3000);
       }
    }

    // Only update narrative if we just entered the act (simple check via puzzle count, or we could track prev act)
    // For now, rely on render checks
    if (gameState.act === 1 && gameState.puzzlesSolved.length === 0) {
       // Keep Observe
    } else if (gameState.act === 2 && !gameState.puzzlesSolved.some(id => PUZZLES[id as keyof typeof PUZZLES].act === 2)) {
      setNarrative({ text: "Act II: Control", subtext: "You have already seized the power." });
    } else if (gameState.act === 3 && !gameState.puzzlesSolved.some(id => PUZZLES[id as keyof typeof PUZZLES].act === 3)) {
      setNarrative({ text: "Act III: Resistance", subtext: "The timelines are fracturing." });
    } else if (gameState.act === 4 && !gameState.puzzlesSolved.some(id => PUZZLES[id as keyof typeof PUZZLES].act === 4)) {
       // Narrative for Judgment Phase
       if (gameState.cheatCount > 15) {
          setNarrative({ text: "The Fracture.", subtext: "You forced your will upon the flow. A violent path." });
       } else if (gameState.cheatCount < 2) {
          setNarrative({ text: "The Pattern.", subtext: "You obeyed every command. A perfect sequence." });
       } else if (idleTime.current > 30000) {
          setNarrative({ text: "The Void.", subtext: "You observed from a distance. The timeline barely felt your touch." });
       } else {
          setNarrative({ text: "The Balance.", subtext: "You took control, but respected the order." });
       }
       // Hide clock during Judgment (Start of Act 4) - Already handled by top check but explicit here for clarity if logic changes
       setShowClock(false);
       
       // Play intense sound for Act 4 entry
       soundManager.playDeepChime();
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

      <div className={gameEnded ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 pointer-events-none" : ""}>
        <Narrative 
          text={narrative.text} 
          subtext={narrative.subtext} 
          act={gameState.act} 
        />
      </div>

      <Objectives 
        isVisible={gameReady && !gameEnded}
        availablePuzzles={(() => {
          // If Act 4, determine the dynamic ending puzzle
          if (gameState.act === 4) {
             // 1. Check Judgment first
             if (!gameState.puzzlesSolved.includes('judgment')) {
                return ['judgment'];
             }

             // 2. If Judgment solved, show specific ending
             let endingId: PuzzleId = 'alignment';
             if (idleTime.current > 20000) endingId = 'departure';
             else if (gameState.cheatCount > 15) endingId = 'destruction';
             else if (gameState.cheatCount < 2) endingId = 'acceptance';
             
             // If already solved an ending, show nothing
             if (gameState.puzzlesSolved.some(id => id !== 'judgment' && PUZZLES[id as keyof typeof PUZZLES].act === 4)) return [];
             
             return [endingId];
          }

          // Filter for current Act and not solved
          const actPuzzles = PUZZLE_SEQUENCE.filter(pid => {
            const p = PUZZLES[pid as keyof typeof PUZZLES];
            return p.act === gameState.act && !gameState.puzzlesSolved.includes(pid);
          });
          // Return only the first one (Sequential)
          return actPuzzles.slice(0, 1);
        })()}
      />

      {/* Signal Tuner (New Feature - Act 2+) */}
      <AnimatePresence>
        {gameState.act >= 2 && gameReady && !gameEnded && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg backdrop-blur-md z-40 flex flex-col gap-2"
          >
             <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span className="flex items-center gap-2"><Radio className="w-3 h-3" /> SIGNAL FREQUENCY</span>
                <span>{gameState.signalStrength}%</span>
             </div>
             <Slider 
               value={[gameState.signalStrength]} 
               min={0} 
               max={100} 
               step={1} 
               onValueChange={(vals) => {
                 setGameState(prev => ({ ...prev, signalStrength: vals[0] }));
                 // Add static noise sound when changing
                 if (Math.random() > 0.7) soundManager.playGlitch(0.05);
               }}
               className="cursor-pointer"
             />
             {/* Visual Noise Overlay controlled by Signal */}
             <div 
               className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
               style={{ 
                 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${0.5 + (gameState.signalStrength / 200)}' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
               }}
             />
          </motion.div>
        )}
      </AnimatePresence>

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
          animate={{ 
            opacity: gameReady && showClock && !gameEnded ? 1 : 0, 
            filter: gameReady && showClock && !gameEnded ? 'blur(0px)' : 'blur(20px)',
            scale: showClock && !gameEnded ? 1 : 0.9
          }}
          transition={{ duration: 2 }}
        >
          <Clock 
            time={authorityTime} 
            isGlitching={isCheating || gameState.glitchLevel > 0.3} 
          />
        </motion.div>
        
        {/* Real Time Ghost (visible only in Act 3 or high glitch) */}
        {(gameState.act === 3 || gameState.glitchLevel > 0.5) && offset !== 0 && gameReady && showClock && !gameEnded && (
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none blur-sm mix-blend-difference scale-110">
             <Clock time={realTime} showSeconds={true} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {/* Always visible Authority Clock once game is ready */}
        {gameReady && !gameEnded && (
          <AuthorityClock 
            isLocked={false} 
            onAdjust={handleAdjust}
            onReset={() => {}} // No-op since button is removed visually
          />
        )}
      </AnimatePresence>
      
      <Toaster />
    </div>
  );
}
