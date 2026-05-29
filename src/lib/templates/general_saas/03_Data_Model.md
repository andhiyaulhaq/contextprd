# B2B SaaS: Data Schema & Tenant Isolation

## Core PostgreSQL Schema

```sql
-- Tenant (Organization)
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,          -- URL-safe org identifier
  plan        TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro' | 'enterprise'
  seat_limit  INT NOT NULL DEFAULT 1,
  storage_bytes_used BIGINT DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_expires_at TIMESTAMPTZ,
  data_region TEXT NOT NULL DEFAULT 'us',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  name         TEXT NOT NULL,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member' | 'viewer'
  hashed_pw    TEXT,
  last_login_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Workspaces
CREATE TABLE workspaces (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  profile_json JSONB NOT NULL DEFAULT '{}',
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  version      INT NOT NULL DEFAULT 1,
  updated_by   UUID REFERENCES users(id),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ          -- soft delete
);

-- Audit Log
CREATE TABLE audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  UUID NOT NULL,
  actor_id   UUID,
  action     TEXT NOT NULL,   -- e.g. 'document.updated', 'member.invited'
  resource   TEXT,
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Row-Level Security (RLS) Policy

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see workspaces belonging to their tenant
CREATE POLICY tenant_isolation ON workspaces
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

*   `app.current_tenant_id` is set at the start of every DB transaction by the API middleware.
*   Verified by security tests that cross-tenant queries return zero rows even with direct SQL.

## Indexes
```sql
CREATE INDEX idx_documents_workspace ON documents(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
```

## Data Retention
*   Soft-deleted documents: permanently purged after 30 days via nightly cron job.
*   Audit logs: retained 30 days (Free/Pro), 1 year (Enterprise).
*   Cancelled tenant data: retained 90 days, then permanently deleted.