import { VirtualPLC, validateLadder } from './ladderEngine.js';

/**
 * Runs a single test case against the ladder logic using the VirtualPLC engine.
 * Supports both static single-step and dynamic multi-step sequential execution.
 * 
 * - Preserves PLC internal state (latches, timers, counters, memory) across sequential steps
 * - Isolates each test case with a fresh initial PLC instance
 * - Never substitutes reference solutions or hardcoded mock scores
 */
export function evaluateTestCase(ladder, testCase) {
  // First, check ladder schema validity
  const validation = validateLadder(ladder);
  if (!validation.valid) {
    return {
      id: testCase.id || testCase.name || 'test-case',
      name: testCase.name || 'Test Case',
      passed: false,
      failureReason: `Syntax / Validation Error: ${validation.errors[0]}`,
      steps: []
    };
  }

  // Create isolated virtual PLC instance for this specific test case
  const plc = new VirtualPLC();
  const stepResults = [];
  let allPassed = true;
  let failureReason = null;

  // Normalize test case structure: either steps array or single inputs/expectedOutputs
  const steps = (Array.isArray(testCase.steps) && testCase.steps.length > 0)
    ? testCase.steps
    : [
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
    const expected = s.expected || s.expectedOutputs || {};
    const fault = s.fault || 'NORMAL';
    const durationMs = Math.max(50, Math.min(Number(s.durationMs) || 50, 5000));

    try {
      plc.setFault(fault);
      plc.setInputs(inputs);

      // Execute scan ticks based on durationMs (50ms per scan cycle)
      const tickInterval = 50;
      const ticks = Math.max(1, Math.min(Math.round(durationMs / tickInterval), 100));

      for (let t = 0; t < ticks; t++) {
        plc.scan(ladder, tickInterval);
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
        counters: JSON.parse(JSON.stringify(plc.counters)),
        memory: { ...plc.memory }
      });
    } catch (err) {
      allPassed = false;
      failureReason = `Runtime execution error during Step ${i + 1}: ${err.message}`;
      stepResults.push({
        stepNumber: i + 1,
        description: s.description || `Step ${i + 1}`,
        inputs: { ...inputs },
        expected: { ...expected },
        actual: { ...plc.outputs },
        fault,
        passed: false,
        mismatches: [{ output: 'EXECUTION', expected: 'NORMAL', actual: 'ERROR' }],
        error: err.message
      });
      break;
    }
  }

  return {
    id: testCase.id || testCase.name || 'test-case',
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
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return {
      passed: true,
      passedCount: 0,
      totalCount: 0,
      scorePercent: 100,
      results: []
    };
  }

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
