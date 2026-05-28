-- ═══════════════════════════════════════════════════════════════
--  JobPulse — Database Schema
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Users ───────────────────────────────────────────────────────
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(255),
    summary TEXT,
    resume_url TEXT,
    location VARCHAR(255),
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    skills TEXT[],
    experience_years INT DEFAULT 0,
    salary_min INT,
    salary_max INT,
    preferred_work_type VARCHAR(50)[],  -- REMOTE, HYBRID, ONSITE
    preferred_job_types VARCHAR(50)[],  -- FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
    open_to_work BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Companies ───────────────────────────────────────────────────
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    careers_url TEXT,
    linkedin_url TEXT,
    description TEXT,
    industry VARCHAR(100),
    size_range VARCHAR(50),
    headquarters VARCHAR(255),
    founded_year INT,
    is_tracked BOOLEAN DEFAULT TRUE,
    scrape_frequency_minutes INT DEFAULT 30,
    last_scraped_at TIMESTAMPTZ,
    scrape_selector JSONB,  -- CSS selectors / API config
    api_endpoint TEXT,
    api_headers JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Jobs ────────────────────────────────────────────────────────
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT FALSE,
    work_type VARCHAR(50),          -- REMOTE, HYBRID, ONSITE
    employment_type VARCHAR(50),    -- FULL_TIME, PART_TIME, CONTRACT
    experience_min INT,
    experience_max INT,
    salary_min INT,
    salary_max INT,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    skills_required TEXT[],
    skills_preferred TEXT[],
    department VARCHAR(100),
    seniority_level VARCHAR(50),    -- INTERN, JUNIOR, MID, SENIOR, LEAD, EXECUTIVE
    apply_url TEXT,
    source VARCHAR(50),             -- DIRECT_SCRAPE, LINKEDIN_API, GREENHOUSE, LEVER, etc.
    status VARCHAR(50) DEFAULT 'ACTIVE',
    views_count INT DEFAULT 0,
    applies_count INT DEFAULT 0,
    posted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, external_id)
);

-- Full-text search index
CREATE INDEX idx_jobs_fts ON jobs USING gin(
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(skills_required, ' '))
);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_location ON jobs USING gin(location gin_trgm_ops);

-- ─── Job Alerts ──────────────────────────────────────────────────
CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    keywords TEXT[],
    locations TEXT[],
    companies TEXT[],
    job_types VARCHAR(50)[],
    work_types VARCHAR(50)[],
    seniority_levels VARCHAR(50)[],
    skills TEXT[],
    salary_min INT,
    salary_max INT,
    frequency VARCHAR(50) DEFAULT 'INSTANT',  -- INSTANT, DAILY, WEEKLY
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Applications ────────────────────────────────────────────────
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'APPLIED',  -- SAVED, APPLIED, SCREENING, INTERVIEW, OFFER, REJECTED, WITHDRAWN
    notes TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- ─── Notifications ───────────────────────────────────────────────
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,  -- NEW_JOB_MATCH, APPLICATION_UPDATE, ALERT_TRIGGER
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ─── Scrape Logs ─────────────────────────────────────────────────
CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    source VARCHAR(100),
    status VARCHAR(50),     -- SUCCESS, FAILED, PARTIAL
    jobs_found INT DEFAULT 0,
    jobs_new INT DEFAULT 0,
    jobs_updated INT DEFAULT 0,
    error_message TEXT,
    duration_ms INT,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Recommendations ─────────────────────────────────────────────
CREATE TABLE job_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    score DECIMAL(5,4),
    reasons TEXT[],
    is_viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- ─── Seed Data ───────────────────────────────────────────────────
INSERT INTO companies (name, slug, website_url, careers_url, industry, size_range, headquarters, is_tracked, scrape_frequency_minutes, scrape_selector) VALUES
('Google', 'google', 'https://google.com', 'https://careers.google.com', 'Technology', '10000+', 'Mountain View, CA', true, 15, '{"type":"api","endpoint":"https://careers.google.com/api/jobs"}'),
('Meta', 'meta', 'https://meta.com', 'https://www.metacareers.com', 'Technology', '10000+', 'Menlo Park, CA', true, 15, '{"type":"api","endpoint":"https://www.metacareers.com/jobs"}'),
('Stripe', 'stripe', 'https://stripe.com', 'https://stripe.com/jobs', 'FinTech', '1000-5000', 'San Francisco, CA', true, 30, '{"type":"greenhouse","company_id":"stripe"}'),
('Vercel', 'vercel', 'https://vercel.com', 'https://vercel.com/careers', 'Developer Tools', '100-500', 'San Francisco, CA', true, 60, '{"type":"lever","company_id":"vercel"}'),
('Anthropic', 'anthropic', 'https://anthropic.com', 'https://anthropic.com/careers', 'AI/ML', '100-500', 'San Francisco, CA', true, 30, '{"type":"greenhouse","company_id":"anthropic"}'),
('Linear', 'linear', 'https://linear.app', 'https://linear.app/careers', 'Developer Tools', '1-100', 'San Francisco, CA', true, 60, '{"type":"ashby","company_id":"linear"}'),
('Figma', 'figma', 'https://figma.com', 'https://www.figma.com/careers', 'Design Tools', '1000-5000', 'San Francisco, CA', true, 30, '{"type":"greenhouse","company_id":"figma"}'),
('Notion', 'notion', 'https://notion.so', 'https://www.notion.so/careers', 'Productivity', '100-500', 'San Francisco, CA', true, 60, '{"type":"lever","company_id":"notion"}');

-- Seed sample jobs
INSERT INTO jobs (company_id, external_id, title, location, is_remote, work_type, employment_type, experience_min, experience_max, salary_min, salary_max, skills_required, seniority_level, source, status, posted_at, discovered_at) 
SELECT 
    c.id,
    'ext-' || gen_random_uuid()::text,
    t.title,
    t.location,
    t.is_remote,
    t.work_type,
    'FULL_TIME',
    t.exp_min,
    t.exp_max,
    t.sal_min,
    t.sal_max,
    t.skills,
    t.level,
    'DIRECT_SCRAPE',
    'ACTIVE',
    NOW() - (random() * interval '7 days'),
    NOW() - (random() * interval '7 days')
FROM companies c,
(VALUES
    ('Senior Software Engineer', 'San Francisco, CA', true, 'REMOTE', 5, 8, 180000, 250000, ARRAY['Java','Kubernetes','PostgreSQL'], 'SENIOR'),
    ('Staff Frontend Engineer', 'Remote', true, 'REMOTE', 6, 10, 200000, 280000, ARRAY['React','TypeScript','GraphQL'], 'LEAD'),
    ('ML Engineer', 'New York, NY', false, 'HYBRID', 3, 6, 160000, 220000, ARRAY['Python','PyTorch','MLOps'], 'MID'),
    ('DevOps Engineer', 'Austin, TX', true, 'REMOTE', 4, 7, 150000, 200000, ARRAY['Terraform','AWS','Docker'], 'SENIOR'),
    ('Product Designer', 'San Francisco, CA', true, 'HYBRID', 3, 5, 130000, 180000, ARRAY['Figma','Prototyping','UX Research'], 'MID')
) AS t(title, location, is_remote, work_type, exp_min, exp_max, sal_min, sal_max, skills, level)
WHERE c.slug IN ('google','stripe','anthropic');
