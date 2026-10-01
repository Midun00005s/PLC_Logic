import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Plus, Edit2, Trash2, Save, ArrowLeft, CheckCircle2, 
  AlertCircle, Users, Cpu, FileText, Activity, Search, RefreshCw, 
  Eye, Terminal, Award, Layers, Zap
} from 'lucide-react';

export default function SuperAdminDashboard({ onOpenProblem }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('problems'); // 'problems' | 'students' | 'audit' | 'engine'
  
  // Data states
  const [problems, setProblems] = useState([]);
  const [students, setStudents] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalProblems: 0,
    totalSubmissions: 0,
    passRate: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);
  
  // Problem editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Load problems
      const probRes = await fetch('/api/problems');
      if (probRes.ok) {
        const probData = await probRes.json();
        setProblems(probData);
      }

      // Load users
      const userRes = await fetch('/api/auth/users');
      if (userRes.ok) {
        const userData = await userRes.json();
        setStudents(userData);
      }

      // Load stats
      const statsRes = await fetch('/api/auth/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load recent submissions
      const subRes = await fetch('/api/submissions');
      if (subRes.ok) {
        const subData = await subRes.json();
        setAllSubmissions(subData);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateNew = () => {
    setEditingProblem({
      title: 'New Industrial Automation Problem',
      difficulty: 'Easy',
      category: 'Process Automation',
      tag: 'Custom Logic',
      description: '### Industrial Problem Statement\nDescribe the industrial requirements and ladder logic specifications here...',
      inputs: [
        { address: 'X0', name: 'START_PB', description: 'Start Pushbutton', type: 'momentary' },
        { address: 'X1', name: 'STOP_PB', description: 'Stop Pushbutton', type: 'momentary' }
      ],
      outputs: [
        { address: 'Y0', name: 'MOTOR', description: 'Motor Contactor', color: '#10b981' }
      ],
      starterLadder: {
        rungs: [
          {
            id: 'rung-1',
            comment: 'Sample Rung',
            elements: [
              { type: 'NO', address: 'X0' },
              { type: 'COIL', address: 'Y0' }
            ]
          }
        ]
      },
      publicTests: [
        {
          name: 'Test 1: Start Button Activates Motor',
          steps: [
            { step: 1, inputs: { X0: true, X1: false }, expected: { Y0: true } }
          ]
        }
      ],
      hiddenTests: [
        {
          name: 'Hidden 1: Safety Stop Test',
          steps: [
            { step: 1, inputs: { X0: false, X1: true }, expected: { Y0: false } }
          ]
        }
      ]
    });
    setIsEditing(true);
  };

  const handleEdit = async (probId) => {
    try {
      const res = await fetch(`/api/problems/${probId}/admin`);
      if (res.ok) {
        const fullProblem = await res.json();
        setEditingProblem(fullProblem);
        setIsEditing(true);
      }
    } catch (err) {
      alert('Error loading problem details: ' + err.message);
    }
  };

  const handleDelete = async (probId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this benchmark challenge?')) return;
    try {
      const res = await fetch(`/api/problems/${probId}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Problem removed successfully' });
        loadAllData();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove student "${studentName}"? This will delete their account and records.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/users/${studentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Student ${studentName} removed successfully.` });
        loadAllData();
      } else {
        throw new Error(data.error || 'Failed to remove student');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleSaveProblem = async (e) => {
    e.preventDefault();
    try {
      const isUpdate = Boolean(editingProblem.id);
      const url = isUpdate ? `/api/problems/${editingProblem.id}` : '/api/problems';
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProblem)
      });

      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Problem and test suites saved successfully!' });
        setIsEditing(false);
        setEditingProblem(null);
        loadAllData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.role?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div style={{ flex: 1, padding: '32px 28px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      {/* Super Admin Top Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 16, 48, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        borderRadius: 'var(--radius-xl)',
        padding: '30px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.15)'
      }}>
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#c084fc',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              marginBottom: '10px'
            }}>
              <Shield size={13} />
              SUPER ADMIN CONSOLE • IEC 61131-3 BENCHMARK CONTROL
            </div>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>
              Instructor & Master Administrator Dashboard
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '680px' }}>
              Manage industrial ladder logic challenges, inspect both public & secret hidden evaluation test suites, monitor registered student progress, and audit live benchmark submissions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={loadAllData}
              title="Refresh all metrics"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'spin-active' : ''} />
              <span>Refresh</span>
            </button>

            {!isEditing && (
              <button
                className="btn-primary"
                onClick={handleCreateNew}
                id="btn-superadmin-create-problem"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', border: 'none' }}
              >
                <Plus size={16} />
                <span>Create New Problem</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: statusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '22px',
          fontSize: '13.5px'
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '26px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered Students</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '6px', borderRadius: '8px', color: 'var(--plc-cyan)' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800', color: '#f8fafc' }}>
            {stats.totalStudents || students.filter(s => s.role === 'student').length} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>students</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '4px' }}>
            Total user accounts: {students.length}
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Arena Problems</span>
            <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '6px', borderRadius: '8px', color: '#c084fc' }}>
              <Cpu size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800', color: '#f8fafc' }}>
            {problems.length} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>challenges</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#c084fc', marginTop: '4px' }}>
            With public & hidden verification suites
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Evaluated Submissions</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '6px', borderRadius: '8px', color: '#10b981' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800', color: '#f8fafc' }}>
            {allSubmissions.length} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>runs</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#10b981', marginTop: '4px' }}>
            Accepted: {allSubmissions.filter(s => s.isAccepted).length} solutions
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Simulation Engine</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '6px', borderRadius: '8px', color: '#f59e0b' }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', color: '#10b981' }}>
            ONLINE
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            IEC 61131-3 virtual scan cycle (10ms)
          </div>
        </div>
      </div>

      {/* Main Admin Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '22px', gap: '8px' }}>
        <button
          onClick={() => { setActiveTab('problems'); setIsEditing(false); }}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'problems' ? '#c084fc' : 'var(--text-secondary)',
            borderBottom: activeTab === 'problems' ? '2px solid #c084fc' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-admin-problems"
        >
          <Cpu size={16} />
          <span>Challenge & Benchmark Studio ({problems.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('students'); setIsEditing(false); }}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'students' ? '#c084fc' : 'var(--text-secondary)',
            borderBottom: activeTab === 'students' ? '2px solid #c084fc' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-admin-students"
        >
          <Users size={16} />
          <span>Registered Students Directory ({students.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('audit'); setIsEditing(false); }}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'audit' ? '#c084fc' : 'var(--text-secondary)',
            borderBottom: activeTab === 'audit' ? '2px solid #c084fc' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-admin-audit"
        >
          <FileText size={16} />
          <span>Live Submissions Audit ({allSubmissions.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('engine'); setIsEditing(false); }}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'engine' ? '#c084fc' : 'var(--text-secondary)',
            borderBottom: activeTab === 'engine' ? '2px solid #c084fc' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="tab-admin-engine"
        >
          <Terminal size={16} />
          <span>Virtual Engine Diagnostics</span>
        </button>
      </div>

      {/* Tab 1: Problems Studio */}
      {activeTab === 'problems' && (
        <>
          {isEditing && editingProblem ? (
            /* Problem Editor Form */
            <form onSubmit={handleSaveProblem} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  <ArrowLeft size={14} /> Back to Problem Catalog
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" id="btn-save-problem" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none' }}>
                    <Save size={14} /> Save Benchmark & Test Suites
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Problem Title</label>
                  <input
                    type="text"
                    required
                    value={editingProblem.title}
                    onChange={e => setEditingProblem({ ...editingProblem, title: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Difficulty</label>
                  <select
                    value={editingProblem.difficulty}
                    onChange={e => setEditingProblem({ ...editingProblem, difficulty: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Category</label>
                  <input
                    type="text"
                    value={editingProblem.category}
                    onChange={e => setEditingProblem({ ...editingProblem, category: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Industrial Tag</label>
                  <input
                    type="text"
                    value={editingProblem.tag || ''}
                    onChange={e => setEditingProblem({ ...editingProblem, tag: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Problem Statement & Requirements (Markdown)</label>
                <textarea
                  rows={8}
                  value={editingProblem.description}
                  onChange={e => setEditingProblem({ ...editingProblem, description: e.target.value })}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'vertical' }}
                />
              </div>

              {/* Public & Hidden Tests JSON config */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Public Test Cases (Visible to Students)
                  </label>
                  <textarea
                    rows={10}
                    value={JSON.stringify(editingProblem.publicTests, null, 2)}
                    onChange={e => {
                      try {
                        setEditingProblem({ ...editingProblem, publicTests: JSON.parse(e.target.value) });
                      } catch {}
                    }}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#f59e0b', marginBottom: '6px' }}>
                    Hidden Test Cases (Secret Hackathon Evaluation Suite)
                  </label>
                  <textarea
                    rows={10}
                    value={JSON.stringify(editingProblem.hiddenTests, null, 2)}
                    onChange={e => {
                      try {
                        setEditingProblem({ ...editingProblem, hiddenTests: JSON.parse(e.target.value) });
                      } catch {}
                    }}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                  />
                </div>
              </div>
            </form>
          ) : (
            /* Problem Catalog Table */
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    <th style={{ padding: '12px 16px' }}>ID / TITLE</th>
                    <th style={{ padding: '12px 16px' }}>DIFFICULTY</th>
                    <th style={{ padding: '12px 16px' }}>CATEGORY</th>
                    <th style={{ padding: '12px 16px' }}>I/O CHANNELS</th>
                    <th style={{ padding: '12px 16px' }}>PUBLIC TESTS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map(prob => (
                    <tr key={prob.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{prob.title}</div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{prob.id}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: prob.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : prob.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: prob.difficulty === 'Easy' ? '#10b981' : prob.difficulty === 'Medium' ? '#f59e0b' : '#ef4444'
                        }}>
                          {prob.difficulty}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{prob.category}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {prob.inputsCount} DI • {prob.outputsCount} DO
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                        {prob.publicTestsCount} Cases
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px' }}
                            onClick={() => onOpenProblem(prob.id)}
                            title="Preview Problem in Simulator"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px' }}
                            onClick={() => handleEdit(prob.id)}
                            title="Edit Problem & Hidden Tests"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '4px 8px' }}
                            onClick={(e) => handleDelete(prob.id, e)}
                            title="Delete Problem"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Registered Students Directory */}
      {activeTab === 'students' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search students by name, email, or role..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                id="search-students-admin"
              />
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Showing {filteredStudents.length} registered accounts
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <th style={{ padding: '12px 18px' }}>STUDENT NAME</th>
                  <th style={{ padding: '12px 18px' }}>EMAIL ADDRESS</th>
                  <th style={{ padding: '12px 18px' }}>SYSTEM ROLE</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>SOLVED</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>SCORE PTS</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>JOINED DATE</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(st => (
                  <tr key={st.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: st.role === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #c084fc)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {st.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#f8fafc' }}>{st.name}</div>
                          <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{st.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {st.email}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        background: st.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                        color: st.role === 'admin' ? '#c084fc' : '#10b981',
                        border: st.role === 'admin' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        {st.role === 'admin' ? 'SUPER ADMIN' : 'STUDENT'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {st.solvedCount || 0}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#10b981' }}>
                      {st.score || 0}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {st.createdAt ? new Date(st.createdAt).toLocaleDateString() : 'Active'}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      {st.role === 'admin' ? (
                        <span style={{
                          fontSize: '11px',
                          color: '#c084fc',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Shield size={11} />
                          <span>Protected</span>
                        </span>
                      ) : (
                        <button
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => handleDeleteStudent(st.id, st.name)}
                          title="Remove Student from Platform"
                          id={`btn-remove-student-${st.id}`}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Submissions Audit Log */}
      {activeTab === 'audit' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {allSubmissions.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FileText size={32} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>No submissions recorded in audit log yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>When students test or submit ladder logic, evaluations appear here in real time.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <th style={{ padding: '12px 18px' }}>STATUS</th>
                  <th style={{ padding: '12px 18px' }}>STUDENT / CONTESTANT</th>
                  <th style={{ padding: '12px 18px' }}>CHALLENGE</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>TESTS PASSED</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>SCORE %</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {allSubmissions.map((sub, idx) => (
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
                          <CheckCircle2 size={12} /> ACCEPTED
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
                          <AlertCircle size={12} /> FAILED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: '600', color: '#f8fafc' }}>
                      {sub.userName || 'Student'}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                      {sub.problemTitle || sub.problemId}
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: Engine Diagnostics */}
      {activeTab === 'engine' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} color="var(--plc-cyan)" />
              Virtual PLC Execution Standard
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Standard:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>IEC 61131-3 Compliant</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Virtual Scan Rate:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>10 ms / cycle</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Supported Instruction Types:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>NO, NC, COIL, TON, TOF, CTU, CTD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Resolution Order:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>Top-to-Bottom, Left-to-Right</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Edge-Case Test Injection:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>Active (Multi-step verification)</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="#c084fc" />
              Evaluation & Benchmark Integrity
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '14px' }}>
              Public test cases are exposed to students for real-time debugging in the Virtual IO visualizer. Secret Hidden Evaluation suites are strictly evaluated server-side to prevent hardcoded solutions and ensure industrial reliability.
            </p>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: '12px', color: '#c084fc' }}>
              🔒 <strong>Anti-Cheat Security:</strong> Hidden test parameters are stripped from student responses and never sent to the browser prior to evaluation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
