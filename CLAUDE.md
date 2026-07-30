# Project: Address Book Management System (Frontend SPA)

Agent/architecture context for the React SPA. For framework mechanics follow React/Vite/TS conventions; this file wins for architecture and the app's boundaries. Companion API context: [../backend/CLAUDE.md](../backend/CLAUDE.md).

## What this project is

A **decoupled React 19 + TypeScript + Vite SPA** for an Address Book. It consumes the separate [Laravel API](../backend/README.md) over Sanctum token auth. No SSR, no UI framework — hand-built components + plain CSS. One core entity (`Contact`).

## The one rule (never break it)

**Client-side validation MUST mirror the backend Form Request rules.** [src/lib/validation.ts](src/lib/validation.ts) is the single mirror of the backend rules (email, phone regex, age 1–150, website URL, gender enum, required fields). When a backend rule changes, update this file and its tests. The backend remains authoritative — 422 responses are mapped back to inline field errors — but the client mirror must stay in sync for a good UX.

## Conventions

- **No hardcoded URLs or tokens.** All requests go through [src/api/client.ts](src/api/client.ts), which reads `VITE_API_BASE_URL` and attaches the Bearer token. Never `fetch` a literal URL or read a token outside the auth layer.
- **All network access lives in `src/api/`.** Pages/features call `api.get/post/...` or the typed `authApi`/`contactsApi` wrappers — never `fetch` directly.
- **Auth is centralized** in `src/auth/` — `AuthProvider` owns token persistence (`localStorage`) and the session lifecycle; `RequireAuth` gates routes. Don't read/write the token elsewhere.
- **List state lives in the URL** (search/filters/pagination as query params) so views are shareable and back-button-correct.
- **Errors** surface via the typed `ApiError` (`.isValidation/.isUnauthorized/.isNotFound/.isRateLimited`) and the toast/inline-field patterns already in use. Reuse them; don't invent new error UI.
- Strict TypeScript — no `any` in app code. Reuse `components/ui/*` before adding new primitives.

## Guardrails (do NOT)

- ❌ Hardcode API base URLs or tokens anywhere in `src/`.
- ❌ Call `fetch` outside `src/api/`.
- ❌ Let client validation drift from the backend Form Requests.
- ❌ Store or read the auth token outside `src/auth/`.
- ❌ Add a UI framework / state library without approval — the app is intentionally dependency-light.

## Folder map

```
src/api/                request layer (client, auth, contacts, types)
src/auth/               AuthProvider, RequireAuth, context, useAuth
src/features/contacts/  ContactForm + list/single data hooks
src/pages/              Login, Register, ContactsList, Create, Edit, Details
src/components/ui/      Button, Field, Pagination, ConfirmDialog, Alert, ...
src/components/toast/   toast provider + hook
src/lib/                validation (mirrors backend), useDebounce, resourceCache
src/test/setup.ts       Vitest + jest-dom
```

## Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Env | `cp .env.example .env` |
| Dev server | `npm run dev` → http://localhost:5173 |
| Build | `npm run build` |
| Preview build | `npm run preview` |
| Tests | `npm run test` (46) / `npm run test:watch` |
| Lint | `npm run lint` |

**Seeded login:** `test@example.com` / `password`.
