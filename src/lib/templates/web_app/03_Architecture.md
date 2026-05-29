# Web App: Architecture Blueprint

## Technology Stack
| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript | SSR + static export, type safety |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, accessible component primitives |
| State | Zustand (client) + React Query v5 (server) | Separation of UI state and server cache |
| Database | PostgreSQL 16 (primary), Redis 7 (cache/queue) | ACID compliance + high-throughput ephemeral data |
| Auth | NextAuth.js v5 (JWT + OAuth) | Built-in provider support, edge-compatible session handling |
| File Storage | AWS S3 + CloudFront CDN | Scalable object storage with global edge delivery |
| API | REST (v1) — GraphQL considered for v2 | Simpler HTTP caching, broad client compatibility |

## System Architecture Diagram
```
Browser → CloudFront CDN → Next.js App (Vercel)
                                  ↓
                       API Routes / Route Handlers
                          ↙               ↘
               PostgreSQL 16          Redis 7
             (persistent data)    (sessions, cache, queues)
                                          ↓
                                  S3 (file/media storage)
```

## Caching Strategy
*   **Client:** React Query stale-while-revalidate. TTL: 60s for lists, 5min for detail views.
*   **Edge:** Vercel Edge Cache for static assets and public GET responses. `Cache-Control: s-maxage=3600, stale-while-revalidate=86400`.
*   **Server:** Redis for session tokens, rate-limit counters, and hot DB query results (TTL: 5min).
*   **Database:** PostgreSQL connection pooling via PgBouncer (pool_mode=transaction, pool_size=20).

## Core Data Model
```sql
users           — id, email, name, avatar_url, role, hashed_password, created_at
workspaces      — id, owner_id, name, settings JSONB, created_at
workspace_members — workspace_id, user_id, role, joined_at
documents       — id, workspace_id, title, content TEXT, version INT, updated_at, updated_by
document_versions — id, document_id, content_snapshot, created_by, created_at
api_keys        — id, user_id, key_hash, scopes TEXT[], last_used_at, revoked_at
```

## Error Handling
*   All API errors follow RFC 7807 Problem Details: `{ type, title, status, detail, instance }`.
*   Unhandled exceptions caught by global error boundary — logged to Sentry + user sees friendly error page.
*   Database query errors retried up to 3 times with exponential backoff before surfacing to caller.