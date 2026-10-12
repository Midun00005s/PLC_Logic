/**
 * Automated Regression Test Suite for PLC Logic Arena
 * 
 * Verifies:
 * 1. Empty ladder program handling (fails tests expecting active outputs)
 * 2. Wrong contact polarity (fails seal-in / stop tests)
 * 3. Direct Start-to-output without seal-in (fails latching step)
 * 4. Correct 3-wire Start/Stop seal-in logic (passes 100%)
 * 5. Stop priority over Start (simultaneous inputs)
 * 6. Dual Tank level hysteresis (low/high float switches)
 * 7. Conveyor Part Counter (CTU counting to 5 parts, resetting on button)
 * 8. Star-Delta transition timer (TON On-Delay transition)
 * 9. Safety Guard Interlock (Door + E-Stop + Manual Reset)
 * 10. Forward/Reverse Motor Interlocking
 * 11. State preservation across sequential steps within a test scenario
 * 12. State isolation & reset between separate test scenarios
 * 13. Rejection of invalid or unsupported instructions
 * 14. Safe handling of malformed JSON / missing addresses
 */

import { VirtualPLC, validateLadder, executeLadder } from '../plc/ladderEngine.js';
import { evaluateTestCase, runTestSuite } from '../plc/evaluator.js';
import { seedProblems } from '../models/seedProblems.js';
import { db } from '../models/db.js';

let passedTestsCount = 0;
let totalTestsCount = 0;

function assert(condition, message) {
  totalTestsCount++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTestsCount++;
    console.log(`  ✓ ${message}`);
  }
}

console.log('\n============================================================');
console.log('⚡ STARTING PLC LOGIC ARENA REGRESSION TEST SUITE');
console.log('============================================================\n');

// 1. Schema Validation Tests
console.log('--- 1. Ladder Schema & Instruction Validation ---');
{
  const emptyRes = validateLadder({ rungs: [] });
  assert(emptyRes.valid === true, 'Empty ladder with rungs array is structurally valid');

  const invalidTypeRes = validateLadder({
    rungs: [{ id: 'r1', elements: [{ type: 'INVALID_INSTRUCTION', address: 'X0' }] }]
  });
  assert(invalidTypeRes.valid === false, 'Rejects unsupported instruction type');
  assert(invalidTypeRes.errors[0].includes('Unsupported instruction type'), 'Reports unsupported instruction error message');

  const missingAddrRes = validateLadder({
    rungs: [{ id: 'r1', elements: [{ type: 'NO', address: '' }] }]
  });
  assert(missingAddrRes.valid === false, 'Rejects contact with empty address');

  const invalidTimerAddr = validateLadder({
    rungs: [{ id: 'r1', elements: [{ type: 'TON', address: 'Y0' }] }]
  });
  assert(invalidTimerAddr.valid === false, 'Rejects TON timer not starting with T');
}

// 2. Empty Ladder Program Test
console.log('\n--- 2. Empty Ladder Program Execution ---');
{
  const motorProb = seedProblems.find(p => p.id === 'prob-01');
  const emptyLadder = { rungs: [] };
  const suiteResult = runTestSuite(emptyLadder, motorProb.publicTests);
  
  assert(suiteResult.passed === false, 'Empty ladder must NOT pass test suite');
  assert(suiteResult.scorePercent < 100, `Empty ladder score (${suiteResult.scorePercent}%) is less than 100%`);
  // Test 1 (initial state off) passes, but Test 2 (start button press) fails
  assert(suiteResult.passedCount === 1, 'Empty ladder passes only initial OFF test, fails active output tests');
}

