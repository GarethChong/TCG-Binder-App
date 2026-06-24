# Architecture Decision Record

## System Overview

The TCG Binder App follows a client-server architecture. The frontend handles all user interaction and rendering, while the backend manages data persistence, authentication, external API calls, and AI suggestions. They communicate via a REST API — the frontend sends HTTP requests, the backend responds with JSON.

---

## Tech Stack

### Original Plan
| Technology | Role |
|---|---|
| HTML / CSS / JavaScript | Frontend |
| Python + Flask | Backend |
| SQLite | Database |
| GitHub Pages | Hosting |

### What Was Built
| Technology | Role | Decision |
|---|---|---|
| React | Frontend UI | Chosen over vanilla JS for its component-based architecture, which suited the dynamic and interactive grid UI |
| Tailwind CSS | Styling | Utility-first approach that accelerated UI development; industry standard |
| Python + Flask | Backend API | Retained — simple, flexible, and beginner-friendly with a strong extension ecosystem |
| SQLAlchemy | ORM | Retained — abstracts database queries into Python, making the SQLite → PostgreSQL migration seamless |
| PostgreSQL | Production Database | Replaced SQLite for persistent cloud storage on deployment |
| Render | Backend Hosting | Replaced Railway — free tier, simple GitHub integration |
| Vercel | Frontend Hosting | Replaced GitHub Pages — supports React SPAs with proper client-side routing |
| Git + GitHub | Version Control | Tracked all progress and decisions throughout the build |

---

## Core Routes

| Method | Route | Description |
|---|---|---|
| GET | `/` | Home — health check |
| POST | `/register` | Register a new user |
| POST | `/login` | Authenticate a user |
| POST | `/logout` | Log out current user |
| GET | `/auth/check` | Check authentication status |
| GET | `/cards/search` | Search for Pokémon cards by name |
| GET | `/binderlist` | Retrieve all binders for current user |
| POST | `/binderlist` | Create a new binder |
| GET | `/binder/<id>` | View a specific binder and its pages |
| PUT | `/binder/<id>` | Rename a binder |
| DELETE | `/binder/<id>` | Delete a binder |
| POST | `/binder/<id>` | Add a sheet (two pages) to a binder |
| GET | `/binder/<id>/page/<number>` | View a specific page |
| POST | `/binder/<id>/page/<number>` | Add a card to a page |
| PUT | `/binder/<id>/page/<number>` | Swap/shift cards or images on a page |
| DELETE | `/binder/<id>/page/<number>` | Delete a sheet from a binder |
| PUT | `/binder/<id>/page/<number>/clear` | Clear all cards and images from a page |
| POST | `/binder/<id>/page/<number>/image` | Add a decorative image to a page |
| DELETE | `/binder/<id>/page/<number>/image/<image_id>` | Delete an image from a page |
| GET | `/binder/<id>/page/<number>/card/<card_id>/price` | Fetch live price for a card |
| POST | `/binder/<id>/page/<number>/suggestions` | Get AI suggestions for a page |

---

## Authentication Flow

1. On registration, the username and a bcrypt-hashed password are stored in the database alongside a unique surrogate key
2. On login, the username is looked up and the submitted password is verified against the stored hash using Flask-Bcrypt
3. On success, Flask-Login creates a server-side session tied to the user's unique ID
4. All protected routes use the `@login_required` decorator — unauthenticated requests receive a 401 response
5. Cross-origin sessions are maintained using `SESSION_COOKIE_SAMESITE=None` and `SESSION_COOKIE_SECURE=True` to support the Vercel + Render cross-domain deployment

---

## Data Models

**User** — `id`, `username`, `password`
→ has many Binders (cascade delete)

**Binder** — `id`, `name`, `size`, `colour`, `user_id`
→ belongs to User; has many Pages (cascade delete)
→ `size` determines grid dimensions (2 = 2×2, 3 = 3×3, 4 = 4×4)
→ `colour` is used to theme the binder and highlight its pages

**Page** — `id`, `page_number`, `sheet`, `binder_id`
→ belongs to Binder; has many Cards and DecorativeImages (cascade delete)
→ `sheet` groups two pages into a spread, simulating a real book

