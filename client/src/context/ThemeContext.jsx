import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'monochrome-dark',
    name: 'Monochrome Noir',
    tagline: 'Executive Deep Black & Crisp White',
    category: 'dark',
    icon: 'Moon',
    colors: {
      bg: '#09090b',
      surface: '#121214',
      accent: '#ffffff',
      cyan: '#e4e4e7',
      navbar: '#09090b',
      text: '#ffffff'
    },
    description: 'Executive dark mode with deep obsidian black, crisp silver borders, and high-contrast white conductors.'
  },
  {
    id: 'monochrome-light',
    name: 'Pro Precision White',
    tagline: 'Pure White Canvas & Pitch Black Header',
    category: 'light',
    icon: 'Sun',
    colors: {
      bg: '#ffffff',
      surface: '#ffffff',
      accent: '#10b981',
      cyan: '#111827',
      navbar: '#09090b',
      text: '#111827'
    },
    description: 'Pristine pure white laboratory canvas with a sharp pitch-black header and clean architectural monochrome styling.'
  },
  {
    id: 'monochrome-pure-white',
    name: 'Minimal Pure White',
    tagline: 'All White Canvas & Stark Black Accents',
    category: 'light',
    icon: 'Sparkles',
    colors: {
      bg: '#ffffff',
      surface: '#ffffff',
      accent: '#09090b',
      cyan: '#52525b',
      navbar: '#ffffff',
      text: '#09090b'
    },
    description: 'Ultra-clean Swiss minimalist daylight aesthetic with pure white surfaces, stark black typography, and fine hairline borders.'
  },
  {
    id: 'monochrome-contrast',
    name: 'High-Contrast B&W',
    tagline: 'Stark 100% Vector Wireframe',
    category: 'dark',
    icon: 'Terminal',
    colors: {
      bg: '#000000',
      surface: '#0a0a0a',
      accent: '#ffffff',
      cyan: '#ffffff',
      navbar: '#000000',
      text: '#ffffff'
    },
    description: 'Maximum contrast technical schematic styling with absolute pitch-black and pure white vector geometry.'
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
      if (!saved || saved === 'white-brown' || saved === 'cyber-obsidian') {
        localStorage.setItem('plc_theme', 'monochrome-light');
        return 'monochrome-light';
      }
      return saved;
    } catch {
      return 'monochrome-light';
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
