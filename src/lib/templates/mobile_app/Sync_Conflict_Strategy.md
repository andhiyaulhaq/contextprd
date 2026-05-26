# Mobile App: Sync Conflict Resolution

## Conflict Scenarios
1.  **Simultaneous Edit:** User edits a document on desktop and mobile offline.
2.  **Workspace Deleted:** Mobile updates deleted workspace files.

## Resolution Mechanics
*   We employ a Last-Write-Wins (LWW) conflict strategy based on system timestamps.
*   User will be prompted with a choice dialog in the UI if conflicts exceed 24 hours in age.