const MIN_MINUTES = 5;
const MAX_MINUTES = 10080; // 7 days

export function intervalToMinutes(value, unit = 'minutes') {
  const v = Number(value);
  if (!Number.isFinite(v) || v < 1) return null;
  let mins = v;
  if (unit === 'hours') mins = v * 60;
  if (unit === 'days') mins = v * 24 * 60;
  return Math.round(Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, mins)));
}

export function formatIntervalMinutes(minutes) {
  const m = Number(minutes) || 0;
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'}`;
  if (m < 1440) {
    const h = m / 60;
    const whole = h % 1 === 0;
    return whole ? `${h} hour${h === 1 ? '' : 's'}` : `${h.toFixed(1)} hours`;
  }
  const d = m / 1440;
  return d % 1 === 0 ? `${d} day${d === 1 ? '' : 's'}` : `${d.toFixed(1)} days`;
}

export const INTERVAL_PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '6 hr', minutes: 360 },
  { label: '24 hr', minutes: 1440 },
];

export function resolveIntervalMinutes(value) {
  if (typeof value === 'number' && value >= MIN_MINUTES) {
    return Math.min(MAX_MINUTES, value);
  }
  return null;
}
