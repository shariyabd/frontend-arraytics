# AI Usage

How AI tooling was used to build the **frontend** SPA — and, honestly, where it helped and where it needed correction.

**Tool:** Claude Code (Claude Opus) used as a pair-programmer in the terminal/IDE, in an agentic loop (read the spec and the existing backend contract → scaffold → implement → run typecheck/lint/tests → re-prompt on failures).

---

## 1. Where AI was used

| Area | How AI was used |
|------|-----------------|
| Reading the contract | Summarizing the backend API handover (`../backend/api-doc/`) — envelope shape, endpoints, validation rules, pagination meta — so the SPA's types and calls matched the API before writing UI. |
| Scaffolding | Vite + React + TS project, routing (`App.tsx`), the request layer (`api/client.ts`), and the auth context/guard. |
| Feature work | The contacts list (search/filters/pagination/edit/delete), the create/edit form with inline validation, loading/empty/error states, toast + confirm-dialog primitives. |
| Validation mirror | Deriving `lib/validation.ts` directly from the backend Form Requests so client rules mirror the server field-for-field. |
| Tests | Vitest + Testing Library suite for `validation.ts`, the `ApiError` mapping in `client.ts`, and the `ContactForm` inline-error behavior. |
| Docs | This file, the README, and `CLAUDE.md`. |

AI did **not** unilaterally add dependencies — the app is intentionally dependency-light (no UI framework, no data-fetching library); a hand-rolled `resourceCache` was chosen over pulling in TanStack Query, and that trade-off was a human decision.

---

## 2. An approach that worked well

**"Treat the backend api-doc as the source of truth, and generate the client types + validation from it — then let the type-checker enforce the contract."**

The response envelope (`{ success, message, data }`), the pagination meta shape, and the contact fields were transcribed into `api/types.ts` first. Everything downstream (the `api` wrapper, the hooks, the form) was written against those types, so drift between the SPA and the API surfaced immediately as `tsc` errors rather than runtime bugs. The validation rules were mirrored the same way — copied from the backend Form Requests into `lib/validation.ts` — which is why the client and server agree on every field.

Why it worked: the SPA integrated with the API on the first real run, and `tsc -b` + `oxlint` stayed clean throughout.

---

## 3. Where AI was wrong / suboptimal — and how it was caught

**Incorrect output: inconsistent environment-variable wiring.**

An early pass had `api/client.ts` reading `import.meta.env.VITE_API_BASE_URL`, but the committed `.env` only defined `VITE_API_TARGET` (the Vite dev-proxy target), and there was **no `.env.example`**. Locally everything "worked" purely because the client's `/api/v1` fallback happened to line up with the dev proxy — masking the fact that a **production build had no configured API base URL at all**. An AI that verifies only "does it run in dev?" will happily ship this.

**How it was caught:** an explicit audit against the requirement "API base URL and auth token handled cleanly via environment variable — no hardcoded URLs." Tracing the two variables showed they serve different layers (request base path vs. dev-proxy origin) and that the production path was unconfigured. The fix: document **both** variables, add a committed `.env.example` explaining each, gitignore the real `.env` (which had been tracked — another bad-hygiene catch), and add a comment in `client.ts` clarifying the dev-vs-prod behavior.

**A second catch: "runs" is not "tested".** The first working version had **zero tests**, despite tests being an explicit deliverable — easy to overlook because the app looked complete in the browser. The gap was closed by adding the Vitest suite, prioritizing the highest-value pure logic first (`validation.ts`, the `ApiError` mapping) before component tests. Lesson reinforced: a green dev server is not evidence of correctness — assert the pure logic explicitly.

---

## 4. Guardrails applied to the AI

- Every change was validated with `npm run test`, `tsc -b` (via `npm run build`), and `npm run lint` before being considered done.
- No hardcoded URLs/tokens: all requests go through `api/client.ts`; the auth token lives only in the `auth/` layer.
- Client validation was kept mirrored to the backend Form Requests, and that mirror is covered by tests so future drift is caught.
