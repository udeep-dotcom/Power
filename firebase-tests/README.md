# Firestore Security Rules tests

Proves the multi-tenancy boundary in `firestore/firestore.rules` actually holds, using
the Firebase emulator (not assumed to work from reading the rules).

## Run

```
cd firebase-tests
npm install
npm test          # requires firebase-tools + the emulator; see below
```

The suite must run inside the Firestore emulator. From the repo root:

```
npx firebase-tools emulators:exec --only firestore --project pt-companion-rules-test \
  "cd firebase-tests && npm test"
```

The first run downloads the emulator jar (cached afterwards under
`~/.cache/firebase/emulators/`). No real Firebase project or credentials are needed -
`emulators:exec` runs entirely locally.

## What's covered (45 tests)

- Trainer profile isolation: a trainer can only create/read/write their own `/trainers/{id}` doc.
- Invite-code join flow: redeeming a valid code succeeds; tampering with the target
  `trainerId`, redeeming a used code twice, or creating a profile under someone else's
  uid all fail.
- **Cross-trainer roster isolation** (the core requirement): trainer A can list/read only
  their own roster; trainer B's query for trainer A's roster is denied outright, not
  silently filtered.
- Client-to-client isolation within one trainer's roster: client A1 cannot read client
  A2's profile, sessions, or programs even though they share a trainer.
- Program templates and client-assigned copies: only the owning trainer writes; only the
  assigned client (not other clients of the same trainer) can read their own copy.
- Workout sessions: only the owning client can create/update their own logged session;
  the owning trainer has read-only access; other trainers/clients get nothing.
- Weekly check-ins and body measurements follow the same pattern.
- Exercise library: readable by any signed-in user, writable by no one from the app.
