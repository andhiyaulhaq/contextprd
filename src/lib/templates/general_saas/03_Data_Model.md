# B2B SaaS: Data Schema & Isolation

## Core PostgreSQL Schema
*   **Tenants:** id, name, plan, status, stripe_customer_id, created_at
*   **Workspaces:** id, tenant_id, name, profile, file_tree, created_at
*   **Users:** id, tenant_id, email, password_hash, role, created_at

## Tenant Isolation Guardrails
*   Utilize PostgreSQL Row-Level Security (RLS) policies on all tenant tables.
*   Database connection pooling configured with separate schemas for Enterprise tier.