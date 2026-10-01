import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'plc-logic-arena-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Register
router.post('/register', (req, res) => {
  try {
    const { email, username, password, name, role } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0] || '').trim().toLowerCase();
    const cleanName = (name || cleanUsername || 'Student').trim();

    if (!cleanEmail && !cleanUsername) {
      return res.status(400).json({ error: 'Email or username is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Prohibit registering with reserved admin handles
    if (cleanUsername === 'admin' || cleanEmail === 'admin@plc.com' || cleanEmail === 'admin' || cleanName.toLowerCase() === 'admin') {
      return res.status(400).json({ error: 'Username "admin" is reserved for platform administration' });
    }

    // Check duplicate email
    if (cleanEmail) {
      const existingEmail = db.data.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (existingEmail) {
        return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      }
    }

    // Check duplicate username
    if (cleanUsername) {
      const existingUser = db.data.users.find(u => 
        (u.username && u.username.toLowerCase() === cleanUsername) ||
        (u.email && u.email.toLowerCase() === cleanUsername)
      );
      if (existingUser) {
        return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
      }
    }

    const finalEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanUsername}@plc.com`;
    const user = db.createUser({
      email: finalEmail,
      username: cleanUsername,
      name: cleanName,
      passwordHash: password,
      role: 'student'
    });

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        score: user.score || 0,
        solvedCount: user.solvedCount || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const user = db.findUserByIdentifier(identifier);
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        score: user.score || 0,
        solvedCount: user.solvedCount || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all registered users / students (for Super Admin dashboard)
router.get('/users', (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET system analytics / KPIs (for Super Admin dashboard)
router.get('/stats', (req, res) => {
  try {
    const stats = db.getPlatformStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE student account (Admin can remove students, but cannot delete admin accounts)
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = db.findUserById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'admin' || targetUser.email === 'admin@plc.com' || targetUser.email === 'admin') {
      return res.status(403).json({ error: 'Administrator accounts cannot be deleted. Self-removal is prohibited.' });
    }

    db.deleteUser(id);
    res.json({ success: true, message: `Student ${targetUser.name} removed successfully` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Demo / Quick Login (1-click for hackathon judges & testers)
router.post('/demo', (req, res) => {
  try {
    const role = req.body.role === 'admin' ? 'admin' : 'student';
    const email = role === 'admin' ? 'admin@plc.com' : 'student@plc.com';
    let user = db.findUserByEmail(email);

    if (!user) {
      user = db.createUser({
        email,
        name: role === 'admin' ? 'Admin' : 'PLC Engineer',
        passwordHash: role === 'admin' ? 'admin123' : 'student123',
        role
      });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        score: user.score || 0,
        solvedCount: user.solvedCount || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current User Profile
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        score: user.score || 0,
        solvedCount: user.solvedCount || 0
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
