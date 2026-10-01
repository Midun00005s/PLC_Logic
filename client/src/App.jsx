import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentDashboard from './pages/StudentDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AuthPage from './pages/AuthPage';
import Problem from './pages/Problem';
import Leaderboard from './pages/Leaderboard';
import Docs from './pages/Docs';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainApp() {
  const { user, isAdmin, isStudent } = useAuth();
  
  // Decide initial active page based on user role
  const [activePage, setActivePage] = useState(() => {
    try {
      const savedUser = localStorage.getItem('plc_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.role === 'admin' ? 'admin-dashboard' : 'student-dashboard';
      }
    } catch {}
    return 'login';
  });

  const [selectedProblemId, setSelectedProblemId] = useState(null);

  // Sync route if user auth state changes
  useEffect(() => {
    if (!user) {
      if (activePage !== 'leaderboard' && activePage !== 'docs' && activePage !== 'register') {
        setActivePage('login');
      }
    } else if (isAdmin && (activePage === 'login' || activePage === 'register')) {
      setActivePage('admin-dashboard');
    } else if (isStudent && (activePage === 'login' || activePage === 'register' || activePage === 'admin-dashboard')) {
      setActivePage('student-dashboard');
    }
  }, [user, isAdmin, isStudent]);

  const handleSelectProblem = (probId) => {
    setSelectedProblemId(probId);
    setActivePage('problem');
  };

  const handleBackToDashboard = () => {
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
    if (authenticatedUser?.role === 'admin') {
      setActivePage('admin-dashboard');
    } else {
      setActivePage('student-dashboard');
    }
  };

  return (
    <div className="app-container">
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
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
