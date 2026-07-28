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

## 2. SQLite and Vercel

This is where most people get caught, so it gets its own section.

Vercel's serverless functions have an **ephemeral filesystem** and every
invocation runs isolated. A classic `better-sqlite3` + `data.db` setup cannot
write in production, and reads are unreliable too.

This project uses **libSQL**. libSQL *is* SQLite, but it can also speak HTTP:

| Environment | `TURSO_DATABASE_URL` | What happens |
| --- | --- | --- |
| Local | `file:local.db` | A plain SQLite file on disk |
| Vercel | `libsql://….turso.io` | Remote SQLite, persistent |

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

4. **Project settings → Service accounts → Generate new private key** → take
   three fields out of the downloaded JSON:

```
FIREBASE_PROJECT_ID     ← project_id
FIREBASE_CLIENT_EMAIL   ← client_email
FIREBASE_PRIVATE_KEY    ← private_key   (quoted, with \n escapes)
```

5. Add your Vercel domains under **Authentication → Settings → Authorized
   domains**. Preview URLs change on every deployment, so you need the
   `*.vercel.app` pattern too, otherwise Google sign-in breaks on previews.

The server verifies the `Authorization: Bearer <ID token>` header with
`firebase-admin`. The cart endpoints are genuinely protected; the client is
never trusted.

### Metrics

Two Firebase measurement products are wired in, both loaded lazily in the
browser and both written so they can never take the page down.

| Product | Needs | Status |
| --- | --- | --- |
| **Performance Monitoring** | Firebase config only | Active immediately |
| **Analytics (GA4)** | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No-ops until set |

Performance Monitoring reports page load, render and network timings with no
extra work. Analytics needs a measurement id, which only exists once you enable
Google Analytics for the web app: **Firebase console → Project settings →
Integrations → Google Analytics → Enable**, then re-copy the web app config and
paste the `G-XXXXXXXXXX` value into `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`.

The following standard GA4 ecommerce events are already emitted:

| Event | Fires when |
| --- | --- |
| `view_item` | A product detail page mounts |
| `add_to_cart` | An add to cart call succeeds |
| `view_cart` | The cart page renders with items |

`lib/metrics.ts` holds the helpers. Every call is wrapped so a blocked SDK, an
ad blocker or an unsupported browser degrades to a silent no-op rather than an
error.

---

## 4. Deploying to Vercel

1. Push to GitHub, then **Import Project** in Vercel
2. Add the environment variables for **both** Preview and Production:
   `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, the six `NEXT_PUBLIC_FIREBASE_*`
   (plus `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` if you have one), and the three
   `FIREBASE_*`
3. Deploy

Framework detection is automatic; no extra configuration is needed.

**For IronBee:** Project Settings → Deployment Protection → *Protection Bypass
for Automation* → **Create**, label it `IronBee`. Previews are protected by
default, so without this secret every verification run gets a 403.

---

## 5. Using this as a verification target

### Fault injection

Set `FAULT_INJECT` **on the preview environment only** and redeploy. Leave it
empty in production. Each value produces a real defect, which is how you prove
a verifier catches it rather than assuming.

| Value | What breaks | What should catch it |
| --- | --- | --- |
| `slow` | `/api/products` stalls 6 seconds | Budget / timeout checks |
| `contract` | `price` returns a string, not a number | Contract validation |
| `error` | `/api/products/[slug]` returns 500 | Route health |
| `empty` | Product list comes back empty | Silent regression |
| `stock` | Stock returns negative | Business logic |

`empty` is the nasty one: the page returns 200, nothing errors, there are just
no products. A check that only looks at status codes will miss it entirely.

### Test hooks

Bind end-to-end tests to these `data-testid` values rather than to DOM
structure:

| Where | testid |
| --- | --- |
| Product card | `product-card`, `price` |
| Product detail | `product-name`, `product-price`, `add-to-cart`, `qty` |
| Listing | `result-count`, `sort`, `filters`, `apply-price`, `empty-state` |
| Category tile | `category-tile` |
| Cart | `cart-line`, `cart-count`, `subtotal`, `total` |
| Forms | `contact-submit`, `contact-success`, `submit-login` |

### Edge-case row

The seed deliberately includes one hostile record: *"Limited Run Hand-Hammered
Copper-Plated Gooseneck Kettle (Numbered Series)"* — very long name, no image,
zero stock, low rating, highest price. Cards and the detail page have to carry
all of that without breaking. This is the row a visual regression test should
watch.

---

## 6. API contract

Everything is JSON and `no-store`.

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/api/health` | GET | — | `status`, `database`, `latencyMs`, `commit`, `environment` |
| `/api/products` | GET | — | Filtering, sorting, pagination, `facets` |
| `/api/products/[slug]` | GET | — | `product` + `related`, 404 when missing |
| `/api/categories` | GET | — | With product counts |
| `/api/cart` | GET · POST · DELETE | **Bearer** | Scoped to the Firebase UID |
| `/api/contact` | POST | — | 422 returns per-field errors |

`/api/products` query parameters: `category`, `brand`, `q`, `minPrice`,
`maxPrice` (cents), `inStock`, `sort` (`newest` · `price_asc` · `price_desc` ·
`rating`), `page`, `perPage` (1–48, default 12).

Error bodies always take the same shape:

```json
{ "error": { "code": "invalid_range", "message": "…" } }
```

**Prices are integer cents** so there is no floating-point rounding drift.
`14900` = $149.

---

## 7. Project layout

```
app/
  page.tsx                    home · hero, categories, featured
  products/page.tsx           listing · filters, sorting, pagination
  products/[slug]/page.tsx    detail · add to cart, related products
  cart/page.tsx               cart · quantities, removal, summary
  contact/page.tsx            contact form
  login/page.tsx              sign in, sign up, Google
  api/…                       six endpoints
components/                   providers and interface pieces
lib/
  metrics.ts                  Analytics + Performance, lazily loaded
  db.ts                       libSQL client
  queries.ts                  all SQL, in one place
  types.ts                    the contracts
  firebase-admin.ts           ID token verification
  faults.ts                   fault injection
db/
  schema.sql · migrate.ts · seed.ts
```

Scripts: `npm run dev` · `build` · `typecheck` · `db:migrate` · `db:seed` ·
`db:reset`.
