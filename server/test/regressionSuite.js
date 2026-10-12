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

// 14. Elevator Overload Protection & Direction Control Verification
console.log('\n--- 14. Elevator Overload Protection & Direction Control (prob-1791828405933) ---');
{
  const elevatorProb = db.getProblemById('prob-1791828405933', true);
  assert(elevatorProb !== null, 'Elevator challenge prob-1791828405933 exists in database');

  // I/O Mapping Validation
  const inputMap = {};
  (elevatorProb.inputs || []).forEach(inp => { inputMap[inp.address] = inp.name; });
  assert(inputMap.X0 === 'LOAD_OK', 'Elevator X0 maps to LOAD_OK');
  assert(inputMap.X1 === 'UP_PB', 'Elevator X1 maps to UP_PB');
  assert(inputMap.X2 === 'DOWN_PB', 'Elevator X2 maps to DOWN_PB');
  assert(inputMap.X3 === 'STOP_PB', 'Elevator X3 maps to STOP_PB');
  assert(inputMap.X4 === 'RESET_PB', 'Elevator X4 maps to RESET_PB');

  const outputMap = {};
  (elevatorProb.outputs || []).forEach(out => { outputMap[out.address] = out.name; });
  assert(outputMap.Y0 === 'LIFT_UP', 'Elevator Y0 maps to LIFT_UP');
  assert(outputMap.Y1 === 'LIFT_DOWN', 'Elevator Y1 maps to LIFT_DOWN');
  assert(outputMap.Y2 === 'OVERLOAD_LAMP', 'Elevator Y2 maps to OVERLOAD_LAMP');

  const memoryMap = {};
  (elevatorProb.memory || []).forEach(mem => { memoryMap[mem.address] = mem.name; });
  assert(memoryMap.M0 === 'OVERLOAD_FAULT', 'Elevator M0 maps to OVERLOAD_FAULT');
  assert(memoryMap.M1 === 'UP_LATCH', 'Elevator M1 maps to UP_LATCH');
  assert(memoryMap.M2 === 'DOWN_LATCH', 'Elevator M2 maps to DOWN_LATCH');

  // Verify other challenges are NOT affected (preserves generic/specific mappings per problem)
  const motorProb = db.getProblemById('prob-01', true);
  const motorInpMap = {};
  (motorProb.inputs || []).forEach(inp => { motorInpMap[inp.address] = inp.name; });
  assert(motorInpMap.X0 === 'START_PB', 'Other challenges preserve original X0 (START_PB)');
  assert(motorInpMap.X1 === 'STOP_PB', 'Other challenges preserve original X1 (STOP_PB)');

  // Validate elevator ladder program schema
  const schemaRes = validateLadder(elevatorProb.starterLadder);
  assert(schemaRes.valid === true, 'Elevator starter ladder passes IEC 61131-3 schema validation');

  // Evaluate Public Test Suite
  const publicRes = runTestSuite(elevatorProb.starterLadder, elevatorProb.publicTests);
  assert(publicRes.passed === true, 'Elevator ladder passes 100% of public test suite');
  assert(publicRes.scorePercent === 100, 'Elevator public score is 100%');
  assert(publicRes.passedCount === elevatorProb.publicTests.length, `All ${elevatorProb.publicTests.length} public tests passed`);

  // Evaluate Hidden Test Suite
  const hiddenRes = runTestSuite(elevatorProb.starterLadder, elevatorProb.hiddenTests);
  assert(hiddenRes.passed === true, 'Elevator ladder passes 100% of hidden test suite');
  assert(hiddenRes.scorePercent === 100, 'Elevator hidden score is 100%');
  assert(hiddenRes.passedCount === elevatorProb.hiddenTests.length, `All ${elevatorProb.hiddenTests.length} hidden tests passed`);

  // Detailed Step-by-Step Behavioral Verification using VirtualPLC Engine
  const plc = new VirtualPLC();

  // Test: Safe load allows UP
  plc.setInputs({ X0: true, X1: true, X2: false, X3: false, X4: false });
  plc.scan(elevatorProb.starterLadder);
  assert(plc.outputs.Y0 === true && plc.outputs.Y1 === false && plc.outputs.Y2 === false, 'Safe load allows UP movement');

  // Test: Overload immediately stops movement and latches fault M0 & lamp Y2
  plc.setInputs({ X0: false, X1: false, X2: false, X3: false, X4: false });
  plc.scan(elevatorProb.starterLadder);
  assert(plc.outputs.Y0 === false, 'Overload immediately turns OFF UP movement');
  assert(plc.outputs.Y1 === false, 'Overload immediately turns OFF DOWN movement');
  assert(plc.memory.M0 === true, 'Overload latches fault bit M0');
  assert(plc.outputs.Y2 === true, 'Overload turns ON indicator lamp Y2');

  // Test: Unsafe reset attempt (X4 pressed while X0 remains false) fails to clear M0
  plc.setInputs({ X0: false, X1: false, X2: false, X3: false, X4: true });
  plc.scan(elevatorProb.starterLadder);
  assert(plc.memory.M0 === true, 'Reset button cannot clear overload while load is unsafe (X0 false)');
  assert(plc.outputs.Y2 === true, 'Overload lamp remains ON during unsafe reset attempt');

  // Test: Load safe + Reset clears fault M0 without restarting movement
  plc.setInputs({ X0: true, X1: false, X2: false, X3: false, X4: true });
  plc.scan(elevatorProb.starterLadder);
  assert(plc.memory.M0 === false, 'Reset button clears overload fault when load is safe (X0 true)');
  assert(plc.outputs.Y2 === false, 'Overload lamp turns OFF after valid reset');
  assert(plc.outputs.Y0 === false && plc.outputs.Y1 === false, 'Reset NEVER automatically restarts movement');

  // Test: Simultaneous UP and DOWN commands are mutually inhibited
  plc.setInputs({ X0: true, X1: true, X2: true, X3: false, X4: false });
  plc.scan(elevatorProb.starterLadder);
  assert(plc.outputs.Y0 === false && plc.outputs.Y1 === false, 'Simultaneous UP and DOWN requests are both inhibited');
}

