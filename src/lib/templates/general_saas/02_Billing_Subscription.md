# B2B SaaS: Billing & Subscription Specs

## Stripe Billing Strategy
*   **Pricing Tiers:** Free, Pro (/mo), Enterprise (/user/mo).
*   **Provisioning Flow:** Stripe Webhook -> Parse Event -> Update Tenant License in Database -> Active/Block Workspace capabilities.

## Customer Billing Portal
*   Integrate Stripe Customer Portal link inside settings UI.
*   Allow users to download invoices, upgrade tiers, and add billing info.