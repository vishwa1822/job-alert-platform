export default function LiveTicker({ liveFeed }) {
  const items = [...liveFeed, ...liveFeed];
  return (
    <div className="ticker-wrap" style={{ height: 36, display: 'flex', alignItems: 'center' }}>
      <div className="ticker-inner">
        {items.map((item, i) => (
          <span key={`${item.company}-${i}`} style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{item.company}</span>
            <span style={{ margin: '0 8px', opacity: 0.4 }}>›</span>
            <span style={{ color: 'var(--text-muted)' }}>{item.title}</span>
            <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
            <span>{item.time}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
