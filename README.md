# Tare Storefront

An end-to-end sample coffee-equipment store. It was written to be a
**deliberately verifiable target**: typed API contracts, an auth-protected
surface, a wide filter matrix, edge-case seed data, and optional fault
injection so you can prove a verifier actually catches things.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · libSQL/SQLite ·
Firebase Auth · hand-written CSS (no build step for styles).

---

## 1. Quick start

```bash
npm install
cp .env.example .env.local     # at minimum TURSO_DATABASE_URL=file:local.db
npm run db:reset               # schema + 5 categories, 15 products
npm run dev                    # http://localhost:3000
```

The store works fully without Firebase credentials. Only sign-in and the cart
are disabled, and the interface says so plainly.

---



## 2. SQLite and Vercel - Turbo

This is where most people get caught, so it gets its own section.

Vercel's serverless functions have an **ephemeral filesystem** and every
invocation runs isolated. A classic `better-sqlite3` + `data.db` setup cannot
write in production, and reads are unreliable too.

This project uses **libSQL**. libSQL *is* SQLite, but it can also speak HTTP:


| Environment | `TURSO_DATABASE_URL`  | What happens                |
| ----------- | --------------------- | --------------------------- |
| Local       | `file:local.db`       | A plain SQLite file on disk |
| Vercel      | `libsql://….turso.io` | Remote SQLite, persistent   |


The SQL dialect is identical, so there is no branching anywhere in the code.

### Turso setup (for Vercel)

```bash
curl -sSfL https://tur.so/install.sh | bash
turso auth signup
turso db create tare
turso db show tare --url          # → TURSO_DATABASE_URL
turso db tokens create tare       # → TURSO_AUTH_TOKEN
```

Then push the schema and data to the remote database:

```bash
TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" npm run db:reset
```

---



## 3. Firebase setup

