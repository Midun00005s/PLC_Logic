import React, { useState, useEffect } from 'react';
import { Search, Filter, Play, CheckCircle2, ChevronRight, Zap, Cpu, Award, Shield, Layers } from 'lucide-react';

export default function Dashboard({ onSelectProblem }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    async function loadProblems() {
      try {
        setLoading(true);
        const res = await fetch('/api/problems');
        if (res.ok) {
          const data = await res.json();
          setProblems(data);
        }
      } catch (err) {
        console.error('Failed to load problems:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProblems();
  }, []);

  const categories = ['ALL', 'Latching Logic', 'Counters', 'Timers', 'Process Automation', 'Safety Systems'];
  const difficulties = ['ALL', 'Easy', 'Medium', 'Hard'];

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiff = selectedDifficulty === 'ALL' || p.difficulty.toUpperCase() === selectedDifficulty.toUpperCase();
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesDiff && matchesCat;
  });

  return (
    <div style={{ flex: 1, padding: '32px 28px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.9) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid var(--border-muted)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '700px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#38bdf8', marginBottom: '14px' }}>
            <Zap size={13} />
            PROBLEM STATEMENT 07 • INDUSTRIAL PLC ARENA
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: '800', lineHeight: 1.2, marginBottom: '12px', letterSpacing: '-0.5px' }}>
            LeetCode for PLC Ladder Logic
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '22px' }}>
            Solve real-world industrial automation challenges using virtual PLC simulation. Construct ladder diagrams with contacts, coils, timers, and counters, then test your logic against automated public and hidden edge-case suites.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Virtual PLC Execution Engine</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Automated Output Comparison</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Fault-Condition Simulation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search problems, categories, tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }}
            id="search-problems-input"
          />
        </div>

        {/* Difficulties */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
            Difficulty:
          </span>
          {difficulties.map(diff => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: selectedDifficulty === diff ? 'var(--bg-card)' : 'transparent',
                border: selectedDifficulty === diff ? '1px solid var(--border-focus)' : '1px solid transparent',
                color: selectedDifficulty === diff ? '#fff' : 'var(--text-secondary)'
              }}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
            Category:
          </span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 10px' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Problem Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Cpu size={32} className="spin-active" style={{ margin: '0 auto 12px auto', color: 'var(--plc-cyan)' }} />
          <p>Loading industrial problems...</p>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '8px' }}>No problems match your filter</p>
          <button
            className="btn-secondary"
            onClick={() => { setSearchQuery(''); setSelectedDifficulty('ALL'); setSelectedCategory('ALL'); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {filteredProblems.map((prob, idx) => (
            <div
              key={prob.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative'
              }}
              className="problem-card"
              id={`problem-card-${prob.id}`}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    CHALLENGE #{String(idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: prob.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : prob.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: prob.difficulty === 'Easy' ? '#10b981' : prob.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                    border: prob.difficulty === 'Easy' ? '1px solid rgba(16, 185, 129, 0.3)' : prob.difficulty === 'Medium' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    {prob.difficulty}
                  </span>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: '700', fontFamily: 'var(--font-heading)', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  {prob.title}
                </h3>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '2px 7px', borderRadius: '4px' }}>
                    {prob.category}
                  </span>
                  {prob.tag && (
                    <span style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.1)', color: '#38bdf8', padding: '2px 7px', borderRadius: '4px' }}>
                      {prob.tag}
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: 'var(--bg-surface)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '18px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Inputs: <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{prob.inputsCount} DI</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Outputs: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{prob.outputsCount} DO</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Public Tests: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{prob.publicTestsCount} Cases</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Hidden Tests: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Active</span>
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => onSelectProblem(prob.id)}
                id={`btn-solve-${prob.id}`}
              >
                <span>Solve Ladder Logic</span>
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
