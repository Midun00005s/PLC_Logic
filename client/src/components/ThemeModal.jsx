import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  X, Check, Sparkles, Sliders, Palette, Zap, 
  Compass, Cpu, Terminal, Sun, Grid, Dot, Layers, Coffee, Moon
} from 'lucide-react';

export default function ThemeModal({ isOpen, onClose }) {
  const { 
    theme, 
    setTheme, 
    themes, 
    pattern, 
    setPattern, 
    patterns, 
    glowEnabled, 
    setGlowEnabled 
  } = useTheme();

  if (!isOpen) return null;

  const getThemeIcon = (iconName) => {
    switch (iconName) {
      case 'Moon': return <Moon size={18} />;
      case 'Coffee': return <Coffee size={18} />;
      case 'Zap': return <Zap size={18} />;
      case 'Compass': return <Compass size={18} />;
      case 'Cpu': return <Cpu size={18} />;
      case 'Terminal': return <Terminal size={18} />;
      case 'Sparkles': return <Sparkles size={18} />;
      case 'Sun': return <Sun size={18} />;
      default: return <Palette size={18} />;
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        zIndex: 999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="modal-card theme-selector-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          className="modal-header"
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Palette size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: 0 }}>
                UI Theme & Background Workbench
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Select an authentic industrial atmosphere and customized CAD background texture
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            title="Close theme settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Section: Themes */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '14px' 
            }}>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={14} color="var(--text-primary)" /> 
                Preset Environments ({themes.length})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Live reactive preview enabled
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px'
            }}>
              {themes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="theme-card-option"
                    style={{
                      background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      border: isSelected 
                        ? `2px solid var(--border-focus)` 
                        : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Top Row: Icon, Title & Active Check */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          color: t.colors.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: `${t.colors.accent}18`
                        }}>
                          {getThemeIcon(t.icon)}
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '700', 
                            color: 'var(--text-primary)',
                            lineHeight: 1.2
                          }}>
                            {t.name}
                          </div>
                          <span style={{ 
                            fontSize: '9.5px', 
                            fontFamily: 'var(--font-mono)',
                            textTransform: 'uppercase',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)'
                          }}>
                            {t.category}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{
                          background: 'var(--text-primary)',
                          color: 'var(--bg-primary)',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <p style={{ 
                      fontSize: '11.5px', 
                      color: 'var(--text-secondary)', 
                      margin: 0, 
                      lineHeight: 1.4,
                      minHeight: '32px'
                    }}>
                      {t.description}
                    </p>

                    {/* Color Swatches Preview */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: 'var(--bg-surface)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: 'auto', fontFamily: 'var(--font-mono)' }}>
                        PALETTE
                      </span>
                      {t.colors.navbar && (
                        <span 
                          title={`Navbar: ${t.colors.navbar}`}
                          style={{ width: '14px', height: '14px', borderRadius: '50%', background: t.colors.navbar, border: '1px solid #777' }} 
                        />
                      )}
                      <span 
                        title={`Base: ${t.colors.bg}`}
                        style={{ width: '14px', height: '14px', borderRadius: '50%', background: t.colors.bg, border: '1px solid #888' }} 
                      />
                      <span 
                        title={`Surface: ${t.colors.surface}`}
                        style={{ width: '14px', height: '14px', borderRadius: '50%', background: t.colors.surface, border: '1px solid #888' }} 
                      />
                      <span 
                        title={`Signal: ${t.colors.accent}`}
                        style={{ width: '14px', height: '14px', borderRadius: '50%', background: t.colors.accent, boxShadow: `0 0 6px ${t.colors.accent}` }} 
                      />
                      <span 
                        title={`Telemetry: ${t.colors.cyan}`}
                        style={{ width: '14px', height: '14px', borderRadius: '50%', background: t.colors.cyan }} 
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Background Pattern Texture */}
          <div style={{ 
            borderTop: '1px solid var(--border-subtle)', 
            paddingTop: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Grid size={14} color="var(--text-primary)" /> 
              Background Blueprint / Grid Texture
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px'
            }}>
              {patterns.map((p) => {
                const isSelected = pattern === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPattern(p.id)}
                    className="btn-secondary"
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px',
                      borderRadius: 'var(--radius-md)',
                      borderColor: isSelected ? 'var(--border-focus)' : 'var(--border-muted)',
                      background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '600' }}>{p.name}</span>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Ambient Lighting Glow */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Ambient Atmospheric Lighting
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Soft pulsing radial gradient lighting behind panels for depth
              </div>
            </div>

            <button
              onClick={() => setGlowEnabled(!glowEnabled)}
              className="btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                borderColor: glowEnabled ? 'var(--plc-cyan)' : 'var(--border-muted)',
                color: glowEnabled ? 'var(--plc-cyan)' : 'var(--text-muted)',
                background: glowEnabled ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-card)'
              }}
            >
              {glowEnabled ? 'GLOW: ON' : 'GLOW: OFF'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="modal-footer"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            THEME: {theme.toUpperCase()} • SAVED TO LOCALSTORAGE
          </div>

          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '7px 20px', fontSize: '13px' }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
