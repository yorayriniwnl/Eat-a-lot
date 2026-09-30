# YOR // Eat A Lot

> Full-stack food ordering storefront with a public menu, cart, WhatsApp checkout, and admin control surface.

| Surface / claim | State | Boundary |
|---|---|---|
| Public menu, cart, settings, and order submission | VERIFIED | Express routes and seeded SQLite are wired locally. |
| Admin panel and JWT auth | DEMO | Development may use explicit local defaults; production fails closed unless admin credentials and JWT secret are configured. |
| Seeded catalog and food imagery | REPORTED | Repository assets and database seed are the source of truth. |
| WhatsApp and Instagram handoff | EXPERIMENTAL | External destinations depend on configured environment values. |
| Vercel serverless entrypoint | UNVERIFIED | Hosted health and ephemeral SQLite behavior require deployment verification. |
| Durable production storage and operations | PLANNED | Move off temporary SQLite and complete security/observability hardening. |

The storefront and admin panel follow the YOR visual contract: `#000000` void,
`#050505` graphite, `#e84b4b` crimson, `#671515` deep crimson, `#ff8a7f` signal,
`#f5eaea` warm white, `#c4c4c4` muted text, and the
`#671515 → #8c1616 → #2a0505` field gradient. Run `npm run design:check` to guard both pages.

Eat A Lot is a full-stack food ordering site with a public storefront, a JWT-protected admin panel, WhatsApp checkout, and a seeded SQLite catalog.

## What is wired together

- Public site settings now drive the live brand, status, hours, address, WhatsApp links, and footer copy.
- Admin featured-item flags now power the homepage hero cards instead of living only in the admin/API layer.
- Admin menu management now uses the full admin menu dataset, so hidden items stay editable.
- Admin category management supports edit plus hide/show, and category counts include hidden items.
- Order submission is blocked when the restaurant is marked closed in settings.
- The app runs both locally and on Vercel through a shared Express app entry in `api/index.js`.

## Quick start

```bash
npm install
cp .env.example .env
npm start
```

Local URLs:

- Site: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

For local development only, the app falls back to `admin / admin` when admin environment variables are absent. Production does **not** use those defaults: set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a strong `JWT_SECRET` or admin authentication remains unavailable.

## Project structure

```text
eat-a-lot/
|-- api/
|   `-- index.js           # Shared Express app for local + serverless runtime
|-- db/
|   `-- database.js        # SQLite setup, schema, defaults, seed data
|-- middleware/
|   `-- auth.js            # JWT admin auth middleware
|-- public/
|   |-- index.html         # Public storefront
|   |-- admin.html         # Admin panel
|   `-- assets/catalog/    # Catalog photos + visual map
|-- routes/
|   |-- admin.js           # Admin auth, settings, categories, admin menu feed
|   |-- menu.js            # Public menu + admin item CRUD
|   |-- orders.js          # Order placement, order admin, stats
|   `-- settings.js        # Public-safe settings endpoint
|-- server.js              # Local HTTP server bootstrap
|-- vercel.json            # Vercel rewrite to serverless app entry
`-- .env.example
```

## API surface

### Public

- `GET /api/menu`
- `GET /api/menu/featured`
- `GET /api/menu/category/:slug`
- `GET /api/settings`
- `POST /api/orders`
- `GET /api/health`

### Admin

- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `GET /api/admin/menu-items`
- `POST /api/menu/items`
- `PUT /api/menu/items/:id`
- `DELETE /api/menu/items/:id`
- `PATCH /api/menu/items/:id/toggle`
- `GET /api/orders`
- `GET /api/orders/:ref`
- `PATCH /api/orders/:ref/status`
- `GET /api/orders/stats/summary`

## Environment variables

- `PORT` - local server port
- `JWT_SECRET` - JWT signing secret for admin auth; required in production
- `ADMIN_USERNAME` - admin username; required in production
- `ADMIN_PASSWORD` - admin password; required in production
- `WHATSAPP_NUMBER` - WhatsApp number without `+`
- `WHATSAPP_CATALOG_URL` - public WhatsApp catalog link
- `INSTAGRAM_URL` - Instagram profile URL

## Deployment notes

### Local / VPS / traditional Node hosts

Run `npm start`.

### Vercel

The project serves Express through `api/index.js` and rewrites traffic via `vercel.json`.

SQLite on Vercel uses temp storage so the function can boot, but writes are ephemeral there. For durable production data on Vercel, move orders/settings/menu storage to a networked database such as Postgres.