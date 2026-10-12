import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentDashboard from './pages/StudentDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AuthPage from './pages/AuthPage';
import Problem from './pages/Problem';
import Leaderboard from './pages/Leaderboard';
import Docs from './pages/Docs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import BackgroundEffects from './components/BackgroundEffects';

function getInitialRoute() {
  const hash = window.location.hash || '';
  if (hash.startsWith('#/problem/')) {
    const id = hash.replace('#/problem/', '').split('?')[0].trim();
    if (id) {
      return { page: 'problem', problemId: id };
    }
  }
  if (hash === '#/leaderboard') return { page: 'leaderboard', problemId: null };
  if (hash === '#/docs') return { page: 'docs', problemId: null };
  if (hash === '#/admin-dashboard' || hash === '#/admin') return { page: 'admin-dashboard', problemId: null };
  if (hash === '#/student-dashboard' || hash === '#/dashboard') return { page: 'student-dashboard', problemId: null };
  if (hash === '#/register') return { page: 'register', problemId: null };
  if (hash === '#/login') return { page: 'login', problemId: null };

  // Fallback to localStorage
  try {
    const savedPage = localStorage.getItem('plc_active_page');
    const savedProblemId = localStorage.getItem('plc_selected_problem_id');
    if (savedPage === 'problem' && savedProblemId) {
      return { page: 'problem', problemId: savedProblemId };
    }
    if (savedPage) {
      return { page: savedPage, problemId: null };
    }
    const savedUser = localStorage.getItem('plc_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return { page: parsed.role === 'admin' ? 'admin-dashboard' : 'student-dashboard', problemId: null };
    }
  } catch {}

  return { page: 'login', problemId: null };
}

function MainApp() {
  const { user, isAdmin, isStudent } = useAuth();
  
  const initialRoute = getInitialRoute();
  const [activePage, setActivePage] = useState(initialRoute.page);
  const [selectedProblemId, setSelectedProblemId] = useState(initialRoute.problemId);

  // Sync route if user auth state changes
  useEffect(() => {
    if (!user) {
      if (activePage !== 'leaderboard' && activePage !== 'docs' && activePage !== 'register' && activePage !== 'login') {
        setActivePage('login');
      }
    } else if (isAdmin && (activePage === 'login' || activePage === 'register')) {
      setActivePage('admin-dashboard');
    } else if (isStudent && (activePage === 'login' || activePage === 'register')) {
      setActivePage('student-dashboard');
    }
  }, [user, isAdmin, isStudent]);

  // Sync active page and problem ID to URL hash and localStorage
  useEffect(() => {
    let targetHash = '#/dashboard';
    if (activePage === 'problem' && selectedProblemId) {
      targetHash = `#/problem/${selectedProblemId}`;
      localStorage.setItem('plc_active_page', 'problem');
      localStorage.setItem('plc_selected_problem_id', selectedProblemId);
    } else {
      localStorage.setItem('plc_active_page', activePage);
      localStorage.removeItem('plc_selected_problem_id');
      if (activePage === 'admin-dashboard') targetHash = '#/admin';
      else if (activePage === 'student-dashboard') targetHash = '#/dashboard';
      else if (activePage === 'leaderboard') targetHash = '#/leaderboard';
      else if (activePage === 'docs') targetHash = '#/docs';
      else if (activePage === 'login') targetHash = '#/login';
      else if (activePage === 'register') targetHash = '#/register';
    }

    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  }, [activePage, selectedProblemId]);

  // Listen to browser hash changes (Back / Forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const route = getInitialRoute();
      if (route.page && route.page !== activePage) {
        setActivePage(route.page);
      }
      if (route.problemId !== selectedProblemId) {
        setSelectedProblemId(route.problemId);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activePage, selectedProblemId]);

  const handleSelectProblem = (probId) => {
    setSelectedProblemId(probId);
    setActivePage('problem');
  };

  const handleBackToDashboard = () => {
    setSelectedProblemId(null);
    if (isAdmin) {
      setActivePage('admin-dashboard');
    } else {
      setActivePage('student-dashboard');
    }
  };

  const handleOpenLeaderboard = () => {
    setActivePage('leaderboard');
  };

  const handleAuthSuccess = (authenticatedUser) => {
    if (selectedProblemId) {
      setActivePage('problem');
      return;
    }
    if (authenticatedUser?.role === 'admin') {
      setActivePage('admin-dashboard');
    } else {
      setActivePage('student-dashboard');
    }
  };

  return (
    <div className="app-container">
      {/* Dynamic Background Atmospheric Layer */}
      <BackgroundEffects />

      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="main-content">
        {(activePage === 'login' || activePage === 'register') && (
          <AuthPage
            initialMode={activePage}
            onModeChange={(newMode) => setActivePage(newMode)}
            onAuthSuccess={handleAuthSuccess}
            onBrowseGuest={() => setActivePage('student-dashboard')}
          />
        )}

        {activePage === 'student-dashboard' && (
          <StudentDashboard
            onSelectProblem={handleSelectProblem}
            onOpenLeaderboard={handleOpenLeaderboard}
            onOpenDocs={() => setActivePage('docs')}
          />
        )}

        {activePage === 'admin-dashboard' && (
          isAdmin ? (
            <SuperAdminDashboard onOpenProblem={handleSelectProblem} />
          ) : (
            <StudentDashboard
              onSelectProblem={handleSelectProblem}
              onOpenLeaderboard={handleOpenLeaderboard}
              onOpenDocs={() => setActivePage('docs')}
            />
          )
        )}

        {activePage === 'problem' && selectedProblemId && (
          <Problem
            problemId={selectedProblemId}
            onBack={handleBackToDashboard}
            onOpenLeaderboard={handleOpenLeaderboard}
          />
        )}

        {activePage === 'leaderboard' && (
          <Leaderboard />
        )}

        {activePage === 'docs' && (
          <Docs />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
