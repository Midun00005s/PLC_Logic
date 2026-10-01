import React from 'react';
import { BookOpen, Zap, Layers, Cpu, Shield, Clock, Hash } from 'lucide-react';

export default function Docs() {
  return (
    <div style={{ flex: 1, padding: '36px 28px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
          <BookOpen size={12} />
          IEC 61131-3 REFERENCE GUIDE
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: '800' }}>
          PLC Ladder Logic Quick Reference
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
          Standard industrial conventions, symbols, and logic patterns for PLC Logic Arena.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Contacts Section */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--plc-cyan)" /> Core Contacts & Power Flow
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 'bold', color: '#00ff88', marginBottom: '6px' }}>
                —[ ]— Normally Open (NO)
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Examines if the addressed bit is ON (TRUE). If input bit = 1, contact conducts current to the right. Used for Start pushbuttons and sensors that activate on presence.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 'bold', color: '#f87171', marginBottom: '6px' }}>
                —[/]— Normally Closed (NC)
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Examines if the addressed bit is OFF (FALSE). Conducts current when input bit = 0; opens and breaks current when input bit = 1. Used for Stop buttons, thermal overloads, and limits.
              </p>
            </div>
          </div>
        </div>

        {/* Coils Section */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#38bdf8" /> Output Coils
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>
                —( )— Standard Coil
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Energizes addressed bit (Y0..Y7, M0..M7) to TRUE while the rung has continuity; de-energizes to FALSE when rung opens.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 'bold', color: '#c084fc', marginBottom: '4px' }}>
                —(S)— Set / Latch
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Once rung becomes TRUE, sets the target bit to TRUE permanently, even after rung continuity drops.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 'bold', color: '#fb923c', marginBottom: '4px' }}>
                —(R)— Reset / Unlatch
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                When rung becomes TRUE, clears the target bit back to FALSE or resets counter count to 0.
              </p>
            </div>
          </div>
        </div>

        {/* 3-Wire Seal-in Pattern */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#10b981" /> Industrial 3-Wire Seal-in Latch Circuit
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
            In factory machinery, momentary push buttons are used so machines do not automatically restart after power failures. The auxiliary contact of the motor contactor is connected in parallel with the START button to maintain continuity:
          </p>

          <div style={{
            background: '#070a10',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.8,
            color: '#94a3b8'
          }}>
            <div>|───+──[ NO X0: Start ]──+──[/ NC X1: Stop ]──[/ NC X2: Overload ]──( Y0: Motor )──|</div>
            <div>|   |                    |                                                            |</div>
            <div>|   +──[ NO Y0: Latch ]──+                                                            |</div>
          </div>
        </div>

        {/* Timers & Counters */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#f59e0b" /> Timers (TON) & Counters (CTU)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '6px' }}>
                [TON T0 PRE:3000ms]
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Timer On-Delay accumulates elapsed time while the rung condition is TRUE. When elapsed reaches preset (e.g. 3000ms), Done bit (T0) turns TRUE. Resets immediately when rung input drops.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px' }}>
                [CTU C0 PRE:5]
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Up-Counter detects false-to-true rising edge transitions of its rung. Each pulse increments count. When count &ge; preset, Done bit (C0) becomes TRUE. Reset using —(R)— C0.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