**Card** — `id`, `card_id`, `card_number`, `card_set`, `name`, `image_url`, `slot_col`, `slot_row`, `page_id`
→ belongs to Page
→ `card_id` is the Pokémon TCG API identifier (e.g. `sv1-123`); 
→ `id` is the internal database primary key — these are never mixed
→ `slot_col` and `slot_row` enable direct grid position lookup without scanning the full page

**DecorativeImage** — `id`, `image_url`, `slot_col`, `slot_row`, `width`, `is_primary`, `page_id`
→ belongs to Page
→ supports the michi collection style — images can span 1 or 2 columns (`width`)
→ `is_primary` distinguishes the anchor slot from the secondary slot of a 2-wide image, enabling correct swap and delete logic

---

## Database Schema
User

├── id (PK)

├── username (unique)

└── password (hashed)

Binder

├── id (PK)

├── name

├── size

├── colour

└── user_id (FK → User.id)
Page

├── id (PK)

├── page_number

├── sheet

└── binder_id (FK → Binder.id)

Card

├── id (PK)

├── card_id (Pokémon TCG API ID)

├── card_number

├── card_set

├── name

├── image_url

├── slot_col

├── slot_row

└── page_id (FK → Page.id)

DecorativeImage

├── id (PK)

├── image_url

├── slot_col

├── slot_row

├── width (1 or 2)

├── is_primary

└── page_id (FK → Page.id)

---

## External APIs

| API | Purpose | Status |
|---|---|---|
| Pokémon TCG API | Card search and live price lookup via TCGPlayer data | ✅ In use |
| Groq (LLaMA 3.3 70B) | AI page suggestions | ✅ In use |
| TCGPlayer API | Broader pricing and multi-game support | ❌ Closed to new developers as of 2024 |
| Scryfall API | MTG-specific card data | ❌ Not used — app is Pokémon only |

**Note:** Prices are fetched on demand rather than stored, given constant market fluctuations. This saves database space and ensures users always see current market values.

---

## Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Automatic deploys on push to `main`; `vercel.json` rewrites handle React Router client-side routing |
| Backend | Render | Free tier; cold starts of ~30s after 15 minutes of inactivity |
| Database | Render PostgreSQL | Free tier expires after 90 days — migration to paid tier recommended for long-term use |

---

## Known Limitations

- **English cards only** — the Pokémon TCG API does not support Japanese cards, which are a significant and sought-after segment of the market
- **No aggregate pricing** — displaying total page cost below the grid was visually cluttered and complicated by variant pricing (reverse holos, alternate arts). Prices are shown one card at a time on selection instead
- **No holo rendering** — the API image URLs return standard card images only; foil and holo visual effects are not supported
- **AI text-only responses** — Groq's LLaMA model cannot return image URLs or render card images in suggestions. This was a budget constraint; a more capable model would enable richer visual recommendations
- **No AI memory** — the AI adviser has no memory between sessions by design, both due to free tier storage constraints and to encourage user creativity rather than AI dependency

---

## What Changed From Plan

**Pricing display** — the original plan was to show cumulative card prices directly on the grid. This was built and functional, but proved visually messy and technically ambiguous — cards with multiple variants (reverse holo, alternate art) have different prices, making a single value misleading. The decision was made to show prices individually on card selection instead.

**API scope** — three APIs were originally planned (TCGPlayer, Scryfall, Pokémon TCG). TCGPlayer was inaccessible to new developers, Scryfall was MTG-specific, and the Pokémon TCG API covered all required functionality for free with no hard rate limit. The scope was narrowed to one API.

**AI capability** — the original vision included a conversational, image-aware AI adviser. Budget constraints led to Groq (free, unlimited calls) over more capable paid models. The result is text-only suggestions, which fulfils the core use case of idea generation without enabling over-reliance on AI for creative decisions.

**Frontend stack** — the original plan used vanilla HTML, CSS, and JavaScript for simplicity. React and Tailwind were adopted instead to align with industry standards and maximise learning value, despite the steeper learning curve.