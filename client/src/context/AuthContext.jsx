import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('plc_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'admin') {
          parsed.name = 'Admin';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('plc_token') || null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('plc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('plc_user');
    }
    if (token) {
      localStorage.setItem('plc_token', token);
    } else {
      localStorage.removeItem('plc_token');
    }
  }, [user, token]);

  const login = async (identifier, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, username: identifier, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    if (data.user && data.user.role === 'admin') {
      data.user.name = 'Admin';
    }
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const register = async (name, email, password, username = '', role = 'student') => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: name.trim(), 
        email: email.trim(), 
        username: (username || email).trim(), 
        password, 
        role 
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const demoLogin = async (role = 'student') => {
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user && data.user.role === 'admin') {
          data.user.name = 'Admin';
        }
        setUser(data.user);
        setToken(data.token);
        return data.user;
      }
    } catch {
      // Fallback offline mock
    }
    const fallbackUser = role === 'admin'
      ? { id: 'usr-admin-1', name: 'Admin', email: 'admin@plc.com', role: 'admin', score: 800, solvedCount: 8 }
      : { id: 'usr-student-1', name: 'Alex Vance (Student)', email: 'student@plc.com', role: 'student', score: 485, solvedCount: 5 };
    setUser(fallbackUser);
    setToken('offline-token');
    return fallbackUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('plc_user');
    localStorage.removeItem('plc_token');
  };

  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isStudent, login, register, demoLogin, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
