import React, { useState, useEffect, useRef } from 'react';
import LadderEditor from '../components/LadderEditor/LadderEditor';
import VirtualIOPanel from '../components/VirtualIO/VirtualIOPanel';
import TestResultsPanel from '../components/TestResults/TestResultsPanel';
import { useAuth } from '../context/AuthContext';
import { VirtualPLC } from '../../../server/plc/ladderEngine';
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
  Sliders
} from 'lucide-react';

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

  // Left sidebar tabs: 'problem' | 'pins'
  const [leftTab, setLeftTab] = useState('problem');

  // Test Execution State
  const [testData, setTestData] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(260);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Virtual PLC instance ref for continuous high-speed simulation
  const plcRef = useRef(new VirtualPLC());

  // Load problem details
  useEffect(() => {
    async function fetchProblem() {
      try {
        setLoading(true);
        const res = await fetch(`/api/problems/${problemId}`);
        if (!res.ok) throw new Error('Problem not found');
        const data = await res.json();
        setProblem(data);

        // Load starter ladder logic
        if (data.starterLadder?.rungs?.length > 0) {
          setLadder(JSON.parse(JSON.stringify(data.starterLadder)));
        } else {
          setLadder({
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
          });
        }

        // Initialize inputs
        const initialInp = {};
        (data.inputs || []).forEach(inp => {
          initialInp[inp.address] = false;
        });
        setInputs(initialInp);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [problemId]);

  // Continuous Virtual PLC Scan Loop (Runs at ~20Hz = 50ms)
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

  // Revert ladder to starter template
  const handleRevertLadder = () => {
    if (!problem?.starterLadder) return;
    if (window.confirm('Reset ladder logic to original starter code? Any unsaved edits will be lost.')) {
      setLadder(JSON.parse(JSON.stringify(problem.starterLadder)));
      handleResetPlc();
    }
  };

  // Run Public Test Cases (Run Code)
  const handleRunPublicTests = async () => {
    try {
      setIsRunningTests(true);
      setIsBottomCollapsed(false);
      const res = await fetch('/api/simulation/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ladder,
          problemId: problem.id
        })
      });
      const data = await res.json();
      setTestData(data);
      setSubmissionData(null); // Clear previous submission view
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
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          <Cpu size={40} className="spin-active" style={{ margin: '0 auto 16px auto', color: 'var(--plc-cyan)' }} />
          <div>Loading PLC Logic Problem & Specifications...</div>
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
      {/* Top Workspace Header Bar */}
      <div style={{
        height: '52px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '12px' }}
            title="Return to Problem Dashboard"
            id="btn-back-dashboard"
          >
            <ArrowLeft size={14} /> Problems
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
              {problem.title}
            </h2>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '4px',
              background: problem.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : problem.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: problem.difficulty === 'Easy' ? '#10b981' : problem.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
              border: problem.difficulty === 'Easy' ? '1px solid rgba(16, 185, 129, 0.3)' : problem.difficulty === 'Medium' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {problem.difficulty}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRevertLadder}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Revert back to starter ladder"
            id="btn-revert-starter"
          >
            <RotateCcw size={13} />
            Reset Code
          </button>

          <button
            onClick={handleRunPublicTests}
            disabled={isRunningTests || isSubmitting}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12.5px', background: 'var(--bg-card)' }}
            id="btn-top-run-code"
          >
            {isRunningTests ? 'Running...' : 'Run Public Tests'}
          </button>

          <button
            onClick={handleSubmitSolution}
            disabled={isRunningTests || isSubmitting}
            className="btn-primary"
            style={{ padding: '6px 16px', fontSize: '12.5px' }}
            id="btn-top-submit"
          >
            {isSubmitting ? 'Evaluating...' : 'Submit Solution'}
          </button>
        </div>
      </div>

      {/* Main 3-Column Split View */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Column: Problem Statement & I/O Specifications */}
        <div style={{
          width: '320px',
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Subtabs: Description vs Pin Mapping */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
            <button
              onClick={() => setLeftTab('problem')}
              style={{
                flex: 1,
                padding: '9px 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: leftTab === 'problem' ? 'var(--plc-cyan)' : 'var(--text-muted)',
                borderBottom: leftTab === 'problem' ? '2px solid var(--plc-cyan)' : 'none',
                background: leftTab === 'problem' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <FileText size={13} /> Description
            </button>
            <button
              onClick={() => setLeftTab('pins')}
              style={{
                flex: 1,
                padding: '9px 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: leftTab === 'pins' ? 'var(--plc-cyan)' : 'var(--text-muted)',
                borderBottom: leftTab === 'pins' ? '2px solid var(--plc-cyan)' : 'none',
                background: leftTab === 'pins' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sliders size={13} /> I/O Pin Map
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {leftTab === 'problem' ? (
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-main)' }}>
                  {problem.description}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Inputs Allocation Table
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <tbody>
                      {(problem.inputs || []).map(inp => (
                        <tr key={inp.address} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '6px 4px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#00ff88' }}>
                            {inp.address}
                          </td>
                          <td style={{ padding: '6px 4px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {inp.name}
                          </td>
                          <td style={{ padding: '6px 4px', color: 'var(--text-dim)', fontSize: '11px' }}>
                            {inp.type || 'Digital'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Outputs Allocation Table
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: The Visual Ladder Logic Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <LadderEditor
              ladder={ladder}
              setLadder={setLadder}
              problemInputs={problem.inputs || []}
              problemOutputs={problem.outputs || []}
              rungStates={rungStates}
              plcState={plcState}
            />
          </div>

          {/* Collapsible Bottom Test Results Drawer (LeetCode style) */}
          <div style={{
            height: isBottomCollapsed ? '38px' : `${bottomPanelHeight}px`,
            transition: 'height 0.2s ease',
            borderTop: '2px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            {/* Header / Collapse Toggle */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600' }}>
                <span>Test Bench & Output Diagnostics</span>
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
                {isBottomCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
        <div style={{ width: '340px', height: '100%', overflow: 'hidden' }}>
          <VirtualIOPanel
            inputs={inputs}
            setInputs={setInputs}
            outputs={outputs}
            timers={timers}
            counters={counters}
            fault={fault}
            setFault={setFault}
            problem={problem}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
            onStepScan={handleStepScan}
            onResetPlc={handleResetPlc}
          />
        </div>
      </div>

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
