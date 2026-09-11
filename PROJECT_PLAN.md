# PROJECT_PLAN.md

## 0. Scope reality check (read this first)

The master prompt for this project specifies 76 requirements for a full production
platform: multi-role auth, template learning and auto-matching, supplier/company
master data, conflict-resolution workflows, an admin cost dashboard, golden-file
regression testing, visual PDF regression testing, Docker deployment, and six
separate documentation files, among others. That is genuinely months of work for
a team, not a single build pass — and the spec itself says not to pretend
otherwise ("No fake functionality," Section 69).

The spec's own Section 51 gives explicit permission to scope down:

> First get this workflow working perfectly ... Do not build fifteen incomplete
> features before the core workflow works.

This build follows that instruction literally. **What's implemented is the real,
end-to-end MVP loop with no mocked logic.** Everything else is listed below as
explicit Phase 2/3 work with a note on what it needs.

## 1. What's built (Phase 1 / MVP)

- Email+password auth (next-auth/Auth.js, bcrypt, JWT sessions), two roles
  (ADMIN, OPERATOR), route-level and server-action-level authorization.
- Upload blank PDF form + one or more supporting PDF documents.
- Real text-layer extraction from PDFs (pdfjs-dist) — no OCR faking, no
  hard-coded sample data.
- AI-assisted form field detection: the AI identifies which text is a label,
  what it means semantically, and where the value goes relative to it; all
  actual (x, y) coordinates are computed deterministically from the real
  extracted text positions, never invented by the model (Section 75).
- AI-assisted structured extraction from supporting documents into a shared
  semantic field vocabulary (Section 6), validated against a Zod schema with
  one automatic repair/retry on invalid output (Section 57).
- Deterministic field mapping by matching normalized field keys — no AI call
  needed at this step since both sides already agreed on vocabulary.
- Human verification screen: Field / Proposed Value / Source / Confidence,
  editable; manual edits always win over AI values (Section 11).
- Conflict detection: if two documents disagree on a field, both are kept,
  the row is flagged, and confidence is capped so it can't pass silently.
- Deterministic PDF overlay generation (pdf-lib) onto the *original* PDF —
  layout, logos, boxes untouched, only inserted text is added. Field overflow
  is handled by shrinking font size within a floor, then truncating with an
  ellipsis, never by bleeding into a neighboring box (Section 38).
- Deterministic amount-in-words, currency formatting, SWIFT/account/currency
  validation — none of this is ever asked of an LLM (Sections 19, 41, 42).
- Duplicate-document detection by file hash (warns, never blocks).
- Full audit log + AI usage/cost tracking per transaction.
- Transaction state machine matching Section 33 exactly, including a
  documented recovery path from FAILED.
- Dashboard: forms today/this month, hours saved (estimated), needs-review
  count, recent transactions.
