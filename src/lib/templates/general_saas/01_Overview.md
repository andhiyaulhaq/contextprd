# B2B SaaS: Project Overview

## Core Value Proposition
*   **Mission:** Scale product documentation into a collaborative, multi-tenant team platform — enabling entire engineering and product organizations to plan, write, and align on PRDs in one shared workspace.
*   **Key Customers:** Enterprise product teams, remote-first startups, software development agencies.
*   **Success Metrics:**
    *   Monthly Active Tenants growth > 15% MoM
    *   Net Revenue Retention (NRR) > 115%
    *   Time-to-first-value (account creation → first shared document) < 5 minutes
    *   Support ticket rate < 2% of MAU

## Multi-Tenancy Model
*   **Architecture:** Logical multi-tenancy — all tenants share one database. Data isolation enforced via PostgreSQL Row-Level Security (RLS) policies on every table.
*   **Tenant = Organization:** One subscription, multiple team members (seats).
*   **RBAC Roles:** Owner (1 per org), Admin, Member, Viewer. Permissions enforced at both API middleware and DB RLS layers.
*   **Data Residency:** US region by default. EU region available on Enterprise plan (separate RDS cluster).

## Pricing Tiers
| Plan | Seats | Storage | Key Features |
|---|---|---|---|
| **Free** | 1 | 100MB | 3 workspaces, basic editor |
| **Pro** | Up to 10 | 10GB | Unlimited workspaces, version history, AI features |
| **Enterprise** | Unlimited | Custom | SSO/SAML, audit logs, SLA, EU data residency, custom contract |

## Constraints & Non-Goals
*   No on-premise deployment in v1 (cloud-only).
*   No real-time co-editing cursor presence in v1 (async collaboration only).
*   No white-labeling in v1.