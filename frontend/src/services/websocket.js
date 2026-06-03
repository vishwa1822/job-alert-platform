function resolveWsBase() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
  }
  return 'ws://localhost:8080';
}

const WS_BASE = resolveWsBase();

let ws         = null;
let userId     = null;
let reconnectDelay = 1000;
let pingTimer  = null;
const MAX_DELAY = 30_000;
const listeners = new Map();

function dispatch(type, data) {
  listeners.forEach((fn) => fn(type, data));
}

function connect() {
  if (!userId) return;
  try {
    ws = new WebSocket(`${WS_BASE}/ws/notifications?userId=${userId}`);
  } catch (_) { scheduleReconnect(); return; }

  ws.onopen = () => {
    reconnectDelay = 1000;
    dispatch('WS_CONNECTED', {});
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25_000);
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type !== 'PONG') dispatch(msg.type || 'WS_MESSAGE', msg);
    } catch (_) {}
  };

  ws.onclose = () => {
    clearInterval(pingTimer);
    dispatch('WS_DISCONNECTED', {});
    scheduleReconnect();
  };

  ws.onerror = () => ws.close();
}

function scheduleReconnect() {
  if (!userId) return;
  setTimeout(connect, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_DELAY);
}

export const wsClient = {
  init(uid) {
    userId = uid;
    connect();
  },
  subscribe(id, fn) { listeners.set(id, fn); },
  unsubscribe(id)   { listeners.delete(id); },
  disconnect()      { userId = null; clearInterval(pingTimer); ws?.close(); },
  isConnected()     { return ws?.readyState === WebSocket.OPEN; },
};
