import express from 'express';
import { db } from '../models/db.js';

const router = express.Router();

// GET all problems (public views don't expose hidden test cases)
router.get('/', (req, res) => {
  try {
    const problems = db.getProblems(false);
    // Add summary info
    const summary = problems.map(p => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      category: p.category,
      tag: p.tag,
      inputsCount: p.inputs?.length || 0,
      outputsCount: p.outputs?.length || 0,
      publicTestsCount: p.publicTests?.length || 0
    }));
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET specific problem by ID
router.get('/:id', (req, res) => {
  try {
    const problem = db.getProblemById(req.params.id, false);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: GET problem with hidden tests included
router.get('/:id/admin', (req, res) => {
  try {
    const problem = db.getProblemById(req.params.id, true);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Create new problem
router.post('/', (req, res) => {
  try {
    const { title, difficulty, category, description, inputs, outputs, starterLadder, publicTests, hiddenTests } = req.body;
    if (!title || !difficulty) {
      return res.status(400).json({ error: 'Title and difficulty are required' });
    }

    const newProblem = db.createOrUpdateProblem({
      id: `prob-${Date.now()}`,
      title,
      difficulty,
      category: category || 'General Logic',
      tag: req.body.tag || 'Industrial',
      description: description || 'No description provided.',
      inputs: inputs || [],
      outputs: outputs || [],
      starterLadder: starterLadder || { rungs: [] },
      publicTests: publicTests || [],
      hiddenTests: hiddenTests || []
    });

    res.status(201).json(newProblem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Update existing problem
router.put('/:id', (req, res) => {
  try {
    const existing = db.getProblemById(req.params.id, true);
    if (!existing) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const updated = db.createOrUpdateProblem({
      ...existing,
      ...req.body,
      id: req.params.id
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Delete problem
router.delete('/:id', (req, res) => {
  try {
    db.deleteProblem(req.params.id);
    res.json({ message: 'Problem deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
