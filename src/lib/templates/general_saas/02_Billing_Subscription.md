# B2B SaaS: Billing & Subscription

## Pricing & Plans

| Feature | Free | Pro ($19/mo) | Enterprise (custom) |
|---|---|---|---|
| Seats | 1 | Up to 10 | Unlimited |
| Workspaces | 3 | Unlimited | Unlimited |
| Storage | 100MB | 10GB | Custom |
| Version History | 7 days | 90 days | Unlimited |
| AI Features | ❌ | ✅ | ✅ |
| SSO / SAML | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | 30 days | Unlimited |
| SLA Guarantee | None | 99.9% | 99.95% |
| Support | Community | Email (48h) | Dedicated CSM |

## Stripe Integration

### Provisioning Flow
1.  User selects plan on pricing page → Redirected to Stripe Checkout (hosted page).
2.  Stripe webhook `checkout.session.completed` → API verifies signature → Updates `tenants.plan` in DB → Sends welcome email.
3.  Monthly renewal: Stripe `invoice.payment_succeeded` → No action needed (plan stays active).
4.  Payment failure: Stripe `invoice.payment_failed` → Email sent → 3-day grace period → Downgrade to Free on day 4.
5.  Cancellation: Stripe `customer.subscription.deleted` → Plan set to Free at period end date.

### Stripe Webhook Events Handled
*   `checkout.session.completed` — New subscription activated
*   `invoice.payment_succeeded` — Renewal confirmed
*   `invoice.payment_failed` — Payment failure flow initiated
*   `customer.subscription.updated` — Plan change (upgrade/downgrade)
*   `customer.subscription.deleted` — Cancellation processed

### Customer Billing Portal
*   Stripe Customer Portal link embedded in Settings → Billing.
*   Users can: view invoices, download receipts, update payment method, cancel subscription.
*   Custom portal configuration: cancel flow disabled (redirects to cancellation survey first).

## Seat Management
*   **Seat Count:** Billed seats = active Members + Admins (Viewers are free seats on Pro+).
*   **Overage:** If team exceeds seat limit, Admin is prompted to upgrade — new members cannot be invited until upgraded or a seat is freed.
*   **Annual Billing:** 20% discount. Seats locked for billing period; can add seats mid-period (prorated).

## Tax & Compliance
*   Stripe Tax handles automatic tax calculation for EU VAT, US Sales Tax, and Australian GST.
*   Invoices include VAT/GST number field for B2B customers who provide their tax ID.