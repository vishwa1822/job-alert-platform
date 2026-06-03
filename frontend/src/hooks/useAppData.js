import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { wsClient } from '../services/websocket';
import { SEED_JOBS, genJob, normalizeJob, normalizeStats } from '../utils/jobs';

const DEMO_USER = '00000000-0000-0000-0000-000000000001';

export function useAppData() {
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [stats, setStats] = useState({ today: 0, sources: 0, total: 0 });
  const [dataMode, setDataMode] = useState('demo');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const pushJob = useCallback((j) => {
    setJobs((p) => [j, ...p.slice(0, 49)]);
    setStats((p) => ({ ...p, today: p.today + 1, total: p.total + 1 }));
    setNotifications((prev) => [{
      id: Date.now(),
      type: 'NEW_JOB',
      title: `New at ${j.company}`,
      body: j.title,
      time: new Date(),
      read: false,
    }, ...prev.slice(0, 14)]);
  }, []);

  const loadFromApi = useCallback(async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        api.jobs.list({ page: 0, size: 40 }),
        api.jobs.stats(),
      ]);

      const content = jobsRes?.content ?? jobsRes;
      if (Array.isArray(content) && content.length > 0) {
        setJobs(content.map(normalizeJob).filter(Boolean));
      }
      setStats(normalizeStats(statsRes));
      setDataMode('live');
      return true;
    } catch {
      setDataMode('demo');
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadFromApi();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadFromApi]);

  useEffect(() => {
    wsClient.init(DEMO_USER);
    const subId = 'main';
    wsClient.subscribe(subId, (type, msg) => {
      if (type === 'JOB_MATCH' || type === 'NEW_JOB') {
        const raw = msg?.job ?? msg?.payload ?? msg;
        if (raw?.title) {
          pushJob(normalizeJob({ ...raw, isNew: true, postedAt: new Date() }));
        }
      }
    });
    return () => wsClient.unsubscribe(subId);
  }, [pushJob]);

  useEffect(() => {
    if (dataMode === 'live') return undefined;
    const iv = setInterval(() => {
      pushJob(genJob({ isNew: true, postedAt: new Date() }));
    }, 45000);
    return () => clearInterval(iv);
  }, [dataMode, pushJob]);

  return {
    jobs,
    stats,
    dataMode,
    notifications,
    setNotifications,
    loading,
    loadFromApi,
  };
}
