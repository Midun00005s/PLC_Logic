import express from 'express';
import { executeLadder, VirtualPLC } from '../plc/ladderEngine.js';
import { evaluateTestCase, runTestSuite } from '../plc/evaluator.js';
import { db } from '../models/db.js';

const router = express.Router();

// Run single scan or state update for live interactive ladder testing
router.post('/scan', (req, res) => {
  try {
    const { ladder, inputs, previousState, fault, deltaTimeMs } = req.body;

    if (!ladder) {
      return res.status(400).json({ error: 'Ladder logic JSON is required' });
    }

    const plc = new VirtualPLC(previousState || {});
    if (fault) plc.setFault(fault);
    if (inputs) plc.setInputs(inputs);

    const scanResult = plc.scan(ladder, deltaTimeMs || 50);

    res.json({
      success: true,
      scanResult,
      plcState: {
        inputs: plc.inputs,
        outputs: plc.outputs,
        memory: plc.memory,
        timers: plc.timers,
        counters: plc.counters,
        fault: plc.fault,
        scanCount: plc.scanCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run Public Test Cases (for "Run Code" button)
router.post('/test', (req, res) => {
  try {
    const { ladder, problemId, customTests } = req.body;

    if (!ladder) {
      return res.status(400).json({ error: 'Ladder logic JSON is required' });
    }

    let testsToRun = customTests;

    if (!testsToRun && problemId) {
      const problem = db.getProblemById(problemId, false);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }
      testsToRun = problem.publicTests || [];
    }

    if (!testsToRun || testsToRun.length === 0) {
      return res.status(400).json({ error: 'No test cases to execute' });
    }

    const testResults = runTestSuite(ladder, testsToRun);

    res.json({
      success: true,
      ...testResults
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
