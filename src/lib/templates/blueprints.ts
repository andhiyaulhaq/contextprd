import { DomainCategory, FileNode } from '../../types/workspace';

const TEMPLATES: Record<DomainCategory, Record<string, string>> = {
  WEB_APP: {
    '/Overview.md': `# Web App: Project Overview

## Product Vision & Goals
*   **Mission:** Build a high-performance, web-based application delivering responsive desktop-grade functionality.
*   **Target Audience:** General web users accessing via standard desktop and mobile browsers.
*   **Success Metrics:** Page load speed < 1.5s, User Retention rate > 40%, System Uptime > 99.9%.

## Platform Requirements
*   **Browser Compatibility:** Chrome (last 3 versions), Firefox, Safari (last 2 versions), Edge.
*   **Responsive Breakpoints:** Mobile-first media queries:
    *   Mobile: \`< 768px\`
    *   Tablet: \`768px - 1024px\`
    *   Desktop: \`> 1024px\`
*   **Accessibility Standards:** Conform to WCAG 2.1 Level AA requirements.`,

    '/Features.md': `# Web App: Product Features & Requirements

## Core Functional Specs
### 1. User Dashboard
*   **Objective:** Provide a centralized view of user data, notifications, and active sessions.
*   **Features:** Drag-and-drop widgets, customizable search filters, export data button.
*   **Permissions:** Viewable by logged-in users only.

### 2. File Explorer & Editor
*   **Objective:** Enable inline file organization and editing directly in-browser.
*   **Features:** Create, rename, delete files. File tree visualization on sidebar.
*   **Autosave:** Trigger every 300ms of inactivity.

## User Persona Profiles
*   **Product Managers:** Need macro-level project dashboards and export tools.
*   **Developers:** Require fast UI response times, inline markdown editors, and clear API metrics.`,

    '/Architecture.md': `# Web App: Architecture Blueprint

## Technology Stack
*   **Frontend Framework:** Next.js (React 18), Tailwind CSS, TypeScript.
*   **State Management:** Zustand with custom middleware.
*   **Database:** PostgreSQL for primary storage, Redis for session caching.
*   **Authentication:** OAuth 2.0 / OpenID Connect (Google, GitHub, email).

## Caching Strategy
*   **Client Cache:** Stale-While-Revalidate (SWR) fetching strategy.
*   **Edge Cache:** Vercel Edge Middleware for localized routing.
*   **Server Cache:** Redis cluster for session states and rate limits.`,

    '/API_Endpoints.md': `# Web App: API & Integration Spec

## Endpoint Specifications (v1)
*   \`GET /api/v1/workspaces\`
    *   *Description:* Retrieves a list of active workspaces for the authenticated user.
    *   *Response (200):* \`{ workspaces: Workspace[] }\`
*   \`POST /api/v1/workspaces\`
    *   *Description:* Creates a new workspace under the user's account.
    *   *Payload:* \`{ name: string, category: string }\`
*   \`DELETE /api/v1/workspaces/:id\`
    *   *Description:* Destroys a workspace and its associated conversation log.

## Rate Limiting & Safety
*   Standard endpoints capped at 100 requests per minute per IP address.
*   Error payloads follow the RFC 7807 problem details specification.`,

    '/UI_UX_Specification.md': `# Web App: UI/UX Specification

## Design System Tokens
*   **Colors:**
    *   Primary: Indigo (\`#6366f1\`)
    *   Secondary: Violet (\`#8b5cf6\`)
    *   Neutral Background: Dark slate (\`#0f172a\`)
*   **Typography:** Inter (main body font), JetBrains Mono (monospace coding blocks).

## Key User Flows
1.  **Onboarding:** Login -> Select Template -> Initialize Workspace.
2.  **Document Drafting:** Select File -> Input Text -> Real-time preview updates on split-pane.`,

    '/Deployment_Ops.md': `# Web App: Deployment & Ops

## CI/CD Pipeline
*   **Trigger:** Merges into the \`main\` branch.
*   **Pipeline Steps:** Lint -> Format Verification -> Build Checks -> Integration Tests -> Vercel Deployment.

## Monitoring & Alerts
*   **Performance Tracking:** Vercel Analytics + Speed Insights.
*   **Error Logging:** Sentry SDK integration for client-side crash tracking.
*   **Backup Strategy:** Automated daily PostgreSQL backups stored securely on AWS S3 with 30-day retention.`
  },

  NATIVE_DESKTOP: {
    '/Overview.md': `# Desktop App: Project Overview

## Core Objectives
*   **Mission:** Build a high-performance native desktop tool that operates client-side with native filesystem access.
*   **Target OS Platform:** Windows 10/11, macOS Monterey+, Ubuntu 22.04 LTS+.
*   **Success Metrics:** Idle memory < 150MB, App cold startup time < 1.5 seconds.

## Architecture Paradigm
*   **Shell Engine:** Tauri (Rust backend, HTML/TS frontend).
*   **Storage Approach:** Local-first SQLite database.
*   **Process Isolation:** Main native process handles OS APIs; Renderer process runs sandbox UI.`,

    '/Features.md': `# Desktop App: Core Native Features

## File System Integration
*   **System Files:** Full read/write capability to designated workspace directories.
*   **Native Dialogs:** OS file pickers for choosing folder directories and opening archives.
*   **Watcher API:** Real-time hot-reloading when files are edited outside the application shell.

## Offline Mode Requirements
*   **Zero Network Sync:** Full functionality when disconnected.
*   **Conflict Resolution:** Local file system modifications override remote states.
*   **Local Engine:** Inline AI parsing via local llama.cpp endpoints when offline.`,

    '/Architecture.md': `# Desktop App: Multi-Process Architecture

## Process Communication (IPC)
*   Frontend triggers Rust bindings using secure commands: \`invoke('create_file', { path: string })\`.
*   Rust main process listens, executes system actions, and returns strongly-typed results.

## Data Schema & Local DB
*   **Engine:** SQLite (via sqlx in Rust).
*   **Migrations:** Embedded SQL scripts executed automatically on startup.
*   **Tables:** Workspaces, FileIndex, LocalConfig, ChatHistory.`,

    '/System_Integration.md': `# Desktop App: OS Integration Spec

## Menu & Tray Features
*   **Native Menus:** Custom system file menus (File, Edit, View, AI Assistant).
*   **System Tray:** Background polling options, quick-scratchpad menu, and application restore button.

## File Associations
*   Automatically register app as default handler for \`.cprd\` and \`.md\` extensions.
*   Support drag-and-drop file operations directly onto the active app workspace.`,

    '/Performance_Metrics.md': `# Desktop App: Performance Targets

## Benchmarks
*   **Frame Render Budget:** < 16.6ms (solid 60 FPS) under heavy layouts.
*   **File Read/Load:** < 100ms for loading files larger than 10MB.
*   **Local Search Indexing:** < 500ms for indexing 15,000 document files.

## Memory Optimization
*   Avoid memory leaks by terminating unused background webview instances.
*   Employ virtual list rendering for sidebar trees and active text views.`,

    '/Security_Compliance.md': `# Desktop App: Security & Code Signing

## Application Notarization
*   **macOS:** Automated notarization using Apple Developer tools during pipeline build.
*   **Windows:** EV Code Signing certificate signature to prevent Windows SmartScreen alerts.

## Sandboxing
*   Restrict IPC commands to prevent arbitrary execution of shell files.
*   Disable native developer tools in production releases.
*   Encrypt application configuration files at rest.`
  },

  MOBILE_APP: {
    '/Overview.md': `# Mobile App: Project Overview

## Core Objectives
*   **Mission:** Deliver an offline-first companion mobile app designed for editing PRDs and managing workspaces on-the-go.
*   **Platform Targets:** iOS 16.0+, Android 13.0+.
*   **Success Metrics:** App crash-free rate > 99.9%, Touch interaction lag < 100ms.

## Development Framework
*   **Tech Stack:** React Native (TypeScript), Expo SDK, Reanimated.
*   **Local Store:** WatermelonDB / SQLite.`,

    '/Features.md': `# Mobile App: Native Mobile Features

## Mobile Touch & Layout
*   **Touch Targets:** Minimum 48x48dp for all buttons and interactive items.
*   **Gestures:** Swipe left to delete conversation, pull-to-refresh folder structure.
*   **Biometrics:** Optional Face ID / Fingerprint scanner login validation.

## Mobile Offline Capability
*   Cache all workspace data locally.
*   Queue offline mutations (renaming, deleting) and play them back sequentially when connectivity returns.`,

    '/Architecture.md': `# Mobile App: Architecture & Sync

## Synchronization Architecture
*   Client maintains dynamic sync status (Syncing, Up-to-date, Offline, Sync Error).
*   API payload structures match JSON-patches to reduce mobile bandwidth payload sizes.

## Data Persistence
*   Structured data saved to SQLite.
*   Large markdown files saved to local sandboxed app document directory.
*   OAuth tokens stored securely via iOS Keychain / Android Keystore.`,

    '/Push_Notifications.md': `# Mobile App: Push Notifications & Deep Linking

## Notification Pipelines
*   **Apple APNS:** Configure certificates for production distribution.
*   **Google FCM:** Configure JSON file in project root.
*   **Trigger Events:** Background document updates, team comment mentions, sync warnings.

## Deep Linking Configuration
*   **Custom Scheme:** \`contextprd://\`
*   **Universal Links:** \`https://app.contextprd.com/workspace/*\` to bypass web page routes.`,

    '/Sync_Conflict_Strategy.md': `# Mobile App: Sync Conflict Resolution

## Conflict Scenarios
1.  **Simultaneous Edit:** User edits a document on desktop and mobile offline.
2.  **Workspace Deleted:** Mobile updates deleted workspace files.

## Resolution Mechanics
*   We employ a Last-Write-Wins (LWW) conflict strategy based on system timestamps.
*   User will be prompted with a choice dialog in the UI if conflicts exceed 24 hours in age.`,

    '/App_Store_Compliance.md': `# Mobile App: App Store Compliance

## Apple Review Guardrails
*   Must provide standard sign-in credentials for Apple Reviewers.
*   Privacy Manifest must declare use of local document directories.
*   Explicit App Tracking Transparency (ATT) prompt implementation if tracking analytics.

## Google Play Guardrails
*   Target SDK level maintained at the latest requirements (API 34+).
*   Explicit permissions request model for runtime Push Notifications.`
  },

  GENERAL_SAAS: {
    '/Overview.md': `# B2B SaaS: Project Overview

## Core Value Proposition
*   **Mission:** Scale workspaces into collaborative multi-tenant team portals.
*   **Key Users:** Enterprise Product Teams, Remote Startups, Software Development Agencies.
*   **Success Metrics:** Active Tenant growth, Net Revenue Retention (NRR) > 115%.

## Multi-Tenancy Architecture
*   Logical data separation within a single unified database.
*   Strict Role-Based Access Control (RBAC) layers (Admin, Member, Viewer).`,

    '/Billing_Subscription.md': `# B2B SaaS: Billing & Subscription Specs

## Stripe Billing Strategy
*   **Pricing Tiers:** Free, Pro ($15/mo), Enterprise ($49/user/mo).
*   **Provisioning Flow:** Stripe Webhook -> Parse Event -> Update Tenant License in Database -> Active/Block Workspace capabilities.

## Customer Billing Portal
*   Integrate Stripe Customer Portal link inside settings UI.
*   Allow users to download invoices, upgrade tiers, and add billing info.`,

    '/Data_Model.md': `# B2B SaaS: Data Schema & Isolation

## Core PostgreSQL Schema
*   **Tenants:** \`id, name, plan, status, stripe_customer_id, created_at\`
*   **Workspaces:** \`id, tenant_id, name, profile, file_tree, created_at\`
*   **Users:** \`id, tenant_id, email, password_hash, role, created_at\`

## Tenant Isolation Guardrails
*   Utilize PostgreSQL Row-Level Security (RLS) policies on all tenant tables.
*   Database connection pooling configured with separate schemas for Enterprise tier.`,

    '/Integration_API.md': `# B2B SaaS: Integrations & Webhooks

## Developer API Specifications
*   API key generation UI inside user profiles.
*   All endpoints require bearer token authentication headers.
*   Versioned endpoints (\`/api/v1/\`) returning standardized JSON formats.

## Outbound Webhooks
*   Post payloads on workspace actions (\`workspace.created\`, \`document.updated\`).
*   HMAC-SHA256 headers generated to sign webhook payloads for verified client consumption.`,

    '/Security_Compliance.md': `# B2B SaaS: Compliance & Security Guardrails

## Data Compliance Targets
*   **SOC 2 Type II:** Keep access logs, enforce password policies, maintain patch schedules.
*   **GDPR:** Support user data deletion requests, local data hosting options (EU server cluster).

## Security Audits
*   Encrypt all database storage at rest using AES-256.
*   Run weekly automated package vulnerability scans in CI/CD pipeline.`,

    '/SLA_Infrastructure.md': `# B2B SaaS: SLA & Cloud Infrastructure

## High Availability Setup
*   Multiple application instances balanced with AWS ALB.
*   Auto-scaling groups triggered when CPU exceeds 70%.
*   99.9% uptime SLA commitments for Enterprise customer levels.

## Disaster Recovery
*   Continuous database replication with RDS Multi-AZ.
*   Point-in-Time Recovery (PITR) backups with a 15-minute granularity target.`
  }
};

export function getBlueprint(category: DomainCategory): Record<string, string> {
  return TEMPLATES[category];
}

export function blueprintToFileTree(category: DomainCategory): FileNode[] {
  const blueprint = TEMPLATES[category];
  return Object.entries(blueprint).map(([path, content]) => {
    const name = path.split('/').filter(Boolean).pop() || path;
    return {
      id: `template-${category.toLowerCase()}-${name.replace(/\s+/g, '-').toLowerCase()}`,
      name,
      path,
      content,
      type: 'markdown',
    };
  });
}
