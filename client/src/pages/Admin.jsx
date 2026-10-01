import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Admin({ onOpenProblem }) {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/problems');
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleCreateNew = () => {
    setEditingProblem({
      title: 'New Industrial Automation Problem',
      difficulty: 'Easy',
      category: 'Process Automation',
      tag: 'Custom Logic',
      description: '### Industrial Problem Statement\nDescribe the requirements here...',
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
    if (!window.confirm('Are you sure you want to delete this challenge?')) return;
    try {
      const res = await fetch(`/api/problems/${probId}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Problem removed successfully' });
        loadProblems();
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
        setStatusMsg({ type: 'success', text: 'Problem saved successfully!' });
        setIsEditing(false);
        setEditingProblem(null);
        loadProblems();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div style={{ flex: 1, padding: '32px 28px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            <Shield size={12} />
            INSTRUCTOR & ADMIN STUDIO
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800' }}>
            Challenge & Benchmark Management
          </h1>
        </div>

        {!isEditing && (
          <button className="btn-primary" onClick={handleCreateNew} id="btn-admin-create-problem">
            <Plus size={15} /> Create New Problem
          </button>
        )}
      </div>

      {statusMsg && (
        <div className={`alert-banner ${statusMsg.type}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Editor Form Mode */}
      {isEditing && editingProblem ? (
        <form onSubmit={handleSaveProblem} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
              <ArrowLeft size={14} /> Back to Problem List
            </button>
            <button type="submit" className="btn-primary" id="btn-save-problem">
              <Save size={14} /> Save Problem & Test Cases
            </button>
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
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Public Test Cases (JSON)</label>
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
              <label style={{ display: 'block', fontSize: '12px', color: '#f59e0b', marginBottom: '6px' }}>Hidden Test Cases (Secret Hackathon Evaluation Suite)</label>
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
        /* Problem Catalog List for Admin */
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <th style={{ padding: '12px 16px' }}>TITLE</th>
                <th style={{ padding: '12px 16px' }}>DIFFICULTY</th>
                <th style={{ padding: '12px 16px' }}>CATEGORY</th>
                <th style={{ padding: '12px 16px' }}>TESTS</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {problems.map(prob => (
                <tr key={prob.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{prob.title}</td>
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
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    {prob.publicTestsCount} Public
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(prob.id)} title="Edit Problem">
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={(e) => handleDelete(prob.id, e)} title="Delete Problem">
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
    </div>
  );
}
