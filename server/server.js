import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import problemRoutes from './routes/problems.js';
import simulationRoutes from './routes/simulation.js';
import submissionRoutes from './routes/submissions.js';
import leaderboardRoutes from './routes/leaderboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// System status / Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'PLC Logic Arena Virtual Execution Engine',
    timestamp: new Date().toISOString(),
    iecStandard: 'IEC 61131-3 Compliant'
  });
});

// Serve frontend in production if built
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('PLC Logic Arena Backend is running. Frontend dev server is active on port 5173.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`⚡ PLC LOGIC ARENA - VIRTUAL PLC SIMULATOR SERVER`);
  console.log(`⚡ Server running on: http://localhost:${PORT}`);
  console.log(`⚡ IEC 61131-3 Virtual Engine: READY`);
  console.log(`=================================================\n`);
});
