const STORAGE_KEY = 'jp_monitors';

export const DEFAULT_MONITORS = [
  { id: 'demo-1', name: 'Google', url: 'https://careers.google.com', interval: 15, isActive: true, lastScrapedAt: null },
  { id: 'demo-2', name: 'Stripe', url: 'https://stripe.com/jobs', interval: 15, isActive: true, lastScrapedAt: null },
];

export function normalizeSource(s) {
  if (!s) return null;
  return {
    id: String(s.id),
    name: s.companyName || s.name,
    url: s.careerPageUrl || s.url,
    strategy: s.scrapeStrategy || s.strategy || 'HTML',
    interval: s.scrapeIntervalMinutes ?? s.interval ?? 15,
    isActive: s.isActive ?? true,
    lastScrapedAt: s.lastScrapedAt || null,
  };
}

export function loadLocalMonitors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_MONITORS.map((m) => ({ ...m }));
}

export function saveLocalMonitors(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function formatLastChecked(iso) {
  if (!iso) return 'Not checked yet';
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
