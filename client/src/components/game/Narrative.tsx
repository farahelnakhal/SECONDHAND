import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NarrativeProps {
  text: string;
  subtext?: string;
  act: number;
}

export function Narrative({ text, subtext, act }: NarrativeProps) {
  return (
    <div className="absolute top-24 left-0 w-full text-center z-10 pointer-events-none px-4">
      <motion.div
        key={text}
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-xl md:text-2xl font-light tracking-wide text-white/90 mb-2">
          {text}
        </h2>
      </motion.div>
      
      <AnimatePresence>
        {subtext && (
          <motion.p
            key={subtext}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-sm md:text-base text-white/50 font-mono mt-4 max-w-md mx-auto leading-relaxed"
          >
            {subtext}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="fixed top-8 left-8 text-xs font-mono text-white/20">
        ACT {act} // STATUS: ACTIVE
      </div>
    </div>
  );
}
