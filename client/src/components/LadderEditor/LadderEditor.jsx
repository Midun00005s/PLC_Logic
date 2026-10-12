import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  GitBranch,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Zap,
  Play,
  Square,
  StepForward,
  Database,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  AlertTriangle,
  CheckCircle,
  FileCode,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  Hash,
  Layers,
  HelpCircle
} from 'lucide-react';
import InstructionDialog from './InstructionDialog';
import DataFilesModal from './DataFilesModal';
import LadderRung from './LadderRung';

export default function LadderEditor({
  ladder,
  setLadder,
  problemInputs = [],
  problemOutputs = [],
  rungStates = [],
  plcState = null,
  isScanning = true,
  setIsScanning,
  onStepScan,
  onResetPlc
}) {
  const [selectedRungIdx, setSelectedRungIdx] = useState(0);
  const [paletteTab, setPaletteTab] = useState('bit'); // 'bit' | 'timer' | 'compare' | 'math'
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100); // 75 to 125%

  // Dialog State
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    element: null,
    rIdx: 0,
    elIdx: 0,
    bIdx: null,
    subIdx: null
  });

  // Data Files Modal State
  const [dataModalState, setDataModalState] = useState({
    isOpen: false,
    initialFile: 'T4'
  });

  // Validation Warnings/Errors State
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationPopover, setShowValidationPopover] = useState(false);

  // Undo / Redo History Stack
  const historyRef = useRef([]);
  const historyIdxRef = useRef(-1);
  const isUndoRedoAction = useRef(false);

  // Push to history when ladder changes (except during undo/redo)
  useEffect(() => {
    if (!ladder) return;
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    const currentSnapshot = JSON.stringify(ladder);
    const lastSnapshot = historyRef.current[historyIdxRef.current];

    if (currentSnapshot !== lastSnapshot) {
      // Cut any redo branch
      const nextHistory = historyRef.current.slice(0, historyIdxRef.current + 1);
      nextHistory.push(currentSnapshot);
      // Limit history depth to 50
      if (nextHistory.length > 50) nextHistory.shift();
      historyRef.current = nextHistory;
      historyIdxRef.current = nextHistory.length - 1;
    }
  }, [ladder]);

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current -= 1;
      isUndoRedoAction.current = true;
      const targetState = JSON.parse(historyRef.current[historyIdxRef.current]);
      setLadder(targetState);
    }
  }, [setLadder]);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current += 1;
      isUndoRedoAction.current = true;
      const targetState = JSON.parse(historyRef.current[historyIdxRef.current]);
      setLadder(targetState);
    }
  }, [setLadder]);

  // Available addresses list
  const inputAddresses = problemInputs.length > 0
    ? problemInputs.map(i => ({ address: i.address, name: `${i.address} (${i.name})` }))
    : [
        { address: 'X0', name: 'X0 (Start PB)' },
        { address: 'X1', name: 'X1 (Stop PB)' },
        { address: 'X2', name: 'X2 (Sensor)' },
        { address: 'X3', name: 'X3 (Limit Sw)' }
      ];

  const outputAddresses = problemOutputs.length > 0
    ? problemOutputs.map(o => ({ address: o.address, name: `${o.address} (${o.name})` }))
    : [
        { address: 'Y0', name: 'Y0 (Motor)' },
        { address: 'Y1', name: 'Y1 (Lamp)' },
        { address: 'Y2', name: 'Y2 (Buzzer)' }
      ];

  const memoryAddresses = [
    { address: 'M0', name: 'M0 (Aux Flag 0)' },
    { address: 'M1', name: 'M1 (Aux Flag 1)' },
    { address: 'M2', name: 'M2 (Aux Flag 2)' },
    { address: 'M3', name: 'M3 (Aux Flag 3)' }
  ];

  const timerAddresses = [
    { address: 'T0', name: 'T0 (Timer 0)' },
    { address: 'T1', name: 'T1 (Timer 1)' },
    { address: 'T2', name: 'T2 (Timer 2)' },
    { address: 'T3', name: 'T3 (Timer 3)' }
  ];

  const counterAddresses = [
    { address: 'C0', name: 'C0 (Counter 0)' },
    { address: 'C1', name: 'C1 (Counter 1)' },
    { address: 'C2', name: 'C2 (Counter 2)' },
    { address: 'C3', name: 'C3 (Counter 3)' }
  ];

  const allAddresses = [
    ...inputAddresses,
    ...outputAddresses,
    ...memoryAddresses,
    ...timerAddresses,
    ...counterAddresses
  ];

  // Address Live State helper
  const getAddressState = (addr) => {
    if (!plcState || !addr) return false;
    if (addr.startsWith('X')) return Boolean(plcState.inputs?.[addr]);
    if (addr.startsWith('Y')) return Boolean(plcState.outputs?.[addr]);
    if (addr.startsWith('M')) return Boolean(plcState.memory?.[addr]);
    if (addr.startsWith('T')) return Boolean(plcState.timers?.[addr]?.done);
    if (addr.startsWith('C')) return Boolean(plcState.counters?.[addr]?.done);
    return false;
  };

  // Logic & Syntax Validation
  useEffect(() => {
    if (!ladder?.rungs) {
      setValidationErrors([]);
      return;
    }

    const errors = [];
    ladder.rungs.forEach((rung, rIdx) => {
      const elements = rung.elements || [];
      if (elements.length === 0) {
        errors.push({ rung: rIdx, text: `Rung ${String(rIdx).padStart(4, '0')}: Empty rung with no instructions` });
        return;
      }

      const hasOutput = elements.some(el => ['COIL', 'SET', 'RESET', 'TON', 'CTU'].includes(el.type));
      if (!hasOutput) {
        errors.push({ rung: rIdx, text: `Rung ${String(rIdx).padStart(4, '0')}: Missing output instruction (Coil, Set, Reset, Timer, or Counter)` });
      }

      elements.forEach((el, elIdx) => {
        if (el.type === 'BRANCH') {
          if (!el.branches || el.branches.length < 2) {
            errors.push({ rung: rIdx, text: `Rung ${String(rIdx).padStart(4, '0')}: Parallel branch has fewer than 2 branch paths` });
          }
        } else {
          if (!el.address) {
            errors.push({ rung: rIdx, text: `Rung ${String(rIdx).padStart(4, '0')}: Instruction [${el.type}] has empty address` });
          } else {
            if (el.type === 'TON' && !el.address.startsWith('T')) {
              errors.push({ rung: rIdx, text: `Rung ${String(rIdx).padStart(4, '0')}: TON Timer address must start with 'T' (e.g. T0)` });
            }
            if (el.type === 'CTU' && !el.address.startsWith('C')) {
              errors.push({ rung: rIdx, text: `Rung ${String(rIdx).padStart(4, '0')}: CTU Counter address must start with 'C' (e.g. C0)` });
            }
          }
        }
      });
    });

    setValidationErrors(errors);
  }, [ladder]);

  // Keyboard shortcut listener (Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Rung Manipulation Handlers
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

  const handleInsertRung = (targetIdx) => {
    const newRungs = [...(ladder?.rungs || [])];
    const newRung = {
      id: `rung-${Date.now()}`,
      comment: `New Rung`,
      elements: [
        { type: 'NO', address: inputAddresses[0]?.address || 'X0' },
        { type: 'COIL', address: outputAddresses[0]?.address || 'Y0' }
      ]
    };
    newRungs.splice(targetIdx + 1, 0, newRung);
    setLadder({ rungs: newRungs });
    setSelectedRungIdx(targetIdx + 1);
  };

  const handleDeleteRung = (rIdx) => {
    if ((ladder?.rungs?.length || 0) <= 1) return;
    const newRungs = ladder.rungs.filter((_, idx) => idx !== rIdx);
    setLadder({ rungs: newRungs });
    setSelectedRungIdx(Math.max(0, rIdx - 1));
  };

  const handleMoveRung = (rIdx, direction) => {
    const newRungs = [...ladder.rungs];
    const targetIdx = rIdx + direction;
    if (targetIdx < 0 || targetIdx >= newRungs.length) return;
    const temp = newRungs[rIdx];
    newRungs[rIdx] = newRungs[targetIdx];
    newRungs[targetIdx] = temp;
    setLadder({ rungs: newRungs });
    setSelectedRungIdx(targetIdx);
  };

  const handleUpdateComment = (rIdx, newComment) => {
    const newRungs = [...ladder.rungs];
    newRungs[rIdx].comment = newComment;
    setLadder({ rungs: newRungs });
  };

  // Add Component to selected rung
  const handleAddComponent = (type) => {
    if (!ladder?.rungs || ladder.rungs.length === 0) {
      handleAddRung();
      return;
    }
    const rIdx = selectedRungIdx < ladder.rungs.length ? selectedRungIdx : 0;
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

    // If it's an output element (COIL, TON, CTU), place at the end
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

  // Add Parallel Branch to selected rung
  const handleAddBranch = () => {
    if (!ladder?.rungs || ladder.rungs.length === 0) {
      handleAddRung();
      return;
    }
    const rIdx = selectedRungIdx < ladder.rungs.length ? selectedRungIdx : 0;
    const rung = { ...ladder.rungs[rIdx] };
    const elements = [...(rung.elements || [])];

    const branchBlock = {
      type: 'BRANCH',
      branches: [
        [{ type: 'NO', address: inputAddresses[0]?.address || 'X0' }],
        [{ type: 'NO', address: outputAddresses[0]?.address || 'Y0' }]
      ]
    };

    elements.unshift(branchBlock);
    rung.elements = elements;
    const newRungs = [...ladder.rungs];
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  // Update element properties
  const handleUpdateElement = (rIdx, elIdx, updates) => {
    const newRungs = [...ladder.rungs];
    const rung = { ...newRungs[rIdx] };
    const elements = [...rung.elements];
    elements[elIdx] = { ...elements[elIdx], ...updates };
    rung.elements = elements;
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  // Delete element
  const handleDeleteElement = (rIdx, elIdx) => {
    const newRungs = [...ladder.rungs];
    const rung = { ...newRungs[rIdx] };
    rung.elements = rung.elements.filter((_, idx) => idx !== elIdx);
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  // Branch Leg Handlers
  const handleAddPathToBranch = (rIdx, elIdx) => {
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

  const handleRemovePathFromBranch = (rIdx, elIdx, bIdx) => {
    const newRungs = [...ladder.rungs];
    const rung = { ...newRungs[rIdx] };
    const elements = [...rung.elements];
    const branchEl = { ...elements[elIdx] };
    if (!branchEl.branches || branchEl.branches.length <= 1) return;
    branchEl.branches = branchEl.branches.filter((_, idx) => idx !== bIdx);
    elements[elIdx] = branchEl;
    rung.elements = elements;
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

  const handleAddContactToBranchLeg = (rIdx, elIdx, bIdx) => {
    const newRungs = [...ladder.rungs];
    const rung = { ...newRungs[rIdx] };
    const elements = [...rung.elements];
    const branchEl = { ...elements[elIdx] };
    const branches = [...branchEl.branches];
    branches[bIdx] = [
      ...branches[bIdx],
      { type: 'NO', address: inputAddresses[0]?.address || 'X0' }
    ];
    branchEl.branches = branches;
    elements[elIdx] = branchEl;
    rung.elements = elements;
    newRungs[rIdx] = rung;
    setLadder({ rungs: newRungs });
  };

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

  // Open property dialog for an element
  const handleOpenDialog = (element, rIdx, elIdx, bIdx = null, subIdx = null) => {
    setDialogState({
      isOpen: true,
      element,
      rIdx,
      elIdx,
      bIdx,
      subIdx
    });
  };

  // Save handler from dialog
  const handleDialogSave = (updates) => {
    const { rIdx, elIdx, bIdx, subIdx } = dialogState;
    if (bIdx !== null && subIdx !== null) {
      handleUpdateBranchElement(rIdx, elIdx, bIdx, subIdx, updates);
    } else {
      handleUpdateElement(rIdx, elIdx, updates);
    }
  };

  // Delete handler from dialog
  const handleDialogDelete = () => {
    const { rIdx, elIdx, bIdx, subIdx } = dialogState;
    if (bIdx !== null && subIdx !== null) {
      // Remove contact inside branch leg
      const newRungs = [...ladder.rungs];
      const rung = { ...newRungs[rIdx] };
      const elements = [...rung.elements];
      const branchEl = { ...elements[elIdx] };
      const branches = [...branchEl.branches];
      branches[bIdx] = branches[bIdx].filter((_, idx) => idx !== subIdx);
      // If leg empty, remove leg
      if (branches[bIdx].length === 0) {
        branches.splice(bIdx, 1);
      }
      if (branches.length === 0) {
        // Remove branch completely
        elements.splice(elIdx, 1);
      } else {
        branchEl.branches = branches;
        elements[elIdx] = branchEl;
      }
      rung.elements = elements;
      newRungs[rIdx] = rung;
      setLadder({ rungs: newRungs });
    } else {
      handleDeleteElement(rIdx, elIdx);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary, #ffffff)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 1. TOP ENGINEERING MENU & TOOLBAR (Classic Industrial PLC Style) */}
      <div style={{
        background: 'var(--bg-surface, #ffffff)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        zIndex: 20
      }}>
        {/* Menu Bar: File, PLC, Ladder, Data Files, Tools */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '11.5px',
          fontFamily: 'var(--font-mono)',
          background: 'var(--bg-card, #f8fafc)'
        }}>
          {/* Left Menus & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              <FileCode size={14} />
              <span>ROUTINE: MainRoutine [LAD]</span>
            </div>

            <div style={{ height: '14px', width: '1px', background: 'var(--border-muted)' }} />

            {/* PLC Control Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setIsScanning && setIsScanning(true)}
                style={{
                  background: isScanning ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                  border: isScanning ? '1px solid #16a34a' : '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  color: isScanning ? '#16a34a' : 'var(--text-secondary)',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="RUN: Execute cyclic PLC scan loop"
              >
                <Play size={11} fill={isScanning ? '#16a34a' : 'none'} />
                RUN
              </button>

              <button
                onClick={() => setIsScanning && setIsScanning(false)}
                style={{
                  background: !isScanning ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
                  border: !isScanning ? '1px solid #ca8a04' : '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  color: !isScanning ? '#ca8a04' : 'var(--text-secondary)',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="STOP: Halt cyclic execution"
              >
                <Square size={11} fill={!isScanning ? '#ca8a04' : 'none'} />
                STOP
              </button>

              {onStepScan && (
                <button
                  onClick={onStepScan}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    color: 'var(--text-secondary)',
                    padding: '2px 6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Execute single PLC scan step"
                >
                  <StepForward size={11} />
                  STEP
                </button>
              )}

              {onResetPlc && (
                <button
                  onClick={onResetPlc}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    color: 'var(--text-secondary)',
                    padding: '2px 6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Reset controller memory and registers"
                >
                  <RotateCcw size={11} />
                  RESET
                </button>
              )}
            </div>

            <div style={{ height: '14px', width: '1px', background: 'var(--border-muted)' }} />

            {/* Data Files Shortcuts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setDataModalState({ isOpen: true, initialFile: 'T4' })}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  color: 'var(--text-secondary)',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Open Timer Data File (T4: EN, TT, DN, PRE, ACC)"
              >
                <Clock size={12} style={{ color: '#d97706' }} />
                Timer File (T4)
              </button>

              <button
                onClick={() => setDataModalState({ isOpen: true, initialFile: 'C5' })}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  color: 'var(--text-secondary)',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Open Counter Data File (C5: CU, CD, DN, PRE, ACC)"
              >
                <Hash size={12} style={{ color: '#0284c7' }} />
                Counter File (C5)
              </button>

              <button
                onClick={() => setDataModalState({ isOpen: true, initialFile: 'IO' })}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  color: 'var(--text-secondary)',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Open I/O Status Table (I:0 / O:0 channels)"
              >
                <Zap size={12} style={{ color: '#16a34a' }} />
                I/O File
              </button>

              <button
                onClick={() => setDataModalState({ isOpen: true, initialFile: 'N7' })}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  color: 'var(--text-secondary)',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Open Integer Register File (N7)"
              >
                <Layers size={12} style={{ color: '#8b5cf6' }} />
                Integer File (N7)
              </button>
            </div>
          </div>

          {/* Right Tools: Undo/Redo & Zoom & Validation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Validation Badge */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowValidationPopover(!showValidationPopover)}
                style={{
                  background: validationErrors.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  border: validationErrors.length > 0 ? '1px solid #ef4444' : '1px solid #16a34a',
                  borderRadius: '3px',
                  color: validationErrors.length > 0 ? '#ef4444' : '#16a34a',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {validationErrors.length > 0 ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                <span>{validationErrors.length === 0 ? 'Logic Valid' : `${validationErrors.length} Issue(s)`}</span>
              </button>

              {/* Validation Errors Popover */}
              {showValidationPopover && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  width: '320px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  padding: '10px 12px',
                  zIndex: 999
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11.5px', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Rung Logic Diagnostics
                  </div>
                  {validationErrors.length === 0 ? (
                    <div style={{ color: '#16a34a', fontSize: '11px' }}>
                      ✓ All rungs comply with IEC-61131-3 syntax and have valid outputs.
                    </div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#ef4444', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div style={{ height: '14px', width: '1px', background: 'var(--border-muted)' }} />

            {/* Undo / Redo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={handleUndo}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '3px 5px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={13} />
              </button>

              <button
                onClick={handleRedo}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '3px 5px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={13} />
              </button>
            </div>

            <div style={{ height: '14px', width: '1px', background: 'var(--border-muted)' }} />

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setZoomLevel(prev => Math.max(75, prev - 10))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span style={{ fontSize: '11px', width: '38px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(125, prev + 10))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
                title="Reset Zoom to 100%"
              >
                <Maximize2 size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Rung Bar: + Rung, + Parallel Branch, Rung Counter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleAddRung}
              className="btn-primary"
              style={{
                padding: '4px 12px',
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Add a new ladder rung at the end"
            >
              <Plus size={13} />
              Add Rung
            </button>

            <button
              onClick={handleAddBranch}
              className="btn-secondary"
              style={{
                padding: '4px 12px',
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                border: '1px solid #0284c7',
                color: '#0284c7'
              }}
              title="Add Parallel OR Branch to selected rung"
            >
              <GitBranch size={13} />
              + Branch
            </button>

            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: '8px' }}>
              Total: {ladder?.rungs?.length || 0} Rungs • Selected: Rung {String(selectedRungIdx).padStart(4, '0')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              Tip: Double-click or click any element to configure its address & symbol alias
            </span>
          </div>
        </div>
      </div>

      {/* 2. SPLIT WORKSPACE: LADDER CANVAS (LEFT) + INSTRUCTION PALETTE (RIGHT) */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* LADDER CANVAS (Full Width Scrollable Viewport) */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px 24px',
          position: 'relative',
          background: 'var(--bg-primary, #ffffff)'
        }}>
          {/* Zoom Wrapper */}
          <div style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top left',
            minWidth: '780px',
            transition: 'transform 0.1s ease-out'
          }}>
            {/* Top Power Rails Header Indicator */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              padding: '0 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 'bold',
              userSelect: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--rail-power, #ef4444)' }}>
                <Zap size={13} />
                <span>+24V DC POWER RAIL (L1)</span>
              </div>
              <div style={{ color: 'var(--rail-neutral, #0284c7)' }}>
                <span>0V DC RETURN RAIL (L2 / N)</span>
              </div>
            </div>

            {/* Schematic Rails & Rungs Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              padding: '0 20px'
            }}>
              {/* Left Vertical Power Bus Rail */}
              <div style={{
                position: 'absolute',
                left: '12px',
                top: 0,
                bottom: 0,
                width: '6px',
                background: 'var(--rail-power, #ef4444)',
                boxShadow: isScanning ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                borderRadius: '3px',
                zIndex: 10
              }} />

              {/* Right Vertical Return Bus Rail */}
              <div style={{
                position: 'absolute',
                right: '12px',
                top: 0,
                bottom: 0,
                width: '6px',
                background: 'var(--rail-neutral, #0284c7)',
                boxShadow: isScanning ? '0 0 10px rgba(2, 132, 199, 0.4)' : 'none',
                borderRadius: '3px',
                zIndex: 10
              }} />

              {(!ladder?.rungs || ladder.rungs.length === 0) ? (
                <div style={{
                  margin: '60px auto',
                  textAlign: 'center',
                  padding: '36px',
                  border: '2px dashed var(--border-muted)',
                  borderRadius: '8px',
                  maxWidth: '420px',
                  background: 'var(--bg-surface)'
                }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '13px' }}>
                    No rungs present in current ladder routine.
                  </p>
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
                    <LadderRung
                      key={rung.id || rIdx}
                      rung={rung}
                      rIdx={rIdx}
                      isSelected={isSelected}
                      onSelect={() => setSelectedRungIdx(rIdx)}
                      isRungEnergized={isRungEnergized}
                      allAddresses={allAddresses}
                      getAddressState={getAddressState}
                      onUpdateElement={handleUpdateElement}
                      onDeleteElement={handleDeleteElement}
                      onOpenDialog={handleOpenDialog}
                      onMoveRung={handleMoveRung}
                      onDeleteRung={handleDeleteRung}
                      onInsertRung={handleInsertRung}
                      totalRungs={ladder.rungs.length}
                      onUpdateComment={handleUpdateComment}
                      onAddElementToRung={handleAddComponent}
                      onAddPathToBranch={handleAddPathToBranch}
                      onRemovePathFromBranch={handleRemovePathFromBranch}
                      onAddContactToBranchLeg={handleAddContactToBranchLeg}
                      onUpdateBranchElement={handleUpdateBranchElement}
                      plcState={plcState}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT DOCKABLE INSTRUCTION PALETTE */}
        <div style={{
          width: isPaletteCollapsed ? '28px' : '230px',
          transition: 'width 0.2s ease',
          background: 'var(--bg-surface, #ffffff)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 15,
          position: 'relative'
        }}>
          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
            style={{
              position: 'absolute',
              left: '-12px',
              top: '12px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-muted)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              zIndex: 30
            }}
            title={isPaletteCollapsed ? 'Expand Instruction Palette' : 'Collapse Instruction Palette'}
          >
            {isPaletteCollapsed ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
          </button>

          {!isPaletteCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Palette Header */}
              <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                  INSTRUCTION PALETTE
                </span>
              </div>

              {/* Palette Category Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                padding: '4px',
                gap: '2px'
              }}>
                {[
                  { id: 'bit', label: 'Bit Logic' },
                  { id: 'timer', label: 'Timers' },
                  { id: 'compare', label: 'Cmp/Math' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setPaletteTab(t.id)}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      fontSize: '10.5px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '3px',
                      background: paletteTab === t.id ? 'var(--bg-card)' : 'transparent',
                      color: paletteTab === t.id ? '#0284c7' : 'var(--text-muted)',
                      borderBottom: paletteTab === t.id ? '2px solid #0284c7' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Palette Items List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 1. BIT LOGIC TAB */}
                {paletteTab === 'bit' && (
                  <>
                    <button
                      onClick={() => handleAddComponent('NO')}
                      className="btn-secondary"
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)'
                      }}
                      title="Examine if Closed (Normally Open Contact)"
                    >
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>—[ ]—</span>
                      <span>NO Contact</span>
                    </button>

                    <button
                      onClick={() => handleAddComponent('NC')}
                      className="btn-secondary"
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)'
                      }}
                      title="Examine if Open (Normally Closed Contact)"
                    >
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>—[/]—</span>
                      <span>NC Contact</span>
                    </button>

                    <button
                      onClick={handleAddBranch}
                      className="btn-secondary"
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                        border: '1px solid #0284c7',
                        color: '#0284c7'
                      }}
                      title="Add Parallel OR Branch (Seal-In Circuit)"
                    >
                      <span style={{ fontWeight: 'bold' }}>—[+]—</span>
                      <span>Parallel Branch</span>
                    </button>

                    <button
                      onClick={() => handleAddComponent('COIL')}
                      className="btn-secondary"
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)'
                      }}
                      title="Output Energize Coil"
                    >
                      <span style={{ color: '#0284c7', fontWeight: 'bold' }}>—( )—</span>
                      <span>Output Coil</span>
                    </button>

                    <button
                      onClick={() => handleAddComponent('SET')}
                      className="btn-secondary"
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)'
                      }}
                      title="Output Latch (Set Bit TRUE until Unlatched)"
                    >
                      <span style={{ color: '#0284c7', fontWeight: 'bold' }}>—(L)—</span>
                      <span>Latch (Set)</span>
                    </button>

                    <button
                      onClick={() => handleAddComponent('RESET')}
                      className="btn-secondary"
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)'
                      }}
                      title="Output Unlatch (Reset Bit to 0)"
                    >
                      <span style={{ color: '#0284c7', fontWeight: 'bold' }}>—(U)—</span>
                      <span>Unlatch (Reset)</span>
                    </button>
                  </>
                )}

                {/* 2. TIMERS & COUNTERS TAB */}
                {paletteTab === 'timer' && (
                  <>
                    <button
                      onClick={() => handleAddComponent('TON')}
                      className="btn-secondary"
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)'
                      }}
                      title="Timer On Delay (Accumulates time while rung is energized)"
                    >
                      <span style={{ color: '#d97706', fontWeight: 'bold' }}>[TON]</span>
                      <span>Timer On Delay</span>
                    </button>

                    <button
                      onClick={() => handleAddComponent('CTU')}
                      className="btn-secondary"
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)'
                      }}
                      title="Count Up (Increments accumulator on rising edge)"
                    >
                      <span style={{ color: '#0284c7', fontWeight: 'bold' }}>[CTU]</span>
                      <span>Count Up</span>
                    </button>

                    {/* Industrial Coming Soon blocks */}
                    <div style={{
                      padding: '8px 10px',
                      background: 'var(--bg-card)',
                      borderRadius: '5px',
                      border: '1px dashed var(--border-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: 'var(--text-dim)'
                    }}>
                      <span>[TOF] Off-Delay</span>
                      <span style={{ fontSize: '9px', background: 'rgba(100, 116, 139, 0.2)', padding: '1px 5px', borderRadius: '3px' }}>
                        Soon
                      </span>
                    </div>

                    <div style={{
                      padding: '8px 10px',
                      background: 'var(--bg-card)',
                      borderRadius: '5px',
                      border: '1px dashed var(--border-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: 'var(--text-dim)'
                    }}>
                      <span>[CTD] Count Down</span>
                      <span style={{ fontSize: '9px', background: 'rgba(100, 116, 139, 0.2)', padding: '1px 5px', borderRadius: '3px' }}>
                        Soon
                      </span>
                    </div>
                  </>
                )}

                {/* 3. COMPARE & MATH TAB */}
                {paletteTab === 'compare' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '4px' }}>
                      IEC-61131-3 Function Blocks
                    </div>

                    {['EQU (Equal)', 'NEQ (Not Equal)', 'GRT (Greater Than)', 'LES (Less Than)', 'ADD (Math Add)', 'SUB (Subtract)', 'MOV (Move Register)'].map(item => (
                      <div
                        key={item}
                        style={{
                          padding: '7px 10px',
                          background: 'var(--bg-card)',
                          borderRadius: '4px',
                          border: '1px dashed var(--border-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          color: 'var(--text-dim)'
                        }}
                      >
                        <span>{item}</span>
                        <span style={{ fontSize: '9px', background: 'rgba(100, 116, 139, 0.15)', padding: '1px 4px', borderRadius: '3px' }}>
                          Coming Soon
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM INDUSTRIAL STATUS BAR */}
      <div style={{
        height: '28px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)',
        userSelect: 'none',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isScanning ? '#16a34a' : '#ca8a04',
              boxShadow: isScanning ? '0 0 6px #16a34a' : 'none'
            }} />
            <strong style={{ color: isScanning ? '#16a34a' : '#ca8a04' }}>
              PLC {isScanning ? 'RUN' : 'STOP'}
            </strong>
          </div>

          <span>CYCLE: 50 ms (20 Hz)</span>
          <span>HARDWARE: V-PLC 5000 SER. B</span>
          <span>RUNGS: {ladder?.rungs?.length || 0}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>FOCUS: RUNG {String(selectedRungIdx).padStart(4, '0')}</span>
          <span style={{ color: validationErrors.length === 0 ? '#16a34a' : '#ef4444' }}>
            {validationErrors.length === 0 ? 'SYNTAX: 0 ERRORS' : `SYNTAX: ${validationErrors.length} ERRORS`}
          </span>
        </div>
      </div>

      {/* Instruction Configuration Dialog Modal */}
      <InstructionDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        element={dialogState.element}
        rIdx={dialogState.rIdx}
        elIdx={dialogState.elIdx}
        bIdx={dialogState.bIdx}
        subIdx={dialogState.subIdx}
        onSave={handleDialogSave}
        onDelete={handleDialogDelete}
        allAddresses={allAddresses}
        plcState={plcState}
      />

      {/* Data Files Table Modal */}
      <DataFilesModal
        isOpen={dataModalState.isOpen}
        onClose={() => setDataModalState(prev => ({ ...prev, isOpen: false }))}
        initialFile={dataModalState.initialFile}
        plcState={plcState}
        problemInputs={problemInputs}
        problemOutputs={problemOutputs}
      />
    </div>
  );
}
