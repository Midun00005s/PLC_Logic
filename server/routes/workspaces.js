import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';
import { validateLadder } from '../plc/ladderEngine.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'plc-logic-arena-secret-key-2026';

/**
 * Helper to resolve authenticated user from Authorization header or body/query fallback
 */
function resolveUser(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded?.id) {
        return { id: decoded.id, name: decoded.name, role: decoded.role };
      }
    } catch {
      // Token might be offline or expired; fall through to body/query
    }
  }

  // Fallback to explicit userId in body or query params for development / offline guest mode
  const fallbackId = req.body?.userId || req.query?.userId || req.headers['x-user-id'];
  if (fallbackId) {
    const user = db.findUserById(fallbackId);
    if (user) return { id: user.id, name: user.name, role: user.role };
    return { id: fallbackId, name: req.body?.userName || 'PLC User', role: 'student' };
  }

  return null;
}

// GET workspace for a specific problem and authenticated user
router.get('/problem/:problemId', (req, res) => {
  try {
    const { problemId } = req.params;
    const user = resolveUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required to access saved workspace' });
    }

    const problem = db.getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const workspace = db.getWorkspace(user.id, problemId);
    res.json({
      success: true,
      workspace: workspace || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST autosave or manually save workspace for a specific problem
router.post('/problem/:problemId', (req, res) => {
  try {
    const { problemId } = req.params;
    const { ladder, testHistory, plcState } = req.body;
    const user = resolveUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required to save workspace' });
    }

    const problem = db.getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (!ladder || typeof ladder !== 'object') {
      return res.status(400).json({ error: 'Ladder logic JSON object is required' });
    }

    // Validate structural schema of ladder program
    const validation = validateLadder(ladder);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid ladder diagram structure',
        errors: validation.errors
      });
    }

    const saved = db.saveWorkspace(user.id, problemId, {
      ladder,
      testHistory,
      plcState
    });

    res.json({
      success: true,
      message: 'Workspace saved successfully',
      workspace: saved
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE reset workspace back to default starter code
router.delete('/problem/:problemId', (req, res) => {
  try {
    const { problemId } = req.params;
    const user = resolveUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required to reset workspace' });
    }

    const deleted = db.deleteWorkspace(user.id, problemId);
    res.json({
      success: true,
      message: deleted ? 'Workspace deleted, reset to starter code' : 'No saved workspace found',
      deleted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET My Progress summary across all challenges
router.get('/my-progress', (req, res) => {
  try {
    const user = resolveUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to retrieve progress summary' });
    }

    const summary = db.getUserProgressSummary(user.id);
    res.json({
      success: true,
      progress: summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET progress for a specific user ID
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const summary = db.getUserProgressSummary(userId);
    res.json({
      success: true,
      progress: summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
