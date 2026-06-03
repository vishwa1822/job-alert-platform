export default function LeftSidebar({
  stats, newJobPulse, liveFeed, filterRemote, setFilterRemote,
  filterLevel, setFilterLevel, filterType, setFilterType,
}) {
  return (
    <>
      <p className="section-label" style={{ marginBottom: 12 }}>Filters</p>

      <FilterGroup label="Remote type" options={['ALL', 'REMOTE', 'HYBRID', 'ONSITE']} value={filterRemote} onChange={setFilterRemote} labels={{ ALL: 'All types' }} />
      <FilterGroup label="Experience" options={['ALL', 'ENTRY', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL']} value={filterLevel} onChange={setFilterLevel} labels={{ ALL: 'All levels' }} />
      <FilterGroup label="Job type" options={['ALL', 'FULL_TIME', 'CONTRACT', 'PART_TIME', 'INTERNSHIP']} value={filterType} onChange={setFilterType} labels={{ ALL: 'All types' }} format={(v) => v.replace('_', ' ')} />

      <hr className="divider" />

      <p className="section-label" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="dot-live anim-pulse" style={{ width: 6, height: 6 }} />
        Live feed
      </p>
      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {liveFeed.slice(0, 6).map((item, i) => (
          <div key={`${item.company}-${i}`} className="card anim-slide-in" style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 2 }}>{item.company}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{item.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
              {item.location} · <span style={{ color: 'var(--accent-emerald)' }}>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FilterGroup({ label, options, value, onChange, labels = {}, format }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p className="section-label" style={{ marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {options.map((opt) => (
          <button key={opt} type="button" className={`filter-pill ${value === opt ? 'active' : ''}`} style={{ textAlign: 'left' }} onClick={() => onChange(opt)}>
            {labels[opt] ?? (format ? format(opt) : opt)}
          </button>
        ))}
      </div>
    </div>
  );
}
