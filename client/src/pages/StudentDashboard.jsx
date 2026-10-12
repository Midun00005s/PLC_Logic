import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { VirtualPLC } from '../../../server/plc/ladderEngine';
import { 
  Play, Pause, StepForward, RotateCcw, Cpu, Zap, Activity, CheckCircle2, 
  ChevronRight, Award, Trophy, BookOpen, Search, Filter, Layers, Clock, 
  Radio, Power, AlertTriangle, ArrowUpRight, FileText, Check, Sparkles,
  ArrowRight, RefreshCw, Eye, ExternalLink, Sliders
} from 'lucide-react';

// Preset circuits demonstrating typical PLC Ladder Simulator 2A logic
const SIMULATOR_PRESETS = [
  {
    id: 'motor-latch',
    title: '3-Wire Motor Start/Stop (Auxiliary Contact Seal-In)',
    description: 'Momentary Start (X0) energizes Motor (Y0) and latches via auxiliary contact. Stop (X1) breaks current.',
    category: 'Latching Logic',
    inputs: [
      { address: 'X0', name: 'START_PB', type: 'momentary', desc: 'Normally Open Start Pushbutton' },
      { address: 'X1', name: 'STOP_PB', type: 'momentary', desc: 'Normally Closed Stop Pushbutton' },
      { address: 'X2', name: 'OVERLOAD_OL', type: 'toggle', desc: 'Thermal Overload Trip' }
    ],
    outputs: [
      { address: 'Y0', name: 'MOTOR_KM1', type: 'motor', desc: 'Main Motor Contactor' },
      { address: 'Y1', name: 'RUN_LAMP', type: 'lamp', color: '#22c55e', desc: 'Green Run Indicator' }
    ],
    ladder: {
      rungs: [
        {
          id: 'rung-0',
          comment: 'Rung 0000: Motor Contactor with Auxiliary Contact Seal-In',
          elements: [
            {
              type: 'BRANCH',
              branches: [
                [{ type: 'NO', address: 'X0', label: 'START_PB' }],
                [{ type: 'NO', address: 'Y0', label: 'MOTOR_KM1' }]
              ]
            },
            { type: 'NC', address: 'X1', label: 'STOP_PB' },
            { type: 'NC', address: 'X2', label: 'OVERLOAD' },
            { type: 'COIL', address: 'Y0', label: 'MOTOR_KM1' }
          ]
        },
        {
          id: 'rung-1',
          comment: 'Rung 0001: Run Indicator Pilot Lamp',
          elements: [
            { type: 'NO', address: 'Y0', label: 'MOTOR_KM1' },
            { type: 'COIL', address: 'Y1', label: 'RUN_LAMP' }
          ]
        }
      ]
    }
  },
  {
    id: 'timer-pump',
    title: 'Automatic Reservoir Pump with On-Delay Timer (TON)',
    description: 'When Level Sensor (X2) activates, On-Delay Timer (T0, 3.0s) begins timing. Once done, Pump (Y0) runs.',
    category: 'Timers',
    inputs: [
      { address: 'X2', name: 'FLOAT_SW', type: 'toggle', desc: 'High Reservoir Level Float Switch' },
      { address: 'X1', name: 'E_STOP', type: 'toggle', desc: 'Emergency Stop Circuit' }
    ],
    outputs: [
      { address: 'Y0', name: 'PUMP_M1', type: 'motor', desc: 'Drain Pump Contactor' },
      { address: 'Y2', name: 'TIMING_IND', type: 'lamp', color: '#eab308', desc: 'Yellow Timing Warning Lamp' }
    ],
    ladder: {
      rungs: [
        {
          id: 'rung-0',
          comment: 'Rung 0000: Reservoir Level Delay Timer',
          elements: [
            { type: 'NO', address: 'X2', label: 'FLOAT_SW' },
            { type: 'NC', address: 'X1', label: 'E_STOP' },
            { type: 'TON', address: 'T0', preset: 3000, label: '3.0s DELAY' }
          ]
        },
        {
          id: 'rung-1',
          comment: 'Rung 0001: Pump Motor Actuation upon Timer Complete',
          elements: [
            { type: 'NO', address: 'T0', label: 'T0.DN' },
            { type: 'COIL', address: 'Y0', label: 'PUMP_M1' }
          ]
        }
      ]
    }
  },
  {
    id: 'counter-batch',
    title: 'Conveyor Parts Sorter with Up-Counter (CTU)',
    description: 'Proximity Sensor (X3) counts passed items. After reaching preset of 5, Diverter Valve (Y1) triggers.',
    category: 'Counters',
    inputs: [
      { address: 'X3', name: 'PROX_SENSOR', type: 'momentary', desc: 'Optical / Inductive Part Sensor' },
      { address: 'X4', name: 'RESET_COUNTER', type: 'momentary', desc: 'Manual Batch Reset Pushbutton' }
    ],
    outputs: [
      { address: 'Y1', name: 'DIVERTER_SOL', type: 'valve', desc: 'Pneumatic Reject / Divert Gate' },
      { address: 'Y3', name: 'BATCH_FULL', type: 'lamp', color: '#ef4444', desc: 'Red Batch Complete Lamp' }
    ],
    ladder: {
      rungs: [
        {
          id: 'rung-0',
          comment: 'Rung 0000: Optical Part Counter (CTU)',
          elements: [
            { type: 'NO', address: 'X3', label: 'PART_PULSE' },
            { type: 'CTU', address: 'C0', preset: 5, label: '5-COUNT CTU' }
          ]
        },
        {
          id: 'rung-1',
          comment: 'Rung 0001: Diverter Gate on Batch Reached',
          elements: [
            { type: 'NO', address: 'C0', label: 'C0.DN' },
            { type: 'COIL', address: 'Y1', label: 'DIVERTER' }
          ]
        }
      ]
    }
  }
];

