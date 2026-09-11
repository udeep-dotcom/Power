# FormFill — Document-to-Form Automation Platform

Automates repetitive bank/payment/customs form filling: upload a blank form
and its supporting documents, review AI-extracted values, generate a filled
PDF that preserves the original layout exactly.

See `PROJECT_PLAN.md` for architecture, scope decisions, and what's
deliberately deferred to later phases.

## Prerequisites

- Node.js 20.9+ (Node 22 recommended)
- PostgreSQL 16
- An Anthropic API key (or another provider once its adapter is implemented)

## Setup

```bash
npm install
cp .env.example .env
# edit .env: set DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY

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
- `AI_PROVIDER` / `AI_MODEL` / `ANTHROPIC_API_KEY` — AI provider config
  (Section 27 of the spec). Only `anthropic` is implemented; `openai` and
  `gemini` throw a clear "not implemented" error pointing at where to add
  them (`src/lib/ai/providers/`).
- `STORAGE_DRIVER` / `LOCAL_STORAGE_DIR` — file storage (Section 26). Only
  `local` is implemented; `s3` throws a clear "not implemented" error.
- `MAX_UPLOAD_SIZE_MB`, `DEFAULT_CONFIDENCE_THRESHOLD` — upload/validation
  limits.

## Testing

```bash
npm test        # vitest — 45 unit tests over every deterministic module
npx tsc --noEmit
npx eslint .
npx next build
```

There is no live-API integration test in this repo yet: the AI-dependent
parts of the pipeline (form field detection, document extraction) need a
real `ANTHROPIC_API_KEY` to exercise, which wasn't available in the
environment this was built in. See `PROJECT_PLAN.md` Section 4 for exactly
what was and wasn't verified.

## Using it

1. Sign in, click **+ Create Filled Form**.
2. Upload the blank form (digital PDF with a text layer — scanned PDFs and
   image forms are a documented Phase 2 item, see `PROJECT_PLAN.md`).
3. Upload one or more supporting documents (PDF with a text layer, or a
   JPG/PNG photo — images are read via the AI provider's vision endpoint).
4. Click **Start Analysis** and wait for the four processing stages.
5. Review the extracted fields — edit anything that's wrong or marked
   "Information Required"; manual edits always win over AI values.
6. Click **Generate Filled Form**, then download it.

The transaction then shows up in the dashboard's history with its
`DOC-YYYY-NNNNNN` document number.

## Known gaps (see PROJECT_PLAN.md for the full list)

- Scanned PDFs and image-based blank forms are rejected with a clear message
  rather than silently mishandled.
- Template learning/auto-matching, company/supplier master data, the admin
  cost dashboard, and S3 storage are scaffolded (schema/interfaces exist)
  but not wired up yet.