// 3. Direct Start-to-Output Without Seal-In
console.log('\n--- 3. Direct Start-to-Output Without Seal-in (Missing Latch) ---');
{
  const motorProb = seedProblems.find(p => p.id === 'prob-01');
  // Logic: [NO X0] -> [NC X1] -> [COIL Y0] (no Y0 parallel seal-in) and [NO Y0] -> [COIL Y1]
  const unlatchedLadder = {
    rungs: [
      {
        id: 'r1',
        elements: [
          { type: 'NO', address: 'X0' },
          { type: 'NC', address: 'X1' },
          { type: 'COIL', address: 'Y0' }
        ]
      },
      {
        id: 'r2',
        elements: [
          { type: 'NO', address: 'Y0' },
          { type: 'COIL', address: 'Y1' }
        ]
      }
    ]
  };

  const test2 = motorProb.publicTests.find(t => t.name.includes('Start Button Press and Seal-In'));
  const evalResult = evaluateTestCase(unlatchedLadder, test2);
  assert(evalResult.passed === false, 'Unlatched logic fails Test 2 (Seal-in check)');
  assert(evalResult.steps[0].passed === true, 'Step 1 (Start button pressed) passes');
  assert(evalResult.steps[1].passed === false, 'Step 2 (Start button released) fails because output dropped');
}

// 4. Wrong Contact Polarity (NO Stop Button instead of NC Stop Button)
console.log('\n--- 4. Wrong Contact Polarity ---');
{
  const motorProb = seedProblems.find(p => p.id === 'prob-01');
  // Logic: [NO X0] with [NO Y0] -> [NO X1] (wrong polarity!) -> [COIL Y0]
  const wrongPolarityLadder = {
    rungs: [
      {
        id: 'r1',
        elements: [
          {
            type: 'BRANCH',
            branches: [
              [{ type: 'NO', address: 'X0' }],
              [{ type: 'NO', address: 'Y0' }]
            ]
          },
          { type: 'NO', address: 'X1' }, // WRONG: normally open instead of normally closed!
          { type: 'COIL', address: 'Y0' }
        ]
      }
    ]
  };

  const test2 = motorProb.publicTests.find(t => t.name.includes('Start Button Press and Seal-In'));
  const evalResult = evaluateTestCase(wrongPolarityLadder, test2);
  assert(evalResult.passed === false, 'Wrong contact polarity fails when stop button is unpressed (false)');
}

// 5. Correct 3-Wire Motor Seal-In Circuit (Full Pass)
console.log('\n--- 5. Correct 3-Wire Motor Seal-In Circuit ---');
{
  const motorProb = seedProblems.find(p => p.id === 'prob-01');
  const correctLadder = motorProb.starterLadder;

  const publicResult = runTestSuite(correctLadder, motorProb.publicTests);
  assert(publicResult.passed === true, 'Correct ladder passes 100% of public tests');
  assert(publicResult.scorePercent === 100, 'Public score is 100%');

  const hiddenResult = runTestSuite(correctLadder, motorProb.hiddenTests);
  assert(hiddenResult.passed === true, 'Correct ladder passes 100% of hidden tests (overload, stop priority)');
  assert(hiddenResult.scorePercent === 100, 'Hidden score is 100%');
}

// 6. Stop Priority Over Start (Simultaneous Inputs)
console.log('\n--- 6. Stop Priority Over Start ---');
{
  const plc = new VirtualPLC();
  const ladder = {
    rungs: [
      {
        id: 'r1',
        elements: [
          {
            type: 'BRANCH',
            branches: [
              [{ type: 'NO', address: 'X0' }],
              [{ type: 'NO', address: 'Y0' }]
            ]
          },
          { type: 'NC', address: 'X1' },
          { type: 'COIL', address: 'Y0' }
        ]
      }
    ]
  };

  // Both Start (X0) and Stop (X1) are TRUE simultaneously
  plc.setInputs({ X0: true, X1: true });
  const result = plc.scan(ladder);
  assert(result.outputs.Y0 === false, 'Stop priority holds: Y0 is OFF when both X0 and X1 are active');
}

// 7. Dual Tank Level Control (Hysteresis Logic)
console.log('\n--- 7. Dual Tank Level Control (Hysteresis) ---');
{
  const tankProb = seedProblems.find(p => p.id === 'prob-03');
  const tankLadder = tankProb.starterLadder;

  const publicResult = runTestSuite(tankLadder, tankProb.publicTests);
  assert(publicResult.passed === true, 'Tank level control passes public tests');

  const hiddenResult = runTestSuite(tankLadder, tankProb.hiddenTests);
  assert(hiddenResult.passed === true, 'Tank level control passes draining hysteresis hidden test');
}

