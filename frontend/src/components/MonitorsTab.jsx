import { useState } from 'react';
import { formatLastChecked } from '../utils/monitors';
import { formatIntervalMinutes, resolveIntervalMinutes } from '../utils/interval';
import IntervalPicker from './IntervalPicker';
import { IconGlobe, IconX } from './Icons';
import EmptyState from './EmptyState';

export default function MonitorsTab({
  monitors, loading, addMonitor, toggleMonitor, removeMonitor, checkNow,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAdd = async (form) => {
    setSaving(true);
    setMessage(null);
    const result = await addMonitor(form);
    setSaving(false);
    if (result.ok) {
      setShowAdd(false);
      setMessage(result.demo
        ? `${result.item.name} added — will sync when the API is connected.`
        : `${result.item.name} is now being monitored.`);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const activeCount = monitors.filter((m) => m.isActive).length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Company monitors</h1>
          <p className="page-desc">
            Add career portals to watch. JobPulse checks them on your schedule and surfaces new postings in Jobs.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-shimmer" onClick={() => setShowAdd(true)}>
          + Add company
        </button>
      </header>

      {message && (
        <div className="notice anim-slide-up" role="status">{message}</div>
      )}

      <p className="page-meta">
        {loading ? 'Loading…' : `${activeCount} of ${monitors.length} active`}
      </p>

      {monitors.length === 0 ? (
        <EmptyState
          icon={IconGlobe}
          title="No companies yet"
          body="Add a company career page URL to start monitoring new job postings."
          action={<button type="button" className="btn btn-primary btn-shimmer" onClick={() => setShowAdd(true)}>Add company</button>}
        />
      ) : (
        <ul className="monitor-list">
          {monitors.map((m) => (
            <li key={m.id} className="card monitor-card card-glow">
              <div className="monitor-main">
                <div className="monitor-title-row">
                  <span className="monitor-name">{m.name}</span>
                  <span className={`chip ${m.isActive ? 'chip-green' : 'chip-slate'}`}>
                    {m.isActive ? 'Monitoring' : 'Paused'}
                  </span>
                </div>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="monitor-url">
                  {m.url.replace(/^https?:\/\//, '')}
                </a>
                <p className="monitor-meta">
                  Every {formatIntervalMinutes(m.interval)} · {formatLastChecked(m.lastScrapedAt)}
                </p>
              </div>
              <div className="monitor-actions">
                <label className="toggle" title={m.isActive ? 'Pause' : 'Resume'}>
                  <input
                    type="checkbox"
                    checked={m.isActive}
                    onChange={(e) => toggleMonitor(m.id, e.target.checked)}
                  />
                  <div className="toggle-track" />
                  <div className="toggle-thumb" />
                </label>
                <button type="button" className="btn btn-ghost" onClick={() => checkNow(m.id)}>
                  Check now
                </button>
                <button type="button" className="btn-icon" onClick={() => removeMonitor(m.id)} aria-label={`Remove ${m.name}`}>
                  <IconX width={14} height={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <AddCompanyModal
          saving={saving}
          onClose={() => setShowAdd(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}

function AddCompanyModal({ onClose, onSubmit, saving }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter the company name.');
      return;
    }
    if (!url.trim()) {
      setError('Enter the career page URL.');
      return;
    }
    const mins = resolveIntervalMinutes(intervalMinutes);
    if (!mins) {
      setError('Choose a valid check interval (5 min – 7 days).');
      return;
    }
    setError('');
    onSubmit({ name, url, interval: mins });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal-panel modal-panel--green anim-slide-up" onSubmit={submit}>
        <div className="modal-panel-shine" aria-hidden />
        <div className="modal-header">
          <h2 className="page-title modal-title">Add company monitor</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close"><IconX /></button>
        </div>

        <p className="page-desc modal-desc">
          Paste the company&apos;s careers or jobs page. We&apos;ll check it on your schedule for new listings.
        </p>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-stack">
          <label className="field">
            <span className="field-label">Company name</span>
            <input className="input input-glow" placeholder="e.g. Infosys" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          <label className="field">
            <span className="field-label">Career page URL</span>
            <input className="input input-glow" placeholder="careers.company.com/jobs" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          <IntervalPicker valueMinutes={intervalMinutes} onChange={setIntervalMinutes} />
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn btn-primary btn-shimmer" style={{ flex: 1 }} disabled={saving}>
            {saving ? 'Adding…' : 'Start monitoring'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
