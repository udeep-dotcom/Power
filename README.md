# FormFill — Document-to-Form Automation Platform

Automates repetitive bank/payment/customs form filling: upload a blank form
and its supporting documents, review AI-extracted values, generate a filled
PDF that preserves the original layout exactly.

See `PROJECT_PLAN.md` for architecture, scope decisions, and what's
deliberately deferred to later phases.

## Prerequisites

- Node.js 20.9+ (Node 22 recommended)
- PostgreSQL 16
- An OpenRouter API key (recommended — one key, any model) or an Anthropic
  API key

## Setup

```bash
npm install
cp .env.example .env
# edit .env: set DATABASE_URL, AUTH_SECRET, OPENROUTER_API_KEY

npx prisma migrate dev
npm run db:seed   # creates a default org + admin user (see output for credentials)

npm run dev
```

Open http://localhost:3000 and sign in with the seeded admin credentials
(defaults: `admin@example.com` / `ChangeMe123!` unless you set
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before seeding — do that for
anything beyond local development).

## Environment variables

See `.env.example` for the full list. The important ones:

- `DATABASE_URL` — PostgreSQL connection string.
- `AUTH_SECRET` — random 32+ byte secret for session signing.
- `AI_PROVIDER` / `AI_MODEL` — AI provider config (Section 27 of the spec).
  - `AI_PROVIDER=openrouter` (default) + `OPENROUTER_API_KEY`: routes
    through [OpenRouter](https://openrouter.ai/models), so `AI_MODEL` can be
    any model it serves — `"google/gemini-2.5-flash"` (recommended default),
    `"google/gemini-2.5-flash-lite"` (cheapest), `"openai/gpt-4o-mini"`,
    `"anthropic/claude-haiku-4.5"` — with no code change. Verify the exact
    slug on OpenRouter's model list before switching, since they change.
  - `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`: talks to Anthropic
    directly instead.
  - A *direct* (non-OpenRouter) OpenAI or Gemini integration isn't
    implemented — route those through `openrouter` instead.
- `STORAGE_DRIVER` / `LOCAL_STORAGE_DIR` or `S3_*` — file storage
  (Section 26). `local` (default) writes to disk — fine for dev, but loses
  files on any host without a persistent filesystem. `s3` works against AWS
  S3, Cloudflare R2, Supabase Storage, or MinIO — **required** for a
  serverless deployment target like Vercel. See `.env.example` for the S3_*
  variables and `PROJECT_PLAN.md` Section 3a for deployment steps.
- `MAX_UPLOAD_SIZE_MB`, `DEFAULT_CONFIDENCE_THRESHOLD` — upload/validation
  limits.

## Onboarding users

There's no self-serve signup (this is an internal company tool). To create a
login for a specific person:

```bash
npm run user:create -- "jane@company.com" "Jane Doe" OPERATOR
```

Prints a securely generated one-time password to the terminal — send it to
them over a secure channel (not email in plaintext). Pass `ADMIN` as the
third argument for an admin account. Re-run the same command for the same
email to rotate their password (there's no self-serve password-change screen
yet).

## Testing

```bash
npm test        # vitest — 51 unit tests over every deterministic module,
                 # plus the OpenRouter provider's request/retry/error logic
                 # against a mocked HTTP layer
npx tsc --noEmit
npx eslint .
npx next build
```

There is no *live* end-to-end AI integration test verified in this repo yet.
The provider code (both Anthropic and OpenRouter) is unit-tested against
mocked responses, but a real call — the thing that actually proves form
detection and document extraction work — hasn't been run successfully yet.
The Claude Code sandbox sessions this was built in either had no API key, or
(with a real OpenRouter key) had a network policy that blocks
`openrouter.ai` outbound. Run the flow yourself with a real key — on your
own machine there's no such restriction — before trusting the AI-dependent
half of this app. See `PROJECT_PLAN.md` Section 4 for the full story.

## Using it

1. Sign in, click **+ Create Filled Form**.
2. Upload the blank form (digital PDF with a text layer — scanned PDFs and
   image forms are a documented Phase 2 item, see `PROJECT_PLAN.md`), **or**,
   if this exact form has been used before, pick it from the "reuse a form
   used before" list instead — no upload, no re-analysis.
3. Upload one or more supporting documents (PDF with a text layer, or a
   JPG/PNG photo — images are read via the AI provider's vision endpoint).
4. Click **Start Analysis** and wait for the four processing stages.
5. Review the extracted fields — edit anything that's wrong or marked
   "Information Required"; manual edits always win over AI values.
6. Click **Generate Filled Form**, then download it.

The transaction shows up in **History** (`/transactions`) with its
`DOC-YYYY-NNNNNN` document number, searchable by document #, supplier, or
invoice #, and filterable by status — the permanent record of every form
ever filled.

## Known gaps (see PROJECT_PLAN.md for the full list)

- Scanned PDFs and image-based blank forms are rejected with a clear message
  rather than silently mishandled.
- The blank-form reuse described above is an *exact file match* (same
  bytes). A rescanned or re-exported version of the same form won't match —
  that needs the fuzzy/fingerprint matching in Section 16, still Phase 2.
- Template learning's admin review/edit screen, company/supplier master
  data, and the admin cost dashboard are scaffolded (schema exists) but not
  wired up yet.
- Nothing is deployed anywhere yet — see `PROJECT_PLAN.md` Section 3a for
  exactly what that needs from you (a Vercel project, a hosted Postgres, and
  an S3-compatible bucket — none of which I can create on my own).
