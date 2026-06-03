import { useState } from 'react';
import { COMPANY_COLORS, timeAgo } from '../utils/jobs';
import EmptyState from './EmptyState';
import { IconLayers, IconX } from './Icons';

const APP_STAGES = ['APPLIED', 'PHONE_SCREEN', 'TECHNICAL', 'FINAL_ROUND', 'OFFER', 'REJECTED'];

export default function TrackerTab({ savedList, appliedList, trackerFilter, setTrackerFilter, toggleSave, apply }) {
  const [stages, setStages] = useState({});
  const setStage = (id, st) => setStages((p) => ({ ...p, [id]: st }));

  const tabs = [
    { id: 'ALL', label: 'All', count: savedList.length + appliedList.length },
    { id: 'SAVED', label: 'Saved', count: savedList.length },
    { id: 'APPLIED', label: 'Applied', count: appliedList.length },
  ];

  const combined = [...new Map([
    ...savedList.map((j) => [j.id, { ...j, _state: 'SAVED' }]),
    ...appliedList.map((j) => [j.id, { ...j, _state: 'APPLIED' }]),
  ]).values()];

  const display = trackerFilter === 'ALL' ? combined : combined.filter((j) => j._state === trackerFilter);

  return (
    <div style={{ maxWidth: 800 }} className="anim-slide-up">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Application tracker</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage saved roles and your interview pipeline.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Saved', val: savedList.length, color: 'var(--accent-amber)' },
          { label: 'Applied', val: appliedList.length, color: 'var(--accent-emerald)' },
          { label: 'In progress', val: Object.values(stages).filter((s) => !['OFFER', 'REJECTED'].includes(s)).length, color: 'var(--accent-cyan)' },
          { label: 'Offers', val: Object.values(stages).filter((s) => s === 'OFFER').length, color: 'var(--accent-violet)' },
        ].map((s) => (
          <div key={s.label} className="card stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" className={`filter-pill ${trackerFilter === t.id ? 'active' : ''}`} onClick={() => setTrackerFilter(t.id)}>
            {t.label} {t.count > 0 && `(${t.count})`}
          </button>
        ))}
      </div>

      {display.length === 0 ? (
        <EmptyState icon={IconLayers} title="Nothing here yet" body="Save jobs from Discover to track them here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {display.map((job) => {
            const color = COMPANY_COLORS[job.company] || 'var(--accent-cyan)';
            const stage = stages[job.id] || (job._state === 'APPLIED' ? 'APPLIED' : null);
            return (
              <div key={job.id} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, background: `${color}18`, color,
                    border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  }}>{job.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{job.title}</span>
                      <span className={`chip ${job._state === 'APPLIED' ? 'chip-emerald' : 'chip-amber'}`}>{job._state}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
                      <span style={{ color }}>{job.company}</span> · {job.location}
                    </p>
                    {job._state === 'APPLIED' && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {APP_STAGES.map((s, i) => {
                          const stageIdx = APP_STAGES.indexOf(stage || 'APPLIED');
                          const isCurrent = s === stage;
                          const isPast = i <= stageIdx;
                          return (
                            <button key={s} type="button" onClick={() => setStage(job.id, s)} style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontWeight: isCurrent ? 700 : 400,
                              background: isCurrent ? 'rgba(34, 211, 238, 0.15)' : isPast ? 'rgba(34, 211, 238, 0.06)' : 'rgba(148, 163, 184, 0.06)',
                              border: `1px solid ${isCurrent ? 'rgba(34, 211, 238, 0.4)' : 'var(--border)'}`,
                              color: isCurrent ? 'var(--accent-cyan)' : isPast ? 'var(--text-muted)' : 'var(--text-dim)',
                            }}>{s.replace('_', ' ')}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{timeAgo(job.postedAt)}</span>
                    {job._state !== 'APPLIED' && <button type="button" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 11 }} onClick={() => apply(job.id)}>Apply</button>}
                    <button type="button" className="btn-icon" onClick={() => toggleSave(job.id)}><IconX width={14} height={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
