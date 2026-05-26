# Desktop App: Security & Code Signing

## Application Notarization
*   **macOS:** Automated notarization using Apple Developer tools during pipeline build.
*   **Windows:** EV Code Signing certificate signature to prevent Windows SmartScreen alerts.

## Sandboxing
*   Restrict IPC commands to prevent arbitrary execution of shell files.
*   Disable native developer tools in production releases.
*   Encrypt application configuration files at rest.