export default function StudentDashboard({ onSelectProblem, onOpenLeaderboard, onOpenDocs }) {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Main Tab: 'simulator' (PLC Ladder Simulator 2A) | 'challenges' | 'pinmap' | 'history'
  const [activeTab, setActiveTab] = useState('simulator');

  // Search & Filter state for challenges
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // -----------------------------------------------------------------
  // Interactive Virtual PLC Engine for the Live Simulator 2A preview
  // -----------------------------------------------------------------
  const [selectedPresetId, setSelectedPresetId] = useState('motor-latch');
  const activePreset = SIMULATOR_PRESETS.find(p => p.id === selectedPresetId) || SIMULATOR_PRESETS[0];

  const plcRef = useRef(new VirtualPLC());
  const [isScanning, setIsScanning] = useState(true);
  const [scanCycleCount, setScanCycleCount] = useState(0);
  const [scanFrequencyHz, setScanFrequencyHz] = useState(50);
  const [inputs, setInputs] = useState({ X0: false, X1: false, X2: false, X3: false, X4: false, X5: false, X6: false, X7: false });
  const [outputs, setOutputs] = useState({ Y0: false, Y1: false, Y2: false, Y3: false, Y4: false, Y5: false, Y6: false, Y7: false });
  const [timers, setTimers] = useState({});
  const [counters, setCounters] = useState({});
  const [rungStates, setRungStates] = useState([]);

  // Fetch problems and user submissions
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const pRes = await fetch('/api/problems');
        if (pRes.ok) {
          const pData = await pRes.json();
          setProblems(pData);
        }

        if (user && user.id) {
          const sRes = await fetch(`/api/submissions/user/${user.id}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            setSubmissions(sData);
          }
        }
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Reset simulator state when switching presets
  useEffect(() => {
    if (plcRef.current) {
      plcRef.current.reset();
      const initialInputs = { X0: false, X1: false, X2: false, X3: false, X4: false, X5: false, X6: false, X7: false };
      setInputs(initialInputs);
      setOutputs({ Y0: false, Y1: false, Y2: false, Y3: false, Y4: false, Y5: false, Y6: false, Y7: false });
      setTimers({});
      setCounters({});
    }
  }, [selectedPresetId]);

  // High-speed scan loop for live Simulator 2A execution (~25ms = 40Hz)
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      if (!plcRef.current) return;

      plcRef.current.setInputs(inputs);
      const result = plcRef.current.executeScan(activePreset.ladder);

      setOutputs({ ...result.outputs });
      setTimers({ ...result.timers });
      setCounters({ ...result.counters });
      setRungStates(result.rungResults || []);
      setScanCycleCount(c => (c + 1) % 9999);
    }, 28);

    return () => clearInterval(interval);
  }, [isScanning, inputs, activePreset]);

  // Handlers for momentary and toggle inputs
  const handleInputDown = (addr) => {
    setInputs(prev => ({ ...prev, [addr]: true }));
  };

  const handleInputUp = (addr) => {
    setInputs(prev => ({ ...prev, [addr]: false }));
  };

  const handleInputToggle = (addr) => {
    setInputs(prev => ({ ...prev, [addr]: !prev[addr] }));
  };

  const handleResetSimulator = () => {
    if (plcRef.current) {
      plcRef.current.reset();
      setInputs({ X0: false, X1: false, X2: false, X3: false, X4: false, X5: false, X6: false, X7: false });
      setOutputs({ Y0: false, Y1: false, Y2: false, Y3: false, Y4: false, Y5: false, Y6: false, Y7: false });
      setTimers({});
      setCounters({});
    }
  };

  const handleSingleStep = () => {
    if (plcRef.current) {
      plcRef.current.setInputs(inputs);
      const result = plcRef.current.executeScan(activePreset.ladder);
      setOutputs({ ...result.outputs });
      setTimers({ ...result.timers });
      setCounters({ ...result.counters });
      setRungStates(result.rungResults || []);
      setScanCycleCount(c => (c + 1) % 9999);
    }
  };

  // Solved metrics
  const activeProblemIdSet = new Set(problems.map(p => p.id));
  const solvedProblemIds = new Set(
    submissions.filter(s => s.isAccepted && activeProblemIdSet.has(s.problemId)).map(s => s.problemId)
  );
  const attemptedProblemIds = new Set(
    submissions.filter(s => activeProblemIdSet.has(s.problemId)).map(s => s.problemId)
  );

  const categories = ['ALL', 'Latching Logic', 'Counters', 'Timers', 'Process Automation', 'Safety Systems'];
  const difficulties = ['ALL', 'Easy', 'Medium', 'Hard'];

  const filteredProblems = problems.filter(p => {
    const isSolved = solvedProblemIds.has(p.id);
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiff = selectedDifficulty === 'ALL' || p.difficulty.toUpperCase() === selectedDifficulty.toUpperCase();
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || 
                          (selectedStatus === 'SOLVED' && isSolved) || 
                          (selectedStatus === 'UNSOLVED' && !isSolved);
    return matchesSearch && matchesDiff && matchesCat && matchesStatus;
  });

  const totalCount = problems.length;
  const totalSolved = Math.min(solvedProblemIds.size, totalCount);
  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((totalSolved / totalCount) * 100)) : 0;
  const nextRecommended = problems.find(p => !solvedProblemIds.has(p.id)) || problems[0];

  return (
    <div style={{ flex: 1, padding: '24px 20px', maxWidth: '1360px', margin: '0 auto', width: '100%' }}>
      
      {/* =================================================================== */}
      {/* 1. TOP PLC CONTROLLER STATUS CONSOLE (Simulator 2A Signature Bar) */}
      {/* =================================================================== */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-muted)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 22px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Left: Controller Badge & Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Cpu size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                fontSize: '17px',
                fontWeight: '800',
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.3px',
                margin: 0
              }}>
                PLC LADDER SIMULATOR 2A
              </h1>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}>
                v2.4 PRO RUNTIME
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              marginTop: '3px'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span className={`status-dot ${isScanning ? 'active' : 'inactive'}`} />
                <strong style={{ color: isScanning ? 'var(--live-wire)' : 'var(--text-muted)' }}>
                  {isScanning ? 'RUN MODE' : 'HALTED'}
                </strong>
              </span>
              <span>•</span>
              <span>SCAN: <strong>20ms (50Hz)</strong></span>
              <span>•</span>
              <span>CYCLE: <strong>#{String(scanCycleCount).padStart(4, '0')}</strong></span>
              <span>•</span>
              <span>STANDARD: <strong>IEC 61131-3</strong></span>
            </div>
          </div>
        </div>

        {/* Center: Simulator 2A Hardware Execution Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
          padding: '4px 6px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setIsScanning(true)}
            disabled={isScanning}
            className={isScanning ? 'btn-success' : 'btn-secondary'}
            style={{ padding: '6px 14px', fontSize: '12px' }}
            title="Start continuous scan execution"
            id="btn-plc-run"
          >
            <Play size={13} fill={isScanning ? '#fff' : 'none'} />
            <span>RUN</span>
          </button>

          <button
            onClick={() => setIsScanning(false)}
            disabled={!isScanning}
            className={!isScanning ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 14px', fontSize: '12px' }}
            title="Halt PLC scan cycle"
            id="btn-plc-stop"
          >
            <Pause size={13} />
            <span>STOP</span>
          </button>

          <button
            onClick={handleSingleStep}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Step single scan pulse (F7)"
            id="btn-plc-step"
          >
            <StepForward size={13} />
            <span>STEP</span>
          </button>

          <button
            onClick={handleResetSimulator}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Clear all outputs, memory registers, and reset rungs"
            id="btn-plc-reset"
          >
            <RotateCcw size={13} />
            <span>RESET</span>
          </button>
        </div>

        {/* Right: Quick Action to Open Challenge Studio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {nextRecommended && (
            <button
              className="btn-primary"
              onClick={() => onSelectProblem(nextRecommended.id)}
              style={{ padding: '7px 14px', fontSize: '12.5px' }}
              title="Launch full ladder challenge editor"
              id="btn-quick-launch-challenge"
            >
              <span>Next Challenge</span>
              <ArrowRight size={14} />
            </button>
          )}

          <button
            className="btn-secondary"
            onClick={onOpenDocs}
            style={{ padding: '7px 12px', fontSize: '12.5px' }}
            title="PLC Syntax Cheatsheet"
          >
            <BookOpen size={14} />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. KPI METRICS DECK (Clean Monochromatic High Contrast)            */}
      {/* =================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {/* Metric 1 */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Student Rating
            </span>
            <Zap size={15} color="var(--text-primary)" />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {user?.score || 0} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>PTS</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Accumulated challenge points
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Challenges Solved
            </span>
            <CheckCircle2 size={15} color="var(--live-wire)" />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {totalSolved} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {totalCount}</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--live-wire)', marginTop: '4px', fontWeight: '600' }}>
            {progressPercent}% curriculum completed
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Simulator Executions
            </span>
            <Activity size={15} color="var(--text-primary)" />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {submissions.length} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>runs</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Evaluated on Virtual IEC Testbench
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Global Standing
            </span>
            <Trophy size={15} color="var(--text-primary)" />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Rank #{user?.rank || 1}
          </div>
          <button
            onClick={onOpenLeaderboard}
            style={{ fontSize: '11.5px', color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
          >
            <span>View Leaderboard</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. SIMULATOR 2A APP NAVIGATION TABS                                 */}
      {/* =================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderBottom: '1px solid var(--border-muted)',
        marginBottom: '20px',
        paddingBottom: '2px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('simulator')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: '600',
            color: activeTab === 'simulator' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'simulator' ? '2px solid var(--text-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-simulator-2a"
        >
          <Cpu size={16} />
          <span>Interactive Simulator 2A</span>
        </button>

        <button
          onClick={() => setActiveTab('challenges')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: '600',
            color: activeTab === 'challenges' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'challenges' ? '2px solid var(--text-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-student-challenges"
        >
          <Layers size={16} />
          <span>Challenge Catalog ({filteredProblems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pinmap')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: '600',
            color: activeTab === 'pinmap' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'pinmap' ? '2px solid var(--text-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-pinmap"
        >
          <Radio size={16} />
          <span>I/O Pin Map & Registers</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: '600',
            color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'history' ? '2px solid var(--text-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-student-history"
        >
          <Clock size={16} />
          <span>My Submissions History ({submissions.length})</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: INTERACTIVE SIMULATOR 2A APPARATUS                           */}
      {/* =================================================================== */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Preset Selector Banner */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Circuit Architecture:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {SIMULATOR_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: selectedPresetId === preset.id ? 'var(--bg-card)' : 'transparent',
                      border: selectedPresetId === preset.id ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                      color: selectedPresetId === preset.id ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {preset.category}: {preset.title.split('(')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {activePreset.description}
            </div>
          </div>

          {/* Main 2-Column Simulator Workstation */}
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: PLC HARDWARE I/O RACK (Digital Inputs & Outputs) */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Rack Header */}
              <div style={{
                background: 'var(--bg-card)',
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={15} color="var(--text-primary)" />
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: '700', textTransform: 'uppercase' }}>
                    V-PLC 5000 I/O RACK
                  </span>
                </div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  SLOT 0 • 24V SINK/SOURCE
                </span>
              </div>

              {/* Digital Inputs Section */}
              <div style={{ padding: '16px' }}>
                <div style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Digital Inputs (X0 — X7)</span>
                  <span>Click to trigger</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activePreset.inputs.map(inp => {
                    const isHigh = Boolean(inputs[inp.address]);
                    const isMomentary = inp.type === 'momentary';

                    return (
                      <div
                        key={inp.address}
                        style={{
                          background: 'var(--bg-card)',
                          border: isHigh ? '1px solid var(--live-wire)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* LED Status Indicator */}
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: isHigh ? 'var(--live-wire)' : '#27272a',
                            border: isHigh ? '1px solid #4ade80' : '1px solid #3f3f46',
                            boxShadow: isHigh ? '0 0 8px var(--live-wire)' : 'none',
                            transition: 'all 0.1s ease'
                          }} />

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {inp.address}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                {inp.name}
                              </span>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {inp.desc}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Hardware Button / Switch */}
                        {isMomentary ? (
                          <button
                            onMouseDown={() => handleInputDown(inp.address)}
                            onMouseUp={() => handleInputUp(inp.address)}
                            onTouchStart={() => handleInputDown(inp.address)}
                            onTouchEnd={() => handleInputUp(inp.address)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '700',
                              background: isHigh ? 'var(--live-wire)' : 'var(--bg-surface)',
                              color: isHigh ? '#000000' : 'var(--text-primary)',
                              border: '1px solid var(--border-muted)',
                              userSelect: 'none',
                              cursor: 'pointer',
                              boxShadow: isHigh ? 'inset 0 2px 4px rgba(0,0,0,0.4)' : 'var(--shadow-sm)'
                            }}
                          >
                            {isHigh ? 'PRESSED' : 'PRESS'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleInputToggle(inp.address)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '700',
                              background: isHigh ? 'var(--text-primary)' : 'var(--bg-surface)',
                              color: isHigh ? 'var(--bg-primary)' : 'var(--text-primary)',
                              border: '1px solid var(--border-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            {isHigh ? 'ON' : 'OFF'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Digital Outputs Section */}
                <div style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginTop: '20px',
                  marginBottom: '10px'
                }}>
                  Digital Outputs (Y0 — Y7)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activePreset.outputs.map(out => {
                    const isEnergized = Boolean(outputs[out.address]);

                    return (
                      <div
                        key={out.address}
                        style={{
                          background: 'var(--bg-card)',
                          border: isEnergized ? '1px solid var(--live-wire)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Animated Output Indicator */}
                          <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: out.type === 'motor' ? '3px' : '50%',
                            background: isEnergized ? 'var(--live-wire)' : '#27272a',
                            border: isEnergized ? '1px solid #4ade80' : '1px solid #3f3f46',
                            boxShadow: isEnergized ? '0 0 10px var(--live-wire)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontSize: '9px',
                            fontWeight: 'bold'
                          }}>
                            {out.type === 'motor' && isEnergized && <Power size={8} />}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {out.address}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                {out.name}
                              </span>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {out.desc}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: isEnergized ? 'var(--live-wire)' : 'var(--text-muted)',
                          background: isEnergized ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: isEnergized ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent'
                        }}>
                          {isEnergized ? 'ENERGIZED' : 'OFF'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Timers & Counters Telemetry */}
                {(Object.keys(timers).length > 0 || Object.keys(counters).length > 0) && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Function Blocks Telemetry
                    </div>
                    {Object.entries(timers).map(([addr, tData]) => (
                      <div key={addr} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                          <span>TON {addr} (Preset: {tData.preset}ms)</span>
                          <span style={{ color: tData.done ? 'var(--live-wire)' : 'var(--text-secondary)' }}>
                            {(tData.elapsed / 1000).toFixed(1)}s / {(tData.preset / 1000).toFixed(1)}s {tData.done ? '[DN]' : ''}
                          </span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--bg-card)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (tData.elapsed / tData.preset) * 100)}%`, height: '100%', background: tData.done ? 'var(--live-wire)' : 'var(--text-primary)', transition: 'width 0.1s ease' }} />
                        </div>
                      </div>
                    ))}
                    {Object.entries(counters).map(([addr, cData]) => (
                      <div key={addr} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                          <span>CTU {addr} (Preset: {cData.preset})</span>
                          <span style={{ color: cData.done ? 'var(--live-wire)' : 'var(--text-secondary)' }}>
                            Count: {cData.count} / {cData.preset} {cData.done ? '[DN]' : ''}
                          </span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--bg-card)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (cData.count / cData.preset) * 100)}%`, height: '100%', background: cData.done ? 'var(--live-wire)' : 'var(--text-primary)', transition: 'width 0.1s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE LADDER LOGIC CANVAS (Simulator 2A Visualizer) */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Canvas Bar */}
              <div style={{
                background: 'var(--bg-card)',
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="var(--text-primary)" />
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: '700' }}>
                    Live Ladder Schematic Preview (IEC 61131-3)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    RUNGS: {activePreset.ladder.rungs.length} • POWER: +24V DC
                  </span>
                </div>
              </div>

              {/* Graphical Ladder Canvas */}
              <div style={{
                padding: '24px 28px',
                background: 'var(--bg-primary)',
                position: 'relative',
                minHeight: '380px'
              }}>
                {/* Left Power Rail (L1 +24V) */}
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  top: '16px',
                  bottom: '16px',
                  width: '4px',
                  background: isScanning ? 'var(--rail-power)' : 'var(--dead-wire)',
                  borderRadius: '2px',
                  boxShadow: isScanning ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '-8px',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    color: 'var(--rail-power)'
                  }}>
                    +24V
                  </div>
                </div>

                {/* Right Neutral Rail (L2 0V) */}
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '16px',
                  bottom: '16px',
                  width: '4px',
                  background: isScanning ? 'var(--rail-neutral)' : 'var(--dead-wire)',
                  borderRadius: '2px'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    right: '-6px',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    color: 'var(--rail-neutral)'
                  }}>
                    0V
                  </div>
                </div>

                {/* Rungs Container */}
                <div style={{ marginLeft: '16px', marginRight: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {activePreset.ladder.rungs.map((rung, rIdx) => {
                    const isRungActive = Boolean(rungStates[rIdx]);

                    return (
                      <div
                        key={rung.id || rIdx}
                        style={{
                          background: 'var(--bg-surface)',
                          border: isRungActive ? '1px solid var(--live-wire)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 20px',
                          position: 'relative',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Rung Comment Header */}
                        <div style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: isRungActive ? 'var(--live-wire)' : 'var(--text-muted)',
                          marginBottom: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span style={{ fontWeight: '700' }}>RUNG #{String(rIdx).padStart(4, '0')}</span>
                          <span>—</span>
                          <span>{rung.comment}</span>
                        </div>

                        {/* Rung Schematic Line */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          position: 'relative',
                          padding: '10px 0'
                        }}>
                          {/* Horizontal Conductor Line */}
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '50%',
                            height: '2px',
                            background: isRungActive ? 'var(--live-wire)' : 'var(--dead-wire)',
                            zIndex: 1,
                            transition: 'background 0.15s ease'
                          }} />

                          {/* Left Contact Group */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                            {rung.elements.map((el, elIdx) => {
                              if (el.type === 'BRANCH') {
                                // Parallel Branch
                                return (
                                  <div
                                    key={elIdx}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '12px',
                                      background: 'var(--bg-card)',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-subtle)'
                                    }}
                                  >
                                    {el.branches.map((bBranch, bIdx) => {
                                      const branchEl = bBranch[0];
                                      const isClosed = branchEl.type === 'NO' 
                                        ? Boolean(branchEl.address.startsWith('X') ? inputs[branchEl.address] : outputs[branchEl.address])
                                        : !Boolean(branchEl.address.startsWith('X') ? inputs[branchEl.address] : outputs[branchEl.address]);

                                      return (
                                        <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            color: isClosed ? 'var(--live-wire)' : 'var(--text-muted)',
                                            background: 'var(--bg-surface)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            border: isClosed ? '1px solid var(--live-wire)' : '1px solid var(--border-subtle)'
                                          }}>
                                            {branchEl.type === 'NO' ? '—[ ]—' : '—[/]—'} {branchEl.address}
                                          </div>
                                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            {branchEl.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }

                              if (el.type === 'NO' || el.type === 'NC') {
                                const isClosed = el.type === 'NO' 
                                  ? Boolean(inputs[el.address] || outputs[el.address])
                                  : !Boolean(inputs[el.address] || outputs[el.address]);

                                return (
                                  <div
                                    key={elIdx}
                                    style={{
                                      background: 'var(--bg-card)',
                                      padding: '6px 10px',
                                      borderRadius: '6px',
                                      border: isClosed ? '1px solid var(--live-wire)' : '1px solid var(--border-subtle)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <span style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      color: isClosed ? 'var(--live-wire)' : 'var(--text-muted)'
                                    }}>
                                      {el.type === 'NO' ? '—[ ]—' : '—[/]—'}
                                    </span>
                                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '600' }}>
                                      {el.address}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                      {el.label}
                                    </span>
                                  </div>
                                );
                              }

                              if (el.type === 'TON' || el.type === 'CTU') {
                                return (
                                  <div
                                    key={elIdx}
                                    style={{
                                      background: 'var(--bg-card)',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-subtle)',
                                      textAlign: 'center'
                                    }}
                                  >
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                      [{el.type} {el.address}]
                                    </span>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                      PRE: {el.preset}
                                    </div>
                                  </div>
                                );
                              }

                              return null;
                            })}
                          </div>

                          {/* Right Output Coil */}
                          <div style={{ position: 'relative', zIndex: 2 }}>
                            {rung.elements.filter(e => e.type === 'COIL').map((coil, cIdx) => {
                              const isEnergized = Boolean(outputs[coil.address]);

                              return (
                                <div
                                  key={cIdx}
                                  style={{
                                    background: 'var(--bg-card)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: isEnergized ? '1px solid var(--live-wire)' : '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    color: isEnergized ? 'var(--live-wire)' : 'var(--text-muted)'
                                  }}>
                                    —( )—
                                  </span>
                                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '700' }}>
                                    {coil.address}
                                  </span>
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                    {coil.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulator 2A Component Palette Footer Bar */}
              <div style={{
                background: 'var(--bg-card)',
                padding: '14px 20px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Simulator 2A Palette:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['-[ ]- (NO)', '-[/]- (NC)', '-( )- (Coil)', '-(L)- (Latch)', '[ TON ]', '[ CTU ]', '[ EQU ]'].map(sym => (
                      <span
                        key={sym}
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {nextRecommended && (
                    <button
                      className="btn-primary"
                      onClick={() => onSelectProblem(nextRecommended.id)}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      <span>Open Full Studio</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: CHALLENGE CATALOG (LeetCode Style Arena)                    */}
      {/* =================================================================== */}
      {activeTab === 'challenges' && (
        <div>
          {/* Filters & Search Header */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search challenges by title or tag..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
                id="search-student-problems"
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                Status:
              </span>
              {['ALL', 'UNSOLVED', 'SOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    background: selectedStatus === st ? 'var(--bg-card)' : 'transparent',
                    border: selectedStatus === st ? '1px solid var(--text-primary)' : '1px solid transparent',
                    color: selectedStatus === st ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Difficulties */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                Difficulty:
              </span>
              {difficulties.map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    background: selectedDifficulty === diff ? 'var(--bg-card)' : 'transparent',
                    border: selectedDifficulty === diff ? '1px solid var(--text-primary)' : '1px solid transparent',
                    color: selectedDifficulty === diff ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Category Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Category:
              </span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  height: '34px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <Cpu size={32} className="spin-active" style={{ margin: '0 auto 12px auto' }} />
              <p>Loading PLC problems...</p>
            </div>
          ) : filteredProblems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                No challenges match your filters
              </p>
              <button
                className="btn-secondary"
                onClick={() => { setSearchQuery(''); setSelectedDifficulty('ALL'); setSelectedCategory('ALL'); setSelectedStatus('ALL'); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {filteredProblems.map(prob => {
                const isSolved = solvedProblemIds.has(prob.id);
                const isAttempted = attemptedProblemIds.has(prob.id);

                return (
                  <div
                    key={prob.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: isSolved 
                        ? '1px solid rgba(34, 197, 94, 0.4)' 
                        : '1px solid var(--border-muted)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'border-color 0.15s ease, transform 0.15s ease'
                    }}
                  >
                    <div>
                      {/* Top Header: Category & Difficulty */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)'
                        }}>
                          {prob.category}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            fontFamily: 'var(--font-mono)',
                            color: prob.difficulty === 'Easy' ? 'var(--live-wire)' : prob.difficulty === 'Medium' ? 'var(--plc-stop)' : 'var(--plc-fault)'
                          }}>
                            {prob.difficulty}
                          </span>

                          {isSolved && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: 'var(--live-wire)',
                              background: 'rgba(34, 197, 94, 0.12)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              <Check size={12} />
                              SOLVED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '17px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                        lineHeight: 1.3
                      }}>
                        {prob.title}
                      </h3>

                      {/* Description Preview */}
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '12.5px',
                        lineHeight: 1.5,
                        marginBottom: '16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {prob.description ? prob.description.replace(/###/g, '').replace(/\*\*/g, '').slice(0, 110) : 'Implement PLC ladder logic meeting all automated test constraints.'}...
                      </p>

                      {/* I/O Tags */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                        {(prob.inputs || []).slice(0, 3).map(inp => (
                          <span
                            key={inp.address}
                            style={{
                              fontSize: '10.5px',
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            IN: {inp.address}
                          </span>
                        ))}
                        {(prob.outputs || []).slice(0, 2).map(out => (
                          <span
                            key={out.address}
                            style={{
                              fontSize: '10.5px',
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            OUT: {out.address}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {isSolved ? 'Review Solution' : isAttempted ? 'In Progress' : 'Not Started'}
                      </span>

                      <button
                        className={isSolved ? 'btn-secondary' : 'btn-primary'}
                        onClick={() => onSelectProblem(prob.id)}
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        <span>Open in Studio</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: I/O PIN MAP & REGISTERS                                      */}
      {/* =================================================================== */}
      {activeTab === 'pinmap' && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: 0 }}>
              Virtual PLC Memory & Pin Addressing Architecture (IEC 61131-3)
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Standard hardware allocation mapping for virtual sensors, pushbuttons, coils, timers, and internal bit registers.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 20px' }}>ADDRESS RANGE</th>
                <th style={{ padding: '12px 20px' }}>TYPE</th>
                <th style={{ padding: '12px 20px' }}>DESCRIPTION</th>
                <th style={{ padding: '12px 20px' }}>ELECTRICAL / LOGIC STANDARD</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>ACCESS</th>
              </tr>
            </thead>
            <tbody>
              {[
                { range: 'X0 — X7', type: 'Digital Inputs', desc: 'Pushbuttons, Proximity Sensors, Overload Relays', std: '24V DC Sink/Source (Optically Isolated)', access: 'Read Only' },
                { range: 'Y0 — Y7', type: 'Digital Outputs', desc: 'Motor Contactors, Pilot Lamps, Solenoid Valves', std: 'Relay / 24V Transistor Sinking', access: 'Read / Write' },
                { range: 'M0 — M7', type: 'Internal Bits (Memory)', desc: 'Intermediate Logic Flags, Step Sequencers', std: 'Volatile RAM Bit Register', access: 'Read / Write' },
                { range: 'T0 — T3 (T4:0..3)', type: 'Timers (TON / TOF)', desc: 'On-Delay & Off-Delay Timers with .DN bit', std: '1 ms Resolution, 16-bit Accumulator', access: 'Read / Write' },
                { range: 'C0 — C3 (C5:0..3)', type: 'Counters (CTU / CTD)', desc: 'Up/Down Counters with Rising-Edge Detection', std: '16-bit Signed Accumulator', access: 'Read / Write' },
                { range: 'N7:0 — N7:7', type: 'Integer Words', desc: 'Analog setpoints, recipe registers', std: '16-bit Signed Integer (-32768..32767)', access: 'Read / Write' }
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {row.range}
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: '600' }}>
                    {row.type}
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                    {row.desc}
                  </td>
                  <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {row.std}
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)' }}>
                    {row.access}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: SUBMISSIONS & TEST LOG                                       */}
      {/* =================================================================== */}
      {activeTab === 'history' && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: 0 }}>
              Virtual PLC Test Evaluation Log
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Chronological log of automated IEC testbench submissions for student <strong>{user?.name || 'Trainee'}</strong>.
            </p>
          </div>

          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <Clock size={32} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
              <p>No test bench submissions recorded yet.</p>
              <button
                className="btn-primary"
                onClick={() => nextRecommended && onSelectProblem(nextRecommended.id)}
                style={{ marginTop: '14px', padding: '6px 14px', fontSize: '12px' }}
              >
                Launch First Challenge
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 20px' }}>RUN ID</th>
                  <th style={{ padding: '12px 20px' }}>CHALLENGE</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center' }}>RESULT</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center' }}>TESTS PASSED</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {submissions.slice().reverse().map((sub, sIdx) => (
                  <tr key={sub.id || sIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      #{String(sub.id || sIdx + 1).slice(-6)}
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {sub.problemTitle || `Problem ${sub.problemId}`}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: sub.isAccepted ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: sub.isAccepted ? 'var(--live-wire)' : 'var(--plc-fault)',
                        border: sub.isAccepted ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {sub.isAccepted ? 'ACCEPTED' : 'FAILED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {sub.passedCount || (sub.isAccepted ? 'All' : '0')} / {sub.totalTests || 'All'}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
