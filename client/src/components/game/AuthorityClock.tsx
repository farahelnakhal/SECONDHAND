import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Clock as ClockIcon, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthorityClockProps {
  onAdjust: (unit: 'hour' | 'minute', amount: number) => void;
  onReset: () => void;
  isVisible: boolean;
  className?: string;
}

export function AuthorityClock({ onAdjust, onReset, isVisible, className }: AuthorityClockProps) {
  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn("fixed bottom-8 right-8 p-6 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50", className)}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
          <ClockIcon className="w-3 h-3 text-clock-yellow" />
          <span>Authority Interface</span>
        </div>

        <div className="flex gap-6">
          {/* Hours Control */}
          <div className="flex flex-col items-center gap-2">
            <ControlBtn onClick={() => onAdjust('hour', 1)} icon={<ChevronUp className="w-4 h-4" />} />
            <span className="font-mono text-sm text-muted-foreground">HR</span>
            <ControlBtn onClick={() => onAdjust('hour', -1)} icon={<ChevronDown className="w-4 h-4" />} />
          </div>

          {/* Minutes Control */}
          <div className="flex flex-col items-center gap-2">
            <ControlBtn onClick={() => onAdjust('minute', 1)} icon={<ChevronUp className="w-4 h-4" />} />
            <span className="font-mono text-sm text-muted-foreground">MIN</span>
            <ControlBtn onClick={() => onAdjust('minute', -1)} icon={<ChevronDown className="w-4 h-4" />} />
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          className="mt-2 text-xs text-muted-foreground hover:text-white hover:bg-white/5"
        >
          <RotateCcw className="w-3 h-3 mr-2" />
          Sync
        </Button>
      </div>
    </motion.div>
  );
}

function ControlBtn({ onClick, icon }: { onClick: () => void, icon: React.ReactNode }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="w-8 h-8 rounded-full border-white/20 bg-transparent hover:bg-white/10 hover:border-white/40 transition-all active:scale-95"
    >
      {icon}
    </Button>
  );
}
