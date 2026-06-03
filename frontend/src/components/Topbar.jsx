import { useEffect } from 'react';
import { IconBolt, IconSearch, IconBell, IconCompass, IconGlobe, IconStar } from './Icons';
import { timeAgo } from '../utils/jobs';

const TABS = [
  { id: 'jobs', label: 'Jobs', Icon: IconCompass },
  { id: 'monitors', label: 'Monitors', Icon: IconGlobe },
  { id: 'saved', label: 'Saved', Icon: IconStar },
];

export default function Topbar({
  activeTab, setActiveTab, search, setSearch, showSearch,
  dataMode, unreadCount, notifications, showNotifPanel,
  setShowNotifPanel, markAllRead, notifRef, setNotifications,
}) {
  const live = dataMode === 'live';

  return (
    <header className="topbar topbar--glow">
      <div className="topbar-brand">
        <div className="topbar-logo logo-shine">
          <IconBolt width={18} height={18} strokeWidth={2.2} />
        </div>
        <span className="topbar-name">
          Job<span className="brand-gradient">Pulse</span>
        </span>
      </div>

      <nav className="topbar-nav" aria-label="Main">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" className={`nav-tab ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon width={16} height={16} />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {showSearch && (
        <div className="topbar-search">
          <IconSearch width={16} height={16} />
          <input
            className="input input-glow"
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search jobs"
          />
        </div>
      )}

      <div className="topbar-end">
        <span className={`status-pill ${live ? 'status-pill--live' : ''}`} title={live ? 'Connected to API' : 'Demo data'}>
          {live ? 'Live' : 'Demo'}
        </span>
        <NotifDropdown
          unreadCount={unreadCount}
          notifications={notifications}
          showNotifPanel={showNotifPanel}
          setShowNotifPanel={setShowNotifPanel}
          markAllRead={markAllRead}
          notifRef={notifRef}
          setNotifications={setNotifications}
        />
      </div>
    </header>
  );
}

function NotifDropdown({ unreadCount, notifications, showNotifPanel, setShowNotifPanel, markAllRead, notifRef, setNotifications }) {
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [notifRef, setShowNotifPanel]);

  return (
    <div className="notif-wrap" ref={notifRef}>
      <button type="button" className="btn-icon" onClick={() => { setShowNotifPanel((p) => !p); if (!showNotifPanel) markAllRead(); }} aria-label="Notifications">
        <IconBell />
        {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {showNotifPanel && notifications.length > 0 && (
        <div className="card notif-panel anim-slide-up">
          {notifications.slice(0, 8).map((n) => (
            <div key={n.id} className="notif-item" onClick={() => setNotifications((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-body">{n.body} · {timeAgo(n.time)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
