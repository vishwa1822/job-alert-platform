import { COMPANY_COLORS, timeAgo } from '../utils/jobs';
import EmptyState from './EmptyState';
import { IconStar } from './Icons';

export default function SavedTab({ savedList, toggleSave, apply, appliedJobs }) {
  if (savedList.length === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <h1 className="page-title">Saved</h1>
          <p className="page-desc">Roles you bookmark from the Jobs tab appear here.</p>
        </header>
        <EmptyState icon={IconStar} title="Nothing saved yet" body="Open a job and tap Save to keep it for later." />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header page-header--compact">
        <h1 className="page-title">Saved</h1>
        <p className="page-meta">{savedList.length} {savedList.length === 1 ? 'job' : 'jobs'}</p>
      </header>
      <ul className="monitor-list">
        {savedList.map((job) => {
          const color = COMPANY_COLORS[job.company] || 'var(--accent-cyan)';
          const applied = appliedJobs.has(job.id);
          return (
            <li key={job.id} className="card monitor-card card-glow">
              <div className="monitor-main">
                <p className="monitor-name">{job.title}</p>
                <p className="monitor-meta">
                  <span style={{ color }}>{job.company}</span> · {job.location} · {timeAgo(job.postedAt)}
                </p>
              </div>
              <div className="monitor-actions">
                {!applied && (
                  <button type="button" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => apply(job.id)}>
                    Apply
                  </button>
                )}
                {applied && <span className="chip chip-emerald">Applied</span>}
                <button type="button" className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => toggleSave(job.id)}>
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
