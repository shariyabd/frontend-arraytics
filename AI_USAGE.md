# AI Usage — Frontend (React SPA)

How AI tooling was used to plan, build, test, and document the **frontend** SPA — and, honestly, where it helped, where it was wrong, and how its output was validated. The backend has its own companion report (`../backend/AI_USAGE.md`), including the shared docs-first workflow this app plugs into.

---

## 1. Tools & environment

| Tool | Role |
|------|------|
| **Claude Code** (Claude Opus) | Primary coding agent — terminal/IDE pair-programmer in an agentic loop: read the spec and the backend contract → scaffold → implement → run typecheck/lint/tests → re-prompt on failures. |
| **Backend handover docs** (`api-doc/` — envelope, endpoints, validation, pagination meta, plus `design-brief.md` for UI direction) | The agent's source of truth for the API contract; the SPA was written *against these documents*, not against ad-hoc calls to the running server. |
| **`CLAUDE.md`** | Persistent agent context: the one rule (client validation mirrors backend Form Requests), conventions (all network access via `src/api/`, no hardcoded URLs/tokens), guardrails, folder map, commands. |
| **tsc + oxlint + Vitest** | The validation harness — every AI change had to keep `npm run build`, `npm run lint`, and `npm run test` clean before being accepted. |

---

## 2. Strategy: contract-first, dependency-light

The frontend milestones, in order: **transcribe the API contract into types → request layer + auth shell → contacts feature (list/form/details) → hardening (loading/empty/error/429 states) → tests → docs.**

Two deliberate strategies shaped the app:

- **Contract-first.** The response envelope (`{ success, message, data }`), pagination meta, and contact fields were transcribed into `src/api/types.ts` *first*. Everything downstream (the `api` wrapper, hooks, forms) was written against those types, so drift between SPA and API surfaced as `tsc` errors rather than runtime bugs. The validation rules were mirrored the same way — copied from the backend Form Requests into `src/lib/validation.ts` and pinned by tests so future drift is caught.
- **Dependency-light by decision.** No UI framework, no data-fetching library; hand-built `components/ui/*` plus a small SWR-style `resourceCache`. Choosing a hand-rolled cache over TanStack Query was a **human trade-off decision** (fewer dependencies to audit for a small app), not an AI default — and the agent was barred from adding dependencies unilaterally.

---

## 3. Where AI was used across the lifecycle

| Stage | How AI was used |
|-------|-----------------|
| Planning | Summarizing `../backend/api-doc/` into the type layer and a build order; identifying what the assignment required on the client (token gating, mirrored validation, table with search/filters/pagination). |
| Scaffolding | Vite + React + TS project, routing (`App.tsx` with lazy pages), the request layer (`api/client.ts`), auth context/guard. |
| Implementation | Contacts list (debounced search, filters, URL-driven state, pagination, delete confirm), create/edit form with inline validation, details page, toast + dialog primitives, session-expiry and 429-lockout handling. |
| Debugging | Failing tests / tsc errors fed back into the loop; React StrictMode double-mount issue in the cache diagnosed and documented in-code (see `resourceCache.ts` comments). |
| Testing | Vitest + Testing Library suite — every field validator (proving the backend mirror), the `ApiError` mapping (422/401/404/429/network), and `ContactForm` inline-error behavior. Current suite: **47 tests, all passing.** |
| Refactoring | Extracting `ui/` primitives once patterns repeated; keeping pages free of direct `fetch`/URL usage. |
| Documentation | README, `CLAUDE.md`, and this file — drafted by the agent, audited by the human against the assignment text (see §5). |
| Review | A final audit pass against the assignment's frontend requirements — which is exactly what caught the env-var problem below. |

---

## 4. How AI output was validated (never accepted blindly)

