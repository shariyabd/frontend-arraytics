# Address Book Management System — Frontend SPA

A decoupled **React 19 + TypeScript + Vite** single-page app for the Address Book. It talks to the [Laravel API](../backend/README.md) over token-based auth, gating all CRUD views behind login and mirroring the backend's validation rules on the client.

> This README documents the **frontend**. The backend has its own guide at [../backend/README.md](../backend/README.md). Docker (one command for both apps + MySQL) is documented at [../backend/DOCKER.md](../backend/DOCKER.md).

> **Folder layout assumption:** the docs and the Docker setup expect the two repos checked out as **sibling folders named `backend` and `frontend`** (e.g. `git clone <frontend-url> frontend`). If your checkout folders are named differently, rename them or adjust the cross-links and the `../frontend` build context in the backend's `docker-compose.yml`.

---

## 1. Tech Stack & Versions

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | **24.x** (18+ works) | JavaScript runtime |
| npm | 10+ | Package manager |
| React | **19** | UI library |
| React Router | 7 | Client-side routing |
| Vite | **8** | Dev server + bundler |
| TypeScript | 6 | Type safety (strict) |
| Vitest + Testing Library | 4 / 16 | Unit + component tests |
| oxlint | 1 | Linter |

No UI framework dependency — components are hand-built in `components/ui/` with plain CSS.

---

## 2. Prerequisites

```bash
node -v   # 24.x (>= 18)
npm -v    # >= 10
```

You also need the **backend API running** (natively on `http://localhost:8000`, or via Docker). See [../backend/README.md](../backend/README.md).

---

## 3. Setup

```bash
cd frontend
npm install
cp .env.example .env
```

### Environment configuration

The app uses **two** environment variables (see [.env.example](.env.example)); no URLs or tokens are hardcoded anywhere in `src/`:

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Path/origin prepended to **every** API request in [src/api/client.ts](src/api/client.ts). Keep as `/api/v1` in dev (so it hits the proxy); set to an absolute API origin in production (e.g. `https://api.example.com/api/v1`). | `/api/v1` |
| `VITE_API_TARGET` | **Dev only** — the origin the Vite dev proxy forwards `/api` requests to (see [vite.config.ts](vite.config.ts)). Ignored in production builds. | `http://127.0.0.1:8000` |

