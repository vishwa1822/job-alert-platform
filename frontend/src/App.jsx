import { useState, useRef, useMemo } from 'react';
import { useAppData } from './hooks/useAppData';
import { useMonitors } from './hooks/useMonitors';
import Topbar from './components/Topbar';
import DiscoverTab from './components/DiscoverTab';
import MonitorsTab from './components/MonitorsTab';
import SavedTab from './components/SavedTab';
import './styles/global.css';

export default function App() {
  const {
    jobs, stats, dataMode, notifications, setNotifications, loading, loadFromApi,
  } = useAppData();

  const {
    monitors, loading: monitorsLoading, addMonitor, toggleMonitor, removeMonitor, checkNow, refresh: refreshMonitors,
  } = useMonitors(dataMode);

  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRemote, setFilterRemote] = useState('ALL');
  const [savedJobs, setSavedJobs] = useState(() => new Set());
  const [appliedJobs, setAppliedJobs] = useState(() => new Set());
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);

  const filtered = useMemo(() => jobs.filter((j) => {
    if (search) {
      const q = search.toLowerCase();
      if (!j.title.toLowerCase().includes(q) && !j.company.toLowerCase().includes(q)) return false;
    }
    if (filterRemote !== 'ALL' && j.remoteType !== filterRemote) return false;
    return true;
  }), [jobs, search, filterRemote]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const toggleSave = (id) => setSavedJobs((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });
  const apply = (id) => setAppliedJobs((p) => new Set([...p, id]));
  const markAllRead = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));

  const savedList = jobs.filter((j) => savedJobs.has(j.id));

  const onTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedJob(null);
    if (tab === 'monitors' && dataMode === 'live') refreshMonitors();
    if (tab === 'jobs' && !loading) loadFromApi();
  };

  return (
    <>
      <div className="app-bg" aria-hidden>
        <div className="app-bg__base" />
        <div className="app-bg__texture" />
        <div className="app-bg__vignette" />
        <div className="app-bg__rim" />
        <div className="app-bg__sheen" />
      </div>

      <Topbar
        activeTab={activeTab}
        setActiveTab={onTabChange}
        search={search}
        setSearch={setSearch}
        showSearch={activeTab === 'jobs'}
        dataMode={dataMode}
        unreadCount={unreadCount}
        notifications={notifications}
        showNotifPanel={showNotifPanel}
        setShowNotifPanel={setShowNotifPanel}
        markAllRead={markAllRead}
        notifRef={notifRef}
        setNotifications={setNotifications}
      />

      <main className="app-main">
        {activeTab === 'jobs' && (
          <DiscoverTab
            filtered={filtered}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            savedJobs={savedJobs}
            toggleSave={toggleSave}
            search={search}
            filterRemote={filterRemote}
            setFilterRemote={setFilterRemote}
          />
        )}
        {activeTab === 'monitors' && (
          <MonitorsTab
            monitors={monitors}
            loading={monitorsLoading}
            addMonitor={addMonitor}
            toggleMonitor={toggleMonitor}
            removeMonitor={removeMonitor}
            checkNow={checkNow}
          />
        )}
        {activeTab === 'saved' && (
          <SavedTab
            savedList={savedList}
            toggleSave={toggleSave}
            apply={apply}
            appliedJobs={appliedJobs}
          />
        )}
      </main>

      {activeTab === 'jobs' && monitors.length > 0 && (
        <footer className="app-footer">
          Monitoring {monitors.filter((m) => m.isActive).length} career {monitors.length === 1 ? 'portal' : 'portals'}
          {' · '}
          <button type="button" className="link-btn" onClick={() => onTabChange('monitors')}>Manage monitors</button>
        </footer>
      )}
    </>
  );
}
