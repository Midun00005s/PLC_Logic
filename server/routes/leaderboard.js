import express from 'express';
import { db } from '../models/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const list = db.getLeaderboard();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
