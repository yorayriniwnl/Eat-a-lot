# 🔥 Eat A Lot — Full Stack Website

> **Born to be Devoured.** A complete full-stack food ordering website with 3D WebGL visuals, live cart, WhatsApp order integration, and admin panel.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your WhatsApp number, catalog link, and secrets
```

### 3. Run the server
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

### 4. Open in browser
- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

---

## 🔑 Admin Login

Default credentials (change in `.env`):
- **Username**: `admin`
- **Password**: `admin`

---

## 📁 Project Structure

```
eat-a-lot/
├── server.js              # Express app entry point
├── package.json
├── .env.example           # Environment variables template
├── .env                   # Your config (create from .env.example)
│
├── db/
│   └── database.js        # SQLite setup, schema & seed data
│
├── routes/
│   ├── menu.js            # Menu CRUD API
│   ├── orders.js          # Orders API + WhatsApp deeplink
│   └── admin.js           # Auth, settings, categories
│
├── middleware/
│   └── auth.js            # JWT verification middleware
│
└── public/
    ├── index.html         # 3D frontend website
    └── admin.html         # Admin panel
```

---

## 🌐 API Reference

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | All categories + items |
| GET | `/api/menu/featured` | Featured items only |
| GET | `/api/menu/category/:slug` | Items by category |
| POST | `/api/menu/items` | *(Admin)* Add item |
| PUT | `/api/menu/items/:id` | *(Admin)* Update item |
| DELETE | `/api/menu/items/:id` | *(Admin)* Delete item |
| PATCH | `/api/menu/items/:id/toggle` | *(Admin)* Toggle availability |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place an order |
| GET | `/api/orders` | *(Admin)* List orders |
| GET | `/api/orders/:ref` | *(Admin)* Order detail |
| PATCH | `/api/orders/:ref/status` | *(Admin)* Update status |
| GET | `/api/orders/stats/summary` | *(Admin)* Dashboard stats |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Get JWT token |
| GET | `/api/admin/me` | Verify token |
| GET | `/api/admin/settings` | Get site settings |
| PUT | `/api/admin/settings` | Update settings |
| GET | `/api/admin/categories` | List categories |
| POST | `/api/admin/categories` | Add category |
| PUT | `/api/admin/categories/:id` | Update category |

---

## ✨ Features

### Frontend
- **Three.js WebGL** background scene — 18 glowing orbs + 300 ember particles
- **3D hero canvas** — rotating geometric shapes with emissive materials
- **3D card tilt** — every card reacts to mouse with perspective transform
- **Magnetic buttons** — CTA buttons have a magnetic pull effect
- **Live cart** — add items, update quantities, place orders
- **WhatsApp order flow** — order placed → redirects to pre-filled WhatsApp chat
- **Skeleton loading** — graceful loading states for API data
- **Filter by category** — smooth animated menu filtering
- **Custom cursor** — dot + trailing ring, scales on hover
- **Scroll reveal** — intersection observer-powered reveal animations

### Backend
- **Express.js** REST API
- **SQLite** (via better-sqlite3) — zero-config, file-based database
- **JWT authentication** for admin routes
- **Rate limiting** — 200 req/15min global, 20 orders/15min
- **Helmet.js** security headers
- **Auto-seeded** — 30+ menu items loaded on first run
- **WhatsApp deeplink** — orders generate a wa.me link with full order details

### Admin Panel
- Dashboard with live stats (orders, revenue, pending)
- Order management with status updates
- Menu item CRUD (add, edit, delete, toggle availability)
- Category management
- Site settings (WhatsApp number, hours, etc.)

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret for JWT signing | `dev_secret` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin` |
| `WHATSAPP_CATALOG_URL` | WhatsApp catalog URL | `https://wa.me/c/<WHATSAPP_NUMBER>` |
| `WHATSAPP_NUMBER` | WA number (no +) | — |
| `INSTAGRAM_URL` | Instagram profile URL | — |

---

## 📦 Deployment

### Railway / Render / Fly.io
1. Push to GitHub
2. Connect repo in your platform
3. Set environment variables
4. Deploy — it runs `npm start`

### VPS (Ubuntu)
```bash
npm install -g pm2
pm2 start server.js --name eat-a-lot
pm2 save
pm2 startup
```

---

## 🧑‍💻 Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken) |
| Security | Helmet, express-rate-limit |
| Frontend | Vanilla HTML/CSS/JS |
| 3D Graphics | Three.js (r128) |
| Fonts | Google Fonts (Bebas Neue, Cormorant, Syne) |

---

Made with 🔥 in Patna
