# Mobile App: Project Overview

## Core Objectives
*   **Mission:** Deliver a fast, offline-first mobile companion app for managing workspaces and editing PRDs on-the-go — with the same quality of experience as the desktop version.
*   **Platform Targets:** iOS 16.0+, Android 13.0+ (API level 33+).
*   **Success Metrics:**
    *   App crash-free rate > 99.9% (Firebase Crashlytics)
    *   Touch interaction lag < 100ms (60 FPS animations via Reanimated)
    *   App Store rating ≥ 4.5 stars
    *   Offline-to-online sync success rate > 99.5%

## Development Framework
*   **Tech Stack:** React Native (TypeScript), Expo SDK 51+, Expo Router (file-based navigation).
*   **Animation:** React Native Reanimated v3 (runs on UI thread — no JS bridge jank).
*   **Local Database:** WatermelonDB (LokiJS adapter for iOS, SQLite adapter for Android).
*   **Networking:** Axios + React Query. Offline queue via `react-native-queue`.

## Design Philosophy
*   **Mobile-Native Feel:** Platform-specific interactions (iOS swipe-back gesture, Android back button, haptic feedback).
*   **Offline-First Architecture:** All reads served from local DB. Writes queued and synced when online.
*   **Adaptive UI:** Dynamic Type on iOS, sp units on Android. Respects system dark/light mode.

## Constraints & Non-Goals
*   No desktop/tablet-optimized layout in v1 (phone form factor only).
*   No background file sync while app is terminated (iOS background fetch limitations).
*   No in-app AI chat in v1 — view and manage documents only.