import { VirtualPLC } from './ladderEngine.js';

/**
 * Runs a test case against the ladder logic using the VirtualPLC engine.
 * Supports both static single-step and dynamic multi-step sequential execution.
 */
export function evaluateTestCase(ladder, testCase) {
  const plc = new VirtualPLC();
  const stepResults = [];
  let allPassed = true;
  let failureReason = null;

  // Normalize test case structure: either steps array or single inputs/expectedOutputs
  const steps = testCase.steps || [
    {
      step: 1,
      description: testCase.description || testCase.name || 'Default Step',
      inputs: testCase.inputs || {},
      expected: testCase.expectedOutputs || testCase.expected || {},
      fault: testCase.fault || 'NORMAL',
      durationMs: testCase.durationMs || 50
    }
  ];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const inputs = s.inputs || {};
    const expected = s.expected || {};
    const fault = s.fault || 'NORMAL';
    const durationMs = s.durationMs || 50;

    plc.setFault(fault);
    plc.setInputs(inputs);

    // If durationMs > 50 (e.g. timer test), run multiple scan ticks
    const tickInterval = 50;
    const ticks = Math.max(1, Math.round(durationMs / tickInterval));
    let lastScanResult = null;

    for (let t = 0; t < ticks; t++) {
      lastScanResult = plc.scan(ladder, tickInterval);
    }

    const actual = { ...plc.outputs };
    const mismatches = [];

    for (const outKey in expected) {
      const expVal = Boolean(expected[outKey]);
      const actVal = Boolean(actual[outKey]);
      if (expVal !== actVal) {
        mismatches.push({
          output: outKey,
          expected: expVal,
          actual: actVal
        });
      }
    }

    const stepPassed = mismatches.length === 0;
    if (!stepPassed) {
      allPassed = false;
      if (!failureReason) {
        const first = mismatches[0];
        failureReason = `Step ${i + 1} (${s.description || 'Execution'}): Expected ${first.output}=${first.expected ? 'ON' : 'OFF'}, got ${first.actual ? 'ON' : 'OFF'}`;
      }
    }

    stepResults.push({
      stepNumber: i + 1,
      description: s.description || `Step ${i + 1}`,
      inputs: { ...inputs },
      expected: { ...expected },
      actual: { ...actual },
      fault,
      passed: stepPassed,
      mismatches,
      timers: JSON.parse(JSON.stringify(plc.timers)),
      counters: JSON.parse(JSON.stringify(plc.counters))
    });
  }

  return {
    id: testCase.id || testCase.name,
    name: testCase.name || 'Test Case',
    passed: allPassed,
    failureReason,
    steps: stepResults
  };
}

/**
 * Runs a full test suite (public or hidden)
 */
export function runTestSuite(ladder, testCases) {
  const results = [];
  let passedCount = 0;

  for (const tc of testCases) {
    const res = evaluateTestCase(ladder, tc);
    if (res.passed) passedCount++;
    results.push(res);
  }

  const total = testCases.length;
  const scorePercent = total > 0 ? Math.round((passedCount / total) * 100) : 0;

  return {
    passed: passedCount === total,
    passedCount,
    totalCount: total,
    scorePercent,
    results
  };
}
