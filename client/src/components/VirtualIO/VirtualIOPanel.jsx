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
        background: '#070a10',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: isScanning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: isScanning ? '1px solid #10b981' : '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            color: isScanning ? '#10b981' : '#f59e0b'
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
            {isScanning ? <Pause size={13} /> : <Play size={13} />}
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
            color: activeTab === 'io' ? 'var(--plc-cyan)' : 'var(--text-muted)',
            borderBottom: activeTab === 'io' ? '2px solid var(--plc-cyan)' : 'none',
            background: activeTab === 'io' ? 'rgba(6, 182, 212, 0.08)' : 'transparent'
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
            color: activeTab === 'twin' ? 'var(--plc-cyan)' : 'var(--text-muted)',
            borderBottom: activeTab === 'twin' ? '2px solid var(--plc-cyan)' : 'none',
            background: activeTab === 'twin' ? 'rgba(6, 182, 212, 0.08)' : 'transparent'
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
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Digital Inputs Section */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Digital Inputs (DI 24VDC)
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                {problemInputs.length} Configured
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {problemInputs.map(inp => {
                const isPressed = Boolean(inputs[inp.address]);
                const isMomentary = inp.type === 'momentary';

                return (
                  <div
                    key={inp.address}
                    style={{
                      background: 'var(--bg-card)',
                      border: isPressed ? '1px solid #10b981' : '1px solid var(--border-muted)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                    id={`io-input-card-${inp.address}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`status-dot ${isPressed ? 'active' : 'inactive'}`} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '13px', color: isPressed ? '#00ff88' : '#f8fafc' }}>
                            {inp.address}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {inp.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                          {inp.description || (isMomentary ? 'Push-to-hold button' : 'Toggle switch')}
                        </div>
                      </div>
                    </div>

                    {isMomentary ? (
                      <button
                        onMouseDown={() => handleMomentaryDown(inp.address)}
                        onMouseUp={() => handleMomentaryUp(inp.address)}
                        onTouchStart={() => handleMomentaryDown(inp.address)}
                        onTouchEnd={() => handleMomentaryUp(inp.address)}
                        style={{
                          background: isPressed ? '#059669' : '#1e293b',
                          color: isPressed ? '#000' : '#f8fafc',
                          border: isPressed ? '1px solid #34d399' : '1px solid #475569',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '11.5px',
                          fontWeight: 'bold',
                          boxShadow: isPressed ? '0 0 10px rgba(0, 255, 136, 0.4)' : 'none',
                          userSelect: 'none'
                        }}
                        id={`btn-momentary-${inp.address}`}
                      >
                        {isPressed ? 'HELD' : 'PRESS'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleInput(inp.address)}
                        style={{
                          background: isPressed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: isPressed ? '#10b981' : 'var(--text-muted)',
                          border: isPressed ? '1px solid #10b981' : '1px solid #334155',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '11.5px',
                          fontWeight: 'bold'
                        }}
                        id={`btn-toggle-${inp.address}`}
                      >
                        {isPressed ? 'ON' : 'OFF'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Digital Outputs Section */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Digital Outputs (DO Relay)
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                {problemOutputs.length} Configured
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {problemOutputs.map(out => {
                const isEnergized = Boolean(outputs[out.address]);
                const color = out.color || '#38bdf8';

                return (
                  <div
                    key={out.address}
                    style={{
                      background: isEnergized ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-card)',
                      border: isEnergized ? `1px solid ${color}` : '1px solid var(--border-muted)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                    id={`io-output-card-${out.address}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: isEnergized ? color : '#334155',
                        boxShadow: isEnergized ? `0 0 10px ${color}` : 'none',
                        transition: 'all 0.2s ease'
                      }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '13px', color: isEnergized ? color : '#f8fafc' }}>
                            {out.address}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {out.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                          {out.description || 'Actuator Coil'}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: isEnergized ? color : 'var(--text-dim)'
                    }}>
                      {isEnergized ? '🟢 ENERGIZED' : '⚪ OFF'}
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
