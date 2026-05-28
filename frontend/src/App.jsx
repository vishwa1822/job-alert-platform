import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants & helpers ─────────────────────────────────────────────────────
const COMPANIES   = ["Google","Meta","Apple","Microsoft","Amazon","Netflix","Stripe","Airbnb","Uber","Spotify","OpenAI","Anthropic","Figma","Notion","Linear","Vercel","Cloudflare","Databricks","Snowflake","Palantir"];
const TITLES      = ["Senior Software Engineer","Staff Backend Engineer","Principal ML Engineer","Senior Product Manager","Site Reliability Engineer","Frontend Engineer","Data Scientist","DevOps Engineer","Security Engineer","Full-Stack Engineer","Platform Engineer","ML Infrastructure Engineer","Senior iOS Engineer","Android Engineer","Head of Engineering","Engineering Manager","Senior Data Engineer","Solutions Architect","Cloud Infrastructure Engineer","Staff Product Designer"];
const LOCATIONS   = ["San Francisco, CA","New York, NY","Seattle, WA","Austin, TX","London, UK","Berlin, Germany","Toronto, Canada","Singapore","Amsterdam, NL","Dublin, Ireland"];
const SKILLS_ALL  = ["React","TypeScript","Go","Python","Rust","Kubernetes","AWS","PostgreSQL","Kafka","GraphQL","TensorFlow","PyTorch","Node.js","Java","Scala","Redis","Docker","gRPC","Terraform","Spark"];
const LEVELS      = ["ENTRY","MID","SENIOR","STAFF","PRINCIPAL"];
const REMOTE      = ["REMOTE","HYBRID","ONSITE"];
const COMPANY_COLORS = { Google:"#4285F4",Meta:"#0866FF",Apple:"#9ca3af",Microsoft:"#00BCF2",Amazon:"#FF9900",Netflix:"#E50914",Stripe:"#6772E5",Airbnb:"#FF5A5F",Uber:"#60a5fa",Spotify:"#1DB954",OpenAI:"#74AA9C",Anthropic:"#CC785C",Figma:"#A259FF",Notion:"#e5e7eb",Linear:"#5E6AD2",Vercel:"#ffffff",Cloudflare:"#F6821F",Databricks:"#FF3621",Snowflake:"#29B5E8",Palantir:"#8b5cf6" };
const FREQ_OPTS   = ["INSTANT","DAILY","WEEKLY"];
const JOB_TYPES   = ["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP"];

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const fmt$ = (n) => n >= 1000 ? `$${Math.round(n/1000)}k` : `$${n}`;
const salary = (lo, hi) => `${fmt$(lo)}–${fmt$(hi)}`;
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

let _jid = 100;
function genJob(override = {}) {
  const co  = rand(COMPANIES);
  const rem = rand(REMOTE);
  const lo  = rem === "REMOTE" ? "Remote" : rand(LOCATIONS);
  const sk  = [...SKILLS_ALL].sort(() => .5 - Math.random()).slice(0, randInt(3, 6));
  const sal = randInt(100, 220) * 1000;
  return {
    id: String(++_jid),
    title: rand(TITLES),
    company: co,
    initials: co.slice(0, 2).toUpperCase(),
    location: lo,
    remoteType: rem,
    salaryMin: sal,
    salaryMax: sal + randInt(20, 80) * 1000,
    skills: sk,
    level: rand(LEVELS),
    jobType: rand(JOB_TYPES),
    postedAt: new Date(Date.now() - randInt(0, 86400000 * 3)),
    isNew: false,
    matchScore: randInt(62, 99),
    applyUrl: "#",
    description: `Join ${co} as part of a world-class engineering team. You will design, build, and scale systems serving millions of users globally. Expect high ownership, collaborative culture, and meaningful technical challenges.`,
    ...override,
  };
}

const SEED_JOBS   = Array.from({ length: 28 }, () => genJob());
const SEED_FEED   = Array.from({ length: 7 }, () => ({
  company: rand(COMPANIES), title: rand(TITLES),
  location: rand(LOCATIONS), time: `${randInt(1, 59)}m ago`,
}));

