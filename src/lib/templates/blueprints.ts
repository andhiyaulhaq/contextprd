import { DomainCategory, FileNode } from '../../types/workspace';

const TEMPLATES: Record<DomainCategory, Record<string, string>> = {
  WEB_APP: {
    '/Overview.md': `# Web App: Project Overview\n\n## Platform Requirements\n- Browser compatibility: Chrome, Firefox, Safari, Edge\n- Responsive design: mobile-first breakpoints at 768px, 1024px\n- Accessibility: WCAG 2.1 AA compliance\n\n## Tech Stack\n- Frontend: React, TypeScript\n- Backend: Node.js, PostgreSQL\n- Auth: OAuth 2.0 / JWT`,
    '/Auth_Flow.md': `# Authentication & Authorization\n\n## Session Management\n- JWT access tokens (15min expiry)\n- Refresh tokens (7 day expiry)\n- Secure HttpOnly cookies\n\n## OAuth Providers\n- Google\n- GitHub\n- Email/Password`,
    '/API_Endpoints.md': `# API Endpoints\n\n## RESTful Routes\n- \`GET /api/users\` - List users\n- \`POST /api/users\` - Create user\n- \`PUT /api/users/:id\` - Update user\n- \`DELETE /api/users/:id\` - Delete user`,
  },
  NATIVE_DESKTOP: {
    '/Overview.md': `# Desktop App: Project Overview\n\n## Platform Requirements\n- OS: Windows 10+, macOS 12+, Ubuntu 20.04+\n- Memory: < 200MB idle\n- Startup: < 2 seconds\n\n## Architecture\n- Electron/Tauri shell\n- IPC for main/renderer communication\n- Local SQLite for offline storage`,
    '/File_System.md': `# File System Access\n\n## Permissions\n- Read: Documents, Downloads, config directories\n- Write: App-specific data directory only\n- No arbitrary filesystem access\n\n## Caching Strategy\n- LRU cache with 50MB max\n- IndexedDB for structured data`,
    '/Performance.md': `# Performance Targets\n\n## Benchmarks\n- UI render: < 16ms per frame\n- File open: < 100ms\n- Search: < 200ms for 10k files\n\n## Memory Management\n- Virtualized lists for large datasets\n- Debounced file writes\n- Pooled worker threads`,
  },
  MOBILE_APP: {
    '/Overview.md': `# Mobile App: Project Overview\n\n## Platform Requirements\n- iOS 16+, Android 13+\n- Touch targets: minimum 44x44pt\n- Battery efficiency: < 5% per hour background\n- Offline-first architecture\n\n## App Store Compliance\n- Privacy manifest required\n- No background location without explicit consent`,
    '/Push_Notifications.md': `# Push Notifications\n\n## Deep Linking\n- Custom URL scheme: \`myapp://\`\n- Universal links (iOS) / App Links (Android)\n\n## Notification Types\n- Transactional: order updates, receipts\n- Promotional: weekly digests (opt-in)\n- Critical: security alerts (high priority)`,
    '/Cache_Flow.md': `# Caching Strategy\n\n## Offline Storage\n- Core data: SQLite via Room/CoreData\n- Images: Disk cache with 200MB cap\n- API responses: Stale-while-revalidate\n\n## Sync Strategy\n- Background fetch every 15 minutes\n- Push-to-sync for critical updates\n- Conflict resolution: last-write-wins with timestamp`,
  },
  GENERAL_SAAS: {
    '/Overview.md': `# SaaS: Project Overview\n\n## Architecture\n- Multi-tenant with data isolation\n- RBAC with role hierarchy\n- API rate limiting per tenant\n\n## Compliance\n- SOC 2 Type II\n- GDPR data residency\n- 99.9% uptime SLA`,
    '/Data_Model.md': `# Data Model\n\n## Core Entities\n- Organization (tenant root)\n- Workspace (logical grouping)\n- User (belongs to Organization)\n- Role (Admin, Editor, Viewer)\n\n## Data Residency\n- Primary: US-East (us-east-1)\n- EU: Frankfurt (eu-central-1) for GDPR\n- Data export: JSON/CSV within 48 hours`,
    '/Integration.md': `# API & Integrations\n\n## REST API\n- Versioned: \`/api/v1/\`, \`/api/v2/\`\n- Pagination: cursor-based\n- Rate limits: 1000 req/min per tenant\n\n## Webhooks\n- Retry: 3 attempts with exponential backoff\n- Payload signing: HMAC-SHA256\n- Events: resource.created, .updated, .deleted`,
  },
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
