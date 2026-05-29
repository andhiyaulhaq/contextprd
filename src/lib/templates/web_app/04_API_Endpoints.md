# Web App: API & Integration Spec

## Design Principles
*   All endpoints versioned under `/api/v1/`.
*   Authentication via `Authorization: Bearer <access_token>` header.
*   Errors follow RFC 7807: `{ type, title, status, detail }`.
*   Pagination: cursor-based `?after=<cursor>&limit=<n>` (max 100). Response includes `nextCursor`.

## Auth Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account. Payload: `{ email, password, name }` |
| POST | `/api/v1/auth/login` | Returns `{ accessToken, refreshToken, expiresIn }` |
| POST | `/api/v1/auth/refresh` | Exchange refresh token → new access token |
| DELETE | `/api/v1/auth/logout` | Invalidates refresh token server-side |
| POST | `/api/v1/auth/forgot-password` | Sends reset email |
| POST | `/api/v1/auth/reset-password` | Validates token, sets new password |

## Workspace Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/workspaces` | List user's workspaces (cursor-paginated) |
| POST | `/api/v1/workspaces` | Create workspace. Payload: `{ name, settings? }` |
| GET | `/api/v1/workspaces/:id` | Fetch workspace detail + member list |
| PATCH | `/api/v1/workspaces/:id` | Update name or settings |
| DELETE | `/api/v1/workspaces/:id` | Soft-delete. Hard-delete after 30-day grace period |
| POST | `/api/v1/workspaces/:id/members` | Invite member by email. Payload: `{ email, role }` |
| DELETE | `/api/v1/workspaces/:id/members/:userId` | Remove member |

## Document Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/workspaces/:id/documents` | List documents (cursor-paginated) |
| POST | `/api/v1/workspaces/:id/documents` | Create document. Payload: `{ title, content? }` |
| GET | `/api/v1/documents/:id` | Fetch document with latest content |
| PATCH | `/api/v1/documents/:id` | Update content (auto-snapshots version) |
| DELETE | `/api/v1/documents/:id` | Soft-delete document |
| GET | `/api/v1/documents/:id/versions` | List version history |
| POST | `/api/v1/documents/:id/versions/:vId/restore` | Restore a prior version as new HEAD |

## Rate Limits
| Tier | Requests/min | Notes |
|---|---|---|
| Unauthenticated | 20 | IP-based |
| Free (authenticated) | 100 | User-based |
| Pro (authenticated) | 1000 | User-based |

## Webhooks (v1.1)
*   Outbound events: `workspace.created`, `document.updated`, `member.added`.
*   Signed with `X-Signature-256: sha256=<hmac>` using the workspace's webhook secret.
*   Retry policy: 3 attempts with exponential backoff (30s, 5min, 30min).