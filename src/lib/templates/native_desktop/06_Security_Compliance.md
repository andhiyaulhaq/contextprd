# Desktop App: Security & Code Signing

## IPC Security Model
*   **Allowlist:** All Tauri commands explicitly declared in `capabilities/default.json`. No wildcard permissions.
*   **Path Traversal Prevention:** All file paths validated against the user's designated workspace root before any FS operation.
*   **No Shell Execution:** `shell` plugin disabled entirely. No `exec()`, `spawn()`, or `eval()` in the renderer.
*   **Content Security Policy:** `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://openrouter.ai https://api.yourbackend.com`.

## Code Signing

### macOS
*   **Developer ID:** Signed with Apple Developer ID Application certificate.
*   **Notarization:** Submitted to Apple Notary Service via `xcrun notarytool` in CI. Notarization ticket stapled to the `.dmg`.
*   **Hardened Runtime:** Enabled. Entitlements: `com.apple.security.files.user-selected.read-write`.

### Windows
*   **EV Code Signing:** Signed with Extended Validation certificate to bypass Windows SmartScreen.
*   **Authenticode:** Applied to `.exe` installer and the main `.exe` binary.
*   **CI:** Signing done in GitHub Actions using certificate stored as encrypted secret.

### Linux
*   **GPG Signing:** `.deb` and `.AppImage` packages signed with project GPG key. Public key published at `https://yourapp.com/gpg`.

## Data Security
*   **Config Encryption:** Sensitive config values (API keys, tokens) stored via OS keychain (Windows Credential Manager, macOS Keychain, libsecret on Linux) — never in plain SQLite.
*   **Database:** SQLite database file not encrypted by default (no PII stored). SQLCipher available as opt-in for enterprise users.
*   **No Telemetry Without Consent:** Zero data sent before user explicitly opts in on first-launch dialog.

## Dependency Auditing
*   `cargo audit` runs on every CI build. Fails on any `RUSTSEC` advisory rated HIGH or CRITICAL.
*   `pnpm audit` runs on every CI build. Fails on HIGH or CRITICAL npm advisories.
*   Dependency update PRs generated weekly via Renovate Bot.