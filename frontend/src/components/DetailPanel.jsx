import { COMPANY_COLORS, REMOTE_CHIP, salary, timeAgo } from '../utils/jobs';
import { IconStar, IconX } from './Icons';

export default function DetailPanel({ job, saved, applied, toggleSave, apply, onClose }) {
  const color = COMPANY_COLORS[job.company] || 'var(--accent-cyan)';
  const remoteClass = REMOTE_CHIP[job.remoteType] || 'chip-emerald';

  return (
    <div className="anim-slide-up" style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span className="section-label">Job details</span>
        <button type="button" className="btn-icon" onClick={onClose} aria-label="Close"><IconX /></button>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: `${color}18`, color,
          border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
        }}>{job.initials}</div>
        <div>
          <div style={{ fontSize: 13, color, fontWeight: 600, marginBottom: 4 }}>{job.company}</div>
          <h2 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.35 }}>{job.title}</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <span className={`chip ${remoteClass}`}>{job.remoteType}</span>
        <span className="chip chip-violet">{job.level}</span>
        <span className="chip chip-slate">{job.location}</span>
        {job.isNew && <span className="badge-new">JUST POSTED</span>}
      </div>

      <div className="card" style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>Salary range</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)' }}>
            {salary(job.salaryMin, job.salaryMax)}
          </div>
        </div>
        <span className="chip chip-cyan" style={{ fontSize: 13 }}>{job.matchScore}% match</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={applied} onClick={() => apply(job.id)}>
          {applied ? 'Applied' : 'Apply now'}
        </button>
        <button type="button" className="btn-icon" onClick={() => toggleSave(job.id)} style={{ color: saved ? 'var(--accent-amber)' : undefined }}>
          <IconStar filled={saved} />
        </button>
      </div>

      <p className="section-label" style={{ marginBottom: 10 }}>Required skills</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {(job.skills.length ? job.skills : ['See description']).map((s) => (
          <span key={s} className="chip chip-cyan">{s}</span>
        ))}
      </div>

      <p className="section-label" style={{ marginBottom: 10 }}>About the role</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 16 }}>{job.description}</p>

      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(148, 163, 184, 0.06)', fontSize: 11, color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Posted {timeAgo(job.postedAt)}</span>
        <span>via JobPulse Scraper</span>
      </div>
    </div>
  );
}
