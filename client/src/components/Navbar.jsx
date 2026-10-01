import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, Cpu, Award, Shield, BookOpen, User, LogOut, 
  LayoutDashboard, GraduationCap, Lock, LogIn, ArrowRight
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout, isAdmin, isStudent } = useAuth();

  const handleBrandClick = () => {
    if (isAdmin) {
      setActivePage('admin-dashboard');
    } else if (isStudent) {
      setActivePage('student-dashboard');
    } else {
      setActivePage('login');
    }
  };

  const handleLogout = () => {
    logout();
    setActivePage('login');
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button 
          className="brand-section" 
          onClick={handleBrandClick}
          id="nav-brand-button"
        >
          <div className="brand-logo-badge">
            <Zap size={20} fill="#000" />
          </div>
          <div>
            <div className="brand-title">PLC LOGIC ARENA</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              IEC 61131-3 BENCHMARK
            </div>
          </div>
        </button>

        <div className="brand-status-tag">
          <span className="status-dot active"></span>
          PLC CORE: ONLINE
        </div>
      </div>

      <nav className="nav-links">
        {/* If logged in as Student */}
        {isStudent && (
          <button
            className={`nav-item ${activePage === 'student-dashboard' || activePage === 'problem' ? 'active' : ''}`}
            onClick={() => setActivePage('student-dashboard')}
            id="nav-student-dashboard-tab"
          >
            <GraduationCap size={16} />
            Student Dashboard
          </button>
        )}

        {/* If logged in as Super Admin */}
        {isAdmin && (
          <>
            <button
              className={`nav-item ${activePage === 'admin-dashboard' ? 'active' : ''}`}
              onClick={() => setActivePage('admin-dashboard')}
              id="nav-admin-dashboard-tab"
              style={{ color: activePage === 'admin-dashboard' ? '#c084fc' : undefined }}
            >
              <Shield size={16} color="#c084fc" />
              Super Admin Dashboard
            </button>
            <button
              className={`nav-item ${activePage === 'student-dashboard' || activePage === 'problem' ? 'active' : ''}`}
              onClick={() => setActivePage('student-dashboard')}
              id="nav-preview-arena-tab"
            >
              <Cpu size={16} />
              Challenge Arena
            </button>
          </>
        )}

        <button
          className={`nav-item ${activePage === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActivePage('leaderboard')}
          id="nav-leaderboard-tab"
        >
          <Award size={16} />
          Leaderboard
        </button>

        <button
          className={`nav-item ${activePage === 'docs' ? 'active' : ''}`}
          onClick={() => setActivePage('docs')}
          id="nav-docs-tab"
        >
          <BookOpen size={16} />
          PLC Cheatsheet
        </button>
      </nav>

      <div className="header-actions">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* User Profile Badge */}
            <div className="user-badge" style={{ border: isAdmin ? '1px solid rgba(139, 92, 246, 0.4)' : undefined }}>
              <div 
                className="user-avatar" 
                style={{ 
                  background: isAdmin 
                    ? 'linear-gradient(135deg, #8b5cf6, #c084fc)' 
                    : 'linear-gradient(135deg, #3b82f6, #06b6d4)' 
                }}
              >
                {isAdmin ? 'A' : (user.name ? user.name.charAt(0) : 'U')}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {isAdmin ? 'Admin' : user.name}
                </span>
                <span className="user-role" style={{ color: isAdmin ? '#c084fc' : 'var(--plc-cyan)' }}>
                  {isAdmin ? 'SUPER ADMIN' : `${user.score || 0} PTS • ${user.solvedCount || 0} SOLVED`}
                </span>
              </div>
            </div>

            <button
              className="btn-secondary"
              style={{ padding: '6px 10px' }}
              onClick={handleLogout}
              title="Sign out"
              id="btn-nav-logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn-secondary"
              onClick={() => setActivePage('login')}
              id="btn-nav-signin"
              style={{
                fontSize: '13px',
                padding: '7px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: activePage === 'login' ? 'var(--plc-cyan)' : 'var(--border-muted)',
                color: activePage === 'login' ? 'var(--plc-cyan)' : 'var(--text-primary)',
                background: activePage === 'login' ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-card)'
              }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>

            <button
              className="btn-primary"
              onClick={() => setActivePage('register')}
              id="btn-nav-register"
              style={{
                fontSize: '13px',
                padding: '7px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: activePage === 'register' 
                  ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)' 
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: activePage === 'register' ? '#000' : '#032014',
                boxShadow: activePage === 'register' 
                  ? '0 2px 10px rgba(6, 182, 212, 0.4)' 
                  : '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <GraduationCap size={15} />
              <span>Register</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
