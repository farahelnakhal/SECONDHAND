import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface IntroSequenceProps {
  onComplete: () => void;
}

const LINES = [
  "Time is a river, steady yet fragile.",
  "You are an apprentice of the Timekeeper, tasked with understanding its flow.",
  "The Authority Clock is your simulator.",
  "A sandbox where seconds can be nudged, rewound, or accelerated.",
  "Manipulate it wisely... or leave it untouched.",
  "The Timekeeper watches."
];

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    // Auto-advance logic could go here, but click-to-advance is often better for reading pace
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        advance();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index]);

  const advance = () => {
    soundManager.playTick(); // Subtle feedback
    if (index < LINES.length - 1) {
      setIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8 cursor-pointer"
      onClick={advance}
    >
      <div className="max-w-2xl w-full text-center space-y-8">
        <AnimatePresence mode='wait'>
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-2xl md:text-4xl font-light tracking-wide text-white leading-relaxed font-serif"
          >
            {LINES[index]}
          </motion.p>
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-12 text-white/30 text-sm font-mono animate-pulse"
        >
          [Click or Press Space to Continue]
        </motion.div>

        <div className="absolute top-8 right-8">
           <Button 
             variant="ghost" 
             className="text-white/20 hover:text-white hover:bg-white/10 text-xs uppercase tracking-widest"
             onClick={(e) => {
               e.stopPropagation();
               onComplete();
             }}
           >
             Skip Intro <ArrowRight className="ml-2 w-3 h-3" />
           </Button>
        </div>
      </div>
    </div>
  );
}
