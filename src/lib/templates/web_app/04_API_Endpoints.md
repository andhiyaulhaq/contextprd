# Web App: API & Integration Spec

## Endpoint Specifications (v1)
*   GET /api/v1/workspaces
    *   *Description:* Retrieves a list of active workspaces for the authenticated user.
    *   *Response (200):* { workspaces: Workspace[] }
*   POST /api/v1/workspaces
    *   *Description:* Creates a new workspace under the user's account.
    *   *Payload:* { name: string, category: string }
*   DELETE /api/v1/workspaces/:id
    *   *Description:* Destroys a workspace and its associated conversation log.

## Rate Limiting & Safety
*   Standard endpoints capped at 100 requests per minute per IP address.
*   Error payloads follow the RFC 7807 problem details specification.