# B2B SaaS: Integrations & Webhooks

## Developer API Specifications
*   API key generation UI inside user profiles.
*   All endpoints require bearer token authentication headers.
*   Versioned endpoints (/api/v1/) returning standardized JSON formats.

## Outbound Webhooks
*   Post payloads on workspace actions (workspace.created, document.updated).
*   HMAC-SHA256 headers generated to sign webhook payloads for verified client consumption.