-- Shopify Audit SaaS — Database Schema
-- Run this in Supabase SQL editor

-- Audits table
create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  job_id text unique not null,
  user_id uuid,
  store_url text not null,
  store_name text,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  completed_at timestamp,
  status text check (status in ('pending', 'running', 'complete', 'failed')) default 'pending',
  duration_ms integer,
  total_findings integer default 0,
  critical_count integer default 0,
  high_count integer default 0
);

create index if not exists idx_audits_user_id on audits(user_id);
create index if not exists idx_audits_status on audits(status);
create index if not exists idx_audits_created_at on audits(created_at desc);
create index if not exists idx_audits_job_id on audits(job_id);

-- Findings table
create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references audits(id) on delete cascade,
  rule_id text not null,
  severity text check (severity in ('critical', 'high', 'medium', 'low')),
  finding text not null,
  impact text,
  recommendation text,
  business_impact_score integer,
  created_at timestamp default now()
);

create index if not exists idx_findings_audit_id on findings(audit_id);
create index if not exists idx_findings_rule_id on findings(rule_id);
create index if not exists idx_findings_severity on findings(severity);

-- Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references audits(id) on delete cascade,
  finding_id uuid references findings(id) on delete set null,
  prospect_name text,
  prospect_linkedin text,
  linkedin_message text,
  email_subject text,
  email_body text,
  created_at timestamp default now(),
  sent_at timestamp,
  response_received_at timestamp,
  response_sentiment text
);

create index if not exists idx_messages_audit_id on messages(audit_id);

-- Logs table
create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  job_id text,
  event text not null,
  level text default 'info',
  message text,
  metadata jsonb,
  created_at timestamp default now()
);

create index if not exists idx_logs_job_id on logs(job_id);
create index if not exists idx_logs_created_at on logs(created_at desc);
