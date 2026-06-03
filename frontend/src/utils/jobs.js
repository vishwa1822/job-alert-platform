export const COMPANIES = [
  'Google', 'Meta', 'Apple', 'Microsoft', 'Amazon', 'Netflix', 'Stripe', 'Airbnb',
  'Uber', 'Spotify', 'OpenAI', 'Anthropic', 'Figma', 'Notion', 'Linear', 'Vercel',
  'Cloudflare', 'Databricks', 'Snowflake', 'Palantir',
];

export const TITLES = [
  'Senior Software Engineer', 'Staff Backend Engineer', 'Principal ML Engineer',
  'Senior Product Manager', 'Site Reliability Engineer', 'Frontend Engineer',
  'Data Scientist', 'DevOps Engineer', 'Security Engineer', 'Full-Stack Engineer',
];

export const LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
  'London, UK', 'Berlin, Germany', 'Remote',
];

export const SKILLS_ALL = [
  'React', 'TypeScript', 'Go', 'Python', 'Rust', 'Kubernetes', 'AWS',
  'PostgreSQL', 'Kafka', 'GraphQL', 'TensorFlow', 'Node.js', 'Docker',
];

export const LEVELS = ['ENTRY', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL'];
export const REMOTE = ['REMOTE', 'HYBRID', 'ONSITE'];
export const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'];
export const FREQ_OPTS = ['INSTANT', 'DAILY', 'WEEKLY'];

export const COMPANY_COLORS = {
  Google: '#4285F4', Meta: '#0866FF', Apple: '#a1a1aa', Microsoft: '#00BCF2',
  Amazon: '#FF9900', Netflix: '#E50914', Stripe: '#6772E5', Airbnb: '#FF5A5F',
  Uber: '#60a5fa', Spotify: '#1DB954', OpenAI: '#74AA9C', Anthropic: '#CC785C',
  Figma: '#A259FF', Notion: '#e5e7eb', Linear: '#5E6AD2', Vercel: '#f8fafc',
  Cloudflare: '#F6821F', Databricks: '#FF3621', Snowflake: '#29B5E8', Palantir: '#8b5cf6',
};

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const fmt$ = (n) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
export const salary = (lo, hi) => `${fmt$(lo)}–${fmt$(hi)}`;

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

let _jid = 100;

export function genJob(override = {}) {
  const co = rand(COMPANIES);
  const rem = rand(REMOTE);
  const lo = rem === 'REMOTE' ? 'Remote' : rand(LOCATIONS);
  const sk = [...SKILLS_ALL].sort(() => 0.5 - Math.random()).slice(0, randInt(3, 5));
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
    applyUrl: '#',
    description: `Join ${co} on a high-impact engineering team building products at global scale.`,
    ...override,
  };
}

export function normalizeJob(j) {
  if (!j) return null;
  const company = j.company || 'Unknown';
  const skills = j.skillsRequired || j.skills || [];
  return {
    id: String(j.id),
    title: j.title || 'Untitled role',
    company,
    initials: company.slice(0, 2).toUpperCase(),
    location: j.location || 'Remote',
    remoteType: j.remoteType || 'HYBRID',
    salaryMin: j.salaryMin ?? 0,
    salaryMax: j.salaryMax ?? 0,
    skills: Array.isArray(skills) ? skills : [],
    level: j.experienceLevel || j.level || 'MID',
    jobType: j.jobType || 'FULL_TIME',
    postedAt: j.postedAt ? new Date(j.postedAt) : new Date(),
    isNew: Boolean(j.isNew),
    matchScore: j.matchScore ?? randInt(65, 96),
    applyUrl: j.applyUrl || '#',
    description: j.description || '',
  };
}

export function normalizeStats(data) {
  if (!data) return { today: 0, sources: 0, total: 0 };
  return {
    today: data.jobsToday ?? data.today ?? 0,
    sources: data.sourcesMonitored ?? data.sources ?? 0,
    total: data.totalJobs ?? data.total ?? 0,
  };
}

export const SEED_JOBS = Array.from({ length: 24 }, () => genJob());
export const SEED_FEED = Array.from({ length: 6 }, () => ({
  company: rand(COMPANIES),
  title: rand(TITLES),
  location: rand(LOCATIONS),
  time: `${randInt(1, 59)}m ago`,
}));

export const REMOTE_CHIP = { REMOTE: 'chip-cyan', HYBRID: 'chip-amber', ONSITE: 'chip-violet' };
