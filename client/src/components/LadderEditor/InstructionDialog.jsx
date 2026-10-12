import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Cpu, Clock, Hash, Tag, Zap, AlertCircle } from 'lucide-react';

export default function InstructionDialog({
  isOpen,
  onClose,
  element,
  rIdx,
  elIdx,
  bIdx = null,
  subIdx = null,
  onSave,
  onDelete,
  allAddresses = [],
  plcState = null
}) {
  if (!isOpen || !element) return null;

  const [type, setType] = useState(element.type || 'NO');
  const [address, setAddress] = useState(element.address || 'X0');
  const [customTag, setCustomTag] = useState(element.tag || '');
  const [preset, setPreset] = useState(element.preset || (element.type === 'CTU' ? 5 : 3000));
  const [timeBase, setTimeBase] = useState('10ms'); // standard IEC time base

  useEffect(() => {
    if (element) {
      setType(element.type || 'NO');
      setAddress(element.address || 'X0');
      setCustomTag(element.tag || '');
      setPreset(element.preset || (element.type === 'CTU' ? 5 : 3000));
    }
  }, [element]);

  // Determine current live value of this address
  const getLiveValue = (addr) => {
    if (!plcState) return false;
    if (addr.startsWith('X')) return Boolean(plcState.inputs?.[addr]);
    if (addr.startsWith('Y')) return Boolean(plcState.outputs?.[addr]);
    if (addr.startsWith('M')) return Boolean(plcState.memory?.[addr]);
    if (addr.startsWith('T')) return Boolean(plcState.timers?.[addr]?.done);
    if (addr.startsWith('C')) return Boolean(plcState.counters?.[addr]?.done);
    return false;
  };

  const isLiveHigh = getLiveValue(address);

  // Address suggestions based on instruction type
  const filteredAddresses = allAddresses.filter(a => {
    if (type === 'TON') return a.address.startsWith('T');
    if (type === 'CTU') return a.address.startsWith('C');
    if (type === 'COIL' || type === 'SET') return a.address.startsWith('Y') || a.address.startsWith('M');
    if (type === 'RESET') return a.address.startsWith('Y') || a.address.startsWith('M') || a.address.startsWith('C');
    // Contacts can read anything (inputs, outputs, bits, timer flags, counter flags)
    return true;
  });

  const handleApply = () => {
    const updates = {
      type,
      address,
      tag: customTag
    };
    if (type === 'TON' || type === 'CTU') {
      updates.preset = Number(preset) || (type === 'CTU' ? 5 : 1000);
    }
    onSave(updates);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-muted)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '460px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Dialog Header */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="var(--plc-cyan)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '14.5px', color: 'var(--text-primary)' }}>
              Instruction Configuration
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: '4px' }}
            title="Close dialog (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dialog Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Instruction Type */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Instruction Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newT = e.target.value;
                setType(newT);
                if (newT === 'TON' && !address.startsWith('T')) setAddress('T0');
                if (newT === 'CTU' && !address.startsWith('C')) setAddress('C0');
                if ((newT === 'COIL' || newT === 'SET') && !address.startsWith('Y') && !address.startsWith('M')) setAddress('Y0');
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '600',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <optgroup label="Contacts (Inputs / Conditions)">
                <option value="NO">-[ ]- Normally Open Contact (NO)</option>
                <option value="NC">-[/]- Normally Closed Contact (NC)</option>
              </optgroup>
              <optgroup label="Coils (Outputs / Actions)">
                <option value="COIL">-( )- Output Energize Coil</option>
                <option value="SET">-(L)- Set (Latch Bit) Coil</option>
                <option value="RESET">-(U)- Reset (Unlatch Bit / Counter) Coil</option>
              </optgroup>
              <optgroup label="Timers & Counters">
                <option value="TON">[TON] Timer On-Delay (IEC 61131-3)</option>
                <option value="CTU">[CTU] Up Counter (Rising Edge)</option>
              </optgroup>
            </select>
          </div>

          {/* PLC Address */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                PLC Address (Word / Bit)
              </label>
              <span style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono)',
                color: isLiveHigh ? 'var(--live-wire)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isLiveHigh ? 'var(--live-wire)' : '#64748b'
                }} />
                {isLiveHigh ? 'LIVE: TRUE (1)' : 'LIVE: FALSE (0)'}
              </span>
            </div>

            <select
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {filteredAddresses.map(a => (
                <option key={a.address} value={a.address} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  {a.address} • {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Symbol / Tag Alias */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
              <Tag size={12} />
              Symbol / Tag Description
            </label>
            <input
              type="text"
              value={customTag}
              placeholder="e.g. START_PB, PUMP_MOTOR, LATCH_AUX"
              onChange={(e) => setCustomTag(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)'
              }}
            />
          </div>

          {/* Timer Specific Settings */}
          {type === 'TON' && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--plc-cyan)' }}>
                <Clock size={14} />
                <span>Timer Parameters (TON)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Preset (ms):</span>
                  <input
                    type="number"
                    min="100"
                    max="60000"
                    step="500"
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Time Base:</span>
                  <select
                    value={timeBase}
                    onChange={(e) => setTimeBase(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-muted)', borderRadius: '4px' }}
                  >
                    <option value="10ms">10 ms (Standard)</option>
                    <option value="100ms">100 ms</option>
                    <option value="1s">1.0 sec</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Counter Specific Settings */}
          {type === 'CTU' && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--plc-cyan)' }}>
                <Hash size={14} />
                <span>Up-Counter Parameters (CTU)</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Preset Count:</span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Dialog Actions Footer */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="btn-danger"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Delete this instruction from rung"
          >
            <Trash2 size={13} /> Delete
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12.5px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '12.5px' }}
            >
              <Check size={14} /> Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