- Full transaction history (`/transactions`): every form ever filled, with
  search (document #, supplier, invoice #) and status filtering, paginated —
  not just the dashboard's last-10 view (Section 24).
- Blank-form reuse: uploading the same PDF file (by hash) again — or picking
  it from the "reuse a form used before" list instead of uploading at all —
  skips the AI form-analysis call entirely and reuses the previously-detected
  fields. The single biggest cost/latency lever for an org that fills the
  same handful of bank/customs forms every day; see Section 2 for how this
  differs from the full template-matching system that's still Phase 2.
- S3-compatible object storage (`STORAGE_DRIVER=s3`) — works against AWS S3,
  Cloudflare R2, Supabase Storage, or MinIO. Required for any deployment
  target without a persistent local disk (e.g. Vercel); the local driver
  silently loses files there. Also the first storage driver to produce real
  expiring URLs (15-minute presigned GetObject), improving on the local
  driver's non-expiring authenticated route.
- `scripts/create-user.ts` (`npm run user:create`) — onboard a named user
  with a securely generated one-time password, for handing out logins to a
  small set of testers without building an invite-email flow yet.
- Prompt-injection defense: every AI call's system prompt explicitly tells the
  model uploaded document text is data only, never instructions (Section 58).
- Two working AI providers: direct Anthropic, and OpenRouter (one adapter,
  any model OpenRouter serves via `AI_MODEL`, no code change to switch).
  OpenRouter is the recommended default — see README.md for model choice.
- 51 unit tests covering every deterministic module (number-to-words, currency
  formatting/comparison, validation rules, the workflow state machine,
  field-mapping/conflict logic) plus the OpenRouter provider's request
  shape, retry-on-invalid-schema logic, and error handling against a mocked
  HTTP layer — `npm test`.
- A real, non-mocked Playwright smoke test of the browser flow (login →
  create transaction → upload both files → sign out → confirm the
  auth redirect) was run against a live dev server during development; see
  the note in Section 4 about what could and couldn't be verified without
  a live AI API key.

## 2. What's explicitly deferred (Phase 2)

Each of these needs real additional engineering, not a flag flip:

| Item | Why it's deferred | What Phase 2 needs |
|---|---|---|
| Scanned PDFs / OCR (Case C) | No text layer to extract; needs a rasterizer (e.g. a canvas backend for pdf.js, or a dedicated OCR service) not available in this pass | Render page → image → OCR or vision pipeline |
| Image blank forms (JPG/PNG, Case D) | Field-position detection would need vision-based bounding boxes converted into a synthesized PDF page; the `completeVision` hook already exists on the AI provider interface for this | Build the image→PDF background embedding + vision coordinate mapping |
| DOCX/XLSX supporting documents | Explicitly listed as "where practical" in the spec; not wired up | Add a text-extraction adapter per format behind the existing extraction pipeline |
| Template learning & auto-matching (Sections 14–16) | A lightweight exact-file-hash reuse now exists (see Section 1) — that's not the same thing as Section 16's fuzzy matching (perceptual hash, OCR header recognition, logo recognition for a form that's been rescanned/re-exported and isn't byte-identical), and there's still no admin UI to review/correct/rename a template (Section 15) | Add fingerprint/perceptual-hash matching for near-duplicate (not just identical) files; build the template review/edit screen |
| Company & supplier master data (Sections 17–18) | No UI/data model beyond what's needed for the MVP loop | Add `CompanyProfile`/`Supplier` models + admin screens; wire "compare against master data, flag differences" |
| Admin settings screen (Section 46) | Config currently lives in `.env` only | Build an admin UI over the same env-backed settings, org-scoped |
| Admin cost dashboard (Section 29) | `AIUsage` rows are already recorded with estimated cost per call; no UI reads them yet | A simple aggregation page over the existing `AIUsage` table |
| APPROVER role / multi-step approval (Section 60) | Only Operator → Generate exists | Add the role + an approval-required transition gate |
| Golden-file regression tests (Section 55) & visual PDF regression testing (Section 56) | Needs a curated fixture set (real-shaped forms) that doesn't exist yet | Add fixtures + a comparison harness once real bank forms are available |
| Direct OpenAI / Gemini providers | Both are reachable today via `AI_PROVIDER=openrouter` + `AI_MODEL="openai/..."` or `"google/..."`; a *direct* (non-OpenRouter) integration against their own SDKs isn't implemented | Implement `providers/openai.ts` / `providers/gemini.ts` against the official SDKs, mirroring `providers/anthropic.ts` |
| Background job queue (Section 35) | Pipeline currently runs synchronously across three server actions, which is explicitly allowed for now | Move `runAnalysisPipeline` behind a queue (e.g. BullMQ) if document volume or size makes synchronous processing too slow |
| Docker Compose | Not created this pass | `docker-compose.yml` with app + Postgres, once the Python service question (if any) is settled |

## 3. Phase 3 (out of scope until Phase 2 lands)

Bank-specific and customs-specific template packs, advanced multi-level
approval workflows, analytics, ERP integration APIs, a document inbox, and
email ingestion — all listed in the spec's own Section 53 as third-phase work.

## 3a. Deploying this (e.g. to Vercel)

The code is deployment-ready in the sense that matters most: the storage
layer no longer assumes a persistent local disk (`STORAGE_DRIVER=s3` works
against S3/R2/Supabase Storage), which was a hard blocker for any serverless
host. What's still true: **nothing has actually been deployed anywhere.**
That requires accounts and provisioning that belong to whoever owns this
project, not to a Claude Code session — specifically:

1. **A Vercel project connected to this GitHub repo.** Only you can create
   this (it's tied to your Vercel account/billing) — connect the repo at
   vercel.com/new, pick this branch, and Vercel picks up the Next.js app
   automatically. No code changes needed for this part.
2. **A real, persistent PostgreSQL database** — the one in this session is
   local to a disposable sandbox and disappears when it ends. Neon, Vercel
   Postgres, and Supabase all offer a connection string in a couple of
   minutes; set it as `DATABASE_URL` in Vercel's project settings.
3. **An S3-compatible storage bucket** — Cloudflare R2 (has a free tier, S3
   API-compatible) or Supabase Storage are both reasonable choices. Set
   `STORAGE_DRIVER=s3`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (for R2 —
   AWS S3 itself doesn't need this), `S3_ACCESS_KEY_ID`,
   `S3_SECRET_ACCESS_KEY` in Vercel's project settings.
4. **The rest of `.env.example`** — `AUTH_SECRET` (generate a real random
   one, don't reuse the dev placeholder), `AI_PROVIDER`/`AI_MODEL`,
   `OPENROUTER_API_KEY`.
5. **Run migrations and seed against the production database** — `npx
   prisma migrate deploy` (not `migrate dev`) with `DATABASE_URL` pointed at
   the production database, then `npm run db:seed` or `npm run user:create`
   for each real user.

Once those exist, deploying is mechanical — hand over the Vercel project
(or add me as a collaborator, or just paste me the resulting env values) and
the rest is a normal `git push`-triggered deploy. I can't skip the account-
creation steps for you; I can do everything after that.

## 4. Honest limitations of what was tested

The AI-dependent parts of the pipeline — form field detection, document
extraction, and therefore field mapping and PDF generation — have **not**
been exercised against a live model end-to-end yet. What *was* verified:

- All 51 unit tests pass (`npm test`) — every deterministic module (number
  formatting, currency comparisons, SWIFT/account/currency validation, the
  workflow state machine, field-mapping/conflict logic), plus the
  OpenRouter provider's request shape, retry-on-invalid-schema logic, and
  error handling — against a mocked HTTP layer, not a live call.
- `npx tsc --noEmit`, `npx eslint .`, and `npx next build` all pass clean.
- A real Playwright browser session against a live dev server: login, create
  a transaction, upload a blank-form PDF and a supporting-document PDF
  (generated on the fly with pdf-lib), confirm the "Start Analysis" button
  enables once both are present, navigate back to the dashboard, sign out,
  and confirm an unauthenticated request to `/dashboard` redirects to
  `/login`. Zero browser console/page errors were observed.
- A second Playwright session against a live dev server covering the parts
  added after the first pass: created a transaction, uploaded a blank form,
  seeded a `FormField` row directly via SQL to stand in for a successful AI
  analysis (since no live AI call was available — see below), created a
  second transaction, confirmed the "reuse a form used before" picker showed
  the first form and that clicking it attached the blank form with zero
  upload, then confirmed the `/transactions` history page listed both
  transactions and its search filter worked. Zero console errors. The
  `npm run user:create` script was also run for real and its generated
  password verified against the database.

**Why the live call is still missing, specifically:** this project has so far
only been built inside Claude Code's own cloud sandbox sessions. The first
session had no outbound API key at all. The second had a real OpenRouter key
but the sandbox's own egress network policy explicitly denies outbound
connections to `openrouter.ai` (confirmed via the proxy status endpoint — a
policy denial, not a missing allowlist entry, and not something to route
around). `api.anthropic.com` happens to be allowlisted in that same sandbox,
so an Anthropic-direct live test is possible there if a key is provided, but
an OpenRouter live test is not — that will have to happen either on a
developer machine (no such restriction) or in a Claude Code environment
whose network policy allows it.

To finish verifying the core workflow end-to-end (Section 73's "final system
test"), run the app somewhere without that restriction, set `OPENROUTER_API_KEY`
(or `ANTHROPIC_API_KEY` with `AI_PROVIDER=anthropic`) in `.env`, and run the
flow with a real blank form and a real invoice — see README.md.

## 5. Architecture

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS. One app —
  no separate Python service. This was a reasonable-assumption call per
  Section 74: a separate Python document-processing service (Section 31) adds
  real operational complexity (another deployable, another language, another
  set of dependencies) that isn't justified yet, since pdfjs-dist and pdf-lib
  in Node cover the current Case A/B scope. Revisit if/when OCR/rasterization
  (Phase 2) pushes toward Python-only libraries (PyMuPDF, OpenCV).
- **Database**: PostgreSQL via Prisma. Schema in `prisma/schema.prisma`
  already includes `organizationId` on the relevant tables for future
  multi-company support (Section 32), plus `FormTemplate`/`TemplateField` for
  Phase 2 template learning even though nothing populates them yet.
- **Auth**: next-auth (Auth.js) v5, Credentials provider, JWT sessions,
  bcrypt password hashing. `proxy.ts` (Next.js 16's renamed middleware) gates
  every non-auth route.
- **Storage**: `StorageDriver` interface (`src/lib/storage`) with a local-disk
  implementation for development. Files are served only through an
  authenticated route (`/api/files/[...key]`) that re-checks organization
  ownership per request — not a real expiring URL, but not a public one
  either; note in Section 21's terms as a documented gap versus a true
  presigned-URL scheme.
- **AI**: `AIProvider` interface (`src/lib/ai/provider.ts`) with two
  implementations — `providers/anthropic.ts` (Anthropic's Messages API
  directly) and `providers/openrouter.ts` (OpenRouter's OpenAI-compatible
  chat-completions endpoint via plain `fetch`, since OpenRouter has no
  official SDK; this is the recommended default — see README.md). Both
  enforce structured output via a forced tool/function call whose schema
  comes from Zod's native `z.toJSONSchema()`, validated again with Zod on
  the way back, with one automatic repair retry on failure.
- **PDF pipeline**: `src/lib/pdf/` — `extractText.ts` (pdfjs-dist layout
  extraction), `analyzeForm.ts` (AI label detection + deterministic anchor
  resolution), `extractDocument.ts` (AI structured extraction from text or
  vision), `mapFields.ts` (deterministic key-matching + conflict detection),
  `overlay.ts` (pdf-lib overlay with font-shrink/truncate overflow handling).
- **Workflow**: `src/lib/workflow.ts` implements the exact state machine from
  Section 33 as an explicit transition table, not ad hoc status strings.

## 6. Folder structure

```
prisma/                  schema, migrations, seed script
src/
  app/
    (app)/               authenticated shell (dashboard, transactions)
    login/                login page + server action
    actions/              server actions (mutations)
    api/
      auth/[...nextauth]/ next-auth route handlers
      files/[...key]/     authenticated file streaming
  components/            shared UI (badges, sign-out button)
  lib/
    ai/                  provider abstraction + Anthropic implementation
    auth/                next-auth config, session helpers
    domain/              shared field vocabulary
    format/              number-to-words, currency formatting
    pdf/                 extraction, analysis, mapping, overlay
    storage/             storage abstraction + local driver
    upload/              file validation
    validation/          deterministic business rules
    __tests__/           vitest unit tests
  proxy.ts               auth gate (Next.js 16's renamed middleware)
```

## 7. Database design

See `prisma/schema.prisma` for the authoritative definitions. Entities:
`Organization`, `User`, `FormTemplate`/`TemplateField` (Phase 2, scaffolded
now), `Transaction`, `Document`, `FormField`, `ExtractedValue`, `FormValue`,
`GeneratedDocument`, `AuditLog`, `AIUsage`.

## 8. Major technical risks

- **Coordinate-based overlay accuracy on real bank forms.** The anchor-based
  placement heuristic (find the label text, place the value right of or
  below it) works well on forms with clean, well-spaced labels. Dense forms
  with tables or multi-column layouts will need calibration — this is why
  Section 36's print-calibration system exists in the spec; it isn't built
  yet and should be one of the first Phase 2 additions once real forms are
  available to test against.
- **AI cost at scale without templates.** Every transaction currently re-runs
  full form analysis even for a form used yesterday, because template
  matching isn't built yet. This is fine for MVP validation but should be the
  next priority once the core loop is confirmed working, since Section 29's
  cost optimization depends on it.
- **Scanned documents are a hard wall right now.** Any scanned PDF or
  image-based blank form gets a clear rejection message rather than a wrong
  answer — deliberate, per Section 69, but it does mean the tool is currently
  narrower than "any bank form," which was flagged to the user before this
  build started.
