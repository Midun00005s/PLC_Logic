import React from 'react';
import { Trash2, ArrowUp, ArrowDown, GitBranch, Plus, Settings, Edit3, Check } from 'lucide-react';

/**
 * LadderRung
 * Professional Industrial PLC Ladder Rung Renderer
 * 
 * Features:
 * - 4-digit standard rung counter (0000, 0001, etc.)
 * - Left Power Rail (L1 +24V) & Right Return Rail (L2/N 0V)
 * - Industrial schematic representations for NO [ ], NC [/], Coil ( ), Latch (L), Unlatch (U), TON, CTU
 * - True parallel branch geometry with drop trunk and join trunk
 * - Live power flow visualization with electric glow animation
 * - Quick double-click / click to edit via InstructionDialog
 */
export default function LadderRung({
  rung,
  rIdx,
  isSelected,
  onSelect,
  isRungEnergized,
  allAddresses = [],
  getAddressState,
  onUpdateElement,
  onDeleteElement,
  onOpenDialog,
  onMoveRung,
  onDeleteRung,
  onInsertRung,
  totalRungs,
  onUpdateComment,
  onAddElementToRung,
  onAddPathToBranch,
  onRemovePathFromBranch,
  onAddContactToBranchLeg,
  onUpdateBranchElement,
  plcState
}) {
  // Format 4-digit rung number (0000, 0001, 0002)
  const rungNumberStr = String(rIdx).padStart(4, '0');

  // Helper to get alias / tag for an address
  const getTagForAddress = (addr, explicitTag) => {
    if (explicitTag) return explicitTag;
    if (!addr) return '';
    const match = allAddresses.find(a => a.address === addr);
    if (match) {
      // If name is like "X0 (Start PB)", extract "Start PB"
      const nameMatch = match.name.match(/\((.*?)\)/);
      return nameMatch ? nameMatch[1] : match.name;
    }
    return '';
  };

  // Helper to check if a contact conducts
  const isContactConducting = (type, address) => {
    const rawVal = getAddressState(address);
    if (type === 'NO') return rawVal === true;
    if (type === 'NC') return rawVal === false;
    return false;
  };

  // Separate inputs/branches from outputs (coils, timers, counters)
  const inputElements = [];
  const outputElements = [];

  (rung.elements || []).forEach((el, idx) => {
    if (['COIL', 'SET', 'RESET', 'TON', 'CTU'].includes(el.type)) {
      outputElements.push({ ...el, originalIdx: idx });
    } else {
      inputElements.push({ ...el, originalIdx: idx });
    }
  });

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: isSelected ? 'var(--bg-card-hover, rgba(56, 189, 248, 0.04))' : 'transparent',
        border: isSelected ? '1px solid var(--border-focus, #38bdf8)' : '1px solid transparent',
        borderRadius: '6px',
        padding: '6px 8px 12px 8px',
        transition: 'all 0.15s ease',
        cursor: 'default'
      }}
      id={`rung-container-${rIdx}`}
    >
      {/* Top Rung Header: Rung Number, Comment & Operations Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2px 8px 6px 8px',
        borderBottom: '1px dotted var(--border-subtle)',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '3px',
            background: isRungEnergized ? 'var(--live-wire-glow, rgba(34, 197, 94, 0.2))' : 'var(--bg-card)',
            color: isRungEnergized ? 'var(--live-wire)' : 'var(--text-muted)',
            border: isRungEnergized ? '1px solid var(--live-wire)' : '1px solid var(--border-muted)',
            letterSpacing: '0.5px'
          }}>
            RUNG {rungNumberStr}
          </span>

          <input
            type="text"
            value={rung.comment || ''}
            placeholder="Add rung comment / documentation (e.g. Pump Auto Latch Cycle)..."
            onChange={(e) => onUpdateComment(rIdx, e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid transparent',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              fontStyle: 'italic',
              padding: '2px 6px',
              width: '320px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderBottom = '1px solid var(--border-focus, #38bdf8)'}
            onBlur={(e) => e.target.style.borderBottom = '1px solid transparent'}
          />
        </div>

        {/* Quick Rung Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onInsertRung(rIdx); }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              padding: '2px 6px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            title="Insert new rung below"
          >
            + Rung Below
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onMoveRung(rIdx, -1); }}
            disabled={rIdx === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: rIdx === 0 ? 'var(--text-dim)' : 'var(--text-secondary)',
              cursor: rIdx === 0 ? 'default' : 'pointer',
              padding: '3px 5px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Move Rung Up"
          >
            <ArrowUp size={13} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onMoveRung(rIdx, 1); }}
            disabled={rIdx === totalRungs - 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: rIdx === totalRungs - 1 ? 'var(--text-dim)' : 'var(--text-secondary)',
              cursor: rIdx === totalRungs - 1 ? 'default' : 'pointer',
              padding: '3px 5px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Move Rung Down"
          >
            <ArrowDown size={13} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDeleteRung(rIdx); }}
            disabled={totalRungs <= 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: totalRungs <= 1 ? 'var(--text-dim)' : '#ef4444',
              cursor: totalRungs <= 1 ? 'default' : 'pointer',
              padding: '3px 5px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Delete this rung"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Rung Schematic Canvas Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '88px',
        position: 'relative',
        padding: '0 16px'
      }}>
        {/* Horizontal Continuous Conductor Wire */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          height: '3px',
          background: isRungEnergized ? 'var(--live-wire)' : 'var(--dead-wire)',
          boxShadow: isRungEnergized ? '0 0 10px var(--live-wire-glow)' : 'none',
          transition: 'all 0.15s ease',
          zIndex: 1
        }} />

        {/* Components Row (Inputs on Left, Outputs on Right) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          zIndex: 2,
          gap: '24px'
        }}>
          {/* Left / Condition Area: Contacts and Branches */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            paddingRight: '12px'
          }}>
            {inputElements.length === 0 ? (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-muted)',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                Direct connection (Always energized)
              </div>
            ) : (
              inputElements.map((el) => {
                const origIdx = el.originalIdx;

                if (el.type === 'BRANCH') {
                  // PARALLEL OR BRANCH SCHEMATIC
                  return (
                    <div
                      key={origIdx}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-muted)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {/* Branch Header Tag & Control */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#0284c7', letterSpacing: '0.5px' }}>
                            [BRANCH OR]
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                            {el.branches?.length || 0} LEGS
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onAddPathToBranch(rIdx, origIdx); }}
                            style={{
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '3px',
                              color: '#0284c7',
                              fontSize: '9.5px',
                              fontFamily: 'var(--font-mono)',
                              padding: '1px 6px',
                              cursor: 'pointer'
                            }}
                            title="Add parallel branch leg"
                          >
                            + Leg
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteElement(rIdx, origIdx); }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0 4px',
                              fontSize: '12px'
                            }}
                            title="Delete branch"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Parallel Branch Legs with Vertical Drop Rail */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative',
                        borderLeft: '3px solid #0284c7',
                        borderRight: '3px solid #0284c7',
                        padding: '4px 10px'
                      }}>
                        {el.branches?.map((branchElements, bIdx) => {
                          const legConducts = branchElements.every(sub => isContactConducting(sub.type, sub.address));

                          return (
                            <div
                              key={bIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                position: 'relative',
                                background: legConducts ? 'var(--live-wire-glow, rgba(34, 197, 94, 0.1))' : 'transparent',
                                borderRadius: '4px',
                                padding: '4px 6px'
                              }}
                            >
                              {/* Horizontal sub-wire */}
                              <div style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: '50%',
                                height: '2px',
                                background: legConducts ? 'var(--live-wire)' : 'var(--dead-wire)',
                                zIndex: 0
                              }} />

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                                {branchElements.map((subEl, subIdx) => {
                                  const conducts = isContactConducting(subEl.type, subEl.address);
                                  const tag = getTagForAddress(subEl.address, subEl.tag);

                                  return (
                                    <div
                                      key={subIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenDialog(subEl, rIdx, origIdx, bIdx, subIdx);
                                      }}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        background: conducts ? 'var(--live-wire-glow, rgba(34, 197, 94, 0.15))' : 'var(--bg-surface)',
                                        border: conducts ? '1.5px solid var(--live-wire)' : '1px solid var(--border-muted)',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        minWidth: '68px',
                                        boxShadow: conducts ? '0 0 8px var(--live-wire-glow)' : 'none',
                                        transition: 'all 0.15s ease'
                                      }}
                                      title="Click to edit contact properties"
                                    >
                                      {/* Address Top */}
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        fontFamily: 'var(--font-mono)',
                                        color: conducts ? 'var(--live-wire)' : '#0284c7'
                                      }}>
                                        {subEl.address}
                                      </span>

                                      {/* Schematic Symbol */}
                                      <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '14px',
                                        fontWeight: '900',
                                        color: conducts ? 'var(--live-wire)' : 'var(--text-primary)',
                                        lineHeight: 1.2
                                      }}>
                                        {subEl.type === 'NO' ? '—[ ]—' : '—[/]—'}
                                      </div>

                                      {/* Tag Alias Bottom */}
                                      <span style={{
                                        fontSize: '9.5px',
                                        color: 'var(--text-muted)',
                                        fontStyle: 'italic',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '75px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {tag || (subEl.type === 'NO' ? 'NO Cont' : 'NC Cont')}
                                      </span>
                                    </div>
                                  );
                                })}

                                <button
                                  onClick={(e) => { e.stopPropagation(); onAddContactToBranchLeg(rIdx, origIdx, bIdx); }}
                                  style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-muted)',
                                    borderRadius: '3px',
                                    color: '#0284c7',
                                    padding: '2px 5px',
                                    fontSize: '9px',
                                    cursor: 'pointer'
                                  }}
                                  title="Add series contact in this leg"
                                >
                                  +
                                </button>

                                {el.branches.length > 1 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onRemovePathFromBranch(rIdx, origIdx, bIdx); }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-dim)',
                                      cursor: 'pointer',
                                      padding: '0 3px',
                                      fontSize: '11px'
                                    }}
                                    title="Remove this leg"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // STANDARD SERIES CONTACT (NO or NC)
                const conducts = isContactConducting(el.type, el.address);
                const tag = getTagForAddress(el.address, el.tag);

                return (
                  <div
                    key={origIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDialog(el, rIdx, origIdx);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: conducts ? 'var(--live-wire-glow, rgba(34, 197, 94, 0.15))' : 'var(--bg-surface)',
                      border: conducts ? '1.5px solid var(--live-wire)' : '1px solid var(--border-muted)',
                      borderRadius: '5px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      minWidth: '80px',
                      position: 'relative',
                      boxShadow: conducts ? '0 0 10px var(--live-wire-glow)' : '0 1px 4px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Click to configure contact (address, symbol tag, type)"
                  >
                    {/* Quick delete on top right */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteElement(rIdx, origIdx); }}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '3px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        lineHeight: 1,
                        padding: '1px 3px'
                      }}
                      title="Remove contact"
                    >
                      ×
                    </button>

                    {/* Address Display (Blue Industrial) */}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      fontFamily: 'var(--font-mono)',
                      color: conducts ? 'var(--live-wire)' : '#0284c7',
                      letterSpacing: '0.3px'
                    }}>
                      {el.address}
                    </span>

                    {/* Schematic Symbol Display */}
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '16px',
                      fontWeight: '900',
                      color: conducts ? 'var(--live-wire)' : 'var(--text-primary)',
                      lineHeight: 1.3
                    }}>
                      {el.type === 'NO' ? '—[ ]—' : '—[/]—'}
                    </div>

                    {/* Tag / Alias Display */}
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      whiteSpace: 'nowrap',
                      maxWidth: '90px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {tag || (el.type === 'NO' ? 'NO Contact' : 'NC Contact')}
                    </span>
                  </div>
                );
              })
            )}

            {/* Insertion button to add contact */}
            <button
              onClick={(e) => { e.stopPropagation(); onAddElementToRung(rIdx, 'NO'); }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-muted)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                padding: '4px 8px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Add Contact to this rung"
            >
              <Plus size={11} /> Contact
            </button>
          </div>

          {/* Right / Actuator Area: Coils, Timers (TON), Counters (CTU) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            paddingLeft: '12px'
          }}>
            {outputElements.map((el) => {
              const origIdx = el.originalIdx;
              const isEnergized = isRungEnergized;
              const tag = getTagForAddress(el.address, el.tag);

              // 1. TON TIMER BLOCK
              if (el.type === 'TON') {
                const tData = plcState?.timers?.[el.address] || { preset: el.preset || 3000, elapsed: 0, done: false, running: false, lastInput: false };
                const isTiming = tData.running && !tData.done;
                const isDone = tData.done;

                return (
                  <div
                    key={origIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDialog(el, rIdx, origIdx);
                    }}
                    style={{
                      background: 'var(--bg-card)',
                      border: isEnergized ? '1.5px solid #0284c7' : '1px solid var(--border-muted)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      minWidth: '150px',
                      cursor: 'pointer',
                      boxShadow: isEnergized ? '0 0 12px rgba(56, 189, 248, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.1)',
                      position: 'relative'
                    }}
                    title="Click to edit timer settings"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteElement(rIdx, origIdx); }}
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '1px 3px'
                      }}
                      title="Remove Timer"
                    >
                      ×
                    </button>

                    {/* Block Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '3px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#d97706' }}>
                        TON
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                        TIMER ON DELAY
                      </span>
                    </div>

                    {/* Specs Table */}
                    <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Timer:</span>
                        <strong style={{ color: '#0284c7' }}>{el.address}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Time Base:</span>
                        <span>0.01</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Preset:</span>
                        <strong>{el.preset || 3000} ms</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Accum:</span>
                        <strong style={{ color: isTiming ? '#d97706' : 'inherit' }}>{tData.elapsed} ms</strong>
                      </div>
                    </div>

                    {/* Status Bit LEDs */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-around',
                      marginTop: '6px',
                      paddingTop: '4px',
                      borderTop: '1px dotted var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: isEnergized ? '#16a34a' : '#64748b',
                          boxShadow: isEnergized ? '0 0 5px #16a34a' : 'none'
                        }} />
                        <span>EN</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: isTiming ? '#d97706' : '#64748b',
                          boxShadow: isTiming ? '0 0 5px #d97706' : 'none'
                        }} />
                        <span>TT</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: isDone ? '#0284c7' : '#64748b',
                          boxShadow: isDone ? '0 0 5px #0284c7' : 'none'
                        }} />
                        <span>DN</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. CTU COUNTER BLOCK
              if (el.type === 'CTU') {
                const cData = plcState?.counters?.[el.address] || { preset: el.preset || 5, count: 0, done: false, lastInput: false };

                return (
                  <div
                    key={origIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDialog(el, rIdx, origIdx);
                    }}
                    style={{
                      background: 'var(--bg-card)',
                      border: isEnergized ? '1.5px solid #0284c7' : '1px solid var(--border-muted)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      minWidth: '140px',
                      cursor: 'pointer',
                      boxShadow: isEnergized ? '0 0 12px rgba(56, 189, 248, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.1)',
                      position: 'relative'
                    }}
                    title="Click to edit counter settings"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteElement(rIdx, origIdx); }}
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '1px 3px'
                      }}
                      title="Remove Counter"
                    >
                      ×
                    </button>

                    {/* Block Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '3px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#0284c7' }}>
                        CTU
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                        COUNT UP
                      </span>
                    </div>

                    {/* Specs Table */}
                    <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Counter:</span>
                        <strong style={{ color: '#0284c7' }}>{el.address}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Preset:</span>
                        <strong>{el.preset || 5}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Accum:</span>
                        <strong style={{ color: cData.done ? '#16a34a' : 'inherit' }}>{cData.count}</strong>
                      </div>
                    </div>

                    {/* Status Bit LEDs */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-around',
                      marginTop: '6px',
                      paddingTop: '4px',
                      borderTop: '1px dotted var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: isEnergized ? '#16a34a' : '#64748b',
                          boxShadow: isEnergized ? '0 0 5px #16a34a' : 'none'
                        }} />
                        <span>CU</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: cData.done ? '#0284c7' : '#64748b',
                          boxShadow: cData.done ? '0 0 5px #0284c7' : 'none'
                        }} />
                        <span>DN</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // 3. STANDARD COIL, LATCH (SET), UNLATCH (RESET)
              const symbolText = el.type === 'COIL' ? '—( )—' : el.type === 'SET' ? '—(L)—' : '—(U)—';
              const typeLabel = el.type === 'COIL' ? 'Output' : el.type === 'SET' ? 'Latch (Set)' : 'Unlatch (Reset)';

              return (
                <div
                  key={origIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDialog(el, rIdx, origIdx);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: isEnergized ? 'rgba(56, 189, 248, 0.18)' : 'var(--bg-surface)',
                    border: isEnergized ? '1.5px solid #0284c7' : '1px solid var(--border-muted)',
                    borderRadius: '5px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    minWidth: '80px',
                    position: 'relative',
                    boxShadow: isEnergized ? '0 0 10px rgba(56, 189, 248, 0.4)' : '0 1px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Click to configure coil (address, symbol tag, type)"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteElement(rIdx, origIdx); }}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '3px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      lineHeight: 1,
                      padding: '1px 3px'
                    }}
                    title="Remove coil"
                  >
                    ×
                  </button>

                  {/* Address Display */}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-mono)',
                    color: isEnergized ? '#0284c7' : 'var(--text-primary)',
                    letterSpacing: '0.3px'
                  }}>
                    {el.address}
                  </span>

                  {/* Schematic Symbol Display */}
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '16px',
                    fontWeight: '900',
                    color: isEnergized ? '#0284c7' : 'var(--text-primary)',
                    lineHeight: 1.3
                  }}>
                    {symbolText}
                  </div>

                  {/* Tag / Alias Display */}
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    whiteSpace: 'nowrap',
                    maxWidth: '85px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {tag || typeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