**Why two?** In development the SPA calls the relative path `/api/v1/...`, and Vite proxies those to the backend at `VITE_API_TARGET`. This keeps requests **same-origin**, so no CORS setup is needed locally. In production you either serve the SPA behind a reverse proxy that forwards `/api` (see the [Docker setup](../backend/DOCKER.md)), or point `VITE_API_BASE_URL` directly at the API origin (the backend's `FRONTEND_URL` CORS allow-list must then include the SPA origin).

---

## 4. Running

```bash
npm run dev       # dev server with HMR → http://localhost:5173
npm run build     # type-check + production bundle into dist/
npm run preview   # preview the production build locally
npm run lint      # oxlint
```

Open **http://localhost:5173** and log in with the seeded credentials below.

### Seeded login

| Field | Value |
|-------|-------|
| Email | `test@example.com` |
| Password | `password` |

(Created by the backend seeder — run `php artisan migrate --seed` in the backend, or use Docker.)

---

## 5. Testing

```bash
npm run test        # run once (Vitest)
npm run test:watch  # watch mode
```

The suite (**47 tests**) covers:

- [src/lib/validation.test.ts](src/lib/validation.test.ts) — every field validator (name, phone regex, email, website URL, gender enum, age boundaries 1–150, nationality), verifying the client rules **mirror the backend Form Requests**.
- [src/api/client.test.ts](src/api/client.test.ts) — `ApiError` mapping: 422 → validation field errors, 401 → unauthorized, 404 → not found, 429 → rate limited, network failure → status 0.
- [src/features/contacts/ContactForm.test.tsx](src/features/contacts/ContactForm.test.tsx) — the submission form shows inline error messages for invalid input.

### E2E smoke test (optional, needs a live backend)

[e2e/smoke.spec.ts](e2e/smoke.spec.ts) drives a real browser through the full journey: login → list renders → create → search → edit → delete → logout. It is **not** part of `npm run test` because it needs the backend running and seeded:

```bash
# terminal 1 — backend (from the backend repo)
php artisan migrate --seed && php artisan serve      # → :8000

# terminal 2 — this repo (starts the Vite dev server itself)
npx playwright install chromium   # first run only
npm run test:e2e
```

---

## 6. How it connects to the API

- **Base URL + interceptor:** [src/api/client.ts](src/api/client.ts) is a thin `fetch` wrapper. It prepends `VITE_API_BASE_URL`, attaches `Authorization: Bearer <token>` when a token is set, unwraps the `{ success, message, data }` envelope, and normalizes errors into a typed `ApiError`.
- **Auth:** [src/auth/AuthProvider.tsx](src/auth/AuthProvider.tsx) stores the token in `localStorage` and injects it into the client. A global **401 handler** clears the session once and shows a "session expired" notice.
- **Route gating:** [src/auth/RequireAuth.tsx](src/auth/RequireAuth.tsx) wraps all `/contacts` routes and redirects unauthenticated users to `/login` (see [src/App.tsx](src/App.tsx)).
- **List state in the URL:** search, filters, and pagination are reflected in the query string, so the list is shareable and back-button-correct.

---

## 7. Folder Structure

```
frontend/src/
├── api/
│   ├── client.ts          # fetch wrapper: base URL, Bearer token, ApiError
│   ├── auth.ts            # login / register / me / logout calls
│   ├── contacts.ts        # contacts CRUD + list query calls
│   └── types.ts           # API response/DTO types
├── auth/
│   ├── AuthProvider.tsx   # token persistence + session lifecycle
│   ├── RequireAuth.tsx    # route guard → redirects to /login
│   ├── context.ts         # auth context
│   └── useAuth.ts         # auth hook
├── features/contacts/
│   ├── ContactForm.tsx    # create/edit form with inline validation
│   ├── useContactList.ts  # list data hook (search/filter/pagination)
│   └── useContact.ts      # single-contact data hook
├── pages/                 # Login, Register, ContactsList, Create, Edit, Details
├── components/
│   ├── ui/                # Button, Field, Pagination, ConfirmDialog, Alert, ...
│   ├── toast/             # toast provider + hook
│   ├── Layout.tsx         # app shell (nav + logout)
│   └── Icon.tsx
├── lib/
│   ├── validation.ts      # client validation — mirrors backend Form Requests
│   ├── useDebounce.ts     # debounced search input
│   └── resourceCache.ts   # lightweight SWR-style cache
├── test/setup.ts          # Vitest + jest-dom setup
├── App.tsx                # routes (public /login /register, gated /contacts/*)
└── main.tsx               # entry
```

---

## 8. Running both apps — two options

The backend and frontend are **two independent git repositories**; clone them side by side (e.g. as sibling folders `backend/` and `frontend/`). Then pick either path:

**Option A — natively, two separate repos run locally (no Docker required):**
1. Start the backend: follow [../backend/README.md](../backend/README.md) (`composer install`, `.env` + key, `php artisan migrate --seed`, `php artisan serve` → `:8000`).
2. Start this SPA in a second terminal: §3–§4 above (`npm install`, `cp .env.example .env`, `npm run dev` → `:5173`).
3. Log in with `test@example.com` / `password`.

**Option B — Docker (one command):** requires Docker to be **installed and running** first (Docker Engine/Desktop 24+ with Compose v2 — start Docker Desktop and verify with `docker --version`, `docker compose version`, `docker info`). Then, from the backend repo (with this frontend checked out as a sibling `../frontend`): `docker compose up --build`. See [../backend/DOCKER.md](../backend/DOCKER.md).

**Verifying it works:** after logging in you should land on `/contacts` and see a populated table (~50 seeded contacts). Try the search box and a filter; open, edit, and delete a record. If the table is empty, the backend seeder hasn't run (`php artisan migrate --seed`).

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login page shows "Unable to reach the server" | Backend not running, or dev proxy pointing at the wrong origin | Start the backend on `:8000`; check `VITE_API_TARGET` in `.env` matches it (restart `npm run dev` after changing `.env`). |
| `502`/`ECONNREFUSED` in the Vite console for `/api/*` | Same as above — the proxy target is down | Same fix. |
| Login fails with "credentials do not match" | Seeder not run on the backend | In the backend: `php artisan migrate --seed`, then use `test@example.com` / `password`. |
| "Too many attempts" on login | Backend rate limit (6/min) hit | Wait for the on-screen countdown (~60s). |
| Browser CORS error | Calling the API cross-origin (absolute `VITE_API_BASE_URL`) without the backend allow-listing this origin | Either keep the default `/api/v1` + dev proxy (same-origin), or set `FRONTEND_URL` in the backend `.env` to this app's origin. |
| Blank page after `npm run dev` | Node too old | Use Node 18+ (24.x recommended); check `node -v`. |
| Changes to `.env` not taking effect | Vite only reads env at startup | Restart the dev server / rebuild. |
