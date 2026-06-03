import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  loadLocalMonitors, saveLocalMonitors, normalizeSource,
} from '../utils/monitors';

export function useMonitors(dataMode) {
  const [monitors, setMonitors] = useState(loadLocalMonitors);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.sources.list();
      if (Array.isArray(list)) {
        const normalized = list.map(normalizeSource).filter(Boolean);
        setMonitors(normalized);
        saveLocalMonitors(normalized);
        return 'live';
      }
    } catch {
      /* use local */
    } finally {
      setLoading(false);
    }
    return 'demo';
  }, []);

  useEffect(() => {
    if (dataMode === 'live') refresh();
  }, [dataMode, refresh]);

  const addMonitor = async ({ name, url, interval }) => {
    const mins = Math.min(10080, Math.max(5, Number(interval) || 15));
    const payload = {
      companyName: name.trim(),
      careerPageUrl: url.trim(),
      scrapeIntervalMinutes: mins,
      scrapeStrategy: 'HTML',
    };

    try {
      const created = await api.sources.create(payload);
      const item = normalizeSource(created);
      setMonitors((p) => {
        const next = [...p, item];
        saveLocalMonitors(next);
        return next;
      });
      try {
        await api.sources.scrapeNow(item.id);
      } catch {
        /* optional */
      }
      return { ok: true, item };
    } catch {
      const item = {
        id: `local-${Date.now()}`,
        name: payload.companyName,
        url: payload.careerPageUrl.startsWith('http') ? payload.careerPageUrl : `https://${payload.careerPageUrl}`,
        interval: payload.scrapeIntervalMinutes,
        isActive: true,
        lastScrapedAt: new Date().toISOString(),
        strategy: 'HTML',
      };
      setMonitors((p) => {
        const next = [...p, item];
        saveLocalMonitors(next);
        return next;
      });
      return { ok: true, item, demo: true };
    }
  };

  const toggleMonitor = async (id, active) => {
    try {
      await api.sources.toggle(id, active);
    } catch {
      /* local only */
    }
    setMonitors((p) => {
      const next = p.map((m) => (m.id === id ? { ...m, isActive: active } : m));
      saveLocalMonitors(next);
      return next;
    });
  };

  const removeMonitor = async (id) => {
    try {
      await api.sources.delete(id);
    } catch {
      /* local only */
    }
    setMonitors((p) => {
      const next = p.filter((m) => m.id !== id);
      saveLocalMonitors(next);
      return next;
    });
  };

  const checkNow = async (id) => {
    try {
      await api.sources.scrapeNow(id);
    } catch {
      /* demo */
    }
    setMonitors((p) => {
      const next = p.map((m) => (m.id === id ? { ...m, lastScrapedAt: new Date().toISOString() } : m));
      saveLocalMonitors(next);
      return next;
    });
  };

  return {
    monitors,
    loading,
    refresh,
    addMonitor,
    toggleMonitor,
    removeMonitor,
    checkNow,
  };
}
