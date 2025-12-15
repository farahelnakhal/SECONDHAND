import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleId, PUZZLES } from '@/lib/game';

interface ObjectivesProps {
  availablePuzzles: PuzzleId[];
  isVisible: boolean;
}

export function Objectives({ availablePuzzles, isVisible }: ObjectivesProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-8 left-8 z-40 pointer-events-none">
      <div className="flex flex-col gap-3 items-start">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-mono uppercase tracking-widest text-white/30 border-b border-white/10 pb-1 mb-1"
        >
          Active Protocols
        </motion.div>
        
        <AnimatePresence mode="popLayout">
          {availablePuzzles.map((pid) => {
             const puzzle = PUZZLES[pid as keyof typeof PUZZLES];
             if (!puzzle) return null;
             
             return (
               <motion.div
                 key={pid}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                 layout
                 className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-2 rounded-sm border-l-2 border-l-clock-yellow w-64"
               >
                 <div className="text-xs font-mono text-white/90 mb-1">
                   {puzzle.prompt}
                 </div>
                 <div className="text-[10px] font-mono text-clock-cyan/80">
                   REQ: {puzzle.hint}
                 </div>
               </motion.div>
             );
           })}
        </AnimatePresence>

        {availablePuzzles.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-mono text-white/40 italic"
          >
            All protocols satisfied. Awaiting Act transition...
          </motion.div>
        )}
      </div>
    </div>
  );
}
