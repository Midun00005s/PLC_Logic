import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, Shield, GraduationCap, Lock, Mail, User, ArrowRight, 
  CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, Cpu, Terminal
} from 'lucide-react';

export default function AuthPage({ initialMode = 'login', onModeChange, onAuthSuccess, onBrowseGuest }) {
  const { login, register, demoLogin } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  
  // Login form state
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  
  // Registration form states
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync mode whenever initialMode prop changes (e.g. clicking Register in navbar)
  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      setMode(initialMode);
      setErrorMsg('');
    }
  }, [initialMode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const cleanId = identifier.trim();
        if (!cleanId) throw new Error('Please enter your username or email');
        if (!password) throw new Error('Please enter your password');

        const user = await login(cleanId, password);
        if (onAuthSuccess) {
          onAuthSuccess(user);
        }
      } else {
        // Registration is for students
        const cleanName = name.trim();
        const cleanEmail = regEmail.trim();
        const cleanUsername = regUsername.trim();

        if (!cleanName) throw new Error('Please enter your full name');
        if (!cleanEmail) throw new Error('Please enter a valid email address');
        if (regPassword.length < 6) throw new Error('Password must be at least 6 characters long');
        if (regPassword !== confirmPassword) throw new Error('Passwords do not match. Please verify.');
        
        const user = await register(cleanName, cleanEmail, regPassword, cleanUsername || cleanEmail.split('@')[0], 'student');
        if (onAuthSuccess) {
          onAuthSuccess(user);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      background: 'transparent'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Top Branding Badge */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            padding: '6px 14px',
            borderRadius: '30px',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div className="brand-logo-badge" style={{ width: '24px', height: '24px', borderRadius: '6px' }}>
              <Zap size={14} fill="#000" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
              PLC LOGIC ARENA
            </span>
            <span style={{ fontSize: '10px', color: 'var(--plc-cyan)', fontFamily: 'var(--font-mono)', background: 'rgba(6,182,212,0.15)', padding: '2px 6px', borderRadius: '10px' }}>
              v2.4
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '28px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            marginBottom: '6px',
            color: 'var(--text-primary)'
          }}>
            {mode === 'login' ? 'Authentication Gateway' : 'Student Registration'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {mode === 'login' 
              ? 'Sign in to access your designated Student or Super Admin workspace'
              : 'Create your competitor profile to simulate & submit PLC ladder programs'}
          </p>
        </div>

        {/* Auth Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(20px)',
          position: 'relative'
        }}>
          {/* Toggle Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
                border: mode === 'login' ? '1px solid var(--border-focus)' : '1px solid transparent'
              }}
              id="tab-login-mode"
            >
              <Lock size={14} color={mode === 'login' ? 'var(--plc-cyan)' : 'currentColor'} />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('register')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: mode === 'register' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
                border: mode === 'register' ? '1px solid var(--border-focus)' : '1px solid transparent'
              }}
              id="tab-register-mode"
            >
              <GraduationCap size={15} color={mode === 'register' ? 'var(--live-wire)' : 'currentColor'} />
              <span>Register as Student</span>
            </button>
          </div>

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'login' ? (
              <>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                    Username or Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      required
                      placeholder="admin or student@plc.com"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      style={{ width: '100%', paddingLeft: '38px', height: '42px', fontSize: '13.5px' }}
                      id="input-auth-identifier"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      Password
                    </label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '13.5px' }}
                      id="input-auth-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Vance"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{ width: '100%', paddingLeft: '38px', height: '42px', fontSize: '13.5px' }}
                      id="input-register-name"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex.vance@university.edu"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      style={{ width: '100%', paddingLeft: '38px', height: '42px', fontSize: '13.5px' }}
                      id="input-register-email"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                    Username / Handle <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(Optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Terminal size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="e.g. alex_plc"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      style={{ width: '100%', paddingLeft: '38px', height: '42px', fontSize: '13.5px' }}
                      id="input-register-username"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                      Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Min 6 chars"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        style={{ width: '100%', paddingLeft: '32px', height: '42px', fontSize: '13px' }}
                        id="input-register-password"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                      Confirm <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <CheckCircle2 size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={{ width: '100%', paddingLeft: '32px', height: '42px', fontSize: '13px' }}
                        id="input-register-confirm"
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <GraduationCap size={18} color="#10b981" />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Assigned Role: <strong style={{ color: '#10b981' }}>Student Competitor</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grants access to Student Dashboard, PLC Virtual Execution & Leaderboard.</div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                height: '44px',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
              }}
              id="btn-auth-submit"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : mode === 'login' ? (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <span>Create Student Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{ marginTop: '18px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                style={{
                  fontSize: '13px',
                  color: 'var(--plc-cyan)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '500'
                }}
                id="btn-switch-auth-mode"
              >
                {mode === 'login' ? (
                  <span>Don't have an account? <strong style={{ textDecoration: 'underline' }}>Register as Student</strong></span>
                ) : (
                  <span>Already have an account? <strong style={{ textDecoration: 'underline' }}>Sign In</strong></span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
