import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, Award, CheckCircle2, ChevronRight, Zap, 
  Cpu, Clock, Layers, Search, Filter, Play, ArrowUpRight, 
  Trophy, BookOpen, AlertCircle, FileText
} from 'lucide-react';

export default function StudentDashboard({ onSelectProblem, onOpenLeaderboard, onOpenDocs }) {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'SOLVED' | 'UNSOLVED'
  const [activeTab, setActiveTab] = useState('challenges'); // 'challenges' | 'history'

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load problems
        const pRes = await fetch('/api/problems');
        if (pRes.ok) {
          const pData = await pRes.json();
          setProblems(pData);
        }

        // Load student submissions if logged in
        if (user && user.id) {
          const sRes = await fetch(`/api/submissions/user/${user.id}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            setSubmissions(sData);
          }
        }
      } catch (err) {
        console.error('Failed to load student data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Compute solved problem IDs from submissions
  const solvedProblemIds = new Set(
    submissions.filter(s => s.isAccepted).map(s => s.problemId)
  );

  const attemptedProblemIds = new Set(
    submissions.map(s => s.problemId)
  );

  const categories = ['ALL', 'Latching Logic', 'Counters', 'Timers', 'Process Automation', 'Safety Systems'];
  const difficulties = ['ALL', 'Easy', 'Medium', 'Hard'];

  const filteredProblems = problems.filter(p => {
    const isSolved = solvedProblemIds.has(p.id);
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiff = selectedDifficulty === 'ALL' || p.difficulty.toUpperCase() === selectedDifficulty.toUpperCase();
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || 
                          (selectedStatus === 'SOLVED' && isSolved) || 
                          (selectedStatus === 'UNSOLVED' && !isSolved);
    return matchesSearch && matchesDiff && matchesCat && matchesStatus;
  });

  const nextRecommended = problems.find(p => !solvedProblemIds.has(p.id)) || problems[0];
  const totalSolved = solvedProblemIds.size;
  const totalCount = problems.length;
  const progressPercent = totalCount > 0 ? Math.round((totalSolved / totalCount) * 100) : 0;

  return (
    <div style={{ flex: 1, padding: '32px 28px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      {/* Top Student Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid var(--border-muted)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 30px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Subtle accent glow */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '-40px',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: '#38bdf8',
              marginBottom: '14px'
            }}>
              <GraduationCap size={14} />
              STUDENT WORKSPACE • IEC 61131-3 VIRTUAL ARENA
            </div>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '30px', fontWeight: '800', lineHeight: 1.2, marginBottom: '8px', color: '#f8fafc' }}>
              Welcome back, {user?.name || 'PLC Trainee'}! 👋
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.5, marginBottom: '18px' }}>
              Design virtual PLC rungs using Normally Open/Closed contacts, output coils, timers (TON), and counters (CTU). Test your logic against automated IEC test suites and climb the leaderboard!
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {nextRecommended && (
                <button
                  className="btn-primary"
                  onClick={() => onSelectProblem(nextRecommended.id)}
                  id="btn-student-continue-learning"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  <Play size={14} fill="#000" />
                  <span>Next Challenge: {nextRecommended.title.slice(0, 24)}...</span>
                  <ChevronRight size={15} />
                </button>
              )}

              <button
                className="btn-secondary"
                onClick={onOpenDocs}
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                <BookOpen size={14} />
                <span>PLC Syntax Guide</span>
              </button>
            </div>
          </div>

          {/* Quick Progress Dial */}
          <div style={{
            background: 'rgba(7, 9, 14, 0.6)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            minWidth: '220px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Overall Progress
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: '800', color: 'var(--live-wire)', lineHeight: 1 }}>
              {progressPercent}%
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: '10px' }}>
              {totalSolved} of {totalCount} Problems Solved
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Score</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '6px', borderRadius: '8px', color: 'var(--plc-cyan)' }}>
              <Zap size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800', color: '#f8fafc' }}>
            {user?.score || 0} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>PTS</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '4px' }}>
            Earned across all accepted submissions
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Challenges Solved</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '6px', borderRadius: '8px', color: '#10b981' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800', color: '#f8fafc' }}>
            {totalSolved} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {totalCount}</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#34d399', marginTop: '4px' }}>
            {totalCount - totalSolved} challenges remaining
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submissions</span>
            <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '6px', borderRadius: '8px', color: '#c084fc' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800', color: '#f8fafc' }}>
            {submissions.length} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>runs</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#c084fc', marginTop: '4px' }}>
            Evaluated on Virtual PLC Engine
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Standing</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '6px', borderRadius: '8px', color: '#f59e0b' }}>
              <Trophy size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800', color: '#f8fafc' }}>
            Leaderboard
          </div>
          <button
            onClick={onOpenLeaderboard}
            style={{ fontSize: '11.5px', color: '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
          >
            <span>View Rankings</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Tabs: Challenges vs Submissions History */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '22px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('challenges')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'challenges' ? 'var(--plc-cyan)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'challenges' ? '2px solid var(--plc-cyan)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-student-challenges"
        >
          <Cpu size={16} />
          <span>Challenge Catalog ({filteredProblems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'history' ? 'var(--plc-cyan)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'history' ? '2px solid var(--plc-cyan)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-student-history"
        >
          <Clock size={16} />
          <span>My Submissions History ({submissions.length})</span>
        </button>
      </div>

      {activeTab === 'challenges' ? (
        <>
          {/* Filters & Search */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '22px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
                id="search-student-problems"
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                Status:
              </span>
              {['ALL', 'UNSOLVED', 'SOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    background: selectedStatus === st ? 'var(--bg-card)' : 'transparent',
                    border: selectedStatus === st ? '1px solid var(--border-focus)' : '1px solid transparent',
                    color: selectedStatus === st ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Difficulties */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                Diff:
              </span>
              {difficulties.map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Category:
              </span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  height: '34px',
                  backgroundColor: '#0d121d',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} style={{ backgroundColor: '#0d121d', color: '#f8fafc' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Problem Cards Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <Cpu size={32} className="spin-active" style={{ margin: '0 auto 12px auto', color: 'var(--plc-cyan)' }} />
              <p>Loading problems...</p>
            </div>
          ) : filteredProblems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '8px' }}>No problems match your filters</p>
              <button
                className="btn-secondary"
                onClick={() => { setSearchQuery(''); setSelectedDifficulty('ALL'); setSelectedCategory('ALL'); setSelectedStatus('ALL'); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
              {filteredProblems.map((prob, idx) => {
                const isSolved = solvedProblemIds.has(prob.id);
                const isAttempted = attemptedProblemIds.has(prob.id);

                return (
                  <div
                    key={prob.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: isSolved 
                        ? '1px solid rgba(16, 185, 129, 0.4)' 
                        : '1px solid var(--border-muted)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: isSolved ? '0 0 16px rgba(16, 185, 129, 0.1)' : 'var(--shadow-sm)',
                      position: 'relative'
                    }}
                    className="problem-card"
                    id={`student-problem-card-${prob.id}`}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                            CHALLENGE #{String(idx + 1).padStart(2, '0')}
                          </span>
                          {isSolved ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              <CheckCircle2 size={12} /> SOLVED
                            </span>
                          ) : isAttempted ? (
                            <span style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b',
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                              IN PROGRESS
                            </span>
                          ) : (
                            <span style={{
                              background: 'rgba(6, 182, 212, 0.1)',
                              color: '#38bdf8',
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '4px'
                            }}>
                              NEW
                            </span>
                          )}
                        </div>

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

                      <h3 style={{ fontSize: '17px', fontWeight: '700', fontFamily: 'var(--font-heading)', marginBottom: '8px', color: '#f8fafc' }}>
                        {prob.title}
                      </h3>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '2px 7px', borderRadius: '4px' }}>
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
                          Public Tests: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{prob.publicTestsCount} Cases</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Hidden Tests: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Active</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className={isSolved ? 'btn-secondary' : 'btn-primary'}
                      style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                      onClick={() => onSelectProblem(prob.id)}
                      id={`btn-student-solve-${prob.id}`}
                    >
                      <span>{isSolved ? 'Review / Re-solve' : 'Construct Ladder Diagram'}</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Submissions History */
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {submissions.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Clock size={32} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>No submissions yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Choose any challenge from the catalog to submit your ladder logic diagram.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <th style={{ padding: '12px 18px' }}>STATUS</th>
                  <th style={{ padding: '12px 18px' }}>CHALLENGE</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>TEST CASES</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>SCORE %</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>DATE & TIME</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => (
                  <tr key={sub.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 18px' }}>
                      {sub.isAccepted ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          <CheckCircle2 size={13} /> ACCEPTED
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          <AlertCircle size={13} /> FAILED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: '600', color: '#f8fafc' }}>
                      {sub.problemTitle || 'PLC Automation Challenge'}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {sub.passedTests} / {sub.totalTests} Passed
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '700', color: sub.isAccepted ? '#10b981' : '#f59e0b' }}>
                      {sub.scorePercent}%
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {new Date(sub.submittedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        onClick={() => onSelectProblem(sub.problemId)}
                      >
                        Open Editor
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
