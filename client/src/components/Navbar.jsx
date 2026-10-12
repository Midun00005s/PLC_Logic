import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, Cpu, Award, Shield, BookOpen, User, LogOut, 
  LayoutDashboard, GraduationCap, Lock, LogIn, ArrowRight, Menu, X
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleBrandClick = () => {
    setIsMobileMenuOpen(false);
    if (isAdmin) {
      setActivePage('admin-dashboard');
    } else if (isStudent) {
      setActivePage('student-dashboard');
    } else {
      setActivePage('login');
    }
  };

  const handleNavigate = (page) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setActivePage('login');
  };

  return (
    <>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="brand-section" 
            onClick={handleBrandClick}
            id="nav-brand-button"
          >
            <div className="brand-logo-badge">
              <Zap size={20} fill="currentColor" stroke="currentColor" />
            </div>
            <div>
              <div className="brand-title">PLC LOGIC ARENA</div>
              <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.55)', fontFamily: 'var(--font-mono)' }}>
                IEC 61131-3 BENCHMARK
              </div>
            </div>
          </button>

          <div className="brand-status-tag">
            <span className="status-dot active"></span>
            <span>PLC CORE: ONLINE</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          {/* If logged in as Student */}
          {isStudent && (
            <button
              className={`nav-item ${activePage === 'student-dashboard' || activePage === 'problem' ? 'active' : ''}`}
              onClick={() => handleNavigate('student-dashboard')}
              id="nav-student-dashboard-tab"
            >
              <GraduationCap size={15} />
              <span>Student Dashboard</span>
            </button>
          )}

          {/* If logged in as Super Admin */}
          {isAdmin && (
            <>
              <button
                className={`nav-item ${activePage === 'admin-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavigate('admin-dashboard')}
                id="nav-admin-dashboard-tab"
              >
                <Shield size={15} />
                <span>Super Admin</span>
              </button>
              <button
                className={`nav-item ${activePage === 'student-dashboard' || activePage === 'problem' ? 'active' : ''}`}
                onClick={() => handleNavigate('student-dashboard')}
                id="nav-preview-arena-tab"
              >
                <Cpu size={15} />
                <span>Challenge Arena</span>
              </button>
            </>
          )}

          <button
            className={`nav-item ${activePage === 'leaderboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('leaderboard')}
            id="nav-leaderboard-tab"
          >
            <Award size={15} />
            <span>Leaderboard</span>
          </button>

          <button
            className={`nav-item ${activePage === 'docs' ? 'active' : ''}`}
            onClick={() => handleNavigate('docs')}
            id="nav-docs-tab"
          >
            <BookOpen size={15} />
            <span>PLC Cheatsheet</span>
          </button>
        </nav>

        {/* Actions Section */}
        <div className="header-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* User Profile Badge */}
              <div className="user-badge">
                <div className="user-avatar">
                  {isAdmin ? 'A' : (user.name ? user.name.charAt(0) : 'U')}
                </div>
                <div className="user-info">
                  <span className="user-name">
                    {isAdmin ? 'Admin' : user.name}
                  </span>
                  <span className="user-role" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {isAdmin ? 'SUPER ADMIN' : `${user.score || 0} PTS`}
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
                onClick={() => handleNavigate('login')}
                id="btn-nav-signin"
                style={{
                  fontSize: '13px',
                  padding: '7px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>

              <button
                className="btn-nav-register-highlight"
                onClick={() => handleNavigate('register')}
                id="btn-nav-register"
                style={{
                  fontSize: '13px',
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <GraduationCap size={15} />
                <span>Register</span>
              </button>
            </div>
          )}

          {/* Mobile Navigation Drawer Toggle */}
          <button
            className="mobile-nav-toggle btn-secondary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: 'none',
              padding: '6px 10px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'sticky',
          top: '64px',
          left: 0,
          right: 0,
          zIndex: 49,
          background: '#09090b',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.8)'
        }}>
          {isStudent && (
            <button
              className={`nav-item ${activePage === 'student-dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigate('student-dashboard')}
              style={{ padding: '10px 14px', fontSize: '14px', width: '100%', justifyContent: 'flex-start' }}
            >
              <GraduationCap size={16} /> Student Dashboard
            </button>
          )}

          {isAdmin && (
            <>
              <button
                className={`nav-item ${activePage === 'admin-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavigate('admin-dashboard')}
                style={{ padding: '10px 14px', fontSize: '14px', width: '100%', justifyContent: 'flex-start' }}
              >
                <Shield size={16} /> Super Admin Dashboard
              </button>
              <button
                className={`nav-item ${activePage === 'student-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavigate('student-dashboard')}
                style={{ padding: '10px 14px', fontSize: '14px', width: '100%', justifyContent: 'flex-start' }}
              >
                <Cpu size={16} /> Challenge Arena
              </button>
            </>
          )}

          <button
            className={`nav-item ${activePage === 'leaderboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('leaderboard')}
            style={{ padding: '10px 14px', fontSize: '14px', width: '100%', justifyContent: 'flex-start' }}
          >
            <Award size={16} /> Leaderboard
          </button>

          <button
            className={`nav-item ${activePage === 'docs' ? 'active' : ''}`}
            onClick={() => handleNavigate('docs')}
            style={{ padding: '10px 14px', fontSize: '14px', width: '100%', justifyContent: 'flex-start' }}
          >
            <BookOpen size={16} /> PLC Cheatsheet
          </button>
        </div>
      )}
    </>
  );
}
