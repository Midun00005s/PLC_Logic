import React, { useState, useEffect, useRef } from 'react';
import LadderEditor from '../components/LadderEditor/LadderEditor';
import VirtualIOPanel from '../components/VirtualIO/VirtualIOPanel';
import TestResultsPanel from '../components/TestResults/TestResultsPanel';
import { useAuth } from '../context/AuthContext';
import { VirtualPLC, validateLadder } from '../../../server/plc/ladderEngine';
import {
  ArrowLeft,
  RotateCcw,
  Save,
  CheckCircle2,
  Cpu,
  Layers,
  FileText,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  Download,
  Terminal,
  Shield,
  Activity,
  Zap,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Radio,
  Cloud,
  CloudOff,
  RefreshCw,
  Clock
} from 'lucide-react';

function renderInlineFormatted(text) {
  if (!text) return null;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldText = token.slice(2, -2);
      parts.push(
        <strong key={match.index} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
          {boldText}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const codeText = token.slice(1, -1);
      let badgeColor = 'var(--text-primary)';
      let badgeBg = 'rgba(255, 255, 255, 0.07)';
      let badgeBorder = 'var(--border-subtle)';

      if (/^X\d+/i.test(codeText) || codeText.includes('X0') || codeText.includes('X1') || codeText.includes('X2')) {
        badgeColor = '#10b981';
        badgeBg = 'rgba(16, 185, 129, 0.12)';
        badgeBorder = 'rgba(16, 185, 129, 0.3)';
      } else if (/^Y\d+/i.test(codeText) || codeText.includes('Y0') || codeText.includes('Y1')) {
        badgeColor = '#38bdf8';
        badgeBg = 'rgba(56, 189, 248, 0.12)';
        badgeBorder = 'rgba(56, 189, 248, 0.3)';
      } else if (/^T\d+/i.test(codeText)) {
        badgeColor = '#f59e0b';
        badgeBg = 'rgba(245, 158, 11, 0.12)';
        badgeBorder = 'rgba(245, 158, 11, 0.3)';
      } else if (/^M\d+/i.test(codeText)) {
        badgeColor = '#c084fc';
        badgeBg = 'rgba(192, 132, 252, 0.12)';
        badgeBorder = 'rgba(192, 132, 252, 0.3)';
      }

      parts.push(
        <code
          key={match.index}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            background: badgeBg,
            border: `1px solid ${badgeBorder}`,
            color: badgeColor,
            padding: '1.5px 5.5px',
            borderRadius: '4px',
            fontWeight: '600',
            letterSpacing: '0.02em',
            margin: '0 2px'
          }}
        >
          {codeText}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

function FormattedDescription({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith('### ')) {
      const heading = line.replace('### ', '').trim();
      elements.push(
        <div
          key={`heading-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '18px 0 8px 0',
            paddingBottom: '5px',
            borderBottom: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontWeight: '700',
            fontSize: '11px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span style={{ width: '3px', height: '12px', background: '#10b981', borderRadius: '2px' }} />
          <span>{heading}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      const num = match[1];
      const body = match[2];
      elements.push(
        <div
          key={`req-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '8px 10px',
            margin: '6px 0',
            fontSize: '12px',
            lineHeight: 1.55
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              flexShrink: 0,
              marginTop: '1px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {num}
          </div>
          <div style={{ flex: 1, color: 'var(--text-secondary)' }}>
            {renderInlineFormatted(body)}
          </div>
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const body = line.substring(2);
      elements.push(
        <div
          key={`bullet-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            margin: '4px 0',
            padding: '3px 6px',
            fontSize: '11.5px',
            lineHeight: 1.5,
            color: 'var(--text-secondary)'
          }}
        >
          <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px', lineHeight: '14px' }}>•</span>
          <div style={{ flex: 1 }}>{renderInlineFormatted(body)}</div>
        </div>
      );
    } else {
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            fontSize: '12.5px',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            margin: '4px 0 8px 0'
          }}
        >
          {renderInlineFormatted(line)}
        </p>
      );
    }
  }

  return <div style={{ display: 'flex', flexDirection: 'column' }}>{elements}</div>;
}

export default function Problem({ problemId, onBack, onOpenLeaderboard }) {
  const { user, setUser } = useAuth();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PLC Execution State
  const [ladder, setLadder] = useState({ rungs: [] });
  const [inputs, setInputs] = useState({});
  const [outputs, setOutputs] = useState({});
  const [timers, setTimers] = useState({});
  const [counters, setCounters] = useState({});
  const [fault, setFault] = useState('NORMAL');
  const [isScanning, setIsScanning] = useState(true);
  const [rungStates, setRungStates] = useState([]);
  const [plcState, setPlcState] = useState(null);

  // Sidebar collapse states (persisted across sessions)
  const [leftTab, setLeftTab] = useState('problem');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => {
    try {
      return localStorage.getItem('plc_left_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isRightCollapsed, setIsRightCollapsed] = useState(() => {
    try {
      return localStorage.getItem('plc_right_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleLeftPanel = () => {
    setIsLeftCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('plc_left_collapsed', next); } catch {}
      return next;
    });
  };

  const toggleRightPanel = () => {
    setIsRightCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('plc_right_collapsed', next); } catch {}
      return next;
    });
  };

  // Save / Restore & Validation State
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error' | 'idle'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState(null);
  const [hasSavedProgram, setHasSavedProgram] = useState(false);
  const [syntaxValidation, setSyntaxValidation] = useState({ valid: true, errors: [] });
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Test Execution State
  const [testData, setTestData] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(260);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Virtual PLC instance ref for continuous simulation
  const plcRef = useRef(new VirtualPLC());

  // Refs for tracking changes and debounce autosave
  const isLoadedRef = useRef(false);
  const lastSavedJsonRef = useRef('');
  const autosaveTimerRef = useRef(null);
  const ladderRef = useRef(ladder);
  ladderRef.current = ladder;

  // Helper to build headers with auth token and userId fallback
  const getAuthHeaders = () => {
    const token = localStorage.getItem('plc_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token && token !== 'offline-token') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (user?.id) {
      headers['x-user-id'] = user.id;
    }
    return headers;
  };

  // Check saved storage existence
  const checkSavedStorage = (id) => {
    try {
      const uKey = user?.id ? `plc_workspace_${user.id}_${id}` : null;
      const savedUser = uKey ? localStorage.getItem(uKey) : null;
      const savedGeneric = localStorage.getItem(`plc_program_${id}`);
      setHasSavedProgram(Boolean(savedUser || savedGeneric));
    } catch {
      setHasSavedProgram(false);
    }
  };

  // Save workspace to backend API + local fallback
  const persistWorkspace = async (currentLadder, isManual = false) => {
    if (!currentLadder || !Array.isArray(currentLadder.rungs) || !problemId) return;

    // Check if ladder actually has content or differs from what was saved
    const ladderJson = JSON.stringify(currentLadder);
    if (!isManual && ladderJson === lastSavedJsonRef.current) {
      return;
    }

    try {
      setSaveStatus('saving');
      setSaveErrorMessage(null);

      // Save locally first as instant fallback
      if (user?.id) {
        localStorage.setItem(`plc_workspace_${user.id}_${problemId}`, ladderJson);
      }
      localStorage.setItem(`plc_program_${problemId}`, ladderJson);
      setHasSavedProgram(true);

      const res = await fetch(`/api/workspaces/problem/${problemId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ladder: currentLadder,
          userId: user?.id,
          userName: user?.name,
          plcState: plcState ? {
            fault: plcState.fault,
            scanCount: plcState.scanCount
          } : null
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      lastSavedJsonRef.current = ladderJson;
      setSaveStatus('saved');
      setLastSavedTime(new Date());
    } catch (err) {
      console.warn('Autosave failed:', err);
      setSaveStatus('error');
      setSaveErrorMessage(err.message);
    }
  };

  // Load problem specifications and restore latest saved workspace
  useEffect(() => {
    let isMounted = true;

    async function fetchProblemAndWorkspace() {
      try {
        setLoading(true);
        isLoadedRef.current = false;

        // 1. Fetch problem specs
        const res = await fetch(`/api/problems/${problemId}`);
        if (!res.ok) throw new Error('Problem not found');
        const data = await res.json();
        if (!isMounted) return;
        setProblem(data);

        // 2. Fetch backend saved workspace for this user
        let restoredLadder = null;
        let restoredTestHistory = null;

        try {
          const wsRes = await fetch(`/api/workspaces/problem/${problemId}`, {
            headers: getAuthHeaders()
          });
          if (wsRes.ok) {
            const wsData = await wsRes.json();
            if (wsData.workspace && wsData.workspace.ladder?.rungs?.length > 0) {
              restoredLadder = wsData.workspace.ladder;
              restoredTestHistory = wsData.workspace.testHistory || null;
            }
          }
        } catch (wsErr) {
          console.warn('Could not load remote workspace, trying local cache', wsErr);
        }

        // 3. Fallback to localStorage if no remote workspace found
        if (!restoredLadder) {
          const uKey = user?.id ? `plc_workspace_${user.id}_${problemId}` : null;
          const localSavedRaw = (uKey && localStorage.getItem(uKey)) || localStorage.getItem(`plc_program_${problemId}`);
          if (localSavedRaw) {
            try {
              const parsed = JSON.parse(localSavedRaw);
              if (parsed?.rungs?.length > 0) {
                restoredLadder = parsed;
              }
            } catch {}
          }
        }

        // 4. Apply restored ladder or starter code
        if (restoredLadder) {
          setLadder(restoredLadder);
          lastSavedJsonRef.current = JSON.stringify(restoredLadder);
          setHasSavedProgram(true);
          setSaveStatus('saved');
          setLastSavedTime(new Date());
        } else {
          initStarter(data);
          setSaveStatus('idle');
        }

        // Restore test history if available
        if (restoredTestHistory) {
          setTestData({
            passed: restoredTestHistory.passed || restoredTestHistory.isAccepted || false,
            scorePercent: restoredTestHistory.scorePercent || 0,
            passedCount: restoredTestHistory.passedTests || 0,
            totalTests: restoredTestHistory.totalTests || (data.publicTests?.length || 0),
            isRestoredHistory: true,
            testedAt: restoredTestHistory.testedAt || restoredTestHistory.submittedAt
          });
        }

        // Initialize inputs
        const initialInp = {};
        (data.inputs || []).forEach(inp => {
          initialInp[inp.address] = false;
        });
        setInputs(initialInp);
        checkSavedStorage(problemId);

        // Mark problem loaded so autosave can engage safely on subsequent edits
        setTimeout(() => {
          if (isMounted) isLoadedRef.current = true;
        }, 300);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    function initStarter(data) {
      let starter;
      if (data.starterLadder?.rungs?.length > 0) {
        starter = JSON.parse(JSON.stringify(data.starterLadder));
      } else {
        starter = {
          rungs: [
            {
              id: 'rung-1',
              comment: 'Initial Rung',
              elements: [
                { type: 'NO', address: data.inputs?.[0]?.address || 'X0' },
                { type: 'COIL', address: data.outputs?.[0]?.address || 'Y0' }
              ]
            }
          ]
        };
      }
      setLadder(starter);
      lastSavedJsonRef.current = JSON.stringify(starter);
    }

    fetchProblemAndWorkspace();

    return () => {
      isMounted = false;
      // On unmount/navigation, immediately flush any pending autosave
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      if (isLoadedRef.current && ladderRef.current) {
        persistWorkspace(ladderRef.current, true).catch(() => {});
      }
    };
  }, [problemId, user?.id]);

  // Debounced Autosave (1500ms) triggered whenever the ladder logic changes
  useEffect(() => {
    if (!isLoadedRef.current || !problem) return;

    const currentJson = JSON.stringify(ladder);
    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    setSaveStatus('saving');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      persistWorkspace(ladder, false);
    }, 1500);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [ladder, problem]);

  // Live syntax validation whenever ladder structure changes
  useEffect(() => {
    if (ladder) {
      const v = validateLadder(ladder);
      setSyntaxValidation(v);
    }
  }, [ladder]);

  // Continuous Virtual PLC Scan Loop (~20Hz = 50ms)
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      const plc = plcRef.current;
      plc.setFault(fault);
      plc.setInputs(inputs);

      const result = plc.scan(ladder, 50);

      setOutputs({ ...result.outputs });
      setTimers(JSON.parse(JSON.stringify(result.timers)));
      setCounters(JSON.parse(JSON.stringify(result.counters)));
      setRungStates(result.rungEvaluations || []);
      setPlcState({
        inputs: result.inputs,
        outputs: result.outputs,
        memory: result.memory,
        timers: result.timers,
        counters: result.counters,
        fault: result.fault,
        scanCount: result.scanCount
      });
    }, 50);

    return () => clearInterval(interval);
  }, [ladder, inputs, fault, isScanning]);

  // Single step scan execution
  const handleStepScan = () => {
    const plc = plcRef.current;
    plc.setFault(fault);
    plc.setInputs(inputs);

    const result = plc.scan(ladder, 50);

    setOutputs({ ...result.outputs });
    setTimers(JSON.parse(JSON.stringify(result.timers)));
    setCounters(JSON.parse(JSON.stringify(result.counters)));
    setRungStates(result.rungEvaluations || []);
    setPlcState({
      inputs: result.inputs,
      outputs: result.outputs,
      memory: result.memory,
      timers: result.timers,
      counters: result.counters,
      fault: result.fault,
      scanCount: result.scanCount
    });
  };

  // Reset Virtual PLC state
  const handleResetPlc = () => {
    plcRef.current.reset();
    const cleanInputs = {};
    (problem?.inputs || []).forEach(inp => { cleanInputs[inp.address] = false; });
    setInputs(cleanInputs);
    setOutputs({});
    setFault('NORMAL');
  };

  // Manual immediate save button handler
  const handleSaveProgram = async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    await persistWorkspace(ladder, true);
  };

  // Restore saved ladder from server or localStorage
  const handleRestoreProgram = async () => {
    try {
      let restored = null;
      // Try backend first
      try {
        const wsRes = await fetch(`/api/workspaces/problem/${problem.id}`, {
          headers: getAuthHeaders()
        });
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          if (wsData.workspace?.ladder?.rungs?.length > 0) {
            restored = wsData.workspace.ladder;
          }
        }
      } catch {}

      // Fallback to local
      if (!restored) {
        const uKey = user?.id ? `plc_workspace_${user.id}_${problem.id}` : null;
        const raw = (uKey && localStorage.getItem(uKey)) || localStorage.getItem(`plc_program_${problem.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.rungs) restored = parsed;
        }
      }

      if (restored) {
        setLadder(restored);
        lastSavedJsonRef.current = JSON.stringify(restored);
        handleResetPlc();
        setSaveStatus('saved');
        setLastSavedTime(new Date());
      }
    } catch (err) {
      alert('Could not restore program: ' + err.message);
    }
  };

  // Revert ladder to starter template and clear saved workspace
  const handleRevertLadder = async () => {
    if (!problem?.starterLadder) return;
    if (window.confirm('Reset ladder logic to original starter code? Any saved progress on this challenge will be reset.')) {
      const starter = JSON.parse(JSON.stringify(problem.starterLadder));
      setLadder(starter);
      lastSavedJsonRef.current = JSON.stringify(starter);
      handleResetPlc();

      // Clear local storage
      if (user?.id) {
        localStorage.removeItem(`plc_workspace_${user.id}_${problem.id}`);
      }
      localStorage.removeItem(`plc_program_${problem.id}`);
      setHasSavedProgram(false);
      setSaveStatus('idle');

      // Clear server workspace
      try {
        await fetch(`/api/workspaces/problem/${problem.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (err) {
        console.warn('Failed to delete workspace on server:', err);
      }
    }
  };

  // Run Public Test Cases (Run Code)
  const handleRunPublicTests = async () => {
    try {
      setIsRunningTests(true);
      setIsBottomCollapsed(false);
      const res = await fetch('/api/simulation/test', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ladder,
          problemId: problem.id,
          userId: user?.id
        })
      });
      const data = await res.json();
      setTestData(data);
      setSubmissionData(null);
    } catch (err) {
      alert('Error running tests: ' + err.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Submit Solution (Runs Public + Hidden Test Cases)
  const handleSubmitSolution = async () => {
    try {
      setIsSubmitting(true);
      setIsBottomCollapsed(false);
      // Ensure latest workspace is saved on submit
      persistWorkspace(ladder, true).catch(() => {});

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          problemId: problem.id,
          ladder,
          userId: user?.id,
          userName: user?.name
        })
      });
      const data = await res.json();
      setSubmissionData(data);

      if (data.updatedUser && setUser) {
        setUser(data.updatedUser);
      }

      if (data.isAccepted) {
        setShowCelebrationModal(true);
      }
      return data;
    } catch (err) {
      alert('Error submitting solution: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <Cpu size={40} className="spin-active" style={{ margin: '0 auto 16px auto', color: 'var(--text-primary)' }} />
          <div>Loading Industrial PLC Challenge & Specifications...</div>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="alert-banner error" style={{ maxWidth: '500px', margin: '0 auto' }}>
          {error || 'Problem not found'}
        </div>
        <button className="btn-secondary" onClick={onBack} style={{ marginTop: '20px' }}>
          <ArrowLeft size={14} /> Back to Problems
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Top Professional Toolbar */}
      <div style={{
        height: '52px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        gap: '12px'
      }}>
        {/* Left: Problem Details & Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '12px', flexShrink: 0 }}
            title="Return to Problem Dashboard"
            id="btn-back-dashboard"
          >
            <ArrowLeft size={14} /> Problems
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <h2 style={{
              fontSize: '14.5px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-heading)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {problem.title}
            </h2>

            <span style={{
              fontSize: '10.5px',
              fontWeight: '600',
              padding: '2px 7px',
              borderRadius: '4px',
              background: problem.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : problem.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: problem.difficulty === 'Easy' ? '#10b981' : problem.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
              border: problem.difficulty === 'Easy' ? '1px solid rgba(16, 185, 129, 0.3)' : problem.difficulty === 'Medium' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              flexShrink: 0
            }}>
              {problem.difficulty}
            </span>

            {/* Live Autosave & Persistence Status Indicator */}
            <div
              id="autosave-status-indicator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '500',
                background: saveStatus === 'saving'
                  ? 'rgba(56, 189, 248, 0.12)'
                  : saveStatus === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(16, 185, 129, 0.12)',
                color: saveStatus === 'saving'
                  ? '#38bdf8'
                  : saveStatus === 'error'
                  ? '#ef4444'
                  : '#10b981',
                border: saveStatus === 'saving'
                  ? '1px solid rgba(56, 189, 248, 0.3)'
                  : saveStatus === 'error'
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(16, 185, 129, 0.25)',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
              title={saveStatus === 'error' ? (saveErrorMessage || 'Save failed') : (lastSavedTime ? `Last saved at ${lastSavedTime.toLocaleTimeString()}` : 'Workspace synced')}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw size={11} className="spin-active" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <CloudOff size={11} />
                  <span>Save failed</span>
                </>
              ) : (
                <>
                  <Cloud size={11} />
                  <span>{lastSavedTime ? `Saved ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Saved'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Syntax Validation Status Indicator */}
          <button
            onClick={() => setShowValidationModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 9px',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              borderRadius: '4px',
              border: syntaxValidation.valid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
              background: syntaxValidation.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
              color: syntaxValidation.valid ? '#10b981' : '#f87171',
              cursor: 'pointer'
            }}
            title="Inspect syntax and rung validation"
          >
            {syntaxValidation.valid ? <Check size={12} /> : <AlertTriangle size={12} />}
            <span>{syntaxValidation.valid ? 'Syntax OK' : `${syntaxValidation.errors.length} Syntax Warn`}</span>
          </button>

          {/* Immediate Save & Restore buttons */}
          <button
            onClick={handleSaveProgram}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '11.5px' }}
            title="Save your current ladder logic immediately to persistent database"
            id="btn-save-program"
          >
            <Save size={12} /> Save
          </button>

          {hasSavedProgram && (
            <button
              onClick={handleRestoreProgram}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '11.5px' }}
              title="Restore latest saved workspace from database/storage"
              id="btn-restore-program"
            >
              <Download size={12} /> Restore
            </button>
          )}

          <button
            onClick={handleRevertLadder}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '11.5px' }}
            title="Revert back to initial starter code"
            id="btn-revert-starter"
          >
            <RotateCcw size={12} /> Reset
          </button>

          <button
            onClick={toggleLeftPanel}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '11.5px', background: isLeftCollapsed ? 'var(--bg-card-hover)' : 'var(--bg-card)' }}
            title={isLeftCollapsed ? 'Show Problem Specifications (Slide Right)' : 'Collapse Specifications (Slide Left)'}
            id="btn-toggle-specs-panel"
          >
            <FileText size={12} />
            {isLeftCollapsed ? 'Show Specs' : 'Hide Specs'}
          </button>

          <button
            onClick={toggleRightPanel}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '11.5px', background: isRightCollapsed ? 'var(--bg-card-hover)' : 'var(--bg-card)' }}
            title={isRightCollapsed ? 'Show PLC Run & I/O Rack (Slide Left)' : 'Collapse PLC Run Panel (Slide Right)'}
            id="btn-toggle-plc-panel"
          >
            <Radio size={12} />
            {isRightCollapsed ? 'Show PLC Run' : 'Hide PLC Run'}
          </button>

          <button
            onClick={handleRunPublicTests}
            disabled={isRunningTests || isSubmitting}
            className="btn-secondary"
            style={{ padding: '5px 12px', fontSize: '12px', background: 'var(--bg-card)' }}
            id="btn-top-run-code"
          >
            {isRunningTests ? 'Running...' : 'Run Public Tests'}
          </button>

          <button
            onClick={handleSubmitSolution}
            disabled={isRunningTests || isSubmitting}
            className="btn-primary"
            style={{ padding: '5px 14px', fontSize: '12px' }}
            id="btn-top-submit"
          >
            {isSubmitting ? 'Evaluating...' : 'Submit Solution'}
          </button>
        </div>
      </div>

      {/* Main 3-Column Split View */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left Column: Problem Statement & I/O Specifications */}
        <div style={{
          width: isLeftCollapsed ? '0px' : '330px',
          borderRight: isLeftCollapsed ? 'none' : '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0
        }}>
          {/* Subtabs: Description | Pin Mapping | Test Cases */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)', alignItems: 'center' }}>
            <button
              onClick={() => setLeftTab('problem')}
              style={{
                flex: 1,
                padding: '9px 6px',
                fontSize: '11.5px',
                fontWeight: '600',
                color: leftTab === 'problem' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: leftTab === 'problem' ? '2px solid var(--text-primary)' : 'none',
                background: leftTab === 'problem' ? 'var(--bg-card-hover)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <FileText size={12} /> Specs
            </button>
            <button
              onClick={() => setLeftTab('pins')}
              style={{
                flex: 1,
                padding: '9px 6px',
                fontSize: '11.5px',
                fontWeight: '600',
                color: leftTab === 'pins' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: leftTab === 'pins' ? '2px solid var(--text-primary)' : 'none',
                background: leftTab === 'pins' ? 'var(--bg-card-hover)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Sliders size={12} /> I/O Map
            </button>
            <button
              onClick={() => setLeftTab('tests')}
              style={{
                flex: 1,
                padding: '9px 6px',
                fontSize: '11.5px',
                fontWeight: '600',
                color: leftTab === 'tests' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: leftTab === 'tests' ? '2px solid var(--text-primary)' : 'none',
                background: leftTab === 'tests' ? 'var(--bg-card-hover)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Terminal size={12} /> Tests
            </button>
            <button
              onClick={toggleLeftPanel}
              style={{
                padding: '0 8px',
                height: '35px',
                background: 'transparent',
                border: 'none',
                borderLeft: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Slide & Collapse Description Panel"
              id="btn-collapse-specs-header"
            >
              <ChevronLeft size={13} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
            {leftTab === 'problem' && (
              <FormattedDescription text={problem.description} />
            )}

            {leftTab === 'pins' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Digital Inputs Allocation
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <tbody>
                      {(problem.inputs || []).map(inp => (
                        <tr key={inp.address} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '6px 4px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#10b981' }}>
                            {inp.address}
                          </td>
                          <td style={{ padding: '6px 4px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {inp.name}
                          </td>
                          <td style={{ padding: '6px 4px', color: 'var(--text-dim)', fontSize: '11px' }}>
                            {inp.description || inp.type || 'Digital'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Digital Outputs Allocation
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <tbody>
                      {(problem.outputs || []).map(out => (
                        <tr key={out.address} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '6px 4px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#38bdf8' }}>
                            {out.address}
                          </td>
                          <td style={{ padding: '6px 4px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {out.name}
                          </td>
                          <td style={{ padding: '6px 4px', color: 'var(--text-dim)', fontSize: '11px' }}>
                            {out.description || 'Actuator Coil'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {problem.memory && problem.memory.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Internal Memory Allocation (B3 / M Bits)
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        {problem.memory.map(mem => (
                          <tr key={mem.address} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '6px 4px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#f59e0b' }}>
                              {mem.address}
                            </td>
                            <td style={{ padding: '6px 4px', fontWeight: '500', color: 'var(--text-primary)' }}>
                              {mem.name}
                            </td>
                            <td style={{ padding: '6px 4px', color: 'var(--text-dim)', fontSize: '11px' }}>
                              {mem.description || 'Internal Bit Flag'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Standard Registers & Function Blocks
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div>• <strong>M0..M15:</strong> Internal Bit Relays (auxiliary flags, latches)</div>
                    <div>• <strong>T0..T3:</strong> Timers (TON On-Delay, reads T0.DN)</div>
                    <div>• <strong>C0..C3:</strong> Counters (CTU Up-Counter, reads C0.DN)</div>
                  </div>
                </div>
              </div>
            )}

            {leftTab === 'tests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Public Test Scenarios evaluated on verification:
                </div>

                {(problem.publicTests || []).map((tc, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: '6px',
                      padding: '10px'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {tc.name}
                    </div>
                    {tc.description && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {tc.description}
                      </div>
                    )}
                    <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      {tc.steps?.length || 1} Step(s) Sequence
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Left Floating Sliding Arrow Handle */}
        <button
          onClick={toggleLeftPanel}
          style={{
            position: 'absolute',
            left: isLeftCollapsed ? '0px' : '330px',
            top: '45%',
            transform: 'translateY(-50%)',
            zIndex: 45,
            width: '18px',
            height: '46px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            borderLeft: isLeftCollapsed ? 'none' : '1px solid var(--border-muted)',
            borderRadius: isLeftCollapsed ? '0 6px 6px 0' : '6px 0 0 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isLeftCollapsed ? '#10b981' : 'var(--text-secondary)',
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s, color 0.15s',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            padding: 0
          }}
          title={isLeftCollapsed ? 'Slide to Show Description & Specs' : 'Slide to Hide Description & Specs'}
          id="arrow-slide-left-panel"
        >
          {isLeftCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Right Floating Sliding Arrow Handle */}
        <button
          onClick={toggleRightPanel}
          style={{
            position: 'absolute',
            right: isRightCollapsed ? '0px' : '340px',
            top: '45%',
            transform: 'translateY(-50%)',
            zIndex: 45,
            width: '18px',
            height: '46px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            borderRight: isRightCollapsed ? 'none' : '1px solid var(--border-muted)',
            borderRadius: isRightCollapsed ? '6px 0 0 6px' : '0 6px 6px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isRightCollapsed ? '#38bdf8' : 'var(--text-secondary)',
            transition: 'right 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s, color 0.15s',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            padding: 0
          }}
          title={isRightCollapsed ? 'Slide to Show PLC Run & Hardware Rack' : 'Slide to Hide PLC Run & Hardware Rack'}
          id="arrow-slide-right-panel"
        >
          {isRightCollapsed ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>

        {/* Center Column: The Visual Ladder Logic Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <LadderEditor
              ladder={ladder}
              setLadder={setLadder}
              problemInputs={problem.inputs || []}
              problemOutputs={problem.outputs || []}
              problemMemory={problem.memory || []}
              rungStates={rungStates}
              plcState={plcState}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
              onStepScan={handleStepScan}
              onResetPlc={handleResetPlc}
            />
          </div>

          {/* Collapsible Bottom Test Results Drawer */}
          <div style={{
            height: isBottomCollapsed ? '38px' : `${bottomPanelHeight}px`,
            transition: 'height 0.2s ease',
            borderTop: '2px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div
              style={{
                height: '38px',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                cursor: 'pointer',
                borderBottom: isBottomCollapsed ? 'none' : '1px solid var(--border-subtle)'
              }}
              onClick={() => setIsBottomCollapsed(!isBottomCollapsed)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
                <Terminal size={14} />
                <span>Test Bench & Diagnostics</span>
                {(testData || submissionData) && (
                  <span style={{
                    fontSize: '11px',
                    color: (submissionData?.isAccepted || testData?.passed) ? '#10b981' : '#f59e0b',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    • {(submissionData ? submissionData.passedTests : testData?.passedCount)}/
                    {(submissionData ? submissionData.totalTests : testData?.totalCount)} Passed
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                {isBottomCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {!isBottomCollapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <TestResultsPanel
                  testData={testData}
                  submissionData={submissionData}
                  isRunningTests={isRunningTests}
                  isSubmitting={isSubmitting}
                  onRunPublicTests={handleRunPublicTests}
                  onSubmitSolution={handleSubmitSolution}
                  onOpenLeaderboard={onOpenLeaderboard}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Virtual I/O Hardware Rack & Plant Twin */}
        <div style={{
          width: isRightCollapsed ? '0px' : '340px',
          height: '100%',
          overflow: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderLeft: isRightCollapsed ? 'none' : '1px solid var(--border-subtle)'
        }}>
          <div style={{ width: '340px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <VirtualIOPanel
              inputs={inputs}
              setInputs={setInputs}
              outputs={outputs}
              timers={timers}
              counters={counters}
              fault={fault}
              setFault={setFault}
              problem={problem}
              plcState={plcState}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
              onStepScan={handleStepScan}
              onResetPlc={handleResetPlc}
              onCollapse={toggleRightPanel}
            />
          </div>
        </div>
      </div>

      {/* Syntax Validation Diagnostic Modal */}
      {showValidationModal && (
        <div className="modal-overlay" onClick={() => setShowValidationModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                {syntaxValidation.valid ? <CheckCircle2 size={20} color="#10b981" /> : <AlertTriangle size={20} color="#ef4444" />}
                <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {syntaxValidation.valid ? 'Ladder Logic Validated' : 'Syntax & Rule Diagnostics'}
                </h3>
              </div>

              {syntaxValidation.valid ? (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  ✓ All rungs comply with IEC 61131-3 virtual syntax rules.
                  <br />✓ Contacts and coils have valid, non-empty I/O addresses.
                  <br />✓ Timer and counter prefixes (T, C) are correctly formatted.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    Please resolve the following before running tests:
                  </p>
                  {syntaxValidation.errors.map((errText, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                        color: '#f87171'
                      }}
                    >
                      {errText}
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn-secondary"
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => setShowValidationModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Success Modal */}
      {showCelebrationModal && submissionData && (
        <div className="modal-overlay" onClick={() => setShowCelebrationModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', textAlign: 'center' }}>
            <div style={{ padding: '32px 24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid #10b981',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ fontSize: '22px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', marginBottom: '8px' }}>
                All Tests Accepted!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '14px' }}>
                Your PLC Ladder Logic passed 100% of public test cases and hidden industrial edge cases!
              </p>

              {submissionData.isFirstSolve ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '20px'
                }}>
                  <Award size={14} />
                  <span>+100 PTS Added to Leaderboard!</span>
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  color: '#38bdf8',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  marginBottom: '20px'
                }}>
                  <CheckCircle2 size={14} />
                  <span>Problem already solved — unique solve count preserved as 1.</span>
                </div>
              )}

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Public Tests</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                    {submissionData.publicSummary?.passed} / {submissionData.publicSummary?.total}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Hidden Tests</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                    {submissionData.hiddenSummary?.passed} / {submissionData.hiddenSummary?.total}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowCelebrationModal(false)}
                >
                  Continue Practicing
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowCelebrationModal(false);
                    onOpenLeaderboard();
                  }}
                >
                  <Award size={15} /> View Leaderboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
