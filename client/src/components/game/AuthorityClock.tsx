import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Clock as ClockIcon, RotateCcw, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthorityClockProps {
  onAdjust: (unit: 'hour' | 'minute', amount: number) => void;
  onReset: () => void;
  isLocked: boolean; // Changed from isVisible
  className?: string;
}

export function AuthorityClock({ onAdjust, onReset, isLocked, className }: AuthorityClockProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "fixed bottom-8 left-8 p-6 rounded-xl border transition-all duration-500 z-50",
        isLocked 
          ? "bg-black/40 border-white/5 grayscale opacity-50 pointer-events-none" 
          : "bg-black/80 backdrop-blur-md border-white/10 shadow-2xl",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 relative">
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-black/80 px-3 py-1 rounded border border-white/10 flex items-center gap-2">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                Unauthorized
              </span>
            </div>
          </div>
        )}

        <div className={cn("flex items-center gap-2 text-xs uppercase tracking-widest mb-2 transition-colors", isLocked ? "text-white/10" : "text-clock-yellow")}>
          <ClockIcon className="w-3 h-3" />
          <span>Authority Interface</span>
        </div>

        <div className={cn("flex gap-6 transition-opacity duration-500", isLocked ? "opacity-20 blur-[1px]" : "opacity-100")}>
          {/* Hours Control */}
          <div className="flex flex-col items-center gap-2">
            <ControlBtn onClick={() => onAdjust('hour', 1)} icon={<ChevronUp className="w-4 h-4" />} disabled={isLocked} />
            <span className="font-mono text-sm text-muted-foreground">HR</span>
            <ControlBtn onClick={() => onAdjust('hour', -1)} icon={<ChevronDown className="w-4 h-4" />} disabled={isLocked} />
          </div>

          {/* Minutes Control */}
          <div className="flex flex-col items-center gap-2">
            <ControlBtn onClick={() => onAdjust('minute', 1)} icon={<ChevronUp className="w-4 h-4" />} disabled={isLocked} />
            <span className="font-mono text-sm text-muted-foreground">MIN</span>
            <ControlBtn onClick={() => onAdjust('minute', -1)} icon={<ChevronDown className="w-4 h-4" />} disabled={isLocked} />
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          disabled={isLocked}
          className="mt-2 text-xs text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-0"
        >
          <RotateCcw className="w-3 h-3 mr-2" />
          Sync
        </Button>
      </div>
    </motion.div>
  );
}

function ControlBtn({ onClick, icon, disabled }: { onClick: () => void, icon: React.ReactNode, disabled?: boolean }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-full border-white/20 bg-transparent hover:bg-white/10 hover:border-white/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon}
    </Button>
  );
}
