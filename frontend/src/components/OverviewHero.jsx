import { IconTrend, IconGlobe, IconSpark } from './Icons';

export default function OverviewHero({ stats, dataMode, newJobPulse, wsStatus }) {
  const live = dataMode === 'live' && wsStatus === 'live';

  return (
    <section className="overview-hero anim-slide-up" aria-label="Platform overview">
      <div className="card hero-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className={`mode-badge ${live ? 'live' : 'demo'}`}>
            {live ? 'Live API' : 'Demo mode'}
          </span>
          {newJobPulse && <span className="dot-live anim-pulse" aria-hidden />}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
          Real-time job intelligence
          <span className="brand-gradient"> before aggregators</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 420 }}>
          Monitor company career pages directly. New roles stream in via Kafka and appear on your dashboard instantly.
        </p>
        <div style={{ display: 'flex', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
          {['Discover', 'Alerts', 'Track', 'Sources'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)' }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, background: 'rgba(34, 211, 238, 0.12)',
                color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 11,
              }}>{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>

      <StatCard icon={IconTrend} label="Jobs today" value={stats.today.toLocaleString()} accent="var(--accent-cyan)" pulse={newJobPulse} />
      <StatCard icon={IconGlobe} label="Sources active" value={stats.sources} accent="var(--accent-violet)" />
      <StatCard icon={IconSpark} label="Total indexed" value={stats.total.toLocaleString()} accent="var(--accent-emerald)" />
    </section>
  );
}

function StatCard({ icon: Icon, label, value, accent, pulse }) {
  return (
    <div className="card stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: accent, opacity: 0.9 }}><Icon width={20} height={20} /></div>
        {pulse && <span className="dot-live anim-pulse" />}
      </div>
      <div className="stat-value" style={{ color: pulse ? accent : 'var(--text)' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
