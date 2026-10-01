import React, { useState } from 'react';
import { Plus, Trash2, GitBranch, ArrowUp, ArrowDown, RotateCcw, Zap } from 'lucide-react';

const COMPONENT_TYPES = [
  { type: 'NO', label: 'NO Contact', symbol: '—[ ]—', desc: 'Normally Open (Conducts on TRUE)' },
  { type: 'NC', label: 'NC Contact', symbol: '—[/]—', desc: 'Normally Closed (Conducts on FALSE)' },
  { type: 'COIL', label: 'Output Coil', symbol: '—( )—', desc: 'Standard Output Energize' },
  { type: 'SET', label: 'Set (Latch)', symbol: '—(S)—', desc: 'Latches bit TRUE permanently' },
  { type: 'RESET', label: 'Reset (Unlatch)', symbol: '—(R)—', desc: 'Resets bit/counter to 0' },
  { type: 'TON', label: 'Timer On-Delay', symbol: '[TON]', desc: 'Delays output energization' },
  { type: 'CTU', label: 'Up-Counter', symbol: '[CTU]', desc: 'Counts rising edge pulses' }
];

export default function LadderEditor({
  ladder,
  setLadder,
  problemInputs = [],
  problemOutputs = [],
  rungStates = [],
  plcState = null
}) {
  const [selectedRungIdx, setSelectedRungIdx] = useState(0);

  // Available addresses for selection
  const inputAddresses = problemInputs.length > 0 
    ? problemInputs.map(i => ({ address: i.address, name: `${i.address} (${i.name})` }))
    : [
        { address: 'X0', name: 'X0 (Start)' },
        { address: 'X1', name: 'X1 (Stop)' },
        { address: 'X2', name: 'X2 (Sensor)' },
        { address: 'X3', name: 'X3 (Aux)' }
      ];

  const outputAddresses = problemOutputs.length > 0
    ? problemOutputs.map(o => ({ address: o.address, name: `${o.address} (${o.name})` }))
    : [
        { address: 'Y0', name: 'Y0 (Motor)' },
        { address: 'Y1', name: 'Y1 (Lamp)' },
        { address: 'Y2', name: 'Y2 (Buzzer)' }
      ];

  const memoryAddresses = [
    { address: 'M0', name: 'M0 (Aux Flag)' },
    { address: 'M1', name: 'M1 (Aux Flag)' },
    { address: 'M2', name: 'M2 (Aux Flag)' }
  ];

  const timerAddresses = [
    { address: 'T0', name: 'T0 (Timer 0)' },
    { address: 'T1', name: 'T1 (Timer 1)' },
    { address: 'T2', name: 'T2 (Timer 2)' }
  ];

  const counterAddresses = [
    { address: 'C0', name: 'C0 (Counter 0)' },
    { address: 'C1', name: 'C1 (Counter 1)' }
  ];

  const allAddresses = [
    ...inputAddresses,
    ...outputAddresses,
    ...memoryAddresses,
    ...timerAddresses,
    ...counterAddresses
  ];

  // Helper to get live state of an address
  const getAddressState = (addr) => {
    if (!plcState) return false;
    if (addr.startsWith('X')) return Boolean(plcState.inputs?.[addr]);
    if (addr.startsWith('Y')) return Boolean(plcState.outputs?.[addr]);
    if (addr.startsWith('M')) return Boolean(plcState.memory?.[addr]);
    if (addr.startsWith('T')) return Boolean(plcState.timers?.[addr]?.done);
    if (addr.startsWith('C')) return Boolean(plcState.counters?.[addr]?.done);
    return false;
  };

  // Add a new empty rung
  const handleAddRung = () => {
    const newRungs = [
      ...(ladder?.rungs || []),
      {
        id: `rung-${Date.now()}`,
        comment: `Rung ${(ladder?.rungs?.length || 0) + 1}`,
        elements: [
          { type: 'NO', address: inputAddresses[0]?.address || 'X0' },
          { type: 'COIL', address: outputAddresses[0]?.address || 'Y0' }
        ]
      }
    ];
    setLadder({ rungs: newRungs });
    setSelectedRungIdx(newRungs.length - 1);
  };

  // Delete a rung
  const handleDeleteRung = (rIdx, e) => {
    e.stopPropagation();
    if ((ladder?.rungs?.length || 0) <= 1) return;
    const newRungs = ladder.rungs.filter((_, idx) => idx !== rIdx);
    setLadder({ rungs: newRungs });
    setSelectedRungIdx(Math.max(0, rIdx - 1));
  };

  // Move rung up
  const handleMoveRung = (rIdx, direction, e) => {
    e.stopPropagation();
    const newRungs = [...ladder.rungs];
    const targetIdx = rIdx + direction;
    if (targetIdx < 0 || targetIdx >= newRungs.length) return;
    const temp = newRungs[rIdx];
    newRungs[rIdx] = newRungs[targetIdx];
    newRungs[targetIdx] = temp;
    setLadder({ rungs: newRungs });
    setSelectedRungIdx(targetIdx);
  };

  // Add component to currently selected rung
  const handleAddComponent = (type) => {
    if (!ladder?.rungs || ladder.rungs.length === 0) return;
    const rIdx = selectedRungIdx;
    const rung = { ...ladder.rungs[rIdx] };
    const elements = [...(rung.elements || [])];

    let defaultAddress = 'X0';
    if (['COIL', 'SET', 'RESET'].includes(type)) {
      defaultAddress = outputAddresses[0]?.address || 'Y0';
    } else if (type === 'TON') {
      defaultAddress = 'T0';
    } else if (type === 'CTU') {
      defaultAddress = 'C0';
    } else {
      defaultAddress = inputAddresses[0]?.address || 'X0';
    }

    const newElement = {
      type,
      address: defaultAddress,
      ...(type === 'TON' ? { preset: 3000 } : {}),
      ...(type === 'CTU' ? { preset: 5 } : {})
    };

    // If it's an output element (COIL, TON, CTU), place it at the end
    // Otherwise place before the output
    const outIdx = elements.findIndex(el => ['COIL', 'SET', 'RESET', 'TON', 'CTU'].includes(el.type));
    if (outIdx >= 0 && !['COIL', 'SET', 'RESET', 'TON', 'CTU'].includes(type)) {
      elements.splice(outIdx, 0, newElement);
    } else {
      elements.push(newElement);
    }

    rung.elements = elements;
    const newRungs = [...ladder.rungs];
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  // Add a parallel branch to the selected rung (for latching / seal-in)
  const handleAddBranch = () => {
    if (!ladder?.rungs || ladder.rungs.length === 0) return;
    const rIdx = selectedRungIdx;
    const rung = { ...ladder.rungs[rIdx] };
    const elements = [...(rung.elements || [])];

    // Create a parallel branch block
    const branchBlock = {
      type: 'BRANCH',
      branches: [
        [{ type: 'NO', address: inputAddresses[0]?.address || 'X0' }],
        [{ type: 'NO', address: outputAddresses[0]?.address || 'Y0' }]
      ]
    };

    // Insert at beginning of rung
    elements.unshift(branchBlock);
    rung.elements = elements;
    const newRungs = [...ladder.rungs];
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  // Update an element's property
  const handleUpdateElement = (rIdx, elIdx, updates) => {
    const newRungs = [...ladder.rungs];
    const rung = { ...newRungs[rIdx] };
    const elements = [...rung.elements];
    elements[elIdx] = { ...elements[elIdx], ...updates };
    rung.elements = elements;
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  // Delete an element
  const handleDeleteElement = (rIdx, elIdx, e) => {
    e.stopPropagation();
    const newRungs = [...ladder.rungs];
    const rung = { ...newRungs[rIdx] };
    rung.elements = rung.elements.filter((_, idx) => idx !== elIdx);
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  // Update a sub-element inside a branch
  const handleUpdateBranchElement = (rIdx, elIdx, bIdx, subIdx, updates) => {
    const newRungs = [...ladder.rungs];
    const rung = { ...newRungs[rIdx] };
    const elements = [...rung.elements];
    const branchEl = { ...elements[elIdx] };
    const branches = [...branchEl.branches];
    const subPath = [...branches[bIdx]];
    subPath[subIdx] = { ...subPath[subIdx], ...updates };
    branches[bIdx] = subPath;
    branchEl.branches = branches;
    elements[elIdx] = branchEl;
    rung.elements = elements;
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  // Add path to branch
  const handleAddPathToBranch = (rIdx, elIdx, e) => {
    e.stopPropagation();
    const newRungs = [...ladder.rungs];
    const rung = { ...newRungs[rIdx] };
    const elements = [...rung.elements];
    const branchEl = { ...elements[elIdx] };
    branchEl.branches = [
      ...branchEl.branches,
      [{ type: 'NO', address: inputAddresses[1]?.address || 'X1' }]
    ];
    elements[elIdx] = branchEl;
    rung.elements = elements;
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0e17' }}>
      {/* Component Palette Toolbar */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginRight: '6px', textTransform: 'uppercase' }}>
            Palette:
          </span>
          {COMPONENT_TYPES.map(comp => (
            <button
              key={comp.type}
              onClick={() => handleAddComponent(comp.type)}
              className="btn-secondary"
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid #27354f'
              }}
              title={comp.desc}
              id={`palette-btn-${comp.type}`}
            >
              <span style={{ color: comp.type.includes('COIL') || comp.type === 'SET' || comp.type === 'RESET' ? '#38bdf8' : comp.type.startsWith('T') || comp.type.startsWith('C') ? '#f59e0b' : '#34d399' }}>
                {comp.symbol}
              </span>
              <span>{comp.label}</span>
            </button>
          ))}

          <button
            onClick={handleAddBranch}
            className="btn-secondary"
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              border: '1px solid #3b82f6',
              color: '#60a5fa'
            }}
            title="Add Parallel Branch (OR Seal-In Logic)"
            id="palette-btn-branch"
          >
            <GitBranch size={13} />
            + Parallel Branch
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAddRung}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
            id="btn-add-rung"
          >
            <Plus size={14} />
            Add Rung
          </button>
        </div>
      </div>

      {/* Visual Ladder Logic Diagram Container */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px 20px',
        position: 'relative'
      }}>
        {/* Power Rails Background Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', padding: '0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 'bold' }}>
            <Zap size={13} />
            +24V DC POWER RAIL (L1)
          </div>
          <div style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 'bold' }}>
            0V DC RETURN RAIL (N)
          </div>
        </div>

        {/* The Ladder Rungs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
          {/* Left Vertical Power Rail */}
          <div style={{
            position: 'absolute',
            left: '20px',
            top: 0,
            bottom: 0,
            width: '6px',
            background: 'linear-gradient(to bottom, #ef4444, #dc2626)',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
            borderRadius: '3px',
            zIndex: 10
          }} />

          {/* Right Vertical Power Rail */}
          <div style={{
            position: 'absolute',
            right: '20px',
            top: 0,
            bottom: 0,
            width: '6px',
            background: 'linear-gradient(to bottom, #3b82f6, #0284c7)',
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
            borderRadius: '3px',
            zIndex: 10
          }} />

          {(!ladder?.rungs || ladder.rungs.length === 0) ? (
            <div style={{
              margin: '40px auto',
              textAlign: 'center',
              padding: '30px',
              border: '2px dashed var(--border-muted)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '400px'
            }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>No rungs in ladder logic</p>
              <button className="btn-primary" onClick={handleAddRung}>
                <Plus size={14} /> Create First Rung
              </button>
            </div>
          ) : (
            ladder.rungs.map((rung, rIdx) => {
              const evalInfo = rungStates.find(rs => rs.rungIndex === rIdx);
              const isRungEnergized = evalInfo ? evalInfo.energized : false;
              const isSelected = selectedRungIdx === rIdx;

              return (
                <div
                  key={rung.id || rIdx}
                  onClick={() => setSelectedRungIdx(rIdx)}
                  style={{
                    marginLeft: '26px',
                    marginRight: '26px',
                    background: isSelected ? 'rgba(30, 41, 59, 0.4)' : 'rgba(15, 23, 42, 0.25)',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px 14px 16px',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                  id={`ladder-rung-${rIdx}`}
                >
                  {/* Rung Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        background: isRungEnergized ? 'rgba(0, 255, 136, 0.2)' : 'var(--bg-card)',
                        color: isRungEnergized ? '#00ff88' : 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: isRungEnergized ? '1px solid rgba(0, 255, 136, 0.4)' : '1px solid var(--border-subtle)',
                        fontWeight: 'bold'
                      }}>
                        RUNG {rIdx}
                      </span>
                      <input
                        type="text"
                        value={rung.comment || ''}
                        placeholder="Rung comment / description..."
                        onChange={(e) => {
                          const newRungs = [...ladder.rungs];
                          newRungs[rIdx].comment = e.target.value;
                          setLadder({ rungs: newRungs });
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          padding: '2px 6px',
                          width: '260px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => handleMoveRung(rIdx, -1, e)}
                        disabled={rIdx === 0}
                        style={{ padding: '3px 6px', color: 'var(--text-muted)' }}
                        title="Move Rung Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={(e) => handleMoveRung(rIdx, 1, e)}
                        disabled={rIdx === ladder.rungs.length - 1}
                        style={{ padding: '3px 6px', color: 'var(--text-muted)' }}
                        title="Move Rung Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteRung(rIdx, e)}
                        style={{ padding: '3px 6px', color: '#ef4444' }}
                        title="Delete Rung"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Wire Line and Components */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '76px',
                    position: 'relative',
                    padding: '0 8px'
                  }}>
                    {/* Continuous Background Wire */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '3px',
                      background: isRungEnergized ? 'var(--live-wire)' : 'var(--dead-wire)',
                      boxShadow: isRungEnergized ? '0 0 10px var(--live-wire-glow)' : 'none',
                      transition: 'all 0.2s ease',
                      zIndex: 1
                    }} />

                    {/* Components along this rung */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      zIndex: 2,
                      width: '100%',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {rung.elements?.map((el, elIdx) => {
                          if (['COIL', 'SET', 'RESET', 'TON', 'CTU'].includes(el.type)) {
                            return null; // Rendered at the right side
                          }

                          if (el.type === 'BRANCH') {
                            // Parallel Seal-In Branch Rendering
                            return (
                              <div
                                key={elIdx}
                                style={{
                                  background: 'rgba(13, 18, 29, 0.95)',
                                  border: '1px solid rgba(59, 130, 246, 0.4)',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  position: 'relative'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                                    PARALLEL OR
                                  </span>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      onClick={(e) => handleAddPathToBranch(rIdx, elIdx, e)}
                                      style={{ color: '#38bdf8', fontSize: '10px' }}
                                      title="Add parallel branch leg"
                                    >
                                      + leg
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteElement(rIdx, elIdx, e)}
                                      style={{ color: '#ef4444', fontSize: '10px' }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>

                                {el.branches?.map((branchElements, bIdx) => (
                                  <div
                                    key={bIdx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '4px 6px',
                                      borderLeft: '2px solid #3b82f6',
                                      background: 'rgba(255, 255, 255, 0.02)'
                                    }}
                                  >
                                    {branchElements.map((subEl, subIdx) => {
                                      const rawVal = getAddressState(subEl.address);
                                      const isConducting = subEl.type === 'NO' ? rawVal : !rawVal;

                                      return (
                                        <div
                                          key={subIdx}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: isConducting ? 'rgba(0, 255, 136, 0.15)' : 'var(--bg-card)',
                                            border: isConducting ? '1px solid #00ff88' : '1px solid var(--border-muted)',
                                            borderRadius: '6px',
                                            padding: '4px 8px'
                                          }}
                                        >
                                          <select
                                            value={subEl.type}
                                            onChange={(e) => handleUpdateBranchElement(rIdx, elIdx, bIdx, subIdx, { type: e.target.value })}
                                            style={{ padding: '2px 4px', fontSize: '11px', background: 'transparent' }}
                                          >
                                            <option value="NO">-[ ]- NO</option>
                                            <option value="NC">-[/]- NC</option>
                                          </select>

                                          <select
                                            value={subEl.address}
                                            onChange={(e) => handleUpdateBranchElement(rIdx, elIdx, bIdx, subIdx, { address: e.target.value })}
                                            style={{ padding: '2px 4px', fontSize: '11px', fontWeight: 'bold', color: isConducting ? '#00ff88' : 'inherit' }}
                                          >
                                            {allAddresses.map(addr => (
                                              <option key={addr.address} value={addr.address}>{addr.name}</option>
                                            ))}
                                          </select>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          // Series Contact (NO or NC)
                          const rawVal = getAddressState(el.address);
                          const isConducting = el.type === 'NO' ? rawVal : !rawVal;

                          return (
                            <div
                              key={elIdx}
                              style={{
                                background: isConducting ? 'rgba(0, 255, 136, 0.12)' : 'var(--bg-surface)',
                                border: isConducting ? '1px solid var(--live-wire)' : '1px solid var(--border-muted)',
                                boxShadow: isConducting ? '0 0 10px rgba(0, 255, 136, 0.3)' : 'none',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                position: 'relative'
                              }}
                            >
                              <select
                                value={el.type}
                                onChange={(e) => handleUpdateElement(rIdx, elIdx, { type: e.target.value })}
                                style={{ padding: '3px 6px', fontSize: '11px', background: 'transparent' }}
                              >
                                <option value="NO">-[ ]- NO</option>
                                <option value="NC">-[/]- NC</option>
                              </select>

                              <select
                                value={el.address}
                                onChange={(e) => handleUpdateElement(rIdx, elIdx, { address: e.target.value })}
                                style={{
                                  padding: '3px 6px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  color: isConducting ? '#00ff88' : 'inherit'
                                }}
                              >
                                {allAddresses.map(addr => (
                                  <option key={addr.address} value={addr.address}>{addr.name}</option>
                                ))}
                              </select>

                              <button
                                onClick={(e) => handleDeleteElement(rIdx, elIdx, e)}
                                style={{ color: '#94a3b8', fontSize: '12px', padding: '0 2px' }}
                                title="Delete element"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right End: Output Elements (Coils, TON, CTU) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {rung.elements?.map((el, elIdx) => {
                          if (!['COIL', 'SET', 'RESET', 'TON', 'CTU'].includes(el.type)) {
                            return null;
                          }

                          const isOutputEnergized = isRungEnergized;

                          return (
                            <div
                              key={elIdx}
                              style={{
                                background: isOutputEnergized ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-surface)',
                                border: isOutputEnergized ? '1px solid #38bdf8' : '1px solid var(--border-muted)',
                                boxShadow: isOutputEnergized ? '0 0 12px rgba(56, 189, 248, 0.4)' : 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <select
                                value={el.type}
                                onChange={(e) => handleUpdateElement(rIdx, elIdx, { type: e.target.value })}
                                style={{ padding: '3px 6px', fontSize: '11px', background: 'transparent' }}
                              >
                                <option value="COIL">-( )- COIL</option>
                                <option value="SET">-(S)- SET</option>
                                <option value="RESET">-(R)- RESET</option>
                                <option value="TON">[TON] TIMER</option>
                                <option value="CTU">[CTU] COUNTER</option>
                              </select>

                              <select
                                value={el.address}
                                onChange={(e) => handleUpdateElement(rIdx, elIdx, { address: e.target.value })}
                                style={{
                                  padding: '3px 6px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  color: isOutputEnergized ? '#38bdf8' : 'inherit'
                                }}
                              >
                                {(el.type === 'TON' ? timerAddresses : el.type === 'CTU' ? counterAddresses : outputAddresses).map(addr => (
                                  <option key={addr.address} value={addr.address}>{addr.name}</option>
                                ))}
                              </select>

                              {/* Preset input for TON and CTU */}
                              {el.type === 'TON' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>PRE:</span>
                                  <input
                                    type="number"
                                    min="100"
                                    max="30000"
                                    step="500"
                                    value={el.preset || 3000}
                                    onChange={(e) => handleUpdateElement(rIdx, elIdx, { preset: Number(e.target.value) })}
                                    style={{ width: '65px', padding: '2px 4px', fontSize: '11px' }}
                                  />
                                  <span style={{ color: 'var(--text-muted)' }}>ms</span>
                                </div>
                              )}

                              {el.type === 'CTU' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>PRE:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={el.preset || 5}
                                    onChange={(e) => handleUpdateElement(rIdx, elIdx, { preset: Number(e.target.value) })}
                                    style={{ width: '50px', padding: '2px 4px', fontSize: '11px' }}
                                  />
                                </div>
                              )}

                              <button
                                onClick={(e) => handleDeleteElement(rIdx, elIdx, e)}
                                style={{ color: '#94a3b8', fontSize: '12px', padding: '0 2px' }}
                                title="Delete output"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
