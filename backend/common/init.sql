CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    resume_url TEXT,
    skills TEXT[],
    experience_years INT DEFAULT 0,
    preferred_roles TEXT[],
    preferred_locations TEXT[],
    preferred_salary_min BIGINT,
    preferred_salary_max BIGINT,
    remote_preference VARCHAR(50) DEFAULT 'HYBRID',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    career_page_url TEXT NOT NULL,
    api_endpoint TEXT,
    scrape_selector TEXT,
    scrape_interval_minutes INT DEFAULT 15,
    last_scraped_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    scrape_strategy VARCHAR(50) DEFAULT 'HTML',
    headers JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(500),
    source_id UUID REFERENCES company_sources(id),
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255) NOT NULL,
    company_logo TEXT,
    location VARCHAR(255),
    remote_type VARCHAR(50),
    salary_min BIGINT,
    salary_max BIGINT,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    job_type VARCHAR(50),
    experience_level VARCHAR(50),
    skills_required TEXT[],
    apply_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    view_count INT DEFAULT 0,
    apply_count INT DEFAULT 0,
    search_vector TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING gin(skills_required);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active, posted_at DESC);

CREATE OR REPLACE FUNCTION update_job_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.company, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.skills_required, ' '), '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS user_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    keywords TEXT[],
    locations TEXT[],
    companies TEXT[],
    job_types TEXT[],
    remote_types TEXT[],
    skills TEXT[],
    salary_min BIGINT,
    experience_levels TEXT[],
    notify_email BOOLEAN DEFAULT TRUE,
    notify_push BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(50) DEFAULT 'INSTANT',
    is_active BOOLEAN DEFAULT TRUE,
    last_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    status VARCHAR(50) DEFAULT 'APPLIED',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    payload JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES company_sources(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    jobs_found INT DEFAULT 0,
    jobs_new INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'RUNNING',
    error_message TEXT
);

INSERT INTO company_sources (company_name, career_page_url, scrape_strategy, scrape_interval_minutes) VALUES
('Google', 'https://careers.google.com/jobs/results/', 'API', 10),
('Meta', 'https://www.metacareers.com/jobs', 'API', 10),
('Apple', 'https://jobs.apple.com/en-us/search', 'HTML', 15),
('Microsoft', 'https://careers.microsoft.com/us/en/search-results', 'API', 10),
('Amazon', 'https://www.amazon.jobs/en/search', 'API', 5),
('Netflix', 'https://jobs.netflix.com/search', 'HTML', 15),
('Stripe', 'https://stripe.com/jobs/search', 'HTML', 15),
('Airbnb', 'https://careers.airbnb.com/positions/', 'HTML', 20),
('Uber', 'https://www.uber.com/us/en/careers/list/', 'API', 10),
('Spotify', 'https://www.lifeatspotify.com/jobs', 'HTML', 20)
ON CONFLICT DO NOTHING;
