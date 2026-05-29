# B2B SaaS: Compliance & Security

## Authentication & Access Control
*   **SSO/SAML 2.0:** Available on Enterprise plan via `passport-saml`. Supports Okta, Azure AD, Google Workspace.
*   **SCIM 2.0:** Automated user provisioning/deprovisioning from IdP. Endpoints: `/api/scim/v2/Users`, `/api/scim/v2/Groups`.
*   **MFA:** TOTP-based MFA enforced org-wide by Admin toggle. Backup codes generated on setup.
*   **Session Timeout:** Configurable per org: 1h / 8h / 24h / 30 days. Admin-enforced maximum.
*   **IP Allowlist:** Enterprise feature. Requests from IPs outside allowlist return 403.

## Data Compliance Targets

### SOC 2 Type II
*   Access logs retained ≥ 1 year. Reviewed quarterly.
*   Password policies enforced: min 10 chars, complexity, no reuse of last 5.
*   Security patches applied within 30 days of disclosure (7 days for CRITICAL CVEs).
*   Annual penetration test by third-party vendor. Report provided to Enterprise customers on request.

### GDPR (EU)
*   **Data Subject Rights:** Users can export all their data (JSON zip) and request deletion via Settings → Account → Privacy.
*   **Data Deletion:** On account deletion, all PII removed within 30 days. Anonymized records (audit logs) retained per legal obligation.
*   **DPA:** Data Processing Agreement available for Enterprise customers. EU Standard Contractual Clauses (SCCs) included.
*   **EU Data Residency:** Enterprise tenants can elect EU-only data storage (AWS eu-west-1).

### HIPAA (Optional Add-on)
*   Business Associate Agreement (BAA) available for Enterprise healthcare customers.
*   PHI fields encrypted at field-level using AWS KMS in addition to at-rest encryption.

## Security Controls
| Control | Implementation |
|---|---|
| Encryption at rest | AES-256 via AWS RDS encryption |
| Encryption in transit | TLS 1.3 minimum. HSTS preloaded |
| Secrets management | AWS Secrets Manager — no secrets in env vars |
| Dependency scanning | Dependabot + Snyk on every PR |
| SAST | CodeQL on every PR (GitHub Advanced Security) |
| WAF | AWS WAF with OWASP Core Rule Set |
| DDoS protection | AWS Shield Standard |
| Vulnerability disclosure | security@yourapp.com, 90-day responsible disclosure |