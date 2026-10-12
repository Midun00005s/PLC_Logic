import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'pro-monochrome-dark',
    name: 'Pro Studio Black',
    tagline: 'Professional Industrial Black & Crisp White',
    category: 'dark',
    icon: 'Terminal',
    colors: {
      bg: '#09090b',
      surface: '#121215',
      accent: '#22c55e',
      cyan: '#ffffff',
      navbar: '#09090b',
      text: '#fafafa'
    },
    description: 'Ultra-clean, high-contrast engineering dark mode with matte black surfaces, crisp white typography, and industrial signal green.'
  },
  {
    id: 'pro-monochrome-light',
    name: 'Pro Precision White',
    tagline: 'Crisp Daylight White & Solid Matte Black',
    category: 'light',
    icon: 'Sun',
    colors: {
      bg: '#ffffff',
      surface: '#fafafa',
      accent: '#16a34a',
      cyan: '#09090b',
      navbar: '#09090b',
      text: '#09090b'
    },
    description: 'Crisp, high-readability architectural white layout with sharp dark zinc borders and high-contrast drafting lines.'
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
      navbar: '#06152b',
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
      navbar: '#121316',
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
      navbar: '#030a05',
      text: '#ecfdf5'
    },
    description: 'Retro UNIX command terminal with luminous phosphor green and diagnostic scanlines.'
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
      navbar: '#0d121d',
      text: '#f8fafc'
    },
    description: 'High-contrast dark obsidian with glowing neon emerald conductors and cyan telemetry.'
  }
];

export const PATTERNS = [
  { id: 'grid', name: 'Engineering Grid', desc: 'Standard CAD 32px logic grid' },
  { id: 'dots', name: 'Circuit Matrix', desc: 'Digital dot pattern' },
  { id: 'blueprint', name: 'Blueprint Cross', desc: 'Dual-axis millimeter drafting grid' },
  { id: 'mesh', name: 'Industrial Mesh', desc: 'SCADA panel woven mesh' },
  { id: 'clean', name: 'Pure Clean', desc: 'Pure solid workspace without grid' }
];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('plc_theme');
      // Automatically migrate legacy or brown themes to professional black-and-white
      if (!saved || saved === 'white-brown' || saved === 'cyber-obsidian' || saved === 'cleanroom-light' || saved === 'synthwave-nebula') {
        localStorage.setItem('plc_theme', 'pro-monochrome-dark');
        return 'pro-monochrome-dark';
      }
      // If valid theme exists in THEMES list, keep it; otherwise default to pro-monochrome-dark
      const found = THEMES.some(t => t.id === saved);
      if (!found) {
        localStorage.setItem('plc_theme', 'pro-monochrome-dark');
        return 'pro-monochrome-dark';
      }
      return saved;
    } catch {
      return 'pro-monochrome-dark';
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
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
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
