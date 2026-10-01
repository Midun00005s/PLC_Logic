import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedProblems } from './seedProblems.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_USERS = [
  {
    id: "usr-student-1",
    email: "student@plc.com",
    name: "Alex Vance (Student)",
    role: "student",
    // simple bcrypt hash for student123 or fallback match
    passwordHash: "student123",
    score: 185,
    solvedCount: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-admin-1",
    email: "admin@plc.com",
    name: "Admin",
    role: "admin",
    passwordHash: "admin123",
    score: 500,
    solvedCount: 5,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_LEADERBOARD = [];

class DatabaseStore {
  constructor() {
    this.data = {
      users: [...DEFAULT_USERS],
      problems: [...seedProblems],
      submissions: [],
      leaderboard: [...DEFAULT_LEADERBOARD]
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.data.users = parsed.users?.length ? parsed.users : DEFAULT_USERS;
        this.data.problems = parsed.problems?.length ? parsed.problems : seedProblems;
        this.data.submissions = parsed.submissions || [];
        this.data.leaderboard = parsed.leaderboard?.length ? parsed.leaderboard : DEFAULT_LEADERBOARD;
      } else {
        this.save();
      }
      this.recalculateAllStats();
    } catch (err) {
      console.warn('Could not read DB file, using in-memory store:', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.warn('Could not persist to DB file:', err.message);
    }
  }

  // User queries
  findUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserByIdentifier(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    
    // Direct matches for admin / superadmin
    if (clean === 'admin' || clean === 'superadmin' || clean === 'admin@plc.com') {
      const admin = this.data.users.find(u => u.role === 'admin' || u.email.toLowerCase() === 'admin@plc.com');
      if (admin) return admin;
    }
    
    // Direct matches for student alias
    if (clean === 'student' || clean === 'student@plc.com') {
      const student = this.data.users.find(u => u.role === 'student' && u.email.toLowerCase() === 'student@plc.com');
      if (student) return student;
    }
    
    return this.data.users.find(u => 
      u.email.toLowerCase() === clean || 
      (u.username && u.username.toLowerCase() === clean) ||
      u.name.toLowerCase() === clean ||
      u.email.toLowerCase().split('@')[0] === clean
    );
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  getAllUsers() {
    return this.data.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      score: u.score || 0,
      solvedCount: u.solvedCount || 0,
      createdAt: u.createdAt
    }));
  }

  getAllSubmissions() {
    return this.data.submissions || [];
  }

  getPlatformStats() {
    const students = this.data.users.filter(u => u.role === 'student');
    const totalProblems = this.data.problems.length;
    const totalSubmissions = (this.data.submissions || []).length;
    const acceptedCount = (this.data.submissions || []).filter(s => s.isAccepted).length;
    const passRate = totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 0;

    return {
      totalStudents: students.length,
      totalUsers: this.data.users.length,
      totalProblems,
      totalSubmissions,
      acceptedCount,
      passRate
    };
  }

  createUser(userData) {
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: userData.role || 'student',
      score: 0,
      solvedCount: 0,
      createdAt: new Date().toISOString(),
      ...userData
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  deleteUser(id) {
    const user = this.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.role === 'admin' || user.id === 'usr-admin-1' || user.email === 'admin@plc.com' || user.email === 'admin') {
      throw new Error('Cannot remove an administrator account. Self-deletion is prohibited.');
    }
    this.data.users = this.data.users.filter(u => u.id !== id);
    // Remove from leaderboard if present
    if (this.data.leaderboard) {
      this.data.leaderboard = this.data.leaderboard.filter(l => l.name !== user.name);
    }
    this.save();
    return user;
  }

  // Problems
  getProblems(includeHidden = false) {
    return this.data.problems.map(p => {
      const copy = { ...p };
      if (!includeHidden) {
        delete copy.hiddenTests;
      }
      return copy;
    });
  }

  getProblemById(id, includeHidden = false) {
    const p = this.data.problems.find(item => item.id === id);
    if (!p) return null;
    const copy = { ...p };
    if (!includeHidden) {
      delete copy.hiddenTests;
    }
    return copy;
  }

  createOrUpdateProblem(problemData) {
    const id = problemData.id || `prob-${Date.now()}`;
    const existingIndex = this.data.problems.findIndex(p => p.id === id);
    const problem = { ...problemData, id };

    if (existingIndex >= 0) {
      this.data.problems[existingIndex] = problem;
    } else {
      this.data.problems.push(problem);
    }
    this.save();
    return problem;
  }

  deleteProblem(id) {
    this.data.problems = this.data.problems.filter(p => p.id !== id);
    this.save();
  }

  // Submissions
  createSubmission(submission) {
    const sub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: new Date().toISOString(),
      ...submission
    };
    this.data.submissions.unshift(sub);

    // Update user stats and leaderboard if user is registered
    let updatedUser = null;
    let isFirstSolve = false;

    if (sub.userId && sub.userId !== 'anonymous') {
      const stats = this.recalculateUserStats(sub.userId, sub.problemId, sub.isAccepted);
      if (stats) {
        updatedUser = stats.user;
        isFirstSolve = stats.isFirstSolve;
      }
    }

    this.save();
    return { submission: sub, updatedUser, isFirstSolve };
  }

  // Recalculate stats for a specific user:
  // Each problem is counted as solved 1 TIME ONLY regardless of how many times it was solved.
  recalculateUserStats(userId, currentProblemId = null, currentIsAccepted = false) {
    const user = this.findUserById(userId);
    if (!user) return null;

    // Admin accounts are evaluators/teachers and are NEVER on the student leaderboard
    if (user.role === 'admin' || user.name.toLowerCase() === 'admin' || user.email === 'admin@plc.com') {
      this.removeFromLeaderboard(user.name);
      return { user, isFirstSolve: false };
    }

    // Check if this was the first time this problem was solved
    let isFirstSolve = false;
    if (currentProblemId && currentIsAccepted) {
      // Find prior accepted submissions (excluding the very latest one we just unshifted)
      const priorAccepted = this.data.submissions.slice(1).find(s => 
        (s.userId === userId || s.userName === user.name) && 
        s.problemId === currentProblemId && 
        (s.isAccepted || s.scorePercent === 100)
      );
      isFirstSolve = !priorAccepted;
    }

    // Get all user submissions
    const userSubs = this.data.submissions.filter(s => s.userId === userId || s.userName === user.name);

    // Distinct unique problem IDs that have at least one accepted solution
    const uniqueSolvedProblemIds = new Set(
      userSubs.filter(s => s.isAccepted || s.scorePercent === 100).map(s => s.problemId)
    );

    // Solved count is strictly the count of UNIQUE solved problems
    user.solvedCount = uniqueSolvedProblemIds.size;

    // Score is strictly 100 points per unique solved problem
    let calculatedScore = 0;
    uniqueSolvedProblemIds.forEach(pId => {
      const prob = this.getProblemById(pId);
      if (prob?.difficulty === 'Hard') calculatedScore += 200;
      else if (prob?.difficulty === 'Medium') calculatedScore += 150;
      else calculatedScore += 100;
    });
    user.score = calculatedScore;

    // Only students are added to the leaderboard
    if (user.role === 'student' && user.solvedCount > 0) {
      this.updateLeaderboard(user);
    }

    this.save();
    return { user, isFirstSolve };
  }

  // Recalculate all users and rebuild leaderboard purely from registered students
  recalculateAllStats() {
    const studentUsers = (this.data.users || []).filter(u => 
      u.role === 'student' && 
      u.name.toLowerCase() !== 'admin' && 
      u.email !== 'admin@plc.com'
    );

    const newLeaderboard = [];

    // Recalculate unique solves for all registered students
    studentUsers.forEach(user => {
      // Find unique solved problems
      const userSubs = this.data.submissions.filter(s => s.userId === user.id || s.userName === user.name);
      const uniqueSolvedProblemIds = new Set(
        userSubs.filter(s => s.isAccepted || s.scorePercent === 100).map(s => s.problemId)
      );

      user.solvedCount = uniqueSolvedProblemIds.size;
      let calculatedScore = 0;
      uniqueSolvedProblemIds.forEach(pId => {
        const prob = this.getProblemById(pId);
        if (prob?.difficulty === 'Hard') calculatedScore += 200;
        else if (prob?.difficulty === 'Medium') calculatedScore += 150;
        else calculatedScore += 100;
      });
      user.score = calculatedScore;

      newLeaderboard.push({
        id: user.id,
        name: user.name,
        score: user.score,
        solved: user.solvedCount,
        avatar: "🎓",
        badge: user.score >= 300 ? "PLC Master" : (user.score > 0 ? "Active Solver" : "Student Competitor")
      });
    });

    // Reset admin user stats to 0 (administrators do not compete on student leaderboard)
    (this.data.users || []).forEach(user => {
      if (user.role === 'admin' || user.name.toLowerCase() === 'admin') {
        user.solvedCount = 0;
        user.score = 0;
      }
    });

    // Sort leaderboard by score descending, then solved descending
    newLeaderboard.sort((a, b) => b.score - a.score || b.solved - a.solved);
    newLeaderboard.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    this.data.leaderboard = newLeaderboard;
    this.save();
  }

  getSubmissionsByUser(userId) {
    return this.data.submissions.filter(s => s.userId === userId);
  }

  getSubmissionById(id) {
    return this.data.submissions.find(s => s.id === id);
  }

  // Remove an entry from leaderboard (e.g. admin or deleted user)
  removeFromLeaderboard(name) {
    if (!name) return;
    this.data.leaderboard = (this.data.leaderboard || []).filter(l => 
      l.name.toLowerCase() !== name.toLowerCase()
    );
    this.data.leaderboard.sort((a, b) => b.score - a.score || b.solved - a.solved);
    this.data.leaderboard.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    this.save();
  }

  // Leaderboard
  updateLeaderboard(user) {
    // ONLY REGISTERED STUDENTS ARE ALLOWED ON THE LEADERBOARD
    if (!user || user.role !== 'student' || user.name.toLowerCase() === 'admin' || user.email === 'admin@plc.com') {
      return;
    }

    let entry = this.data.leaderboard.find(l => l.name === user.name || l.id === user.id);
    if (entry) {
      entry.score = user.score || 0;
      entry.solved = user.solvedCount || 0;
      entry.badge = user.score >= 300 ? "PLC Master" : (user.score > 0 ? "Active Solver" : "Student Competitor");
    } else {
      this.data.leaderboard.push({
        id: user.id,
        name: user.name,
        score: user.score || 0,
        solved: user.solvedCount || 0,
        avatar: "🎓",
        badge: user.score >= 300 ? "PLC Master" : (user.score > 0 ? "Active Solver" : "Student Competitor")
      });
    }

    // Ensure only real registered students remain
    this.data.leaderboard = this.data.leaderboard.filter(l => 
      this.data.users.some(u => (u.name === l.name || u.id === l.id) && u.role === 'student')
    );

    this.data.leaderboard.sort((a, b) => b.score - a.score || b.solved - a.solved);
    this.data.leaderboard.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    this.save();
  }

  getLeaderboard() {
    // Return exclusively registered students
    return (this.data.leaderboard || [])
      .filter(l => {
        if (!l || !l.name) return false;
        const lower = l.name.toLowerCase();
        if (lower === 'admin' || lower === 'super admin' || lower.includes('(admin)')) return false;
        // Verify this entry matches an actual registered student user
        return this.data.users.some(u => 
          (u.name === l.name || u.id === l.id) && u.role === 'student'
        );
      })
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }
}

export const db = new DatabaseStore();