// 8. Conveyor Part Counter (CTU Up-Counter with Reset)
console.log('\n--- 8. Conveyor Part Sorter & Batch Counter (CTU) ---');
{
  const conveyorProb = seedProblems.find(p => p.id === 'prob-02');
  const conveyorLadder = conveyorProb.starterLadder;

  const publicResult = runTestSuite(conveyorLadder, conveyorProb.publicTests);
  assert(publicResult.passed === true, 'Conveyor batch counter passes 5-part count sequence');

  const hiddenResult = runTestSuite(conveyorLadder, conveyorProb.hiddenTests);
  assert(hiddenResult.passed === true, 'Conveyor batch counter passes batch reset sequence');
}

// 9. Star-Delta Motor Starter (TON Timer Transition)
console.log('\n--- 9. Star-Delta Motor Starter (TON Timer Transition) ---');
{
  const starDeltaProb = seedProblems.find(p => p.id === 'prob-04');
  const starDeltaLadder = starDeltaProb.starterLadder;

  const publicResult = runTestSuite(starDeltaLadder, starDeltaProb.publicTests);
  assert(publicResult.passed === true, 'Star-Delta starter passes 3-second timing transition');

  const hiddenResult = runTestSuite(starDeltaLadder, starDeltaProb.hiddenTests);
  assert(hiddenResult.passed === true, 'Star-Delta starter passes premature stop shutdown');
}

// 10. Safety Guard Interlock & Emergency Stop Circuit
console.log('\n--- 10. Safety Guard Interlock & Emergency Stop ---');
{
  const safetyProb = seedProblems.find(p => p.id === 'prob-05');
  const safetyLadder = safetyProb.starterLadder;

  const publicResult = runTestSuite(safetyLadder, safetyProb.publicTests);
  assert(publicResult.passed === true, 'Safety circuit passes interlock and armed states');

  const hiddenResult = runTestSuite(safetyLadder, safetyProb.hiddenTests);
  assert(hiddenResult.passed === true, 'Safety circuit passes door trip and E-stop trip tests');
}

// 11. Forward / Reverse Motor Interlocking Logic
console.log('\n--- 11. Forward / Reverse Motor Interlocking ---');
{
  // Rung 0: Forward motor: [NO X0 (Fwd PB)] in parallel with [NO Y0 (Fwd Aux)], [NC X2 (Stop)], [NC Y1 (Rev Interlock)] -> [COIL Y0]
  // Rung 1: Reverse motor: [NO X1 (Rev PB)] in parallel with [NO Y1 (Rev Aux)], [NC X2 (Stop)], [NC Y0 (Fwd Interlock)] -> [COIL Y1]
  const fwdRevLadder = {
    rungs: [
      {
        id: 'r1',
        comment: 'Forward Motor Contactor',
        elements: [
          {
            type: 'BRANCH',
            branches: [
              [{ type: 'NO', address: 'X0' }],
              [{ type: 'NO', address: 'Y0' }]
            ]
          },
          { type: 'NC', address: 'X2' }, // Stop PB
          { type: 'NC', address: 'Y1' }, // Reverse Interlock Contact
          { type: 'COIL', address: 'Y0' }
        ]
      },
      {
        id: 'r2',
        comment: 'Reverse Motor Contactor',
        elements: [
          {
            type: 'BRANCH',
            branches: [
              [{ type: 'NO', address: 'X1' }],
              [{ type: 'NO', address: 'Y1' }]
            ]
          },
          { type: 'NC', address: 'X2' }, // Stop PB
          { type: 'NC', address: 'Y0' }, // Forward Interlock Contact
          { type: 'COIL', address: 'Y1' }
        ]
      }
    ]
  };

  const plc = new VirtualPLC();

  // Step 1: Start Forward
  plc.setInputs({ X0: true, X1: false, X2: false });
  let s1 = plc.scan(fwdRevLadder);
  assert(s1.outputs.Y0 === true && s1.outputs.Y1 === false, 'Forward starts successfully');

  // Step 2: Release Forward PB (seal-in)
  plc.setInputs({ X0: false, X1: false, X2: false });
  let s2 = plc.scan(fwdRevLadder);
  assert(s2.outputs.Y0 === true && s2.outputs.Y1 === false, 'Forward remains sealed in');

  // Step 3: Attempt to press Reverse PB while Forward is active (Interlock test!)
  plc.setInputs({ X0: false, X1: true, X2: false });
  let s3 = plc.scan(fwdRevLadder);
  assert(s3.outputs.Y1 === false, 'INTERLOCK HOLDS: Reverse CANNOT engage while Forward is energized');
  assert(s3.outputs.Y0 === true, 'Forward continues safely running');

  // Step 4: Stop
  plc.setInputs({ X0: false, X1: false, X2: true });
  let s4 = plc.scan(fwdRevLadder);
  assert(s4.outputs.Y0 === false && s4.outputs.Y1 === false, 'Stop disengages Forward');
}

