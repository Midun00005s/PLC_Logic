import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'white-brown',
    name: 'Mocha & Pure White',
    tagline: 'White Background & Espresso Brown Navbar',
    category: 'light',
    icon: 'Coffee',
    colors: {
      bg: '#ffffff',
      surface: '#ffffff',
      accent: '#15803d',
      cyan: '#b45309',
      navbar: '#3c2415',
      text: '#1c1917'
    },
    description: 'Crisp pure white background with an elegant espresso brown navigation bar and sharp industrial contrast.'
  },
  {
    id: 'cyber-obsidian',
    name: 'Cyber Obsidian',
    tagline: 'Cyberpunk Dark & Neon Green',
    category: 'dark',
    icon: 'Zap',
    colors: {
      bg: '#07090e',
      surface: '#0d121d',
      accent: '#00ff88',
      cyan: '#06b6d4',
      text: '#f8fafc'
    },
    description: 'High-contrast dark obsidian with glowing neon emerald conductors and cyan telemetry.'
  },
  {
    id: 'blueprint-cad',
    name: 'Blueprint CAD',
    tagline: 'Engineering Schematic Blue',
    category: 'dark',
    icon: 'Compass',
    colors: {
      bg: '#06152b',
      surface: '#0a1f3d',
      accent: '#38bdf8',
      cyan: '#7dd3fc',
      text: '#f0f9ff'
    },
    description: 'Authentic AutoCAD / EPLAN electrical schematic blueprint with precision technical drafting lines.'
  },
  {
    id: 'industrial-amber',
    name: 'Industrial SCADA',
    tagline: 'Factory Steel & Caution Amber',
    category: 'dark',
    icon: 'Cpu',
    colors: {
      bg: '#121316',
      surface: '#181a1f',
      accent: '#f59e0b',
      cyan: '#fbbf24',
      text: '#fef3c7'
    },
    description: 'Heavy machinery control room aesthetics with graphite steel and warm tungsten amber glow.'
  },
  {
    id: 'matrix-terminal',
    name: 'Matrix CRT',
    tagline: 'Phosphor Green Terminal',
    category: 'dark',
    icon: 'Terminal',
    colors: {
      bg: '#030a05',
      surface: '#07140a',
      accent: '#00ff66',
      cyan: '#10b981',
      text: '#ecfdf5'
    },
    description: 'Retro UNIX command terminal with luminous phosphor green and diagnostic scanlines.'
  },
  {
    id: 'synthwave-nebula',
    name: 'Synthwave Nebula',
    tagline: 'Cosmic Violet & Magenta Laser',
    category: 'dark',
    icon: 'Sparkles',
    colors: {
      bg: '#090614',
      surface: '#110d24',
      accent: '#f43f5e',
      cyan: '#c084fc',
      text: '#faf5ff'
    },
    description: 'Deep cosmic amethyst space with neon laser lines and synthwave industrial aesthetics.'
  },
  {
    id: 'cleanroom-light',
    name: 'Cleanroom Studio',
    tagline: 'Precision Daylight & Slate',
    category: 'light',
    icon: 'Sun',
    colors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      accent: '#0284c7',
      cyan: '#0d9488',
      text: '#0f172a'
    },
    description: 'Crisp, high-readability daylight laboratory mode with clean slate panels and vivid cobalt wiring.'
  }
];

export const PATTERNS = [
  { id: 'grid', name: 'Engineering Grid', desc: 'Standard CAD 32px logic grid' },
  { id: 'dots', name: 'Circuit Matrix', desc: 'Digital dot pattern' },
  { id: 'blueprint', name: 'Blueprint Cross', desc: 'Dual-axis millimeter drafting grid' },
  { id: 'mesh', name: 'Industrial Mesh', desc: 'SCADA panel woven mesh' },
  { id: 'clean', name: 'Minimal Glow', desc: 'Pure ambient gradient without grid' }
];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('plc_theme');
      // If user specifically requested white background with brown navbar, switch to white-brown
      if (!saved || saved === 'cyber-obsidian') {
        localStorage.setItem('plc_theme', 'white-brown');
        return 'white-brown';
      }
      return saved;
    } catch {
      return 'white-brown';
    }
  });

  const [pattern, setPattern] = useState(() => {
    try {
      return localStorage.getItem('plc_bg_pattern') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const [glowEnabled, setGlowEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('plc_bg_glow');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Apply attributes to document and root whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-pattern', pattern);
    root.setAttribute('data-glow', glowEnabled ? 'true' : 'false');

    try {
      localStorage.setItem('plc_theme', theme);
      localStorage.setItem('plc_bg_pattern', pattern);
      localStorage.setItem('plc_bg_glow', glowEnabled ? 'true' : 'false');
    } catch {}
  }, [theme, pattern, glowEnabled]);

  const activeThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex].id);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      activeThemeObj,
      themes: THEMES,
      pattern,
      setPattern,
      patterns: PATTERNS,
      glowEnabled,
      setGlowEnabled,
      cycleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