// ─── Global CSS ──────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#07100a;color:#e2f5e6;font-family:'Inter',sans-serif;overflow-x:hidden}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:#0b1a0e}
::-webkit-scrollbar-thumb{background:#1e4d28;border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:#2a6b38}

/* Animations */
@keyframes pulse-ring{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(1.35)}}
@keyframes slide-in{from{transform:translateX(-10px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes fade-up{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes flash-new{0%{box-shadow:0 0 0 2px rgba(76,255,110,.55)}100%{box-shadow:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

.pulse{animation:pulse-ring 1.6s ease-in-out infinite}
.slide-in{animation:slide-in .28s ease}
.fade-up{animation:fade-up .3s ease}
.flash-new{animation:flash-new 1.8s ease-out}
.spin{animation:spin .9s linear infinite}

/* Cards */
.card{background:rgba(255,255,255,.02);border:1px solid rgba(76,255,110,.07);border-radius:12px;transition:all .18s ease}
.card:hover{border-color:rgba(76,255,110,.28);background:rgba(76,255,110,.03);transform:translateY(-1px)}
.card.selected{border-color:rgba(76,255,110,.45)!important;background:rgba(76,255,110,.055)!important}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;font-family:inherit;transition:all .15s}
.btn-primary{background:#4cff6e;color:#030d06;border:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px}
.btn-primary:hover{background:#6dff87;transform:translateY(-1px)}
.btn-primary:disabled{opacity:.45;cursor:default;transform:none}
.btn-ghost{background:transparent;border:1px solid rgba(76,255,110,.18);color:#4cff6e;padding:8px 16px;border-radius:8px;font-size:13px}
.btn-ghost:hover{background:rgba(76,255,110,.07);border-color:rgba(76,255,110,.38)}
.btn-icon{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);color:#9ca3af;width:34px;height:34px;border-radius:8px;font-size:15px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center}
.btn-icon:hover{background:rgba(76,255,110,.06);border-color:rgba(76,255,110,.22);color:#4cff6e}

/* Form */
.input{background:rgba(255,255,255,.04);border:1px solid rgba(76,255,110,.12);color:#e2f5e6;padding:10px 14px;border-radius:8px;font-size:13px;outline:none;transition:border-color .2s;font-family:inherit;width:100%}
.input:focus{border-color:rgba(76,255,110,.4)}
.input::placeholder{color:#3d5244}
.select{appearance:none;background:rgba(255,255,255,.04) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 10px center;border:1px solid rgba(76,255,110,.12);color:#e2f5e6;padding:9px 30px 9px 12px;border-radius:8px;font-size:13px;outline:none;cursor:pointer;font-family:inherit}
.select:focus{border-color:rgba(76,255,110,.4)}

/* Chips / tags */
.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;letter-spacing:.01em}
.chip-green{background:rgba(76,255,110,.09);color:#86efac;border:1px solid rgba(76,255,110,.14)}
.chip-blue{background:rgba(56,189,248,.08);color:#7dd3fc;border:1px solid rgba(56,189,248,.14)}
.chip-yellow{background:rgba(251,191,36,.08);color:#fcd34d;border:1px solid rgba(251,191,36,.12)}
.chip-purple{background:rgba(167,139,250,.08);color:#c4b5fd;border:1px solid rgba(167,139,250,.12)}
.chip-pink{background:rgba(236,72,153,.08);color:#f9a8d4;border:1px solid rgba(236,72,153,.12)}
.chip-red{background:rgba(239,68,68,.09);color:#fca5a5;border:1px solid rgba(239,68,68,.14)}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;background:rgba(255,255,255,.04);color:#6b7280;border:1px solid rgba(255,255,255,.06)}

/* Filter pills */
.filter-pill{background:transparent;border:1px solid rgba(76,255,110,.1);color:#4b5563;padding:5px 13px;border-radius:20px;font-size:12px;cursor:pointer;transition:all .15s;font-family:inherit}
.filter-pill:hover{border-color:rgba(76,255,110,.22);color:#9ca3af}
.filter-pill.active{border-color:rgba(76,255,110,.42);color:#4cff6e;background:rgba(76,255,110,.07)}

/* Nav tabs */
.nav-tab{background:transparent;border:none;color:#4b5563;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:7px;font-family:inherit;position:relative;white-space:nowrap}
.nav-tab.active{background:rgba(76,255,110,.1);color:#4cff6e}
.nav-tab:hover:not(.active){color:#9ca3af;background:rgba(255,255,255,.04)}

/* Score bar */
.score-track{height:3px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden}
.score-fill{height:100%;background:linear-gradient(90deg,#4cff6e,#00e676);border-radius:2px;transition:width .5s ease}

/* Misc */
.section-label{font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#374151}
.glow{color:#4cff6e;text-shadow:0 0 18px rgba(76,255,110,.35)}
.dot-live{width:7px;height:7px;border-radius:50%;background:#4cff6e;flex-shrink:0}
.divider{border:none;border-top:1px solid rgba(76,255,110,.07);margin:16px 0}
.badge-new{font-size:9px;font-weight:700;color:#4cff6e;background:rgba(76,255,110,.1);border:1px solid rgba(76,255,110,.25);padding:1px 6px;border-radius:4px;letter-spacing:.07em}
.notif-dot{position:absolute;top:-3px;right:-3px;background:#ef4444;border:2px solid #07100a;width:17px;height:17px;border-radius:50%;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;color:#fff}
.toggle{position:relative;width:38px;height:20px;cursor:pointer}
.toggle input{opacity:0;width:0;height:0}
.toggle-track{position:absolute;inset:0;background:rgba(255,255,255,.08);border-radius:20px;border:1px solid rgba(255,255,255,.1);transition:.2s}
.toggle input:checked~.toggle-track{background:rgba(76,255,110,.3);border-color:rgba(76,255,110,.5)}
.toggle-thumb{position:absolute;top:2px;left:2px;width:14px;height:14px;background:#6b7280;border-radius:50%;transition:.2s}
.toggle input:checked~.toggle-thumb{transform:translateX(18px);background:#4cff6e}

/* Ticker */
.ticker-wrap{overflow:hidden;border-top:1px solid rgba(76,255,110,.07);border-bottom:1px solid rgba(76,255,110,.07)}
.ticker-inner{display:flex;gap:40px;animation:ticker 30s linear infinite;white-space:nowrap}
.ticker-inner:hover{animation-play-state:paused}

/* Layout */
.layout{display:grid;grid-template-columns:240px 1fr 336px;height:calc(100vh - 58px);overflow:hidden}
@media(max-width:1200px){.layout{grid-template-columns:220px 1fr}.right-col{display:none}}
@media(max-width:820px){.layout{grid-template-columns:1fr}.left-col{display:none}}
.left-col{border-right:1px solid rgba(76,255,110,.06);overflow-y:auto;padding:18px 14px}
.center-col{overflow-y:auto;padding:16px}
.right-col{border-left:1px solid rgba(76,255,110,.06);overflow-y:auto}
`;

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs]             = useState(SEED_JOBS);
  const [liveFeed, setLiveFeed]     = useState(SEED_FEED);
  const [activeTab, setActiveTab]   = useState("discover");
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch]         = useState("");
  const [filterRemote, setFilterRemote] = useState("ALL");
  const [filterLevel,  setFilterLevel]  = useState("ALL");
  const [filterType,   setFilterType]   = useState("ALL");
  const [savedJobs,   setSavedJobs]   = useState(() => new Set());
  const [appliedJobs, setAppliedJobs] = useState(() => new Set());
  const [alerts, setAlerts]         = useState([
    { id: "a1", name: "Senior React Roles", keywords: ["react","frontend"], remoteTypes: ["REMOTE","HYBRID"], salaryMin: 150000, frequency: "INSTANT", isActive: true, matchCount: 23 },
    { id: "a2", name: "ML / AI Engineering", keywords: ["machine learning","pytorch","tensorflow"], remoteTypes: ["REMOTE"], salaryMin: 180000, frequency: "DAILY", isActive: true, matchCount: 11 },
    { id: "a3", name: "Staff Engineer Track", keywords: ["staff","principal"], remoteTypes: ["ALL"], salaryMin: 200000, frequency: "INSTANT", isActive: false, matchCount: 5 },
  ]);
  const [notifications, setNotifications] = useState([]);
  const [wsStatus, setWsStatus]     = useState("connecting");
  const [scraping, setScraping]     = useState(true);
  const [stats, setStats]           = useState({ today: 247, sources: 10, total: 8932 });
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [newJobPulse, setNewJobPulse] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [editAlert, setEditAlert]   = useState(null);
  const [trackerFilter, setTrackerFilter] = useState("ALL");

  const notifRef = useRef(null);

  // ── Simulate real-time scraping ──────────────────────────────────────────
  useEffect(() => {
    if (!scraping) return;
    const iv = setInterval(() => {
      const j = genJob({ isNew: true, postedAt: new Date() });
      setJobs(p => [j, ...p.slice(0, 59)]);
      setLiveFeed(p => [{ company: j.company, title: j.title, location: j.location, time: "just now" }, ...p.slice(0, 8)]);
      setStats(p => ({ ...p, today: p.today + 1, total: p.total + 1 }));
      setNewJobPulse(true);
      setTimeout(() => setNewJobPulse(false), 2200);
      if (Math.random() > .45) {
        setNotifications(p => [{
          id: Date.now(), type: "JOB_MATCH",
          title: `New match: ${j.title}`,
          body: `${j.company} · ${j.location}`,
          time: new Date(), read: false,
        }, ...p.slice(0, 29)]);
      }
    }, 9000 + Math.random() * 7000);
    return () => clearInterval(iv);
  }, [scraping]);

  // ── Simulate WS ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setWsStatus("live"), 1200);
    return () => clearTimeout(t);
  }, []);

  // ── Close notif panel on outside click ──────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = jobs.filter(j => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) &&
        !j.company.toLowerCase().includes(search.toLowerCase()) &&
        !j.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterRemote !== "ALL" && j.remoteType !== filterRemote) return false;
    if (filterLevel  !== "ALL" && j.level     !== filterLevel)  return false;
    if (filterType   !== "ALL" && j.jobType   !== filterType)   return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const toggleSave  = (id) => setSavedJobs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const apply       = (id) => setAppliedJobs(p => new Set([...p, id]));
  const markAllRead = () => { setNotifications(p => p.map(n => ({ ...n, read: true }))); };

  const savedList   = jobs.filter(j => savedJobs.has(j.id));
  const appliedList = jobs.filter(j => appliedJobs.has(j.id));

  return (
    <>
      <style>{CSS}</style>

      {/* ── Topbar ── */}
      <Topbar
        activeTab={activeTab} setActiveTab={setActiveTab}
        search={search} setSearch={setSearch}
        wsStatus={wsStatus} scraping={scraping} setScraping={setScraping}
        unreadCount={unreadCount} notifications={notifications}
        showNotifPanel={showNotifPanel} setShowNotifPanel={setShowNotifPanel}
        markAllRead={markAllRead} notifRef={notifRef}
        setNotifications={setNotifications}
      />

      {/* ── Live ticker ── */}
      <div className="ticker-wrap" style={{ background: "rgba(76,255,110,.025)", height: 30, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div className="ticker-inner" style={{ padding: "0 20px" }}>
          {[...liveFeed, ...liveFeed].map((item, i) => (
            <span key={i} style={{ fontSize: 11, color: "#4b5563" }}>
              <span style={{ color: "#4cff6e", fontWeight: 600 }}>{item.company}</span>
              <span style={{ margin: "0 5px", color: "#1f2e23" }}>›</span>
              <span>{item.title}</span>
              <span style={{ margin: "0 5px", color: "#1f2e23" }}>·</span>
              <span style={{ color: "#374151" }}>{item.time}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="layout">
        {/* ── Left sidebar ── */}
        <aside className="left-col">
          <LeftSidebar
            stats={stats} newJobPulse={newJobPulse} liveFeed={liveFeed}
            filterRemote={filterRemote} setFilterRemote={setFilterRemote}
            filterLevel={filterLevel}  setFilterLevel={setFilterLevel}
            filterType={filterType}    setFilterType={setFilterType}
          />
        </aside>

        {/* ── Center column ── */}
        <main className="center-col">
          {activeTab === "discover"  && <DiscoverTab   filtered={filtered} selectedJob={selectedJob} setSelectedJob={setSelectedJob} savedJobs={savedJobs} appliedJobs={appliedJobs} toggleSave={toggleSave} apply={apply} search={search} />}
          {activeTab === "alerts"    && <AlertsTab     alerts={alerts} setAlerts={setAlerts} showAlertModal={showAlertModal} setShowAlertModal={setShowAlertModal} editAlert={editAlert} setEditAlert={setEditAlert} />}
          {activeTab === "tracker"   && <TrackerTab    savedList={savedList} appliedList={appliedList} trackerFilter={trackerFilter} setTrackerFilter={setTrackerFilter} toggleSave={toggleSave} apply={apply} />}
          {activeTab === "sources"   && <SourcesTab />}
        </main>

        {/* ── Right column ── */}
        <aside className="right-col">
          {selectedJob && activeTab === "discover"
            ? <DetailPanel job={selectedJob} saved={savedJobs.has(selectedJob.id)} applied={appliedJobs.has(selectedJob.id)} toggleSave={toggleSave} apply={apply} onClose={() => setSelectedJob(null)} />
            : <RightSidebar jobs={filtered} setSelectedJob={setSelectedJob} savedJobs={savedJobs} wsStatus={wsStatus} stats={stats} />
          }
        </aside>
      </div>
    </>
  );
}

// ─── Topbar ──────────────────────────────────────────────────────────────────
function Topbar({ activeTab, setActiveTab, search, setSearch, wsStatus, scraping, setScraping, unreadCount, notifications, showNotifPanel, setShowNotifPanel, markAllRead, notifRef, setNotifications }) {
  return (
    <header style={{ height: 58, background: "rgba(7,16,10,.96)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(76,255,110,.07)", display: "flex", alignItems: "center", padding: "0 18px", gap: 18, position: "sticky", top: 0, zIndex: 50 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#4cff6e,#00c853)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#030d06" }}>⚡</div>
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-.02em" }}>Job<span className="glow">Pulse</span></span>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {[["discover","🔍","Discover"],["alerts","🔔","Alerts"],["tracker","📋","Tracker"],["sources","🌐","Sources"]].map(([id, ic, lb]) => (
          <button key={id} className={`nav-tab ${activeTab===id?"active":""}`} onClick={() => setActiveTab(id)}>{ic} {lb}</button>
        ))}
      </nav>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 380, position: "relative" }}>
        <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#374151", fontSize: 13, pointerEvents: "none" }}>🔍</span>
        <input className="input" placeholder="Search jobs, companies, skills…" style={{ paddingLeft: 32 }} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0 }}>
        {/* WS + scraper */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#4b5563" }}>
          <div className={`dot-live pulse`} style={{ background: wsStatus === "live" ? "#4cff6e" : "#f59e0b" }} />
          <span style={{ color: wsStatus === "live" ? "#4cff6e" : "#f59e0b", fontWeight: 600 }}>{wsStatus === "live" ? "Live" : "Connecting…"}</span>
          <button className="btn-ghost" style={{ padding: "4px 11px", fontSize: 11 }} onClick={() => setScraping(p => !p)}>
            {scraping ? "⏸ Pause" : "▶ Resume"}
          </button>
        </div>

        {/* Notifications */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button className="btn-icon" style={{ position: "relative" }} onClick={() => { setShowNotifPanel(p => !p); if (!showNotifPanel) markAllRead(); }}>
            🔔
            {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {showNotifPanel && (
            <div className="card fade-up" style={{ position: "absolute", right: 0, top: 42, width: 310, zIndex: 200, background: "#0c1b0f", border: "1px solid rgba(76,255,110,.14)", overflow: "hidden", padding: 0 }}>
              <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(76,255,110,.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Notifications</span>
                <button className="btn-ghost" style={{ padding: "3px 9px", fontSize: 10 }} onClick={markAllRead}>Mark all read</button>
              </div>
              <div style={{ maxHeight: 340, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 28, textAlign: "center", color: "#374151", fontSize: 13 }}>No notifications yet</div>
                ) : notifications.slice(0, 12).map(n => (
                  <div key={n.id} style={{ padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,.03)", background: n.read ? "transparent" : "rgba(76,255,110,.03)", cursor: "pointer" }}
                    onClick={() => setNotifications(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#d1fae5", marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: "#4b5563" }}>{n.body} · {timeAgo(n.time)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#4cff6e,#00c853)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#030d06", cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif" }}>JP</div>
      </div>
    </header>
  );
}

// ─── Left Sidebar ────────────────────────────────────────────────────────────
function LeftSidebar({ stats, newJobPulse, liveFeed, filterRemote, setFilterRemote, filterLevel, setFilterLevel, filterType, setFilterType }) {
  return (
    <>
      {/* Stats */}
      <p className="section-label" style={{ marginBottom: 10 }}>Live stats</p>
      {[
        { label: "Jobs today",       val: stats.today.toLocaleString(), icon: "📈", pulse: newJobPulse },
        { label: "Sources active",   val: stats.sources,                icon: "🌐", pulse: false },
        { label: "Total indexed",    val: stats.total.toLocaleString(), icon: "💾", pulse: false },
      ].map(s => (
        <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", marginBottom: 7 }}>
          <span style={{ fontSize: 18 }}>{s.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: s.pulse ? "#4cff6e" : "#e2f5e6", transition: "color .5s" }}>{s.val}</div>
            <div style={{ fontSize: 10.5, color: "#374151" }}>{s.label}</div>
          </div>
          {s.pulse && <div className="dot-live pulse" />}
        </div>
      ))}

      <hr className="divider" />

      {/* Remote filter */}
      <p className="section-label" style={{ marginBottom: 9 }}>Remote type</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
        {["ALL","REMOTE","HYBRID","ONSITE"].map(r => (
          <button key={r} className={`filter-pill ${filterRemote===r?"active":""}`} style={{ textAlign: "left" }} onClick={() => setFilterRemote(r)}>
            {r === "ALL" ? "All types" : r}
          </button>
        ))}
      </div>

      {/* Level filter */}
      <p className="section-label" style={{ marginBottom: 9 }}>Experience level</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
        {["ALL","ENTRY","MID","SENIOR","STAFF","PRINCIPAL"].map(l => (
          <button key={l} className={`filter-pill ${filterLevel===l?"active":""}`} style={{ textAlign: "left" }} onClick={() => setFilterLevel(l)}>
            {l === "ALL" ? "All levels" : l}
          </button>
        ))}
      </div>

      {/* Job type filter */}
      <p className="section-label" style={{ marginBottom: 9 }}>Job type</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 18 }}>
        {["ALL","FULL_TIME","CONTRACT","PART_TIME","INTERNSHIP"].map(t => (
          <button key={t} className={`filter-pill ${filterType===t?"active":""}`} style={{ textAlign: "left" }} onClick={() => setFilterType(t)}>
            {t === "ALL" ? "All types" : t.replace("_", " ")}
          </button>
        ))}
      </div>

      <hr className="divider" />

      {/* Live feed */}
      <p className="section-label" style={{ marginBottom: 9, display: "flex", alignItems: "center", gap: 6 }}>
        <span className="dot-live pulse" style={{ width: 6, height: 6 }} />Live feed
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {liveFeed.slice(0, 6).map((item, i) => (
          <div key={i} className="slide-in" style={{ padding: "8px 10px", background: "rgba(76,255,110,.025)", border: "1px solid rgba(76,255,110,.06)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#bbf7d0", marginBottom: 1 }}>{item.company}</div>
            <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 1 }}>{item.title}</div>
            <div style={{ fontSize: 9, color: "#1f2e23" }}>{item.location} · <span style={{ color: "#4cff6e" }}>{item.time}</span></div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Discover Tab ─────────────────────────────────────────────────────────────
function DiscoverTab({ filtered, selectedJob, setSelectedJob, savedJobs, appliedJobs, toggleSave, apply, search }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15 }}>{filtered.length.toLocaleString()}</span>
          <span style={{ color: "#4b5563", fontSize: 13 }}> positions{search ? ` for "${search}"` : ""}</span>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          {savedJobs.size   > 0 && <span className="chip chip-yellow">⭐ {savedJobs.size} saved</span>}
          {appliedJobs.size > 0 && <span className="chip chip-green">✅ {appliedJobs.size} applied</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(job => (
          <JobCard
            key={job.id} job={job}
            selected={selectedJob?.id === job.id}
            saved={savedJobs.has(job.id)}
            applied={appliedJobs.has(job.id)}
            onClick={() => setSelectedJob(p => p?.id === job.id ? null : job)}
            onSave={() => toggleSave(job.id)}
            onApply={() => apply(job.id)}
          />
        ))}
        {filtered.length === 0 && <EmptyState icon="🔍" title="No jobs found" body="Try adjusting your filters or search query." />}
      </div>
    </>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, selected, saved, applied, onClick, onSave, onApply }) {
  const color = COMPANY_COLORS[job.company] || "#4cff6e";
  const remoteChip = { REMOTE:"chip-blue", HYBRID:"chip-yellow", ONSITE:"chip-purple" }[job.remoteType] || "chip-green";
  return (
    <div className={`card ${selected?"selected":""} ${job.isNew?"flash-new":""}`} style={{ padding: "14px 15px", cursor: "pointer" }} onClick={onClick}>
      <div style={{ display: "flex", gap: 12 }}>
        {/* Avatar */}
        <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}1a`, color, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {job.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2f5e6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 8 }}>
              {job.isNew && <span className="badge-new">NEW</span>}
              <button className="btn" style={{ background: "transparent", border: "none", color: saved ? "#fbbf24" : "#374151", fontSize: 14, cursor: "pointer", padding: 2 }} onClick={e => { e.stopPropagation(); onSave(); }}>{saved?"⭐":"☆"}</button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 8 }}>
            <span style={{ color }}>{job.company}</span><span style={{ margin: "0 5px", color: "#1f2e23" }}>·</span>{job.location}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span className={`chip ${remoteChip}`}>{job.remoteType}</span>
            <span className="chip chip-pink">{job.level}</span>
            <span className="chip chip-green">{salary(job.salaryMin, job.salaryMax)}</span>
            <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#2d3e31" }}>{timeAgo(job.postedAt)}</span>
          </div>
          <div style={{ marginTop: 9 }}>
            <div className="score-track"><div className="score-fill" style={{ width: `${job.matchScore}%` }} /></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {job.skills.slice(0, 4).map(s => <span key={s} className="tag">{s}</span>)}
              {job.skills.length > 4 && <span className="tag">+{job.skills.length - 4}</span>}
            </div>
            <span style={{ fontSize: 11, color: "#4cff6e", fontWeight: 600 }}>{job.matchScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ job, saved, applied, toggleSave, apply, onClose }) {
  const color = COMPANY_COLORS[job.company] || "#4cff6e";
  const remoteChip = { REMOTE:"chip-blue", HYBRID:"chip-yellow", ONSITE:"chip-purple" }[job.remoteType] || "chip-green";
  return (
    <div className="detail-panel" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span className="section-label">Job details</span>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      {/* Header */}
      <div style={{ display: "flex", gap: 13, marginBottom: 14 }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: `${color}1a`, color, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{job.initials}</div>
        <div>
          <div style={{ fontSize: 13, color, fontWeight: 600, marginBottom: 3 }}>{job.company}</div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{job.title}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <span className={`chip ${remoteChip}`}>{job.remoteType}</span>
        <span className="chip chip-pink">{job.level}</span>
        <span className="chip chip-green">{job.location}</span>
        {job.isNew && <span className="badge-new">JUST POSTED</span>}
      </div>

      {/* Salary + match */}
      <div style={{ background: "rgba(76,255,110,.05)", border: "1px solid rgba(76,255,110,.12)", borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10.5, color: "#374151", marginBottom: 3 }}>Salary range</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#4cff6e", fontFamily: "'Space Grotesk',sans-serif" }}>{salary(job.salaryMin, job.salaryMax)}</div>
        </div>
        <div style={{ background: "rgba(76,255,110,.1)", border: "1px solid rgba(76,255,110,.25)", color: "#4cff6e", padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{job.matchScore}% match</div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button className="btn btn-primary" style={{ flex: 1, opacity: applied ? .5 : 1 }} disabled={applied} onClick={() => apply(job.id)}>
          {applied ? "✅ Applied" : "Apply Now →"}
        </button>
        <button className="btn-icon" onClick={() => toggleSave(job.id)} style={{ color: saved ? "#fbbf24" : undefined, borderColor: saved ? "rgba(251,191,36,.3)" : undefined }}>
          {saved ? "⭐" : "☆"}
        </button>
      </div>

      {/* Skills */}
      <p className="section-label" style={{ marginBottom: 9 }}>Required skills</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {job.skills.map(s => <span key={s} style={{ padding: "4px 11px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: "rgba(76,255,110,.06)", border: "1px solid rgba(76,255,110,.14)", color: "#86efac" }}>{s}</span>)}
      </div>

      {/* Description */}
      <p className="section-label" style={{ marginBottom: 9 }}>About the role</p>
      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.75, marginBottom: 18 }}>{job.description}</p>

      {/* Requirements */}
      <p className="section-label" style={{ marginBottom: 9 }}>Requirements</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
        {[
          `${["SENIOR","STAFF","PRINCIPAL"].includes(job.level) ? "5+" : "2+"} years of experience`,
          `Proficiency in ${job.skills.slice(0,2).join(" and ")}`,
          "Experience with distributed systems at scale",
          "Excellent communication skills",
          "Track record of high-impact delivery",
        ].map((req, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#6b7280" }}>
            <span style={{ color: "#4cff6e", flexShrink: 0 }}>✓</span>{req}
          </div>
        ))}
      </div>

      <div style={{ padding: "9px 13px", background: "rgba(255,255,255,.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,.04)", fontSize: 11, color: "#374151", display: "flex", justifyContent: "space-between" }}>
        <span>Posted {timeAgo(job.postedAt)}</span>
        <span>via JobPulse Scraper ⚡</span>
      </div>
    </div>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────
function RightSidebar({ jobs, setSelectedJob, savedJobs, wsStatus, stats }) {
  return (
    <div style={{ padding: 18 }}>
      {/* AI recs header */}
      <div style={{ background: "rgba(76,255,110,.04)", border: "1px solid rgba(76,255,110,.1)", borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#4cff6e", letterSpacing: ".1em", marginBottom: 7 }}>🤖 AI RECOMMENDATIONS</div>
        <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>Based on: Senior Engineer · React, TypeScript, Python · $150k+ · Remote preferred</div>
      </div>

      <p className="section-label" style={{ marginBottom: 11 }}>Top picks for you</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
        {jobs.slice(0, 7).map(job => {
          const color = COMPANY_COLORS[job.company] || "#4cff6e";
          return (
            <div key={job.id} className="card" style={{ padding: "11px 13px", cursor: "pointer" }} onClick={() => setSelectedJob(job)}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: `${color}1a`, color, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{job.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#e2f5e6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</div>
                  <div style={{ fontSize: 11, color: "#374151" }}>{job.company}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4cff6e", flexShrink: 0 }}>{job.matchScore}%</span>
              </div>
              <div className="score-track"><div className="score-fill" style={{ width: `${job.matchScore}%` }} /></div>
            </div>
          );
        })}
      </div>

      {/* System status */}
      <p className="section-label" style={{ marginBottom: 11 }}>System status</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { icon: "🔄", label: "Job Scraper",      status: "Running",    ok: true },
          { icon: "📨", label: "Kafka",             status: "Active",     ok: true },
          { icon: "💾", label: "PostgreSQL",        status: "Connected",  ok: true },
          { icon: "⚡", label: "Redis Cache",       status: "Online",     ok: true },
          { icon: "🔌", label: "WebSocket",         status: wsStatus === "live" ? "Live" : "Connecting", ok: wsStatus === "live" },
          { icon: "🤖", label: "Recommender",      status: "Running",    ok: true },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 11px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 8, fontSize: 12 }}>
            <span style={{ color: "#6b7280" }}><span style={{ marginRight: 8 }}>{s.icon}</span>{s.label}</span>
            <span style={{ color: s.ok ? "#4cff6e" : "#f59e0b", fontWeight: 600, fontSize: 11 }}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Alerts Tab ──────────────────────────────────────────────────────────────
function AlertsTab({ alerts, setAlerts, showAlertModal, setShowAlertModal, editAlert, setEditAlert }) {
  const openNew  = () => { setEditAlert(null); setShowAlertModal(true); };
  const openEdit = (a) => { setEditAlert(a);   setShowAlertModal(true); };
  const toggle   = (id) => setAlerts(p => p.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  const remove   = (id) => setAlerts(p => p.filter(a => a.id !== id));
  const save     = (data) => {
    if (editAlert) setAlerts(p => p.map(a => a.id === editAlert.id ? { ...a, ...data } : a));
    else setAlerts(p => [...p, { id: `a${Date.now()}`, matchCount: 0, isActive: true, ...data }]);
    setShowAlertModal(false);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      {showAlertModal && <AlertModal alert={editAlert} onSave={save} onClose={() => setShowAlertModal(false)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Job Alerts</h2>
          <p style={{ fontSize: 13, color: "#4b5563" }}>Get notified instantly when matching jobs are scraped from company career pages.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New alert</button>
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon="🔔" title="No alerts yet" body="Create your first alert to get real-time notifications when matching jobs are posted." action={<button className="btn btn-primary" onClick={openNew}>Create alert</button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map(alert => (
            <div key={alert.id} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#e2f5e6" }}>{alert.name}</span>
                    <span className={`chip ${alert.isActive ? "chip-green" : "chip-red"}`}>{alert.isActive ? "Active" : "Paused"}</span>
                    {alert.matchCount > 0 && <span className="chip chip-blue">{alert.matchCount} matches</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {alert.keywords?.map(k => <span key={k} className="tag">{k}</span>)}
                    {alert.remoteTypes?.map(r => <span key={r} className={`chip ${r==="REMOTE"?"chip-blue":"chip-yellow"}`} style={{ fontSize: 10 }}>{r}</span>)}
                    {alert.salaryMin && <span className="chip chip-green" style={{ fontSize: 10 }}>Min {fmt$(alert.salaryMin)}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#374151" }}>
                    Frequency: <span style={{ color: "#9ca3af" }}>{alert.frequency}</span>
                    <span style={{ margin: "0 8px", color: "#1f2e23" }}>·</span>
                    Email + Push notifications
                  </div>
                </div>
                <div style={{ display: "flex", gap: 7, alignItems: "center", marginLeft: 14 }}>
                  <label className="toggle">
                    <input type="checkbox" checked={alert.isActive} onChange={() => toggle(alert.id)} />
                    <div className="toggle-track" />
                    <div className="toggle-thumb" />
                  </label>
                  <button className="btn-icon" style={{ fontSize: 12 }} onClick={() => openEdit(alert)}>✏️</button>
                  <button className="btn-icon" style={{ fontSize: 12 }} onClick={() => remove(alert.id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div style={{ marginTop: 28, background: "rgba(76,255,110,.03)", border: "1px solid rgba(76,255,110,.09)", borderRadius: 12, padding: 18 }}>
        <p className="section-label" style={{ marginBottom: 12 }}>How real-time alerts work</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { step: "1", title: "Career page crawl", body: "JobPulse monitors 10+ company career pages every 5–15 minutes via scheduled scraper." },
            { step: "2", title: "Kafka event stream", body: "Every new job is published to a Kafka topic as a structured event payload." },
            { step: "3", title: "Alert matcher", body: "Notification service consumes events and runs each job against all active alert criteria." },
            { step: "4", title: "Real-time push", body: "Matching alerts trigger instant WebSocket pushes to your open tabs and email/push notifications." },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(76,255,110,.12)", color: "#4cff6e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#d1fae5", marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.6 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Alert Modal ─────────────────────────────────────────────────────────────
function AlertModal({ alert, onSave, onClose }) {
  const [name,      setName]      = useState(alert?.name       || "");
  const [keywords,  setKeywords]  = useState((alert?.keywords  || []).join(", "));
  const [salaryMin, setSalaryMin] = useState(alert?.salaryMin  || "");
  const [remote,    setRemote]    = useState(alert?.remoteTypes?.[0] || "ALL");
  const [frequency, setFrequency] = useState(alert?.frequency  || "INSTANT");

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
      remoteTypes: remote === "ALL" ? ["REMOTE","HYBRID","ONSITE"] : [remote],
      salaryMin: salaryMin ? Number(salaryMin) : null,
      frequency,
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card fade-up" style={{ width: 440, background: "#0c1b0f", border: "1px solid rgba(76,255,110,.18)", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700 }}>{alert ? "Edit alert" : "New job alert"}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: "#4b5563", marginBottom: 5, display: "block" }}>Alert name *</label>
            <input className="input" placeholder="e.g. Senior React Remote Roles" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#4b5563", marginBottom: 5, display: "block" }}>Keywords (comma separated)</label>
            <input className="input" placeholder="e.g. react, typescript, frontend" value={keywords} onChange={e => setKeywords(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: "#4b5563", marginBottom: 5, display: "block" }}>Remote preference</label>
              <select className="select" style={{ width: "100%" }} value={remote} onChange={e => setRemote(e.target.value)}>
                <option value="ALL">All types</option>
                <option value="REMOTE">Remote only</option>
                <option value="HYBRID">Hybrid only</option>
                <option value="ONSITE">On-site only</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#4b5563", marginBottom: 5, display: "block" }}>Min salary ($)</label>
              <input className="input" type="number" placeholder="e.g. 150000" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#4b5563", marginBottom: 5, display: "block" }}>Notification frequency</label>
            <div style={{ display: "flex", gap: 7 }}>
              {FREQ_OPTS.map(f => (
                <button key={f} className={`filter-pill ${frequency===f?"active":""}`} onClick={() => setFrequency(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>{alert ? "Update alert" : "Create alert"}</button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tracker Tab ─────────────────────────────────────────────────────────────
function TrackerTab({ savedList, appliedList, trackerFilter, setTrackerFilter, toggleSave, apply }) {
  const tabs = [
    { id: "ALL",     label: "All",     count: savedList.length + appliedList.length },
    { id: "SAVED",   label: "Saved",   count: savedList.length },
    { id: "APPLIED", label: "Applied", count: appliedList.length },
  ];
  const combined = [...new Map([...savedList.map(j => [j.id, {...j,  _state:"SAVED"}]), ...appliedList.map(j => [j.id, {...j, _state:"APPLIED"}])]).values()];
  const display  = trackerFilter === "ALL" ? combined : combined.filter(j => j._state === trackerFilter);

  const APP_STAGES = ["APPLIED","PHONE_SCREEN","TECHNICAL","FINAL_ROUND","OFFER","REJECTED"];
  const [stages, setStages] = useState({});
  const setStage = (id, st) => setStages(p => ({ ...p, [id]: st }));

  return (
    <div style={{ maxWidth: 740 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Application Tracker</h2>
        <p style={{ fontSize: 13, color: "#4b5563" }}>Track saved jobs and application pipeline in one place.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Saved",       val: savedList.length,    color: "#fbbf24" },
          { label: "Applied",     val: appliedList.length,  color: "#4cff6e" },
          { label: "In Progress", val: Object.values(stages).filter(s => !["OFFER","REJECTED"].includes(s)).length, color: "#60a5fa" },
          { label: "Offers",      val: Object.values(stages).filter(s => s === "OFFER").length, color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "13px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} className={`filter-pill ${trackerFilter===t.id?"active":""}`} onClick={() => setTrackerFilter(t.id)}>
            {t.label} {t.count > 0 && <span style={{ marginLeft: 4, background: "rgba(76,255,110,.12)", padding: "0 5px", borderRadius: 10, fontSize: 10 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {display.length === 0 ? (
        <EmptyState icon="📋" title="Nothing here yet" body="Save jobs from the Discover tab to track them here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {display.map(job => {
            const color = COMPANY_COLORS[job.company] || "#4cff6e";
            const stage = stages[job.id] || (job._state === "APPLIED" ? "APPLIED" : null);
            return (
              <div key={job.id} className="card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: `${color}1a`, color, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{job.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#e2f5e6" }}>{job.title}</span>
                      <span className={`chip ${job._state==="APPLIED"?"chip-green":"chip-yellow"}`} style={{ fontSize: 10 }}>{job._state}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 10 }}>
                      <span style={{ color }}>{job.company}</span><span style={{ margin: "0 5px", color: "#1f2e23" }}>·</span>{job.location}
                    </div>
                    {job._state === "APPLIED" && (
                      <div>
                        <div style={{ fontSize: 10.5, color: "#374151", marginBottom: 6 }}>Application stage</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {APP_STAGES.map((s, i) => {
                            const stageIdx = APP_STAGES.indexOf(stage || "APPLIED");
                            const isCurrent = s === stage;
                            const isPast    = i <= stageIdx;
                            return (
                              <button key={s} onClick={() => setStage(job.id, s)} style={{
                                padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: isCurrent ? 700 : 400, cursor: "pointer",
                                background: isCurrent ? "rgba(76,255,110,.18)" : isPast ? "rgba(76,255,110,.06)" : "rgba(255,255,255,.03)",
                                border: `1px solid ${isCurrent ? "rgba(76,255,110,.45)" : isPast ? "rgba(76,255,110,.14)" : "rgba(255,255,255,.06)"}`,
                                color: isCurrent ? "#4cff6e" : isPast ? "#86efac" : "#374151",
                              }}>{s.replace("_"," ")}</button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 11, color: "#374151" }}>{timeAgo(job.postedAt)}</span>
                    {job._state !== "APPLIED" && <button className="btn btn-primary" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => apply(job.id)}>Apply</button>}
                    <button className="btn-icon" style={{ fontSize: 12 }} onClick={() => toggleSave(job.id)}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sources Tab ──────────────────────────────────────────────────────────────
function SourcesTab() {
  const [sources] = useState([
    { name: "Google",       url: "careers.google.com",                strategy: "API",  interval: 10, lastScrape: "2m ago",  jobsFound: 3, status: "active" },
    { name: "Meta",         url: "metacareers.com/jobs",              strategy: "API",  interval: 10, lastScrape: "4m ago",  jobsFound: 1, status: "active" },
    { name: "Apple",        url: "jobs.apple.com",                    strategy: "HTML", interval: 15, lastScrape: "8m ago",  jobsFound: 2, status: "active" },
    { name: "Microsoft",    url: "careers.microsoft.com",             strategy: "API",  interval: 10, lastScrape: "3m ago",  jobsFound: 4, status: "active" },
    { name: "Amazon",       url: "amazon.jobs/en/search",             strategy: "API",  interval: 5,  lastScrape: "1m ago",  jobsFound: 7, status: "active" },
    { name: "Netflix",      url: "jobs.netflix.com/search",           strategy: "HTML", interval: 15, lastScrape: "12m ago", jobsFound: 0, status: "active" },
    { name: "Stripe",       url: "stripe.com/jobs/search",            strategy: "HTML", interval: 15, lastScrape: "9m ago",  jobsFound: 2, status: "active" },
    { name: "Airbnb",       url: "careers.airbnb.com/positions",      strategy: "HTML", interval: 20, lastScrape: "18m ago", jobsFound: 1, status: "active" },
    { name: "Uber",         url: "uber.com/us/en/careers/list",       strategy: "API",  interval: 10, lastScrape: "5m ago",  jobsFound: 3, status: "active" },
    { name: "Spotify",      url: "lifeatspotify.com/jobs",            strategy: "HTML", interval: 20, lastScrape: "15m ago", jobsFound: 0, status: "active" },
  ]);

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Scraper Sources</h2>
          <p style={{ fontSize: 13, color: "#4b5563" }}>Company career pages monitored directly — before jobs appear on LinkedIn or Indeed.</p>
        </div>
        <button className="btn btn-ghost">+ Add source</button>
      </div>

      {/* Architecture diagram */}
      <div style={{ background: "rgba(76,255,110,.03)", border: "1px solid rgba(76,255,110,.08)", borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <p className="section-label" style={{ marginBottom: 14 }}>Scraping pipeline architecture</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {["Career Pages","→","ScraperService","→","Kafka","→","NotificationService","→","WebSocket","→","You"].map((item, i) => (
            <span key={i} style={{
              padding: item === "→" ? "0 2px" : "6px 12px",
              borderRadius: item === "→" ? 0 : 8,
              background: item === "→" ? "transparent" : "rgba(76,255,110,.07)",
              border: item === "→" ? "none" : "1px solid rgba(76,255,110,.12)",
              fontSize: 12, fontWeight: item === "→" ? 400 : 500,
              color: item === "→" ? "#374151" : "#86efac",
            }}>{item}</span>
          ))}
        </div>
      </div>

      {/* Sources table */}
      <div style={{ background: "rgba(255,255,255,.015)", border: "1px solid rgba(76,255,110,.07)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 90px 80px 90px 90px 70px", gap: 0, borderBottom: "1px solid rgba(76,255,110,.07)", padding: "10px 16px" }}>
          {["Company","URL","Strategy","Interval","Last Scrape","Jobs Found","Status"].map(h => (
            <span key={h} style={{ fontSize: 10.5, fontWeight: 600, color: "#374151", letterSpacing: ".06em", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>
        {sources.map((s, i) => {
          const color = COMPANY_COLORS[s.name] || "#4cff6e";
          return (
            <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 90px 80px 90px 90px 70px", gap: 0, padding: "12px 16px", borderBottom: i < sources.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none", alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(76,255,110,.025)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: `${color}1a`, color, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{s.name.slice(0,2).toUpperCase()}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#e2f5e6" }}>{s.name}</span>
              </div>
              <span style={{ fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{s.url}</span>
              <span className={`chip ${s.strategy === "API" ? "chip-blue" : "chip-purple"}`} style={{ fontSize: 10, width: "fit-content" }}>{s.strategy}</span>
              <span style={{ fontSize: 12, color: "#4b5563" }}>{s.interval}m</span>
              <span style={{ fontSize: 11, color: "#4b5563" }}>{s.lastScrape}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: s.jobsFound > 0 ? "#4cff6e" : "#374151" }}>{s.jobsFound > 0 ? `+${s.jobsFound}` : "—"}</span>
              <span className="chip chip-green" style={{ fontSize: 10, width: "fit-content" }}>● {s.status}</span>
            </div>
          );
        })}
      </div>

      {/* Supported strategies */}
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { strategy: "API Integration",    icon: "🔌", desc: "Direct JSON API scraping with pagination, auth headers, and retry logic." },
          { strategy: "HTML Scraping",       icon: "🕷️", desc: "Jsoup-based DOM parsing with CSS selectors for career page HTML." },
          { strategy: "RSS / Atom Feeds",    icon: "📡", desc: "Lightweight feed parsing for companies that publish job RSS feeds." },
        ].map(s => (
          <div key={s.strategy} className="card" style={{ padding: "14px 15px" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2f5e6", marginBottom: 5 }}>{s.strategy}</div>
            <div style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.65 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared: Empty State ──────────────────────────────────────────────────────
function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#374151" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#6b7280", marginBottom: 7 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#374151", maxWidth: 320, margin: "0 auto", lineHeight: 1.6, marginBottom: action ? 16 : 0 }}>{body}</div>
      {action}
    </div>
  );
}