1. **Mechanical gates:** `npm run test`, `npm run build` (tsc), `npm run lint` after every change; failures went back into the loop.
2. **The type-checker as contract police:** because types were transcribed first, "the SPA agrees with the API" is enforced by `tsc`, not by hope.
3. **Requirement audits:** each explicit assignment line ("no hardcoded URLs", "client validation mirrors backend", "token gating") was re-checked against the codebase at the end, not assumed done because the app looked finished.
4. **Tests pin the mirror:** `validation.test.ts` exists specifically so a future backend rule change that isn't mirrored fails loudly.

---

## 5. Where AI was wrong / suboptimal — and how it was caught

**Catch #1 — inconsistent environment-variable wiring.**
An early pass had `api/client.ts` reading `import.meta.env.VITE_API_BASE_URL`, but the committed `.env` only defined `VITE_API_TARGET` (the dev-proxy target), and there was **no `.env.example`**. Locally everything "worked" because the client's `/api/v1` fallback happened to line up with the dev proxy — masking that a **production build had no configured API base URL at all**. An AI that verifies only "does it run in dev?" ships this.
*How it was caught:* an explicit audit against the requirement "API base URL and auth token handled cleanly via environment variable — no hardcoded URLs." Tracing both variables showed they serve different layers (request base path vs. dev-proxy origin) and the production path was unconfigured. *Fix:* document both variables, add a committed `.env.example`, gitignore the real `.env` (which had been tracked — a second hygiene catch), and comment the dev-vs-prod behavior in `client.ts`.

**Catch #2 — "runs" is not "tested".**
The first working version had **zero tests**, despite tests being an expected deliverable — easy to miss because the app looked complete in the browser. The gap was closed by adding the Vitest suite, prioritizing the highest-value pure logic first (`validation.ts`, the `ApiError` mapping) before component tests. Lesson: a green dev server is not evidence of correctness — assert the pure logic explicitly.

---

## 6. Prompting techniques that worked

- **"Treat the backend api-doc as the source of truth; generate types + validation from it; let the type-checker enforce the contract."** The single most effective instruction for this app — integration with the API worked on the first real run.
- **Stating the invariant, not just the task.** Prompts framed as invariants ("client validation must mirror the backend Form Requests, field for field") produce code *and* the tests that protect the invariant, where task-framing ("add validation") produces only code.
- **End-of-feature audits.** Prompting the agent to re-read the assignment and diff it against the implementation caught both issues in §5.

---

## 7. Human decisions (where judgment was manual)

| Decision | Rationale |
|----------|-----------|
| No UI framework / no data-fetching library; hand-rolled `resourceCache` | Dependency-light for a small app; the trade-off (vs. TanStack Query) was weighed and documented in `resourceCache.ts`. |
| List state lives in the URL | Shareable, back-button-correct views — a UX bar the assignment didn't demand. |
| Session UX policy | 401 → single global "session expired" notice (no error spam from in-flight requests); 429 login lockout with countdown. |
| Register page included | The backend exposes `/register`; a human call to complete the auth story beyond the strict spec. |

---

## 8. Lessons learned & impact

- **Contracts beat conversations.** Writing types from the api-doc before any UI eliminated the usual integrate-and-debug phase entirely.
- **Audit against the assignment text, not the app.** Both §5 catches came from re-reading requirements, not from watching the app work.
- **Mirrored validation needs a test, or it will drift.** The mirror is only trustworthy because `validation.test.ts` fails when it lies.
- **Productivity:** the SPA (six pages, ui-kit, auth/session handling, 47 tests, docs) fit inside the shared 3-day window alongside the backend — with the polish (skeletons, empty states, URL state, a11y details) being where AI assistance most obviously multiplied output.

---

## 9. Guardrails applied to the AI (summary)

- Every change validated with `npm run test`, `tsc -b` (via `npm run build`), and `npm run lint` before acceptance.
- No hardcoded URLs/tokens: all requests via `api/client.ts`; the token lives only in the `auth/` layer.
- No new dependencies without human approval.
- Client validation kept mirrored to the backend Form Requests, with tests enforcing the mirror.
