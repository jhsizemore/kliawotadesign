# Odyssey contact form and UniverseEternal@kliawota.design

## What is implemented, and what is not activated

The website has a native, optional Cloudflare contact endpoint and an on-page form. It remains on the working email-app link until the server reports that sending and bot verification are configured. No visitor data is silently collected into an unmonitored store.

**The branded address has not been created by this code.** DNS, destination verification, account onboarding and Turnstile keys require Cloudflare account administration. GitHub deployment access is not equivalent to that administration access. Do not paste account API tokens or Turnstile secrets into chat or commit them to the repository.

Recommended flow:

`Visitor → on-page form → Turnstile verification → Cloudflare email binding → Hunter’s existing inbox`

Direct incoming mail:

`UniverseEternal@kliawota.design → Cloudflare Email Routing → Hunter’s verified inbox`

The address uses Hunter’s requested spelling, **UniverseEternal**. The display brand remains **Universes Eternal**.

## 1. Configure the incoming address safely

In Cloudflare **Compute → Email Service → Email Routing**, inspect the existing domain setup first. If another email provider currently handles `kliawota.design`, do not replace its MX records without migrating the existing mail service; create the alias there instead.

If Cloudflare is the intended mail router:

- Onboard the domain for Email Routing and review the DNS changes.
- Add and verify the destination inbox. The current site’s email action points to `jhsizemore@gmail.com`; confirm that this is still the intended destination before configuration.
- Add one routing rule: `UniverseEternal@kliawota.design` → that verified inbox.
- Test from a different sending account, not from the destination itself.

Routing forwards to an existing mailbox. It is not, by itself, a separate mailbox with folders or an outbound identity in your email app. Cloudflare also offers Email Sending and SMTP, but those are configured separately.

Official setup: https://developers.cloudflare.com/email-service/get-started/route-emails/
Routing rules: https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/
Sending / SMTP: https://developers.cloudflare.com/email-service/api/send-emails/smtp/

## 2. Verify the owner-notification destination

The form sends only to the owner inbox configured on the server, not to an address supplied by the visitor. Cloudflare documents free sending to verified destination addresses, including accounts using Email Routing only. Arbitrary-recipient outbound Email Sending has different plan requirements; it is not needed for this one-owner notification flow.

The sender domain must be onboarded to Email Service. Verify that account sending is available and the recipient is verified before enabling the website control.

Reference: https://developers.cloudflare.com/email-service/
Binding API: https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
Binding restrictions: https://developers.cloudflare.com/email-service/configuration/send-bindings/

## 3. Configure Turnstile

Create a managed Turnstile widget for `kliawota.design`. Keep the secret only in Cloudflare’s Worker secrets. The client requests the `odyssey-interest` action, and the server checks the returned hostname, action and success—not merely the presence of a token.

Reference: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

## 4. Activate this Worker integration

Add the email binding and non-secret variables to the deployment configuration only after domain/recipient verification. Keep existing assets, migrations and placement bindings intact. Replace the inbox placeholder before use.

```jsonc
{
  "send_email": [{
    "name": "ODYSSEY_EMAIL",
    "destination_address": "YOUR_VERIFIED_EXISTING_INBOX"
  }],
  "vars": {
    "ODYSSEY_CONTACT_ENABLED": "true",
    "ODYSSEY_CONTACT_FROM": "UniverseEternal@kliawota.design",
    "ODYSSEY_CONTACT_TO": "YOUR_VERIFIED_EXISTING_INBOX",
    "ODYSSEY_TURNSTILE_SITEKEY": "YOUR_PUBLIC_SITEKEY"
  }
}
```

Set `ODYSSEY_TURNSTILE_SECRET` using the Worker’s secret settings or `wrangler secret put ODYSSEY_TURNSTILE_SECRET`. No secret belongs in `wrangler.jsonc`.

After deployment, `GET /mtgtools/odyssey/api/contact` reports only `{ "enabled": true, "sitekey": "..." }`. It never returns the inbox address or secret. The on-page form then replaces the email-app action automatically. Leave `ODYSSEY_CONTACT_ENABLED` unset or false to disable it safely.

## 5. Test before announcing the address

Send one real test through the website and verify its receipt in the owner inbox. Reply-To should be the visitor’s address; the authenticated From is the project address. Check failed-verification and failed-send behavior, mobile layout, and the direct forwarding alias separately. An API acceptance is not proof of inbox delivery.

The automated tests use a simulated Cloudflare verification and email boundary. They do not activate the alias or send a real email.

## Data and consent

The form accepts an optional name, email, interest, optional note and explicit contact permission. It submits these to Hunter via Cloudflare; no message body is written to a public Sheet, site storage or server log. The destination inbox retains the message. It is an individual interest request, not an automatic newsletter subscription or permission for unrelated bulk email.

Payload sizes are bounded, recipient/sender are server-controlled, newline injection is rejected, Turnstile is verified server-side, and success is displayed only after the email service accepts the message. Errors retain the visitor’s form contents. The existing email-app link remains available if configuration or verification fails. Before a major launch, add an appropriate Cloudflare WAF rate limit to POST requests on this endpoint; it must not protect the public GET configuration route with an interactive challenge.
