import { COMPANY_COLORS } from '../utils/jobs';

export default function RightSidebar({ jobs, setSelectedJob, wsStatus, stats }) {
  const live = wsStatus === 'live';

  return (
    <div style={{ padding: 20 }}>
      <div className="card anim-slide-up" style={{ padding: 16, marginBottom: 20, borderColor: 'rgba(167, 139, 250, 0.2)' }}>
        <p className="section-label" style={{ marginBottom: 8, color: 'var(--accent-violet)' }}>AI recommendations</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Ranked by skill overlap, salary fit, and posting recency from your profile signals.
        </p>
      </div>

      <p className="section-label" style={{ marginBottom: 12 }}>Top picks</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {jobs.slice(0, 7).map((job) => {
          const color = COMPANY_COLORS[job.company] || 'var(--accent-cyan)';
          return (
            <div key={job.id} className="card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => setSelectedJob(job)}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: `${color}18`, color,
                  border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                }}>{job.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{job.company}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)' }}>{job.matchScore}%</span>
              </div>
              <div className="score-track"><div className="score-fill" style={{ width: `${job.matchScore}%` }} /></div>
            </div>
          );
        })}
      </div>

      <p className="section-label" style={{ marginBottom: 12 }}>System status</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'Job Scraper', status: 'Running', ok: true },
          { label: 'Kafka', status: 'Active', ok: true },
          { label: 'PostgreSQL', status: 'Connected', ok: true },
          { label: 'Redis', status: 'Online', ok: true },
          { label: 'WebSocket', status: live ? 'Live' : 'Standby', ok: live },
          { label: 'Indexed jobs', status: stats.total.toLocaleString(), ok: true },
        ].map((s) => (
          <div key={s.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', background: 'rgba(148, 163, 184, 0.05)', borderRadius: 10,
            border: '1px solid var(--border)', fontSize: 12,
          }}>
            <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ color: s.ok ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 600, fontSize: 11 }}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