1. [console.firebase.google.com](https://console.firebase.google.com) → new project
2. **Authentication → Sign-in method** → enable *Email/Password* and *Google*
3. **Project settings → General → Your apps → Web** → copy the config values:

All six client fields are used, so copy them all:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

> These values are **public by design**. Firebase web API keys ship in the
> client bundle and are not secrets. Access is controlled by Firebase Security
> Rules, Authentication authorized domains, and API key restrictions in the
> Google Cloud console, not by hiding the key.

1. **Project settings → Service accounts → Generate new private key** → take
  three fields out of the downloaded JSON:

```
FIREBASE_PROJECT_ID     ← project_id
FIREBASE_CLIENT_EMAIL   ← client_email
FIREBASE_PRIVATE_KEY    ← private_key   (quoted, with \n escapes)
```

1. Add your Vercel domains under **Authentication → Settings → Authorized
  domains**. Preview URLs change on every deployment, so you need the
   `*.vercel.app` pattern too, otherwise Google sign-in breaks on previews.

The server verifies the `Authorization: Bearer <ID token>` header with
`firebase-admin`. The cart endpoints are genuinely protected; the client is
never trusted.

### Metrics

Two Firebase measurement products are wired in, both loaded lazily in the
browser and both written so they can never take the page down.


| Product                    | Needs                                 | Status             |
| -------------------------- | ------------------------------------- | ------------------ |
| **Performance Monitoring** | Firebase config only                  | Active immediately |
| **Analytics (GA4)**        | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No-ops until set   |


Performance Monitoring reports page load, render and network timings with no
extra work. Analytics needs a measurement id, which only exists once you enable
Google Analytics for the web app: **Firebase console → Project settings →
Integrations → Google Analytics → Enable**, then re-copy the web app config and
paste the `G-XXXXXXXXXX` value into `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`.

The following standard GA4 ecommerce events are already emitted:


| Event         | Fires when                       |
| ------------- | -------------------------------- |
| `view_item`   | A product detail page mounts     |
| `add_to_cart` | An add to cart call succeeds     |
| `view_cart`   | The cart page renders with items |


`lib/metrics.ts` holds the helpers. Every call is wrapped so a blocked SDK, an
ad blocker or an unsupported browser degrades to a silent no-op rather than an
error.

---



## 4. Checkout and payments

Stripe, in **test mode only**. An `sk_live_` key is rejected in
`lib/stripe.ts`; this store never takes real money.

```bash
STRIPE_SECRET_KEY=sk_test_…      # Stripe dashboard → Developers → API keys
STRIPE_WEBHOOK_SECRET=whsec_…    # see below
```

Without those two the catalogue and cart still work; only the checkout route
answers `503 payments_not_configured`.

### The flow

1. `POST /api/checkout` reads the cart **from the database**, writes a
  `pending` order with a snapshot of every name and price, then opens a
   Stripe Checkout session and returns its URL.
2. Stripe collects the payment on its own hosted page.
3. `POST /api/webhooks/stripe` verifies the signature, marks the order `paid`,
  decrements stock and empties the cart.
4. `/checkout/success` polls `/api/orders?session_id=…` until the order turns
  `paid` — the buyer can arrive there before the webhook does.

Two rules the code takes seriously:

**No amount is ever read from the browser.** `/api/checkout` ignores the
request body entirely. If prices came from the client, anyone could order a
$149 grinder for one cent.

**Only the webhook confirms payment.** Landing on the success page proves
nothing; a user can type that URL. The order becomes `paid` in exactly one
place, behind a verified signature.

The `paid` transition is conditional on the row still being `pending`, so a
webhook Stripe delivers twice cannot decrement stock twice.

### Local webhooks

`localhost` is not reachable from Stripe, so forward the events:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

That command prints the `whsec_…` value for `STRIPE_WEBHOOK_SECRET`. It is
different from the one the Vercel endpoint uses.

Pay with `4242 4242 4242 4242`, any future expiry, any CVC.

### Webhooks on Vercel

Stripe dashboard → Developers → Webhooks → **Add endpoint**:

- URL: `https://<your-domain>/api/webhooks/stripe`
- Events: `checkout.session.completed` and `checkout.session.expired`

Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET` on Vercel.
Preview deployments sit behind Deployment Protection, so Stripe cannot reach
them unless the protection bypass is configured.

---



## 5. Deploying to Vercel

1. Push to GitHub, then **Import Project** in Vercel
2. Add the environment variables for **both** Preview and Production:
  `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, the six `NEXT_PUBLIC_FIREBASE_*`
   (plus `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` if you have one), the three
   `FIREBASE_*`, and `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
3. Deploy

Framework detection is automatic; no extra configuration is needed.

**For IronBee:** Project Settings → Deployment Protection → *Protection Bypass
for Automation* → **Create**, label it `IronBee`. Previews are protected by
default, so without this secret every verification run gets a 403.

---



## 6. Tracing (OpenTelemetry)

Spans leave over **OTLP / HTTP with protobuf encoding**. `instrumentation.ts`
in the project root is the whole setup; Next.js calls its `register()` once per
runtime.

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://collector.service.ironbee.dev
OTEL_EXPORTER_OTLP_HEADERS=X-API-Key=anonymous
OTEL_SERVICE_NAME=tare-storefront
OTEL_LOG_LEVEL=debug
```

Leave the endpoint empty and tracing is off entirely. The `/v1/traces` signal
path is appended for you — set the base URL, not the full path.

`OTEL_EXPORTER_OTLP_HEADERS` uses the standard `key=value,key2=value2` syntax,
so the auth header is configuration rather than code.

### Read this before trusting a green log line

`@vercel/otel`'s OTLP exporter calls its **success** callback for any fetch
that resolves — including `400`, `401` and `500`. Only a network-level failure
counts as an error. An exporter reporting success therefore proves the request
left the process, not that the collector accepted it.

The real status is visible at debug level only:

```
@vercel/otel/otlp: onSuccess 400
```

That is why `OTEL_LOG_LEVEL=debug` is recommended rather than optional. Without
it, a collector rejecting every span looks exactly like a healthy pipeline.

### Checking it from a browser

Spans travel server-to-server, so nothing about them ever appears in the
browser's network tab. `GET /api/otel` fills that gap:

```json
{
  "configured": true,
  "endpoint": "https://collector…/v1/traces",
  "authHeaders": ["X-API-Key"],
  "probe": { "status": 400, "reachable": true, "authAccepted": true }
}
```

The probe posts an empty body on purpose. A `401` means the credentials are
wrong; any other 4xx means the collector is reachable and the credentials were
accepted, and it merely objected to the empty payload. Header **names** are
reported, never their values.

This endpoint proves reachability, not delivery. Delivery is only visible in the runtime logs ---

### Why this exporter

The fetch-based exporter works in both the Node and edge runtimes and survives
Vercel's short-lived functions. The stock `@opentelemetry/exporter-trace-otlp-proto`
builds on Node's `http` module and can be frozen mid-flight when a serverless
function returns, losing the batch.

Spans are batched, so they leave a few seconds after the request they describe.
A server killed immediately after a request may exit before the batch flushes —
that is buffering, not a broken pipeline.

---



## 7. Using this as a verification target



### Fault injection

Set `FAULT_INJECT` **on the preview environment only** and redeploy. Leave it
empty in production. Each value produces a real defect, which is how you prove
a verifier catches it rather than assuming.


| Value      | What breaks                            | What should catch it    |
| ---------- | -------------------------------------- | ----------------------- |
| `slow`     | `/api/products` stalls 6 seconds       | Budget / timeout checks |
| `contract` | `price` returns a string, not a number | Contract validation     |
| `error`    | `/api/products/[slug]` returns 500     | Route health            |
| `empty`    | Product list comes back empty          | Silent regression       |
| `stock`    | Stock returns negative                 | Business logic          |


`empty` is the nasty one: the page returns 200, nothing errors, there are just
no products. A check that only looks at status codes will miss it entirely.

### Test hooks

Bind end-to-end tests to these `data-testid` values rather than to DOM
structure:


| Where          | testid                                                          |
| -------------- | --------------------------------------------------------------- |
| Product card   | `product-card`, `price`                                         |
| Product detail | `product-name`, `product-price`, `add-to-cart`, `qty`           |
| Listing        | `result-count`, `sort`, `filters`, `apply-price`, `empty-state` |
| Category tile  | `category-tile`                                                 |
| Cart           | `cart-line`, `cart-count`, `subtotal`, `total`                  |
| Forms          | `contact-submit`, `contact-success`, `submit-login`             |


