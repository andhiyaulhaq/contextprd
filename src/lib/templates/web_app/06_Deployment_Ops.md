# Web App: Deployment & Ops

## Environments
| Environment | Branch | URL | Purpose |
|---|---|---|---|
| Development | feature branches | `localhost:3000` | Local development |
| Preview | pull requests | Vercel preview URL | PR review & QA |
| Staging | `develop` | `staging.yourapp.com` | Integration testing |
| Production | `main` | `app.yourapp.com` | Live users |

## CI/CD Pipeline (GitHub Actions)
1.  **On PR open:** ESLint + tsc type-check → Vitest unit tests → Preview deploy to Vercel.
2.  **On merge to `develop`:** All above + integration tests → Deploy to Staging → Notify #staging Slack.
3.  **On merge to `main`:** All above + Playwright E2E tests → Deploy to Production → Notify #deploys Slack.

## Infrastructure
*   **Frontend:** Vercel (auto-scaling, global edge network, zero-config SSL).
*   **Database:** AWS RDS PostgreSQL 16 Multi-AZ. Automated daily snapshots, 30-day retention. Read replica for analytics queries.
*   **Cache:** AWS ElastiCache Redis 7 (cluster mode enabled). Eviction: `allkeys-lru`.
*   **File Storage:** AWS S3 (private bucket) + CloudFront CDN. Access via pre-signed URLs (15min TTL).
*   **Email:** AWS SES for transactional email (auth, notifications). Bounce handling via SNS.

## Monitoring & Alerting
| Tool | What it monitors | Alert threshold |
|---|---|---|
| Sentry | Frontend + API errors | Spike > 10 errors/min |
| Vercel Analytics | Core Web Vitals (LCP, FID, CLS) | P75 LCP > 3s |
| Uptime Robot | `/api/health` endpoint | 2 consecutive failures (2min) |
| AWS CloudWatch | RDS CPU, connections, disk | CPU > 80% for 5min |
| Axiom | Structured application logs | Query on demand |

## Runbooks

### Rollback (Frontend)
1. Vercel Dashboard → Deployments → select last successful build → **Promote to Production**.

### Rollback (Database Migration)
1. `pnpm db:migrate:rollback --env production` (requires VPN + production DB credentials from 1Password).
2. Verify with `pnpm db:migrate:status`.

### Scale Up (DB)
1. AWS Console → RDS → Modify instance → Select larger instance class → Apply during next maintenance window.