# Web App: Architecture Blueprint

## Technology Stack
*   **Frontend Framework:** Next.js (React 18), Tailwind CSS, TypeScript.
*   **State Management:** Zustand with custom middleware.
*   **Database:** PostgreSQL for primary storage, Redis for session caching.
*   **Authentication:** OAuth 2.0 / OpenID Connect (Google, GitHub, email).

## Caching Strategy
*   **Client Cache:** Stale-While-Revalidate (SWR) fetching strategy.
*   **Edge Cache:** Vercel Edge Middleware for localized routing.
*   **Server Cache:** Redis cluster for session states and rate limits.