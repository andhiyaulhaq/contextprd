# Web App: Project Overview

## Product Vision & Goals
*   **Mission:** Build a high-performance, web-based SaaS application delivering responsive desktop-grade functionality accessible from any modern browser without installation.
*   **Target Audience:** Professional teams and individual power users who need a reliable, fast, and accessible tool on any device.
*   **Success Metrics:**
    *   Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
    *   User Retention (Day 30) > 40%
    *   System Uptime SLA > 99.9% (< 8.7 hours downtime/year)
    *   API error rate < 0.1% of all requests

## Platform Requirements
*   **Browser Compatibility:** Chrome 120+, Firefox 121+, Safari 17+, Edge 120+. No IE11 support.
*   **Responsive Breakpoints (Mobile-First):**
    *   xs — Mobile portrait: < 480px
    *   sm — Mobile landscape: 480px–767px
    *   md — Tablet: 768px–1023px
    *   lg — Desktop: 1024px–1439px
    *   xl — Wide desktop: ≥ 1440px
*   **Accessibility:** WCAG 2.1 Level AA. All interactive elements keyboard-navigable and screen-reader compatible (ARIA labels required).
*   **Internationalization:** UTF-8 encoding throughout. RTL layout support planned for v2.

## Constraints & Non-Goals
*   No native mobile app in v1 — responsive web + PWA only.
*   No offline-first requirement — stable internet connection assumed for core features.
*   No self-hosted deployment option in v1.