import React, { useState } from 'react';
import { Play, Pause, StepForward, RotateCcw, AlertOctagon, Activity, Radio, Cpu, CheckCircle } from 'lucide-react';

export default function VirtualIOPanel({
  inputs,
  setInputs,
  outputs = {},
  timers = {},
  counters = {},
  fault,
  setFault,
  problem,
  isScanning,
  setIsScanning,
  onStepScan,
  onResetPlc
}) {
  const [activeTab, setActiveTab] = useState('io'); // 'io' | 'twin' | 'faults'

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

  // Visual simulation values
  const isMotorOn = Boolean(outputs['Y0']);
  const isLampOn = Boolean(outputs['Y1']);
  const isBuzzerOn = Boolean(outputs['Y2']);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)'
    }}>
      {/* Top PLC Controller Rack Status Bar */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: isScanning ? 'var(--bg-surface)' : 'var(--bg-surface)',
            border: isScanning ? '1px solid var(--border-focus)' : '1px solid var(--border-muted)',
            borderRadius: '6px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            color: isScanning ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}>
            <span className={`status-dot ${isScanning ? 'active' : 'inactive'}`} />
            PLC {isScanning ? 'RUN' : 'STOP'}
          </div>

          {fault !== 'NORMAL' && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: '#ef4444',
              fontWeight: 'bold'
            }}>
              <AlertOctagon size={12} />
              FAULT: {fault}
            </div>
          )}
        </div>

        {/* Scan Cycle Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={isScanning ? 'btn-secondary' : 'btn-primary'}
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
            title={isScanning ? 'Pause PLC scan loop' : 'Start continuous scan'}
            id="btn-toggle-scan"
          >
            {isScanning ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
            {isScanning ? 'Pause' : 'Scan'}
          </button>

          <button
            onClick={onStepScan}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11.5px' }}
            title="Execute a single PLC scan cycle"
            id="btn-single-step"
          >
            <StepForward size={13} />
          </button>

          <button
            onClick={onResetPlc}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11.5px' }}
            title="Reset Virtual PLC state"
            id="btn-reset-plc"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)'
      }}>
        <button
          onClick={() => setActiveTab('io')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '600',
            color: activeTab === 'io' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'io' ? '2px solid var(--text-primary)' : 'none',
            background: activeTab === 'io' ? 'var(--bg-card-hover)' : 'transparent'
          }}
        >
          Virtual I/O Rack
        </button>

        <button
          onClick={() => setActiveTab('twin')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '600',
            color: activeTab === 'twin' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'twin' ? '2px solid var(--text-primary)' : 'none',
            background: activeTab === 'twin' ? 'var(--bg-card-hover)' : 'transparent'
          }}
        >
          Digital Twin View
        </button>

        <button
          onClick={() => setActiveTab('faults')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '600',
            color: activeTab === 'faults' ? '#ef4444' : 'var(--text-muted)',
            borderBottom: activeTab === 'faults' ? '2px solid #ef4444' : 'none',
            background: activeTab === 'faults' ? 'rgba(239, 68, 68, 0.08)' : 'transparent'
          }}
        >
          Fault Simulation
        </button>
      </div>

      {/* Tab 1: Virtual I/O Rack */}
      {activeTab === 'io' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Module 1: 1769-IQ16 Digital 24VDC Sinking/Sourcing Inputs */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
          }}>
            {/* Module Nameplate */}
            <div style={{
              background: 'var(--nav-bg, #2b3547)',
              color: '#ffffff',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ fontWeight: 'bold' }}>SLOT 1: DIGITAL INPUTS (24VDC)</span>
              <span style={{ fontSize: '10px', color: '#93c5fd' }}>1769-IQ16</span>
            </div>

            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {problemInputs.map((inp, idx) => {
                const isPressed = Boolean(inputs[inp.address]);
                const isMomentary = inp.type === 'momentary';
                const rackAddress = `I:0.${inp.address.replace('X', '')}`;

                return (
                  <div
                    key={inp.address}
                    style={{
                      background: 'var(--bg-surface)',
                      border: isPressed ? '1.5px solid #16a34a' : '1px solid var(--border-subtle)',
                      borderRadius: '5px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                    id={`io-input-card-${inp.address}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Industrial Bi-color LED Indicator */}
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: isPressed ? '#16a34a' : '#ef4444',
                        boxShadow: isPressed ? '0 0 8px #16a34a' : '0 0 4px rgba(239, 68, 68, 0.4)',
                        border: '1px solid #1e293b'
                      }} />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '12.5px', color: isPressed ? '#16a34a' : '#0284c7' }}>
                            {rackAddress}
                          </span>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'var(--bg-card)', padding: '1px 4px', borderRadius: '3px' }}>
                            [{inp.address}]
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {inp.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>
                          {isPressed ? '🟢 HIGH (24VDC)' : '🔴 LOW (0VDC)'} • {isMomentary ? 'Momentary PB' : 'Maintained Sw'}
                        </div>
                      </div>
                    </div>

                    {/* Industrial Field Pushbutton Simulation */}
                    {isMomentary ? (
                      <button
                        onMouseDown={() => handleMomentaryDown(inp.address)}
                        onMouseUp={() => handleMomentaryUp(inp.address)}
                        onMouseLeave={() => handleMomentaryUp(inp.address)}
                        onTouchStart={() => handleMomentaryDown(inp.address)}
                        onTouchEnd={() => handleMomentaryUp(inp.address)}
                        onBlur={() => handleMomentaryUp(inp.address)}
                        style={{
                          background: isPressed ? '#15803d' : 'var(--bg-card)',
                          color: isPressed ? '#ffffff' : 'var(--text-primary)',
                          border: isPressed ? '1px solid #22c55e' : '1px solid var(--border-muted)',
                          borderRadius: '4px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          fontFamily: 'var(--font-mono)',
                          boxShadow: isPressed ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        id={`btn-momentary-${inp.address}`}
                      >
                        {isPressed ? 'PRESSED' : 'PUSH'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleInput(inp.address)}
                        style={{
                          background: isPressed ? 'rgba(22, 163, 74, 0.15)' : 'var(--bg-card)',
                          color: isPressed ? '#16a34a' : 'var(--text-muted)',
                          border: isPressed ? '1px solid #16a34a' : '1px solid var(--border-muted)',
                          borderRadius: '4px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer'
                        }}
                        id={`btn-toggle-${inp.address}`}
                      >
                        {isPressed ? 'TOGGLE: ON' : 'TOGGLE: OFF'}
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
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
          }}>
            {/* Module Nameplate */}
            <div style={{
              background: 'var(--nav-bg, #2b3547)',
              color: '#ffffff',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ fontWeight: 'bold' }}>SLOT 2: DIGITAL OUTPUTS (RELAY)</span>
              <span style={{ fontSize: '10px', color: '#93c5fd' }}>1769-OW8</span>
            </div>

            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {problemOutputs.map(out => {
                const isEnergized = Boolean(outputs[out.address]);
                const rackAddress = `O:0.${out.address.replace('Y', '')}`;

                return (
                  <div
                    key={out.address}
                    style={{
                      background: 'var(--bg-surface)',
                      border: isEnergized ? '1.5px solid #0284c7' : '1px solid var(--border-subtle)',
                      borderRadius: '5px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                    id={`io-output-card-${out.address}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Output LED Bezel */}
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: isEnergized ? '#0284c7' : '#475569',
                        boxShadow: isEnergized ? '0 0 10px #0284c7' : 'none',
                        border: '1px solid #1e293b'
                      }} />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '12.5px', color: isEnergized ? '#0284c7' : 'var(--text-primary)' }}>
                            {rackAddress}
                          </span>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'var(--bg-card)', padding: '1px 4px', borderRadius: '3px' }}>
                            [{out.address}]
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {out.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>
                          {isEnergized ? '🟢 COIL CLOSED (ENERGIZED)' : '⚪ CONTACTS OPEN (DE-ENERGIZED)'}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: isEnergized ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                      color: isEnergized ? '#0284c7' : 'var(--text-dim)',
                      border: isEnergized ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)'
                    }}>
                      {isEnergized ? 'CLOSED' : 'OPEN'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* Timers & Counters Live Telemetry */}
          {(Object.keys(timers).length > 0 || Object.keys(counters).length > 0) && (
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                Function Blocks (Timers & Counters)
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Active Timers */}
                {Object.entries(timers).map(([tKey, tVal]) => {
                  const percent = Math.min(100, Math.round((tVal.elapsed / tVal.preset) * 100));

                  return (
                    <div
                      key={tKey}
                      style={{
                        background: 'var(--bg-card)',
                        border: tVal.done ? '1px solid #10b981' : tVal.running ? '1px solid #f59e0b' : '1px solid var(--border-muted)',
                        borderRadius: '8px',
                        padding: '10px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '12px', color: '#f59e0b' }}>
                            {tKey} (TON Timer)
                          </span>
                          {tVal.done && (
                            <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '1px 5px', borderRadius: '4px' }}>
                              DONE
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {(tVal.elapsed / 1000).toFixed(1)}s / {(tVal.preset / 1000).toFixed(1)}s
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: tVal.done ? '#10b981' : '#f59e0b',
                          transition: 'width 0.1s linear'
                        }} />
                      </div>
                    </div>
                  );
                })}

                {/* Active Counters */}
                {Object.entries(counters).map(([cKey, cVal]) => {
                  const percent = Math.min(100, Math.round((cVal.count / cVal.preset) * 100));

                  return (
                    <div
                      key={cKey}
                      style={{
                        background: 'var(--bg-card)',
                        border: cVal.done ? '1px solid #10b981' : '1px solid var(--border-muted)',
                        borderRadius: '8px',
                        padding: '10px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '12px', color: '#38bdf8' }}>
                            {cKey} (CTU Counter)
                          </span>
                          {cVal.done && (
                            <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '1px 5px', borderRadius: '4px' }}>
                              DONE
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Count: {cVal.count} / {cVal.preset}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: cVal.done ? '#10b981' : '#38bdf8',
                          transition: 'width 0.15s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Digital Twin Simulation Scenery */}
      {activeTab === 'twin' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time physical response of factory actuators driven by Virtual PLC outputs:
          </div>

          {/* Motor Animated Visualizer */}
          <div style={{
            background: 'var(--bg-card)',
            border: isMotorOn ? '1px solid #10b981' : '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Spinning Rotor SVG */}
            <div style={{ position: 'relative', width: '64px', height: '64px' }}>
              <svg
                viewBox="0 0 100 100"
                style={{ width: '100%', height: '100%' }}
                className={isMotorOn ? 'spin-active' : ''}
              >
                <circle cx="50" cy="50" r="45" fill="#1e293b" stroke={isMotorOn ? '#10b981' : '#475569'} strokeWidth="4" />
                <path d="M50 15 L50 85 M15 50 L85 50 M25 25 L75 75 M25 75 L75 25" stroke={isMotorOn ? '#00ff88' : '#64748b'} strokeWidth="4" strokeLinecap="round" />
                <circle cx="50" cy="50" r="14" fill="#0f172a" stroke={isMotorOn ? '#34d399' : '#334155'} strokeWidth="3" />
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>3-Phase Induction Motor (Y0)</span>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: isMotorOn ? '#10b981' : 'var(--text-dim)',
                  fontWeight: 'bold'
                }}>
                  {isMotorOn ? '1750 RPM' : '0 RPM (STOPPED)'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {isMotorOn ? 'Running under normal load current (14.2A)' : 'Motor de-energized, shaft stationary'}
              </p>
            </div>
          </div>

          {/* Plant Lamp & Buzzer Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{
              background: isLampOn ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card)',
              border: isLampOn ? '1px solid #06b6d4' : '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isLampOn ? '#06b6d4' : '#1e293b',
                boxShadow: isLampOn ? '0 0 16px #06b6d4' : 'none',
                margin: '0 auto 8px auto'
              }} />
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>RUN LAMP (Y1)</div>
              <div style={{ fontSize: '10.5px', color: isLampOn ? '#38bdf8' : 'var(--text-dim)' }}>
                {isLampOn ? 'ILLUMINATED' : 'OFF'}
              </div>
            </div>

            <div style={{
              background: isBuzzerOn ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
              border: isBuzzerOn ? '1px solid #ef4444' : '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isBuzzerOn ? '#ef4444' : '#1e293b',
                boxShadow: isBuzzerOn ? '0 0 16px #ef4444' : 'none',
                margin: '0 auto 8px auto'
              }} />
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>ALARM BEACON (Y2)</div>
              <div style={{ fontSize: '10.5px', color: isBuzzerOn ? '#f87171' : 'var(--text-dim)' }}>
                {isBuzzerOn ? 'ACTIVE SOUNDING' : 'SILENT'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fault Injection Control */}
      {activeTab === 'faults' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            PS 07 Requirement: Simulate abnormal and fault conditions to validate safety trip response:
          </div>

          {[
            { id: 'NORMAL', label: 'Normal Operation', desc: 'All field sensors and actuators operating without fault.' },
            { id: 'EMERGENCY_STOP', label: 'Emergency Stop Tripped', desc: 'Forces E-Stop contact (X1) OPEN permanently.' },
            { id: 'MOTOR_OVERLOAD', label: 'Motor Thermal Overload', desc: 'Overload relay (X2) trips HIGH due to excessive current.' },
            { id: 'SENSOR_FAILURE', label: 'Sensor Stuck Fault', desc: 'Proximity/level sensor input remains permanently stuck ON.' },
            { id: 'WIRE_BREAK', label: 'Severed Input Wire', desc: 'Pushbutton wire severed; reading remains permanently 0V.' }
          ].map(fMode => (
            <label
              key={fMode.id}
              style={{
                background: fault === fMode.id ? (fMode.id === 'NORMAL' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)') : 'var(--bg-card)',
                border: fault === fMode.id ? (fMode.id === 'NORMAL' ? '1px solid #10b981' : '1px solid #ef4444') : '1px solid var(--border-muted)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name="faultMode"
                checked={fault === fMode.id}
                onChange={() => setFault(fMode.id)}
                style={{ marginTop: '3px' }}
              />
              <div>
                <div style={{
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  color: fault === fMode.id ? (fMode.id === 'NORMAL' ? '#34d399' : '#f87171') : 'var(--text-primary)'
                }}>
                  {fMode.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
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
