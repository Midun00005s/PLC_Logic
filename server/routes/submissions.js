import express from 'express';
import { runTestSuite } from '../plc/evaluator.js';
import { db } from '../models/db.js';

const router = express.Router();

// Submit solution (Runs Public + Hidden test cases)
router.post('/', (req, res) => {
  try {
    const { problemId, ladder, userId, userName } = req.body;

    if (!problemId || !ladder) {
      return res.status(400).json({ error: 'Problem ID and ladder JSON are required' });
    }

    // Fetch problem with hidden tests included
    const problem = db.getProblemById(problemId, true);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const publicTests = problem.publicTests || [];
    const hiddenTests = problem.hiddenTests || [];

    // Run public tests
    const publicResult = runTestSuite(ladder, publicTests);

    // Run hidden tests
    const hiddenResult = runTestSuite(ladder, hiddenTests);

    const totalTests = publicTests.length + hiddenTests.length;
    const passedTests = publicResult.passedCount + hiddenResult.passedCount;
    const scorePercent = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    const isAccepted = passedTests === totalTests;

    // Mask hidden test internal details so secret test parameters remain secure
    const sanitizedHiddenResults = hiddenResult.results.map((r, idx) => ({
      id: r.id || `hidden-${idx + 1}`,
      name: `Hidden Test Case #${idx + 1}`,
      passed: r.passed,
      failureReason: r.passed ? null : 'Failed expected PLC output condition on hidden edge-case.'
    }));

    // Record submission
    const result = db.createSubmission({
      problemId,
      problemTitle: problem.title,
      userId: userId || 'anonymous',
      userName: userName || 'PLC Contestant',
      ladder,
      passedTests,
      totalTests,
      scorePercent,
      isAccepted,
      publicPassed: publicResult.passedCount,
      publicTotal: publicTests.length,
      hiddenPassed: hiddenResult.passedCount,
      hiddenTotal: hiddenTests.length
    });

    const submission = result.submission || result;
    const updatedUser = result.updatedUser;
    const isFirstSolve = result.isFirstSolve;

    res.json({
      success: true,
      submissionId: submission.id,
      isAccepted,
      isFirstSolve,
      scorePercent,
      passedTests,
      totalTests,
      updatedUser: updatedUser ? {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        score: updatedUser.score,
        solvedCount: updatedUser.solvedCount
      } : null,
      publicSummary: {
        passed: publicResult.passedCount,
        total: publicTests.length,
        results: publicResult.results
      },
      hiddenSummary: {
        passed: hiddenResult.passedCount,
        total: hiddenTests.length,
        results: sanitizedHiddenResults
      },
      message: isAccepted
        ? (isFirstSolve
            ? '🎉 Congratulations! First time solving this problem! +100 PTS awarded to your student rank!'
            : '🎉 Problem solved! (Previously solved — your unique count is preserved as 1 time only)')
        : `${passedTests} of ${totalTests} test cases passed. Review your ladder logic and try again.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all submissions (Super Admin audit log)
router.get('/', (req, res) => {
  try {
    const all = db.getAllSubmissions();
    res.json(all.slice(0, 100)); // Return recent 100
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user submission history
router.get('/user/:userId', (req, res) => {
  try {
    const submissions = db.getSubmissionsByUser(req.params.userId);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific submission details
router.get('/:id', (req, res) => {
  try {
    const sub = db.getSubmissionById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
