import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function BackgroundEffects() {
  const { theme, pattern, glowEnabled } = useTheme();

  return (
    <div 
      className="theme-background-layer"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        transition: 'background-color 0.4s ease'
      }}
    >
      {/* Ambient Gradient Glows (Pulsing Orbs) */}
      {glowEnabled && (
        <>
          <div 
            className="theme-glow-orb orb-primary"
            style={{
              position: 'absolute',
              top: '-15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80vw',
              height: '50vh',
              background: 'radial-gradient(ellipse at center, var(--bg-glow-1) 0%, transparent 70%)',
              filter: 'blur(50px)',
              opacity: 0.8,
              transition: 'all 0.5s ease'
            }}
          />
          <div 
            className="theme-glow-orb orb-secondary"
            style={{
              position: 'absolute',
              bottom: '-20%',
              right: '-10%',
              width: '55vw',
              height: '55vh',
              background: 'radial-gradient(ellipse at center, var(--bg-glow-2) 0%, transparent 70%)',
              filter: 'blur(60px)',
              opacity: 0.6,
              transition: 'all 0.5s ease'
            }}
          />
          <div 
            className="theme-glow-orb orb-tertiary"
            style={{
              position: 'absolute',
              top: '40%',
              left: '-15%',
              width: '45vw',
              height: '45vh',
              background: 'radial-gradient(ellipse at center, var(--bg-glow-1) 0%, transparent 65%)',
              filter: 'blur(70px)',
              opacity: 0.35,
              transition: 'all 0.5s ease'
            }}
          />
        </>
      )}

      {/* Pattern Overlay */}
      <div 
        className={`theme-pattern-grid pattern-${pattern}`}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 'var(--bg-grid-opacity, 0.75)',
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
}
