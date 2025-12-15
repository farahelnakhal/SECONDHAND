import React from 'react';
import { motion } from 'framer-motion';
import noiseTexture from '@assets/generated_images/subtle_dark_noise_texture_for_background.png';

interface GlitchOverlayProps {
  intensity: number; // 0 to 1
}

export function GlitchOverlay({ intensity }: GlitchOverlayProps) {
  if (intensity <= 0) return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-overlay"
      style={{ backgroundImage: `url(${noiseTexture})` }}
    />
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Noise Base */}
      <div 
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: `url(${noiseTexture})` }}
      />

      {/* Chromatic Aberration Layers */}
      <motion.div 
        className="absolute inset-0 bg-clock-cyan/5 mix-blend-screen"
        animate={{ 
          x: [-2, 2, -1, 1],
          opacity: [0, intensity * 0.3, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 0.2,
          repeatDelay: Math.random() * 2 
        }}
      />
      
      <motion.div 
        className="absolute inset-0 bg-clock-magenta/5 mix-blend-screen"
        animate={{ 
          x: [2, -2, 1, -1],
          opacity: [0, intensity * 0.3, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 0.23,
          repeatDelay: Math.random() * 2.5 
        }}
      />

      {/* Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />

      {/* Random Glitch Blocks */}
      {intensity > 0.5 && (
        <>
          <motion.div 
            className="absolute top-1/4 left-0 w-full h-1 bg-white/20"
            animate={{ 
              scaleY: [0, 5, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.1,
              repeatDelay: 2 / intensity
            }}
          />
           <motion.div 
            className="absolute bottom-1/3 left-0 w-full h-32 bg-clock-magenta/10 mix-blend-difference"
            animate={{ 
              x: [-100, 100],
              opacity: [0, 0.5, 0]
            }}
            transition={{ 
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 5 / intensity
            }}
          />
        </>
      )}

      {/* Extreme Glitch - "Horrible" Level */}
      {intensity > 1.5 && (
        <motion.div 
          className="absolute inset-0 bg-red-500/10 mix-blend-color-burn"
          animate={{ opacity: [0, 0.2, 0, 0.4, 0] }}
          transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 0.5 }}
        />
      )}
      
      {intensity > 2.0 && (
         <div className="absolute inset-0 backdrop-invert backdrop-opacity-10 pointer-events-none" />
      )}
    </div>
  );
}
