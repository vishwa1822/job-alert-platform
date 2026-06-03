import JobCard from './JobCard';
import EmptyState from './EmptyState';
import { IconSearch } from './Icons';
import { COMPANY_COLORS, REMOTE_CHIP, salary, timeAgo } from '../utils/jobs';

export default function DiscoverTab({
  filtered, selectedJob, setSelectedJob, savedJobs, toggleSave, search, filterRemote, setFilterRemote,
}) {
  return (
    <div className="page">
      <header className="page-header page-header--compact">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-meta">
            {filtered.length} {filtered.length === 1 ? 'role' : 'roles'}
            {search ? ` · “${search}”` : ''}
          </p>
        </div>
        <select
          className="select filter-select input-glow"
          value={filterRemote}
          onChange={(e) => setFilterRemote(e.target.value)}
          aria-label="Work location"
        >
          <option value="ALL">All locations</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">On-site</option>
        </select>
      </header>

      <div className={`jobs-layout ${selectedJob ? 'jobs-layout--open' : ''}`}>
        <div className="jobs-list">
          {filtered.length === 0 ? (
            <EmptyState icon={IconSearch} title="No jobs match" body="Try a different search or location filter." />
          ) : (
            filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selectedJob?.id === job.id}
                saved={savedJobs.has(job.id)}
                onClick={() => setSelectedJob(job)}
                onSave={() => toggleSave(job.id)}
              />
            ))
          )}
        </div>

        {selectedJob && (
          <aside className="job-detail-drawer card-glow anim-slide-up">
            <JobDetail job={selectedJob} saved={savedJobs.has(selectedJob.id)} onSave={() => toggleSave(selectedJob.id)} onClose={() => setSelectedJob(null)} />
          </aside>
        )}
      </div>
    </div>
  );
}

function JobDetail({ job, saved, onSave, onClose }) {
  const color = COMPANY_COLORS[job.company] || 'var(--accent-cyan)';
  const remoteClass = REMOTE_CHIP[job.remoteType] || 'chip-emerald';

  return (
    <>
      <div className="detail-header">
        <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">×</button>
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, marginBottom: 6 }}>{job.title}</h2>
      <p style={{ fontSize: 13, color, fontWeight: 500, marginBottom: 12 }}>{job.company}</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <span className={`chip ${remoteClass}`}>{job.remoteType}</span>
        <span className="chip chip-emerald">{salary(job.salaryMin, job.salaryMax)}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>{job.description}</p>
      {job.skills?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {job.skills.map((s) => <span key={s} className="tag">{s}</span>)}
        </div>
      )}
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>Posted {timeAgo(job.postedAt)}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <a href={job.applyUrl} className="btn btn-primary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }} target="_blank" rel="noopener noreferrer">Apply</a>
        <button type="button" className="btn btn-ghost" onClick={onSave}>{saved ? 'Saved' : 'Save'}</button>
      </div>
    </>
  );
}
