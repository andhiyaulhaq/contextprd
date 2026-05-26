# Web App: Deployment & Ops

## CI/CD Pipeline
*   **Trigger:** Merges into the main branch.
*   **Pipeline Steps:** Lint -> Format Verification -> Build Checks -> Integration Tests -> Vercel Deployment.

## Monitoring & Alerts
*   **Performance Tracking:** Vercel Analytics + Speed Insights.
*   **Error Logging:** Sentry SDK integration for client-side crash tracking.
*   **Backup Strategy:** Automated daily PostgreSQL backups stored securely on AWS S3 with 30-day retention.