// 15. Save Progress & Resume Workspace Persistence, User Isolation, & Restoration
console.log('\n--- 15. Workspace Autosave, User Isolation & Progress Restoration ---');
{
  const studentUser1 = 'usr-student-test-1';
  const studentUser2 = 'usr-student-test-2';
  const adminUser = 'usr-admin-test-1';
  const testProblemId = 'prob-01';

  // Ensure clean test state for test users
  db.deleteWorkspace(studentUser1, testProblemId);
  db.deleteWorkspace(studentUser2, testProblemId);
  db.deleteWorkspace(adminUser, testProblemId);

  // Initial state verification: Not Started
  const initialStatus1 = db.resolveProblemStatus(studentUser1, testProblemId);
  assert(initialStatus1 === 'Not Started', 'Problem starts with Not Started status before any edits');

  // Verify workspace save with valid rungs
  const customLadder1 = {
    rungs: [
      {
        id: 'rung-test-1',
        comment: 'Student 1 Custom Latch',
        elements: [
          { type: 'NO', address: 'X0' },
          { type: 'NC', address: 'X1' },
          { type: 'COIL', address: 'Y0' }
        ]
      }
    ]
  };

  const saved1 = db.saveWorkspace(studentUser1, testProblemId, {
    ladder: customLadder1,
    testHistory: { lastRunType: 'PUBLIC_TESTS', passed: false, scorePercent: 66 },
    plcState: { fault: 'NORMAL', scanCount: 42 }
  });

  assert(saved1 && saved1.ladder.rungs.length === 1, 'Successfully saved Student 1 workspace');
  assert(saved1.ladder.rungs[0].comment === 'Student 1 Custom Latch', 'Preserved ladder rungs, comments, and instructions');
  assert(saved1.testHistory.scorePercent === 66, 'Preserved testHistory in saved workspace');

  // Status transitions to In Progress simply upon saving non-empty ladder
  const statusAfterSave = db.resolveProblemStatus(studentUser1, testProblemId);
  assert(statusAfterSave === 'In Progress', 'Saving edits transitions status to In Progress (NOT Solved)');

  // Verify retrieval
  const retrieved1 = db.getWorkspace(studentUser1, testProblemId);
  assert(retrieved1 !== null, 'Retrieved saved workspace for Student 1');
  assert(retrieved1.ladder.rungs[0].elements[1].type === 'NC', 'Restored exact NO/NC configuration');
  assert(retrieved1.status === 'In Progress', 'Restored workspace includes current resolved status');

  // User Isolation: Student 2 has separate empty workspace
  const retrieved2 = db.getWorkspace(studentUser2, testProblemId);
  assert(retrieved2 === null, 'User isolation: Student 2 cannot see Student 1 workspace');
  assert(db.resolveProblemStatus(studentUser2, testProblemId) === 'Not Started', 'Student 2 status remains Not Started');

  // Admin isolation: Admin has independent workspace for the same problem
  const adminLadder = {
    rungs: [
      {
        id: 'rung-admin-1',
        comment: 'Admin Independent Reference Solution',
        elements: [
          { type: 'NO', address: 'X0' },
          { type: 'COIL', address: 'Y0' }
        ]
      }
    ]
  };
  db.saveWorkspace(adminUser, testProblemId, { ladder: adminLadder });
  const adminRetrieved = db.getWorkspace(adminUser, testProblemId);
  const studentRetrievedAgain = db.getWorkspace(studentUser1, testProblemId);

  assert(adminRetrieved.ladder.rungs[0].comment === 'Admin Independent Reference Solution', 'Admin has independent workspace');
  assert(studentRetrievedAgain.ladder.rungs[0].comment === 'Student 1 Custom Latch', 'Admin workspace did not overwrite student workspace');

  // Validation rejection: rejects malformed ladder without rungs
  let errorCaught = false;
  try {
    db.saveWorkspace(studentUser1, testProblemId, { ladder: { invalid: true } });
  } catch (err) {
    errorCaught = true;
  }
  assert(errorCaught === true, 'Database rejects malformed ladder without rungs array');

  // Progress Summary verification
  const summary = db.getUserProgressSummary(studentUser1);
  assert(summary.userId === studentUser1, 'Summary matches requested user ID');
  assert(summary.inProgressCount >= 1, 'Summary counts In Progress challenge correctly');
  assert(Array.isArray(summary.activeUnfinished), 'Summary includes activeUnfinished shelf');
  assert(summary.activeUnfinished.some(item => item.id === testProblemId), 'Unfinished challenge appears on Resume shelf');

  // Reset/Delete workspace
  const deleted = db.deleteWorkspace(studentUser1, testProblemId);
  assert(deleted === true, 'Successfully deleted workspace on user reset');
  const afterDelete = db.getWorkspace(studentUser1, testProblemId);
  assert(afterDelete === null, 'Workspace is null after reset');

  // Clean up admin test workspace
  db.deleteWorkspace(adminUser, testProblemId);
}

console.log('\n============================================================');
console.log(`✅ ALL ${passedTestsCount} / ${totalTestsCount} REGRESSION TESTS PASSED SUCCESSFULLY!`);
console.log('============================================================\n');

