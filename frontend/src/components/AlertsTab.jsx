import { useState } from 'react';
import { FREQ_OPTS, fmt$ } from '../utils/jobs';
import EmptyState from './EmptyState';
import { IconTarget, IconX } from './Icons';

export default function AlertsTab({ alerts, setAlerts }) {
  const [showModal, setShowModal] = useState(false);
  const [editAlert, setEditAlert] = useState(null);

  const openNew = () => { setEditAlert(null); setShowModal(true); };
  const openEdit = (a) => { setEditAlert(a); setShowModal(true); };
  const toggle = (id) => setAlerts((p) => p.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)));
  const remove = (id) => setAlerts((p) => p.filter((a) => a.id !== id));
  const save = (data) => {
    if (editAlert) setAlerts((p) => p.map((a) => (a.id === editAlert.id ? { ...a, ...data } : a)));
    else setAlerts((p) => [...p, { id: `a${Date.now()}`, matchCount: 0, isActive: true, ...data }]);
    setShowModal(false);
  };

  return (
    <div style={{ maxWidth: 760 }} className="anim-slide-up">
      {showModal && <AlertModal alert={editAlert} onSave={save} onClose={() => setShowModal(false)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Job alerts</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Get notified when matching roles are scraped from company career pages.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>+ New alert</button>
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon={IconTarget} title="No alerts yet" body="Create your first alert for real-time job notifications." action={<button type="button" className="btn btn-primary" onClick={openNew}>Create alert</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map((alert) => (
            <div key={alert.id} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{alert.name}</span>
                    <span className={`chip ${alert.isActive ? 'chip-emerald' : 'chip-rose'}`}>{alert.isActive ? 'Active' : 'Paused'}</span>
                    {alert.matchCount > 0 && <span className="chip chip-cyan">{alert.matchCount} matches</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {alert.keywords?.map((k) => <span key={k} className="tag">{k}</span>)}
                    {alert.salaryMin && <span className="chip chip-emerald">Min {fmt$(alert.salaryMin)}</span>}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Frequency: {alert.frequency}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label className="toggle">
                    <input type="checkbox" checked={alert.isActive} onChange={() => toggle(alert.id)} />
                    <div className="toggle-track" /><div className="toggle-thumb" />
                  </label>
                  <button type="button" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => openEdit(alert)}>Edit</button>
                  <button type="button" className="btn-icon" onClick={() => remove(alert.id)} aria-label="Delete"><IconX width={14} height={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <HowItWorks />
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { title: 'Career page crawl', body: 'Scheduled scraper monitors company career pages every 5–15 minutes.' },
    { title: 'Kafka event stream', body: 'Each new job is published as a structured event for downstream services.' },
    { title: 'Alert matcher', body: 'Notification service matches jobs against your active alert criteria.' },
    { title: 'Real-time push', body: 'Matches trigger WebSocket pushes to open tabs and optional email.' },
  ];
  return (
    <div className="card" style={{ marginTop: 28, padding: 22 }}>
      <p className="section-label" style={{ marginBottom: 16 }}>How alerts work</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {steps.map((s, i) => (
          <div key={s.title} style={{ display: 'flex', gap: 12 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'rgba(34, 211, 238, 0.12)', color: 'var(--accent-cyan)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12,
            }}>{i + 1}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.55 }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertModal({ alert, onSave, onClose }) {
  const [name, setName] = useState(alert?.name || '');
  const [keywords, setKeywords] = useState((alert?.keywords || []).join(', '));
  const [salaryMin, setSalaryMin] = useState(alert?.salaryMin || '');
  const [remote, setRemote] = useState(alert?.remoteTypes?.[0] || 'ALL');
  const [frequency, setFrequency] = useState(alert?.frequency || 'INSTANT');

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      remoteTypes: remote === 'ALL' ? ['REMOTE', 'HYBRID', 'ONSITE'] : [remote],
      salaryMin: salaryMin ? Number(salaryMin) : null,
      frequency,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel anim-slide-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{alert ? 'Edit alert' : 'New job alert'}</h3>
          <button type="button" className="btn-icon" onClick={onClose}><IconX /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Alert name *"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Senior React Remote" /></Field>
          <Field label="Keywords (comma separated)"><input className="input" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="react, typescript" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Remote preference">
              <select className="select" value={remote} onChange={(e) => setRemote(e.target.value)}>
                <option value="ALL">All types</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </Field>
            <Field label="Min salary ($)"><input className="input" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="150000" /></Field>
          </div>
          <Field label="Frequency">
            <div style={{ display: 'flex', gap: 8 }}>
              {FREQ_OPTS.map((f) => (
                <button key={f} type="button" className={`filter-pill ${frequency === f ? 'active' : ''}`} onClick={() => setFrequency(f)}>{f}</button>
              ))}
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>{alert ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, display: 'block' }}>{label}</label>
      {children}
    </div>
  );
}
