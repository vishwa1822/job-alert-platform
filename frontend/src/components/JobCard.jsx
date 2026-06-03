import { COMPANY_COLORS, salary, timeAgo } from '../utils/jobs';
import { IconStar } from './Icons';

export default function JobCard({ job, selected, saved, onClick, onSave }) {
  const color = COMPANY_COLORS[job.company] || 'var(--accent-cyan)';

  return (
    <article
      className={`card job-card ${selected ? 'selected' : ''} ${job.isNew ? 'anim-flash-new' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
    >
      <div className="job-card-row">
        <div className="job-card-avatar" style={{ background: `${color}18`, color, borderColor: `${color}30` }}>
          {job.initials}
        </div>
        <div className="job-card-body">
          <div className="job-card-top">
            <h3 className="job-card-title">{job.title}</h3>
            <button
              type="button"
              className="job-card-save"
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              aria-label={saved ? 'Unsave' : 'Save'}
            >
              <IconStar width={16} height={16} filled={saved} />
            </button>
          </div>
          <p className="job-card-sub">
            <span style={{ color }}>{job.company}</span>
            <span className="sep">·</span>
            {job.location}
            <span className="sep">·</span>
            {salary(job.salaryMin, job.salaryMax)}
          </p>
          <p className="job-card-time">{timeAgo(job.postedAt)}{job.isNew ? ' · New' : ''}</p>
        </div>
      </div>
    </article>
  );
}
