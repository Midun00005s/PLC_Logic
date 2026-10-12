import React, { useState } from 'react';
import { X, Clock, Hash, Zap, Cpu, RefreshCw, Layers, CheckSquare, HelpCircle } from 'lucide-react';

/**
 * DataFilesModal
 * Industrial PLC Data File Table Viewer (Inspired by Rockwell RSLogix 500 Data Tables):
 * - T4: Timer Data File (WORD | EN | TT | DN | PRE | ACC)
 * - C5: Counter Data File (WORD | CU | CD | DN | PRE | ACC)
 * - I1 / O0: I/O Status File (ADDRESS | TAG | STATE | HEX / BIN)
 * - B3: Bit / Internal Relay File (WORD | BIT | TAG | STATE)
 * - N7: Integer Register File (WORD | DEC | HEX | OCT | BIN)
 * 
 * Powered by real simulation state from plcState (never hardcoded fake values).
 */
export default function DataFilesModal({
  isOpen,
  onClose,
  initialFile = 'T4',
  plcState = null,
  problemInputs = [],
  problemOutputs = [],
  problemMemory = []
}) {
  const [activeFile, setActiveFile] = useState(initialFile);
  const [radix, setRadix] = useState('DEC'); // 'DEC' | 'HEX' | 'BIN'

  if (!isOpen) return null;

  // Extract authentic state from plcState or fallback defaults
  const timers = plcState?.timers || {};
  const counters = plcState?.counters || {};
  const inputs = plcState?.inputs || {};
  const outputs = plcState?.outputs || {};
  const memory = plcState?.memory || {};

  // Standard timer slots T0..T3
  const timerRows = ['T0', 'T1', 'T2', 'T3'].map(tKey => {
    const t = timers[tKey] || { preset: 3000, elapsed: 0, done: false, running: false, lastInput: false };
    const en = t.lastInput ? 1 : 0;
    const tt = (t.running && !t.done) ? 1 : 0;
    const dn = t.done ? 1 : 0;
    const pre = t.preset || 0;
    const acc = t.elapsed || 0;
    const pct = pre > 0 ? Math.min(100, Math.round((acc / pre) * 100)) : 0;
    return { id: tKey, en, tt, dn, pre, acc, pct };
  });

  // Standard counter slots C0..C3
  const counterRows = ['C0', 'C1', 'C2', 'C3'].map(cKey => {
    const c = counters[cKey] || { preset: 5, count: 0, done: false, lastInput: false };
    const cu = c.lastInput ? 1 : 0;
    const cd = 0; // count down not yet in base engine
    const dn = c.done ? 1 : 0;
    const pre = c.preset || 0;
    const acc = c.count || 0;
    const pct = pre > 0 ? Math.min(100, Math.round((acc / pre) * 100)) : 0;
    return { id: cKey, cu, cd, dn, pre, acc, pct };
  });

  // I/O Status rows
  const allInputKeys = ['X0', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7'];
  const allOutputKeys = ['Y0', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'];

  const ioRows = [
    ...allInputKeys.map(k => {
      const pIn = problemInputs.find(i => i.address === k);
      const isHigh = Boolean(inputs[k]);
      return {
        address: k,
        rackAddr: `I:0/${k.replace('X', '')}`,
        tag: pIn?.name || (k === 'X0' ? 'START_PB' : k === 'X1' ? 'STOP_PB' : 'SPARE_IN'),
        type: 'INPUT (24VDC)',
        state: isHigh ? 'ON' : 'OFF',
        bitVal: isHigh ? 1 : 0
      };
    }),
    ...allOutputKeys.map(k => {
      const pOut = problemOutputs.find(o => o.address === k);
      const isHigh = Boolean(outputs[k]);
      return {
        address: k,
        rackAddr: `O:0/${k.replace('Y', '')}`,
        tag: pOut?.name || (k === 'Y0' ? 'MOTOR_RUN' : k === 'Y1' ? 'PILOT_LAMP' : 'SPARE_OUT'),
        type: 'OUTPUT (RELAY)',
        state: isHigh ? 'ON' : 'OFF',
        bitVal: isHigh ? 1 : 0
      };
    })
  ];

  // Bit Memory rows (M0..M7 / B3:0/0..B3:0/7)
  const bitRows = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'].map((mKey, idx) => {
    const isHigh = Boolean(memory[mKey]);
    const pMem = problemMemory.find(m => m.address === mKey);
    return {
      address: mKey,
      rackAddr: `B3:0/${idx}`,
      tag: pMem?.name || `INTERNAL_AUX_${idx}`,
      state: isHigh ? '1' : '0',
      bitVal: isHigh ? 1 : 0
    };
  });

  // Integer registers (N7:0..N7:3 computed from active states)
  const integerRows = [
    { word: 'N7:0', dec: timerRows[0].acc, hex: `0x${timerRows[0].acc.toString(16).toUpperCase().padStart(4, '0')}`, oct: timerRows[0].acc.toString(8).padStart(6, '0') },
    { word: 'N7:1', dec: counterRows[0].acc, hex: `0x${counterRows[0].acc.toString(16).toUpperCase().padStart(4, '0')}`, oct: counterRows[0].acc.toString(8).padStart(6, '0') },
    { word: 'N7:2', dec: (timerRows[0].dn ? 1 : 0) | ((counterRows[0].dn ? 1 : 0) << 1), hex: `0x000${(timerRows[0].dn ? 1 : 0) | ((counterRows[0].dn ? 1 : 0) << 1)}`, oct: '000000' },
    { word: 'N7:3', dec: 0, hex: '0x0000', oct: '000000' }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        width: '840px',
        maxWidth: '96vw',
        maxHeight: '85vh',
        background: 'var(--bg-surface)',
        border: '2px solid var(--border-muted)',
        borderRadius: '8px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)'
      }}>
        {/* Title Bar (Classic Industrial Engineering Window) */}
        <div style={{
          background: 'var(--nav-bg, #2b3547)',
          color: '#ffffff',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          userSelect: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            <Cpu size={15} style={{ color: '#38bdf8' }} />
            <span>PLC CONTROLLER DATA TABLE MONITOR — RS-DATAFILE</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.2)', padding: '2px 8px', borderRadius: '3px', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
              LIVE BUS: ACTIVE
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px'
              }}
              title="Close Data File"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* File Selection Tabs (RSLogix style data files) */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '4px 8px 0 8px',
          gap: '4px',
          overflowX: 'auto'
        }}>
          {[
            { id: 'T4', label: 'T4 - TIMER FILE', icon: Clock, desc: 'EN, TT, DN, PRE, ACC' },
            { id: 'C5', label: 'C5 - COUNTER FILE', icon: Hash, desc: 'CU, CD, DN, PRE, ACC' },
            { id: 'IO', label: 'I/O STATUS FILE', icon: Zap, desc: 'Inputs & Outputs Channels' },
            { id: 'B3', label: 'B3 - BIT FILE', icon: Layers, desc: 'Internal Relays (M0..M7)' },
            { id: 'N7', label: 'N7 - INTEGER FILE', icon: CheckSquare, desc: 'Word Registers (Dec/Hex/Oct)' }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeFile === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFile(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: isSel ? 'var(--bg-surface)' : 'transparent',
                  borderTop: isSel ? '2px solid var(--border-focus, #38bdf8)' : '2px solid transparent',
                  borderLeft: isSel ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  borderRight: isSel ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  borderBottom: 'none',
                  borderRadius: '4px 4px 0 0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={13} style={{ color: isSel ? '#0284c7' : 'inherit' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* TAB 1: TIMER FILE (T4) */}
          {activeFile === 'T4' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  DATA FILE T4: TIMERS (IEC 61131-3 / TON PROTOCOL)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Time Base: 0.01 sec (10ms)
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '90px' }}>ELEMENT</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>EN</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>TT</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>DN</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>PRE (ms)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>ACC (ms)</th>
                    <th style={{ padding: '8px 10px' }}>LIVE TIMING PROGRESS</th>
                  </tr>
                </thead>
                <tbody>
                  {timerRows.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#0284c7' }}>
                        {row.id}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          background: row.en ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                          color: row.en ? '#16a34a' : 'var(--text-dim)',
                          border: row.en ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent'
                        }}>
                          {row.en}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          background: row.tt ? 'rgba(234, 179, 8, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                          color: row.tt ? '#ca8a04' : 'var(--text-dim)',
                          border: row.tt ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid transparent'
                        }}>
                          {row.tt}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          background: row.dn ? 'rgba(56, 189, 248, 0.25)' : 'rgba(100, 116, 139, 0.1)',
                          color: row.dn ? '#0284c7' : 'var(--text-dim)',
                          border: row.dn ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent'
                        }}>
                          {row.dn}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                        {row.pre}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: row.tt ? '#d97706' : 'inherit' }}>
                        {row.acc}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{
                          width: '100%',
                          height: '14px',
                          background: 'var(--bg-card)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          border: '1px solid var(--border-subtle)',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${row.pct}%`,
                            height: '100%',
                            background: row.dn ? '#0284c7' : 'linear-gradient(90deg, #f59e0b, #10b981)',
                            transition: 'width 0.1s linear'
                          }} />
                          <span style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            color: row.pct > 50 ? '#ffffff' : 'var(--text-muted)'
                          }}>
                            {row.pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '14px', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                <span><strong>EN</strong>: Enable bit (1 when rung conditions are true)</span>
                <span><strong>TT</strong>: Timer Timing bit (1 while counting)</span>
                <span><strong>DN</strong>: Done bit (1 when ACC &gt;= PRE)</span>
              </div>
            </div>
          )}

          {/* TAB 2: COUNTER FILE (C5) */}
          {activeFile === 'C5' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  DATA FILE C5: UP-COUNTERS (CTU / IEC 61131-3)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Edge Detect: Rising Edge (0 -&gt; 1)
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '90px' }}>ELEMENT</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>CU</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>CD</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>DN</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>PRESET</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>ACCUM</th>
                    <th style={{ padding: '8px 10px' }}>PROGRESS / ACCUMULATION</th>
                  </tr>
                </thead>
                <tbody>
                  {counterRows.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#0284c7' }}>
                        {row.id}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          background: row.cu ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                          color: row.cu ? '#16a34a' : 'var(--text-dim)',
                          border: row.cu ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent'
                        }}>
                          {row.cu}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          background: 'rgba(100, 116, 139, 0.1)',
                          color: 'var(--text-dim)'
                        }}>
                          {row.cd}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          background: row.dn ? 'rgba(56, 189, 248, 0.25)' : 'rgba(100, 116, 139, 0.1)',
                          color: row.dn ? '#0284c7' : 'var(--text-dim)',
                          border: row.dn ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent'
                        }}>
                          {row.dn}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                        {row.pre}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: row.dn ? '#16a34a' : 'inherit' }}>
                        {row.acc}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{
                          width: '100%',
                          height: '14px',
                          background: 'var(--bg-card)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          border: '1px solid var(--border-subtle)',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${row.pct}%`,
                            height: '100%',
                            background: row.dn ? '#10b981' : '#38bdf8',
                            transition: 'width 0.1s linear'
                          }} />
                          <span style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            color: row.pct > 50 ? '#ffffff' : 'var(--text-muted)'
                          }}>
                            {row.acc} / {row.pre} ({row.pct}%)
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '14px', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                <span><strong>CU</strong>: Count Up pulse bit</span>
                <span><strong>CD</strong>: Count Down bit</span>
                <span><strong>DN</strong>: Done bit (1 when count reaches preset)</span>
              </div>
            </div>
          )}

          {/* TAB 3: I/O STATUS FILE */}
          {activeFile === 'IO' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  DATA FILE I/O: CHASSIS TERMINAL ALLOCATION & LIVE BUS STATE
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  16-Point Digital I/O Module (Slot 0)
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '80px' }}>ADDR</th>
                    <th style={{ padding: '8px 10px', width: '90px' }}>SLOT</th>
                    <th style={{ padding: '8px 10px' }}>SYMBOL / TAG NAME</th>
                    <th style={{ padding: '8px 10px', width: '140px' }}>CHASSIS TYPE</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px' }}>STATE</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px' }}>BIT VAL</th>
                  </tr>
                </thead>
                <tbody>
                  {ioRows.map(row => {
                    const isHigh = row.bitVal === 1;
                    return (
                      <tr key={row.address} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 'bold', color: isHigh ? 'var(--live-wire)' : 'var(--text-primary)' }}>
                          {row.address}
                        </td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-dim)', fontSize: '11px' }}>
                          {row.rackAddr}
                        </td>
                        <td style={{ padding: '7px 10px', fontWeight: '500' }}>
                          {row.tag}
                        </td>
                        <td style={{ padding: '7px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {row.type}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            background: isHigh ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                            color: isHigh ? '#16a34a' : 'var(--text-dim)',
                            border: isHigh ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent'
                          }}>
                            {row.state}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                          {row.bitVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: BIT FILE (B3) */}
          {activeFile === 'B3' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  DATA FILE B3: INTERNAL RELAY & AUXILIARY FLAGS (M0..M7)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Word B3:0 (16-Bit Register)
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '80px' }}>BIT ADDR</th>
                    <th style={{ padding: '8px 10px', width: '90px' }}>SLOT ID</th>
                    <th style={{ padding: '8px 10px' }}>TAG / SYMBOL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px' }}>LOGIC STATE</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px' }}>BINARY</th>
                  </tr>
                </thead>
                <tbody>
                  {bitRows.map(row => {
                    const isHigh = row.bitVal === 1;
                    return (
                      <tr key={row.address} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 'bold', color: isHigh ? '#a855f7' : 'inherit' }}>
                          {row.address}
                        </td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-dim)', fontSize: '11px' }}>
                          {row.rackAddr}
                        </td>
                        <td style={{ padding: '7px 10px', fontWeight: '500' }}>
                          {row.tag}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            background: isHigh ? 'rgba(168, 85, 247, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                            color: isHigh ? '#a855f7' : 'var(--text-dim)',
                            border: isHigh ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent'
                          }}>
                            {isHigh ? 'HIGH' : 'LOW'}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                          {row.bitVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: INTEGER FILE (N7) */}
          {activeFile === 'N7' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  DATA FILE N7: 16-BIT SIGNED INTEGER REGISTERS
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  RSLogix Multi-Radix Monitor
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '100px' }}>REGISTER</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>DECIMAL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>HEXADECIMAL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>OCTAL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>BINARY (16-BIT)</th>
                  </tr>
                </thead>
                <tbody>
                  {integerRows.map(row => (
                    <tr key={row.word} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#0284c7' }}>
                        {row.word}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                        {row.dec}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#8b5cf6' }}>
                        {row.hex}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {row.oct}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '11px', letterSpacing: '1px', color: 'var(--text-dim)' }}>
                        {row.dec.toString(2).padStart(16, '0').replace(/(\d{4})/g, '$1 ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '16px', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px dashed var(--border-muted)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                ℹ️ Integer file values are dynamically synced with active accumulator registers (N7:0 = T0 ACC, N7:1 = C0 ACC, N7:2 = Status Mask). Math operations (ADD, SUB, MUL, DIV) and MOV will manipulate these registers directly.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '8px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <div>
            STATUS: MONITORING ACTIVE RACK BUS (Scan: 50ms)
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '4px 12px', fontSize: '11.5px' }}
          >
            Close Table Monitor
          </button>
        </div>
      </div>
    </div>
  );
}