// 12. State Preservation Across Sequential Steps & Isolation Between Scenarios
console.log('\n--- 12. State Preservation & Scenario Isolation ---');
{
  const testScenario = {
    name: 'State Accumulation Test',
    steps: [
      { step: 1, inputs: { X0: true, X1: false }, expected: { Y0: true } },
      { step: 2, inputs: { X0: false, X1: false }, expected: { Y0: true } },
      { step: 3, inputs: { X0: false, X1: true }, expected: { Y0: false } }
    ]
  };

  const sealInLadder = {
    rungs: [
      {
        id: 'r1',
        elements: [
          {
            type: 'BRANCH',
            branches: [
              [{ type: 'NO', address: 'X0' }],
              [{ type: 'NO', address: 'Y0' }]
            ]
          },
          { type: 'NC', address: 'X1' },
          { type: 'COIL', address: 'Y0' }
        ]
      }
    ]
  };

  const res = evaluateTestCase(sealInLadder, testScenario);
  assert(res.passed === true, 'State accumulates and preserves properly across all 3 steps');

  // Check that running a second independent test starts with a completely reset PLC
  const independentTest = {
    name: 'Fresh Start Test',
    steps: [
      { step: 1, inputs: { X0: false, X1: false }, expected: { Y0: false } }
    ]
  };
  const res2 = evaluateTestCase(sealInLadder, independentTest);
  assert(res2.passed === true, 'Independent test scenario starts in fresh 0V de-energized state');
  assert(res2.steps[0].actual.Y0 === false, 'Y0 was false at start of independent test');
}

// 13. Database Problem Integrity Check
console.log('\n--- 13. Database Multi-Challenge Dynamic Loading ---');
{
  const allProblems = db.getProblems(false);
  assert(allProblems.length >= 6, `Database loaded ${allProblems.length} challenges (expected >= 6)`);
  
  const ids = allProblems.map(p => p.id);
  assert(ids.includes('prob-1791188949918'), 'Preserves original Pump Station problem (prob-1791188949918)');
  assert(ids.includes('prob-01'), 'Loads Motor Start/Stop (prob-01)');
  assert(ids.includes('prob-02'), 'Loads Conveyor Part Sorter (prob-02)');
  assert(ids.includes('prob-03'), 'Loads Dual Tank Fill (prob-03)');
  assert(ids.includes('prob-04'), 'Loads Star-Delta Starter (prob-04)');
  assert(ids.includes('prob-05'), 'Loads Safety Guard Interlock (prob-05)');

  // Verify hidden tests are NOT exposed on public get
  allProblems.forEach(p => {
    assert(p.hiddenTests === undefined, `Problem ${p.id} does NOT expose hidden tests to public get`);
  });
}

console.log('\n============================================================');
console.log(`✅ ALL ${passedTestsCount} / ${totalTestsCount} REGRESSION TESTS PASSED SUCCESSFULLY!`);
console.log('============================================================\n');
