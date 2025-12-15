import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ClockProps {
  time: dayjs.Dayjs;
  isGlitching?: boolean;
  className?: string;
  showSeconds?: boolean;
}

import dayjs from 'dayjs';

export function Clock({ time, isGlitching, className, showSeconds = true }: ClockProps) {
  const hours = time.format('HH');
  const minutes = time.format('mm');
  const seconds = time.format('ss');

  return (
    <div className={cn("font-mono text-8xl md:text-9xl tracking-tight select-none relative", className)}>
      <div className="flex items-baseline justify-center gap-2 md:gap-4">
        <Digit value={hours} isGlitching={isGlitching} delay={0} />
        <span className={cn("animate-pulse text-foreground/50", isGlitching && "text-clock-magenta")}>:</span>
        <Digit value={minutes} isGlitching={isGlitching} delay={0.1} />
        
        {showSeconds && (
          <>
            <span className={cn("text-4xl md:text-6xl text-foreground/30 ml-2", isGlitching && "text-clock-cyan")}>
              {seconds}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Digit({ value, isGlitching, delay }: { value: string, isGlitching?: boolean, delay: number }) {
  return (
    <div className="relative">
      <span className={cn("relative z-10 transition-colors duration-300", isGlitching ? "text-white" : "text-white")}>
        {value}
      </span>
      
      {isGlitching && (
        <>
          <motion.span 
            className="absolute top-0 left-0 -ml-[2px] text-clock-magenta opacity-70 z-0"
            animate={{ 
              x: [-2, 2, -1, 0],
              y: [1, -1, 0],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.2, 
              repeatType: "mirror",
              delay: delay 
            }}
          >
            {value}
          </motion.span>
          <motion.span 
            className="absolute top-0 left-0 ml-[2px] text-clock-cyan opacity-70 z-0"
            animate={{ 
              x: [2, -2, 1, 0],
              y: [-1, 1, 0],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.25, 
              repeatType: "mirror",
              delay: delay + 0.05
            }}
          >
            {value}
          </motion.span>
        </>
      )}
    </div>
  );
}
