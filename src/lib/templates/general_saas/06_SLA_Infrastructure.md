# B2B SaaS: SLA & Cloud Infrastructure

## Service Level Agreement (SLA)

| Plan | Uptime SLA | Support Response | Incident Communication |
|---|---|---|---|
| Free | No SLA | Community forum | Status page only |
| Pro | 99.9% monthly | Email, 48h | Email on P1 incidents |
| Enterprise | 99.95% monthly | Dedicated CSM, 4h | Direct Slack channel |

*   **Downtime Definition:** Service unavailable to > 5% of users for > 1 consecutive minute.
*   **Credits:** Pro: 10% monthly credit per 0.1% below SLA. Enterprise: 25% credit per breach.
*   **Exclusions:** Scheduled maintenance (notified 72h in advance), force majeure, customer-caused incidents.

## Cloud Infrastructure (AWS)

### Compute
*   **API Servers:** AWS ECS Fargate (serverless containers). Auto-scales based on CPU > 60% or request queue depth.
*   **Next.js Frontend:** Vercel Edge Network (CDN + serverless functions).
*   **Background Workers:** AWS SQS + ECS Fargate workers for webhooks, email, audit log writes, and billing events.

### Database
*   **Primary:** AWS RDS PostgreSQL 16 Multi-AZ (`db.t4g.medium` → `db.r7g.large` on Enterprise).
*   **Read Replica:** 1 read replica per region for analytics queries and reporting endpoints.
*   **Backups:** Automated daily snapshots, 30-day retention. Point-In-Time Recovery (PITR) to within 5 minutes.
*   **Connection Pooling:** RDS Proxy (PgBouncer managed by AWS). Eliminates cold-start connection overhead.

### Storage & CDN
*   **S3:** Private bucket for user uploads. Public bucket (via CloudFront) for static assets.
*   **CloudFront:** Global CDN. Origins: S3 (assets) + Vercel (app). Cache TTL: 1 year for hashed assets.

## Disaster Recovery

| Metric | Target |
|---|---|
| Recovery Time Objective (RTO) | < 1 hour |
| Recovery Point Objective (RPO) | < 5 minutes |
| DR Test Frequency | Quarterly (simulated failover) |

### Runbook: Regional Failover
1.  Promote RDS Read Replica in secondary region to primary (`aws rds promote-read-replica`).
2.  Update Route 53 health check to point API DNS to secondary region ECS cluster.
3.  Verify Stripe webhooks still routing correctly (update endpoint URL if needed).
4.  Notify customers via status page and email within 15 minutes of declaring incident.

## Scheduled Maintenance
*   Window: Sundays 02:00–04:00 UTC.
*   Notice: ≥ 72 hours in advance via status page, email to Admins, and in-app banner.
*   Zero-downtime deployments used whenever possible (blue-green via ECS).