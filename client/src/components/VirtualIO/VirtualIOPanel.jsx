import React, { useState } from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  AlertOctagon,
  Activity,
  Radio,
  Cpu,
  CheckCircle,
  Shield,
  Layers,
  Zap,
  Sliders,
  Gauge,
  Box,
  Droplets,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export default function VirtualIOPanel({
  inputs,
  setInputs,
  outputs = {},
  timers = {},
  counters = {},
  fault,
  setFault,
  problem,
  plcState = null,
  isScanning,
  setIsScanning,
  onStepScan,
  onResetPlc,
  onCollapse
}) {
  const [activeTab, setActiveTab] = useState('io'); // 'io' | 'twin' | 'faults'

  const activeTimersCount = Object.values(timers).filter(t => t && (t.elapsed > 0 || t.done)).length;
  const activeCountersCount = Object.values(counters).filter(c => c && (c.count > 0 || c.done)).length;
  const hasActiveBlocks = activeTimersCount > 0 || activeCountersCount > 0;
  const [isFunctionBlocksOpen, setIsFunctionBlocksOpen] = useState(hasActiveBlocks);

  // Momentary button press handlers
  const handleMomentaryDown = (address) => {
    setInputs(prev => ({ ...prev, [address]: true }));
  };

  const handleMomentaryUp = (address) => {
    setInputs(prev => ({ ...prev, [address]: false }));
  };

  // Toggle switch handler
  const handleToggleInput = (address) => {
    setInputs(prev => ({ ...prev, [address]: !prev[address] }));
  };

  const problemInputs = problem?.inputs || [
    { address: 'X0', name: 'START', type: 'momentary' },
    { address: 'X1', name: 'STOP', type: 'momentary' }
  ];

  const problemOutputs = problem?.outputs || [
    { address: 'Y0', name: 'MOTOR', color: '#10b981' }
  ];

  const memory = plcState?.memory || {};

  // Detect process twin category
  const title = (problem?.title || '').toLowerCase();
  const category = (problem?.category || '').toLowerCase();
  const tag = (problem?.tag || '').toLowerCase();

  const isTankProcess = tag.includes('water') || tag.includes('pump') || title.includes('pump') || title.includes('tank');
  const isConveyorProcess = tag.includes('factory') || title.includes('conveyor') || category.includes('counters') || title.includes('batch');
  const isStarDeltaProcess = title.includes('star-delta') || title.includes('star delta');
  const isSafetyProcess = category.includes('safety') || tag.includes('safety') || title.includes('guard') || title.includes('emergency');
  const isMotorProcess = !isTankProcess && !isConveyorProcess && !isSafetyProcess;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)'
    }}>
      {/* Top PLC Controller Status Bar */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: isScanning ? '1px solid #10b981' : '1px solid var(--border-muted)',
            borderRadius: '4px',
            padding: '3px 7px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            color: isScanning ? '#10b981' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}>
            <span className={`status-dot ${isScanning ? 'active' : 'inactive'}`} />
            PLC {isScanning ? 'RUN' : 'STOP'}
          </div>

          {fault !== 'NORMAL' && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: '#ef4444',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              <AlertOctagon size={11} />
              {fault}
            </div>
          )}
        </div>

        {/* Scan Controls & Collapse Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="btn-secondary"
            style={{ padding: '4px 7px', fontSize: '11px' }}
            title={isScanning ? 'Pause Scan Loop' : 'Start Continuous Scan'}
            id="btn-plc-toggle-scan"
          >
            {isScanning ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            onClick={onStepScan}
            disabled={isScanning}
            className="btn-secondary"
            style={{ padding: '4px 7px', fontSize: '11px' }}
            title="Execute Single 50ms Scan Step"
            id="btn-plc-step-scan"
          >
            <StepForward size={12} />
          </button>
          <button
            onClick={onResetPlc}
            className="btn-secondary"
            style={{ padding: '4px 7px', fontSize: '11px' }}
            title="Reset PLC Outputs, Timers & Memory"
            id="btn-plc-reset"
          >
            <RotateCcw size={12} />
          </button>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="btn-secondary"
              style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--text-secondary)' }}
              title="Slide & Collapse PLC Run Panel"
              id="btn-collapse-io-panel"
            >
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)'
      }}>
        {[
          { id: 'io', label: 'I/O Hardware', icon: Radio },
          { id: 'twin', label: 'Digital Twin', icon: Activity },
          { id: 'faults', label: 'Fault Injection', icon: AlertOctagon }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 5px',
                fontSize: '11px',
                fontWeight: '600',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: isActive ? '2px solid var(--text-primary)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minWidth: 0
              }}
              title={tab.label}
            >
              <Icon size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Virtual I/O Hardware Rack */}
      {activeTab === 'io' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Module 1: 1769-IQ16 24VDC Digital Inputs */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#18181b',
              color: '#ffffff',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ fontWeight: 'bold' }}>SLOT 1: DIGITAL INPUTS (24VDC)</span>
              <span style={{ fontSize: '10px', color: '#a1a1aa' }}>1769-IQ16</span>
            </div>

            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {problemInputs.map(inp => {
                const isPressed = Boolean(inputs[inp.address]);
                const isMomentary = inp.type === 'momentary';
                const rackAddress = `I:0.${inp.address.replace('X', '')}`;

                return (
                  <div
                    key={inp.address}
                    style={{
                      background: 'var(--bg-surface)',
                      border: isPressed ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                      borderRadius: '5px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: isPressed ? '#10b981' : '#ef4444',
                        boxShadow: isPressed ? '0 0 6px #10b981' : 'none'
                      }} />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '12px', color: isPressed ? '#10b981' : '#38bdf8' }}>
                            {rackAddress}
                          </span>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'var(--bg-card)', padding: '1px 4px', borderRadius: '3px' }}>
                            [{inp.address}]
                          </span>
                          <span style={{ fontSize: '11.5px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {inp.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                          {isPressed ? '🟢 HIGH (24VDC)' : '⚪ LOW (0VDC)'}
                        </div>
                      </div>
                    </div>

                    {isMomentary ? (
                      <button
                        onMouseDown={() => handleMomentaryDown(inp.address)}
                        onMouseUp={() => handleMomentaryUp(inp.address)}
                        onMouseLeave={() => handleMomentaryUp(inp.address)}
                        onTouchStart={() => handleMomentaryDown(inp.address)}
                        onTouchEnd={() => handleMomentaryUp(inp.address)}
                        style={{
                          background: isPressed ? '#10b981' : 'var(--bg-card)',
                          color: isPressed ? '#000000' : 'var(--text-primary)',
                          border: isPressed ? '1px solid #10b981' : '1px solid var(--border-muted)',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        {isPressed ? 'PRESSED' : 'PUSH'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleInput(inp.address)}
                        style={{
                          background: isPressed ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                          color: isPressed ? '#10b981' : 'var(--text-muted)',
                          border: isPressed ? '1px solid #10b981' : '1px solid var(--border-muted)',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer'
                        }}
                      >
                        {isPressed ? 'ON' : 'OFF'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module 2: 1769-OW8 Digital Relay Outputs */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#18181b',
              color: '#ffffff',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ fontWeight: 'bold' }}>SLOT 2: DIGITAL OUTPUTS (RELAY)</span>
              <span style={{ fontSize: '10px', color: '#a1a1aa' }}>1769-OW8</span>
            </div>

            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {problemOutputs.map(out => {
                const isEnergized = Boolean(outputs[out.address]);
                const rackAddress = `O:0.${out.address.replace('Y', '')}`;

                return (
                  <div
                    key={out.address}
                    style={{
                      background: 'var(--bg-surface)',
                      border: isEnergized ? '1.5px solid #38bdf8' : '1px solid var(--border-subtle)',
                      borderRadius: '5px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: isEnergized ? (out.color || '#38bdf8') : '#334155',
                        boxShadow: isEnergized ? `0 0 8px ${out.color || '#38bdf8'}` : 'none'
                      }} />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '12px', color: isEnergized ? '#38bdf8' : 'var(--text-secondary)' }}>
                            {rackAddress}
                          </span>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'var(--bg-card)', padding: '1px 4px', borderRadius: '3px' }}>
                            [{out.address}]
                          </span>
                          <span style={{ fontSize: '11.5px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {out.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                          {isEnergized ? '🟢 COIL ENERGIZED' : '⚪ DE-ENERGIZED'}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: isEnergized ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                      color: isEnergized ? '#38bdf8' : 'var(--text-dim)',
                      border: isEnergized ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)'
                    }}>
                      {isEnergized ? 'CLOSED' : 'OPEN'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module 3: Internal Relays M0..M7 Monitoring */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#18181b',
              color: '#ffffff',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ fontWeight: 'bold' }}>INTERNAL MEMORY BITS (M0..M7)</span>
              <span style={{ fontSize: '10px', color: '#a1a1aa' }}>B3 FILE</span>
            </div>

            <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'].map(mKey => {
                const isSet = Boolean(memory[mKey]);
                return (
                  <div
                    key={mKey}
                    style={{
                      padding: '5px 2px',
                      minHeight: '44px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSet ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                      border: isSet ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      lineHeight: 1.2
                    }}
                  >
                    <span style={{ color: isSet ? '#10b981' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                      {mKey}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: isSet ? '#10b981' : 'var(--text-dim)', marginTop: '2px' }}>
                      {isSet ? '1' : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Function Blocks: Timers & Counters Telemetry */}
          {(Object.keys(timers).length > 0 || Object.keys(counters).length > 0) && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-muted)',
              borderRadius: '6px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <button
                onClick={() => setIsFunctionBlocksOpen(!isFunctionBlocksOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  width: '100%',
                  color: 'inherit'
                }}
              >
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>FUNCTION BLOCKS (TIMERS & COUNTERS)</span>
                  {hasActiveBlocks && (
                    <span style={{ fontSize: '9.5px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '1px 5px', borderRadius: '3px' }}>
                      ACTIVE
                    </span>
                  )}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {isFunctionBlocksOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
              </button>

              {isFunctionBlocksOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {Object.entries(timers).map(([tKey, tVal]) => {
                    const percent = Math.min(100, Math.round((tVal.elapsed / tVal.preset) * 100));
                    return (
                      <div key={tKey} style={{ background: 'var(--bg-surface)', padding: '8px', borderRadius: '4px', border: tVal.done ? '1px solid #10b981' : '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: tVal.done ? '#10b981' : '#f59e0b' }}>
                            {tKey} (TON On-Delay) {tVal.done && '• DONE'}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                            {(tVal.elapsed / 1000).toFixed(1)}s / {(tVal.preset / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: tVal.done ? '#10b981' : '#f59e0b' }} />
                        </div>
                      </div>
                    );
                  })}

                  {Object.entries(counters).map(([cKey, cVal]) => {
                    const percent = Math.min(100, Math.round((cVal.count / cVal.preset) * 100));
                    return (
                      <div key={cKey} style={{ background: 'var(--bg-surface)', padding: '8px', borderRadius: '4px', border: cVal.done ? '1px solid #10b981' : '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: cVal.done ? '#10b981' : '#38bdf8' }}>
                            {cKey} (CTU Up-Counter) {cVal.done && '• DONE'}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                            Count: {cVal.count} / {cVal.preset}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: cVal.done ? '#10b981' : '#38bdf8' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dynamic Digital Twin Simulation Scenery */}
      {activeTab === 'twin' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Tank Level Control / Pump Twin */}
          {isTankProcess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplets size={14} color="#38bdf8" /> Water Reservoir & Pump Station
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: outputs.Y0 ? '#10b981' : 'var(--text-dim)'
                  }}>
                    {outputs.Y0 ? 'PUMP RUNNING' : 'PUMP IDLE'}
                  </span>
                </div>

                {/* Tank Graphic */}
                <div style={{
                  height: '140px',
                  border: '2px solid #52525b',
                  borderRadius: '4px',
                  background: '#09090b',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end'
                }}>
                  {/* High Level Marker (X1) */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '8px',
                    right: '8px',
                    borderTop: '1px dashed #71717a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: inputs.X1 ? '#10b981' : '#71717a'
                  }}>
                    <span>HIGH FLOAT (X1)</span>
                    <span>{inputs.X1 ? '● HIGH' : '○ OPEN'}</span>
                  </div>

                  {/* Low Level Marker (X0) */}
                  <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '8px',
                    right: '8px',
                    borderTop: '1px dashed #71717a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: inputs.X0 ? '#10b981' : '#71717a'
                  }}>
                    <span>LOW FLOAT (X0)</span>
                    <span>{inputs.X0 ? '● HIGH' : '○ OPEN'}</span>
                  </div>

                  {/* Animated Water Body */}
                  <div style={{
                    height: inputs.X1 ? '85%' : inputs.X0 ? '50%' : '15%',
                    background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.7) 0%, rgba(14, 165, 233, 0.9) 100%)',
                    transition: 'height 0.4s ease',
                    position: 'relative'
                  }}>
                    {outputs.Y0 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: '#ffffff',
                        opacity: 0.6
                      }} />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                  <div style={{
                    padding: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Pump Motor (Y0)</span>
                    <strong style={{ color: outputs.Y0 ? '#10b981' : 'var(--text-muted)' }}>
                      {outputs.Y0 ? 'ENERGIZED' : 'OFF'}
                    </strong>
                  </div>
                  <div style={{
                    padding: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Full Indicator (Y1)</span>
                    <strong style={{ color: outputs.Y1 ? '#38bdf8' : 'var(--text-muted)' }}>
                      {outputs.Y1 ? 'ILLUMINATED' : 'OFF'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conveyor Belt Twin */}
          {isConveyorProcess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Box size={14} color="#f59e0b" /> Part Sorter & Batch Conveyor
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: outputs.Y0 ? '#10b981' : 'var(--text-dim)'
                  }}>
                    {outputs.Y0 ? 'BELT MOVING' : 'BELT STOPPED'}
                  </span>
                </div>

                {/* Conveyor Track */}
                <div style={{
                  height: '80px',
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px'
                }}>
                  {/* Moving Rollers */}
                  <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: 0,
                    right: 0,
                    height: '8px',
                    background: outputs.Y0 ? 'repeating-linear-gradient(90deg, #71717a 0, #71717a 10px, #27272a 10px, #27272a 20px)' : '#3f3f46'
                  }} />

                  {/* Optical Sensor Beam (X1) */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '50%',
                    width: '2px',
                    background: inputs.X1 ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
                    boxShadow: inputs.X1 ? '0 0 8px #ef4444' : 'none'
                  }} />

                  {/* Diverter Gate Arm (Y1) */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '30px',
                    width: '6px',
                    height: '50px',
                    background: outputs.Y1 ? '#f59e0b' : '#52525b',
                    transform: outputs.Y1 ? 'rotate(45deg)' : 'rotate(0deg)',
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease',
                    boxShadow: outputs.Y1 ? '0 0 8px #f59e0b' : 'none'
                  }} />

                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    PE1 Sensor Beam: {inputs.X1 ? 'PART DETECTED' : 'CLEAR'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '10px' }}>
                  <div style={{ padding: '6px', background: 'var(--bg-surface)', borderRadius: '4px', textAlign: 'center', fontSize: '10.5px' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Drive (Y0)</span>
                    <strong style={{ color: outputs.Y0 ? '#10b981' : 'var(--text-muted)' }}>{outputs.Y0 ? 'ON' : 'OFF'}</strong>
                  </div>
                  <div style={{ padding: '6px', background: 'var(--bg-surface)', borderRadius: '4px', textAlign: 'center', fontSize: '10.5px' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Divert (Y1)</span>
                    <strong style={{ color: outputs.Y1 ? '#f59e0b' : 'var(--text-muted)' }}>{outputs.Y1 ? 'DIVERT' : 'STRAIGHT'}</strong>
                  </div>
                  <div style={{ padding: '6px', background: 'var(--bg-surface)', borderRadius: '4px', textAlign: 'center', fontSize: '10.5px' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Buzzer (Y2)</span>
                    <strong style={{ color: outputs.Y2 ? '#ef4444' : 'var(--text-muted)' }}>{outputs.Y2 ? 'ALARM' : 'OFF'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Safety Interlock Twin */}
          {isSafetyProcess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} color="#10b981" /> ISO 13849 Safety Guard Circuit
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: outputs.Y0 ? '#10b981' : '#ef4444'
                  }}>
                    {outputs.Y0 ? 'SAFETY ARMED' : 'SAFETY TRIPPED'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{
                    padding: '10px',
                    background: inputs.X0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: inputs.X0 ? '1px solid #10b981' : '1px solid #ef4444',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Guard Door (X0)</span>
                    <strong style={{ fontSize: '12px', color: inputs.X0 ? '#10b981' : '#ef4444' }}>
                      {inputs.X0 ? 'CLOSED & LOCKED' : 'OPEN (TRIP)'}
                    </strong>
                  </div>

                  <div style={{
                    padding: '10px',
                    background: inputs.X1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: inputs.X1 ? '1px solid #10b981' : '1px solid #ef4444',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>E-Stop (X1)</span>
                    <strong style={{ fontSize: '12px', color: inputs.X1 ? '#10b981' : '#ef4444' }}>
                      {inputs.X1 ? 'HEALTHY' : 'STRUCK (HALT)'}
                    </strong>
                  </div>
                </div>

                <div style={{
                  marginTop: '10px',
                  padding: '12px',
                  background: outputs.Y1 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface)',
                  border: outputs.Y1 ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: outputs.Y1 ? '#ef4444' : '#3f3f46',
                      boxShadow: outputs.Y1 ? '0 0 12px #ef4444' : 'none'
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Trip Alarm Beacon (Y1)</span>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: outputs.Y1 ? '#ef4444' : 'var(--text-dim)' }}>
                    {outputs.Y1 ? 'ACTIVE FLASHING' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Motor / Actuator Twin (Standard Industrial Motor or Star-Delta) */}
          {(isMotorProcess || isStarDeltaProcess) && (
            <div style={{
              background: 'var(--bg-card)',
              border: outputs.Y0 ? '1px solid #10b981' : '1px solid var(--border-muted)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} color="#10b981" /> 3-Phase Induction Motor (Y0)
                </span>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: outputs.Y0 ? '#10b981' : 'var(--text-dim)',
                  fontWeight: 'bold'
                }}>
                  {outputs.Y0 ? (outputs.Y2 ? '1750 RPM (DELTA FULL RUN)' : '850 RPM (STAR START)') : '0 RPM (STOPPED)'}
                </span>
              </div>

              {/* Rotor SVG Graphic */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} className={outputs.Y0 ? 'spin-active' : ''}>
                    <circle cx="50" cy="50" r="45" fill="#18181b" stroke={outputs.Y0 ? '#10b981' : '#3f3f46'} strokeWidth="4" />
                    <path d="M50 15 L50 85 M15 50 L85 50 M25 25 L75 75 M25 75 L75 25" stroke={outputs.Y0 ? '#10b981' : '#52525b'} strokeWidth="4" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="14" fill="#09090b" stroke={outputs.Y0 ? '#34d399' : '#3f3f46'} strokeWidth="3" />
                  </svg>
                </div>

                <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {outputs.Y0
                    ? `Running at rated current (12.4A). Shaft rotor generating rated torque.`
                    : `Contactor open. Stator de-energized, mechanical brake engaged.`}
                </div>
              </div>

              {/* Contactors status row */}
              <div style={{ display: 'grid', gridTemplateColumns: problemOutputs.length > 2 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '6px' }}>
                {problemOutputs.map(out => (
                  <div
                    key={out.address}
                    style={{
                      padding: '6px',
                      background: 'var(--bg-surface)',
                      border: outputs[out.address] ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block' }}>{out.name}</span>
                    <strong style={{ fontSize: '11px', color: outputs[out.address] ? '#10b981' : 'var(--text-muted)' }}>
                      {outputs[out.address] ? 'CLOSED' : 'OPEN'}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Industrial Fault Injection Simulation */}
      {activeTab === 'faults' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Simulate abnormal industrial conditions to evaluate logic safety response:
          </div>

          {[
            { id: 'NORMAL', label: 'Normal Operation', desc: 'Field wiring, sensors and actuators operating without fault.' },
            { id: 'EMERGENCY_STOP', label: 'Emergency Stop Tripped', desc: 'E-Stop circuit open; contacts physically forced LOW.' },
            { id: 'MOTOR_OVERLOAD', label: 'Thermal Overload Trip', desc: 'Overload relay bi-metal contacts tripped due to excessive heat.' },
            { id: 'SENSOR_FAILURE', label: 'Sensor Stuck High', desc: 'Proximity or level float switch short-circuited to 24VDC.' },
            { id: 'WIRE_BREAK', label: 'Severed Input Wire', desc: 'Pushbutton control cable broken; sensor permanently at 0VDC.' }
          ].map(fMode => (
            <label
              key={fMode.id}
              style={{
                background: fault === fMode.id ? (fMode.id === 'NORMAL' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)') : 'var(--bg-card)',
                border: fault === fMode.id ? (fMode.id === 'NORMAL' ? '1px solid #10b981' : '1px solid #ef4444') : '1px solid var(--border-muted)',
                borderRadius: '6px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name="faultMode"
                checked={fault === fMode.id}
                onChange={() => setFault(fMode.id)}
                style={{ marginTop: '2px' }}
              />
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: fault === fMode.id ? (fMode.id === 'NORMAL' ? '#10b981' : '#ef4444') : 'var(--text-primary)'
                }}>
                  {fMode.label}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {fMode.desc}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
