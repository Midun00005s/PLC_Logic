import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, Star, Zap, UserCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setRankings(data);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  // Guarantee only students/teams are shown and re-ranked sequentially
  const studentRankings = rankings
    .filter(item => {
      const name = item.name?.toLowerCase() || '';
      return name !== 'admin' && name !== 'super admin' && !name.includes('(admin)');
    })
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <div style={{ flex: 1, padding: '36px 28px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: '#38bdf8',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          marginBottom: '12px'
        }}>
          <GraduationCap size={14} />
          STUDENT AUTOMATION RANKINGS
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
          PLC Logic Arena Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Student competitors ranked strictly by <strong>unique problems solved</strong> (solving the same problem multiple times is counted as 1 time only).
        </p>
      </div>

      {/* Rankings Table */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-muted)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
              <th style={{ padding: '14px 20px', width: '80px' }}>RANK</th>
              <th style={{ padding: '14px 20px' }}>STUDENT / TEAM</th>
              <th style={{ padding: '14px 20px', width: '160px' }}>TITLE & BADGE</th>
              <th style={{ padding: '14px 20px', width: '120px', textAlign: 'center' }}>UNIQUE SOLVED</th>
              <th style={{ padding: '14px 20px', width: '120px', textAlign: 'right' }}>SCORE</th>
            </tr>
          </thead>
          <tbody>
            {studentRankings.map((item, idx) => {
              const isCurrentUser = user && user.name === item.name;
              const isTop1 = idx === 0;
              const isTop2 = idx === 1;
              const isTop3 = idx === 2;

              return (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: isCurrentUser ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    {isTop1 ? (
                      <span style={{ fontSize: '18px' }}>🥇</span>
                    ) : isTop2 ? (
                      <span style={{ fontSize: '18px' }}>🥈</span>
                    ) : isTop3 ? (
                      <span style={{ fontSize: '18px' }}>🥉</span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        #{idx + 1}
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{item.avatar || '⚡'}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: isCurrentUser ? 'var(--plc-cyan)' : '#f8fafc' }}>
                          {item.name} {isCurrentUser && <span style={{ fontSize: '11px', color: '#38bdf8' }}>(You)</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: '11px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {item.badge || 'Engineer'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                    {item.solved}
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#10b981', fontSize: '15px' }}>
                    {item.score} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>PTS</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
