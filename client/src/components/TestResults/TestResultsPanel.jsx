import React, { useState } from 'react';
import { CheckCircle2, XCircle, Play, Send, ChevronRight, Terminal, Award, AlertTriangle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TestResultsPanel({
  testData = null,
  submissionData = null,
  isRunningTests = false,
  isSubmitting = false,
  onRunPublicTests,
  onSubmitSolution,
  onOpenLeaderboard
}) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  // Trigger celebration confetti when 100% submission pass
  const handleSubmissionCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Determine current active results: submissionData takes precedence if available
  const isSubmissionMode = Boolean(submissionData);
  const activeResults = isSubmissionMode
    ? submissionData.publicSummary?.results || []
    : testData?.results || [];

  const passedCount = isSubmissionMode
    ? submissionData.passedTests
    : testData?.passedCount || 0;

  const totalCount = isSubmissionMode
    ? submissionData.totalTests
    : testData?.totalCount || 0;

  const scorePercent = isSubmissionMode
    ? submissionData.scorePercent
    : testData?.scorePercent || 0;

  const currentCase = activeResults[selectedCaseIdx] || activeResults[0];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#090d16',
      borderTop: '1px solid var(--border-subtle)'
    }}>
      {/* Top Test Control Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}>
            <Terminal size={15} color="var(--plc-cyan)" />
            <span>Test Bench & Output Verification</span>
          </div>

          {(testData?.error || submissionData?.error) ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertTriangle size={13} />
              <span>{testData?.error || submissionData?.error}</span>
            </div>
          ) : (testData || submissionData) && (
            <div style={{
              background: (isSubmissionMode ? submissionData.isAccepted : testData?.passed)
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
              border: (isSubmissionMode ? submissionData.isAccepted : testData?.passed)
                ? '1px solid #10b981'
                : '1px solid #ef4444',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              color: (isSubmissionMode ? submissionData.isAccepted : testData?.passed)
                ? '#34d399'
                : '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {(isSubmissionMode ? submissionData.isAccepted : testData?.passed) ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>{passedCount}/{totalCount} PASSED ({scorePercent}%)</span>
                </>
              ) : (
                <>
                  <XCircle size={13} />
                  <span>{passedCount}/{totalCount} PASSED ({scorePercent}%)</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* LeetCode Actions: Run Code vs Submit Solution */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onRunPublicTests}
            disabled={isRunningTests || isSubmitting}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
            id="btn-run-code"
          >
            <Play size={13} />
            {isRunningTests ? 'Executing Scan...' : 'Run Public Tests'}
          </button>

          <button
            onClick={async () => {
              const res = await onSubmitSolution();
              if (res?.isAccepted) {
                handleSubmissionCelebration();
              }
            }}
            disabled={isRunningTests || isSubmitting}
            className="btn-primary"
            style={{ padding: '6px 16px', fontSize: '12.5px' }}
            id="btn-submit-solution"
          >
            <Send size={13} />
            {isSubmitting ? 'Evaluating...' : 'Submit Solution'}
          </button>
        </div>
      </div>

      {/* Test Results Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Test Cases Tab Selector */}
        <div style={{
          width: '260px',
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '10px 14px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Test Cases ({activeResults.length})
          </div>

          {activeResults.length === 0 ? (
            <div style={{ padding: '20px 14px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
              Click "Run Public Tests" or "Submit Solution" to evaluate ladder logic.
            </div>
          ) : (
            activeResults.map((tc, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCaseIdx(idx)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  background: selectedCaseIdx === idx ? 'var(--bg-card)' : 'transparent',
                  borderLeft: selectedCaseIdx === idx ? '3px solid var(--plc-cyan)' : '3px solid transparent',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {tc.passed ? (
                    <CheckCircle2 size={15} color="#10b981" />
                  ) : (
                    <XCircle size={15} color="#ef4444" />
                  )}
                  <div style={{ fontSize: '12px', fontWeight: selectedCaseIdx === idx ? '6px' : 'normal' }}>
                    {tc.name || `Case ${idx + 1}`}
                  </div>
                </div>
                <ChevronRight size={13} color="var(--text-dim)" />
              </button>
            ))
          )}

          {/* Submission Mode: Hidden Tests Accordion Summary */}
          {isSubmissionMode && submissionData.hiddenSummary && (
            <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', background: '#070a10' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                HIDDEN BENCHMARK TESTS
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: submissionData.hiddenSummary.passed === submissionData.hiddenSummary.total ? '#10b981' : '#f59e0b' }}>
                {submissionData.hiddenSummary.passed} / {submissionData.hiddenSummary.total} Passed
              </div>
            </div>
          )}
        </div>

        {/* Right: Step-by-Step State Trace and Comparison Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {!currentCase ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              gap: '10px'
            }}>
              <Terminal size={32} />
              <p style={{ fontSize: '13px' }}>Awaiting Virtual PLC test execution run...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentCase.passed ? (
                      <CheckCircle2 size={18} color="#10b981" />
                    ) : (
                      <XCircle size={18} color="#ef4444" />
                    )}
                    {currentCase.name}
                  </h4>
                  {currentCase.failureReason && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      ⚠️ {currentCase.failureReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Steps Chronological Trace */}
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Execution Chronology ({currentCase.steps?.length || 0} Scan Steps)
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentCase.steps?.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        background: 'var(--bg-card)',
                        border: step.passed ? '1px solid var(--border-muted)' : '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '8px',
                        padding: '12px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: step.passed ? '#f8fafc' : '#f87171' }}>
                          Step {step.stepNumber}: {step.description}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: step.passed ? '#10b981' : '#ef4444',
                          fontWeight: 'bold'
                        }}>
                          {step.passed ? '✓ PASS' : '✗ FAIL'}
                        </span>
                      </div>

                      {/* Inputs Applied Chip Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Applied Inputs:
                        </span>
                        {Object.entries(step.inputs || {}).map(([iKey, iVal]) => (
                          <span
                            key={iKey}
                            style={{
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              background: iVal ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              border: iVal ? '1px solid #00ff88' : '1px solid #334155',
                              color: iVal ? '#00ff88' : 'var(--text-muted)',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {iKey} = {iVal ? 'ON' : 'OFF'}
                          </span>
                        ))}
                      </div>

                      {/* Actual vs Expected Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                        <thead>
                          <tr style={{ color: 'var(--text-dim)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ padding: '4px 8px' }}>Output Pin</th>
                            <th style={{ padding: '4px 8px' }}>Expected Output</th>
                            <th style={{ padding: '4px 8px' }}>Actual Virtual PLC</th>
                            <th style={{ padding: '4px 8px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(step.expected || {}).map(outKey => {
                            const exp = Boolean(step.expected[outKey]);
                            const act = Boolean(step.actual[outKey]);
                            const match = exp === act;

                            return (
                              <tr
                                key={outKey}
                                style={{
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                  background: match ? 'transparent' : 'rgba(239, 68, 68, 0.1)'
                                }}
                              >
                                <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{outKey}</td>
                                <td style={{ padding: '6px 8px', color: exp ? '#10b981' : 'var(--text-muted)' }}>
                                  {exp ? 'TRUE (ON)' : 'FALSE (OFF)'}
                                </td>
                                <td style={{ padding: '6px 8px', color: act ? '#10b981' : 'var(--text-muted)', fontWeight: 'bold' }}>
                                  {act ? 'TRUE (ON)' : 'FALSE (OFF)'}
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                  {match ? (
                                    <span style={{ color: '#10b981' }}>MATCH ✓</span>
                                  ) : (
                                    <span style={{ color: '#ef4444' }}>MISMATCH ✗</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
