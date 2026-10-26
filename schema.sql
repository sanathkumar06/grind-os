-- ==============================================================================
-- GRIND OS: SUPABASE POSTGRESQL SCHEMA
-- Copy and paste this into your Supabase Dashboard -> SQL Editor and click RUN.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Applied', -- 'Applied', 'Screening', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'
    chance INTEGER DEFAULT 50 CHECK (chance >= 0 AND chance <= 100),
    notes TEXT,
    link TEXT
);

-- 3. German Learning Logs Table
CREATE TABLE IF NOT EXISTS german_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    learned_today TEXT NOT NULL,
    next_session_plan TEXT,
    duration_mins INTEGER DEFAULT 30
);

-- 4. Coding Upskilling Logs Table
CREATE TABLE IF NOT EXISTS coding_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT NOT NULL,
    topics TEXT, -- e.g. "LeetCode, React, Docker"
    hours_spent NUMERIC(4, 1) DEFAULT 1.0,
    link TEXT
);


-- ==============================================================================
-- Row Level Security (RLS) & Public Access Policies
-- Enables reading and writing with anon public key for your personal tracker
-- ==============================================================================

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE german_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon public read/write access (suitable for personal tracker with anon key)
CREATE POLICY "Public access job_applications" ON job_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access german_logs" ON german_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access coding_logs" ON coding_logs FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE job_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE german_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE coding_logs;
