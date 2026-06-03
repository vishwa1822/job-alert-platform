const BASE = import.meta.env.VITE_API_URL ?? '';

let authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('jp_token') : null;

export const setToken = (t) => { authToken = t; localStorage.setItem('jp_token', t); };
export const clearToken = () => { authToken = null; localStorage.removeItem('jp_token'); };
export const getToken = () => authToken;

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status === 204 ? null : res.json();
}

export const api = {
  auth: {
    login:    (body) => req('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
    register: (body) => req('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    me:       ()     => req('/api/auth/me'),
  },
  jobs: {
    list:    (params) => req(`/api/jobs?${new URLSearchParams(params)}`),
    get:     (id)     => req(`/api/jobs/${id}`),
    recent:  (h = 24) => req(`/api/jobs/recent?hoursBack=${h}`),
    stats:   ()       => req('/api/jobs/stats'),
    trigger: ()       => req('/api/jobs/scrape/trigger', { method: 'POST' }),
  },
  alerts: {
    list:        ()         => req('/api/users/alerts'),
    create:      (body)     => req('/api/users/alerts', { method: 'POST', body: JSON.stringify(body) }),
    update:      (id, body) => req(`/api/users/alerts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    toggle:      (id, a)    => req(`/api/users/alerts/${id}/toggle?active=${a}`, { method: 'PATCH' }),
    delete:      (id)       => req(`/api/users/alerts/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    list:        (p = 0)    => req(`/api/notifications?page=${p}`),
    unread:      ()         => req('/api/notifications/unread-count'),
    markRead:    (id)       => req(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: ()         => req('/api/notifications/read-all',   { method: 'PATCH' }),
  },
  sources: {
    list: () => req('/api/sources'),
    create: (body) => req('/api/sources', { method: 'POST', body: JSON.stringify(body) }),
    toggle: (id, active) => req(`/api/sources/${id}/toggle?active=${active}`, { method: 'PATCH' }),
    delete: (id) => req(`/api/sources/${id}`, { method: 'DELETE' }),
    scrapeNow: (id) => req(`/api/sources/${id}/scrape`, { method: 'POST' }),
  },
  recommendations: {
    list: (uid) => req(`/api/recommendations/user/${uid}`),
  },
  profile: {
    update: (body) => req('/api/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
};
