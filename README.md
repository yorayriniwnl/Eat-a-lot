# Eat A Lot

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

Default admin credentials come from `.env`:

- Username: `admin`
- Password: `admin`

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
- `JWT_SECRET` - JWT signing secret for admin auth
- `ADMIN_USERNAME` - admin username
- `ADMIN_PASSWORD` - admin password
- `WHATSAPP_NUMBER` - WhatsApp number without `+`
- `WHATSAPP_CATALOG_URL` - public WhatsApp catalog link
- `INSTAGRAM_URL` - Instagram profile URL

## Deployment notes

### Local / VPS / traditional Node hosts

Run `npm start`.

### Vercel

The project serves Express through `api/index.js` and rewrites traffic via `vercel.json`.

SQLite on Vercel uses temp storage so the function can boot, but writes are ephemeral there. For durable production data on Vercel, move orders/settings/menu storage to a networked database such as Postgres.
