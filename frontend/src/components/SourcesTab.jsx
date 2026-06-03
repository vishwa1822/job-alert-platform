import { useState } from 'react';
import { COMPANY_COLORS } from '../utils/jobs';

const SOURCES = [
  { name: 'Google', url: 'careers.google.com', strategy: 'API', interval: 10, lastScrape: '2m ago', jobsFound: 3 },
  { name: 'Meta', url: 'metacareers.com/jobs', strategy: 'API', interval: 10, lastScrape: '4m ago', jobsFound: 1 },
  { name: 'Apple', url: 'jobs.apple.com', strategy: 'HTML', interval: 15, lastScrape: '8m ago', jobsFound: 2 },
  { name: 'Microsoft', url: 'careers.microsoft.com', strategy: 'API', interval: 10, lastScrape: '3m ago', jobsFound: 4 },
  { name: 'Amazon', url: 'amazon.jobs', strategy: 'API', interval: 5, lastScrape: '1m ago', jobsFound: 7 },
  { name: 'Stripe', url: 'stripe.com/jobs', strategy: 'HTML', interval: 15, lastScrape: '9m ago', jobsFound: 2 },
];

export default function SourcesTab() {
  const [sources] = useState(SOURCES);
  const pipeline = ['Career pages', 'Scraper', 'Kafka', 'Notifications', 'WebSocket', 'You'];

  return (
    <div style={{ maxWidth: 900 }} className="anim-slide-up">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Scraper sources</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Company career pages monitored directly — often before jobs hit LinkedIn or Indeed.
        </p>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <p className="section-label" style={{ marginBottom: 14 }}>Pipeline</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {pipeline.map((item, i) => (
            <span key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>→</span>}
              <span className="chip chip-cyan">{item}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 2fr 90px 80px 100px 80px',
          gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)',
          background: 'rgba(148, 163, 184, 0.04)',
        }}>
          {['Company', 'URL', 'Strategy', 'Interval', 'Last scrape', 'Found'].map((h) => (
            <span key={h} className="section-label">{h}</span>
          ))}
        </div>
        {sources.map((s, i) => {
          const color = COMPANY_COLORS[s.name] || 'var(--accent-cyan)';
          return (
            <div
              key={s.name}
              style={{
                display: 'grid', gridTemplateColumns: '1.2fr 2fr 90px 80px 100px 80px',
                gap: 12, padding: '14px 18px', alignItems: 'center',
                borderBottom: i < sources.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34, 211, 238, 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, background: `${color}18`, color,
                  fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{s.name.slice(0, 2)}</div>
                <span style={{ fontWeight: 500 }}>{s.name}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'ui-monospace, monospace' }}>{s.url}</span>
              <span className={`chip ${s.strategy === 'API' ? 'chip-cyan' : 'chip-violet'}`}>{s.strategy}</span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{s.interval}m</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.lastScrape}</span>
              <span style={{ fontWeight: 600, color: s.jobsFound > 0 ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>
                {s.jobsFound > 0 ? `+${s.jobsFound}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
