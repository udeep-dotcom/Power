# PT Companion

A native Android app for independent personal trainers and their clients, built around one
rule: **trainer A must never be able to see, query, or infer the existence of trainer B's
data.** Multi-tenancy is enforced server-side by Firestore Security Rules, not by the app
hiding things in the UI.

## Tech stack

- Kotlin + Jetpack Compose (Material 3), single-activity architecture
- Room for local persistence, Firebase Auth + Cloud Firestore for sync
- MVVM with a domain / data / UI layer split, Hilt for DI
- Offline-first workout logging via Room + WorkManager

## Repository layout

```
app/                          Android app module
  src/main/java/com/ptcompanion/
    domain/                   Pure Kotlin: models + repository interfaces
    data/local/                Room entities, DAOs, database, exercise-library seeding
    data/remote/                Firestore DTOs, collection/field name constants
    data/repository/            Repository implementations + domain<->DTO<->entity mappers
    data/sync/                  WorkManager-based push sync for offline writes
    di/                         Hilt modules
    ui/                         Compose screens + ViewModels (auth, trainer, client, theme, nav)
  src/main/assets/exercise_library_seed.json   ~60 seeded exercises
firestore/
  firestore.rules             The actual multi-tenancy boundary
  firestore.indexes.json
firebase-tests/               Node/Jest suite that runs firestore.rules against the emulator
scripts/                      Admin SDK script that seeds the two-trainer demo dataset
```

## Multi-tenancy model

Every trainer-owned Firestore document (clients, programs, sessions, check-ins) is a **flat
top-level collection** carrying a `trainerId` field equal to the trainer's Firebase Auth uid.
Client-owned documents additionally carry `clientUserId`. `firestore/firestore.rules` enforces,
server-side:

- A trainer may only read/write documents where `trainerId == request.auth.uid`.
- A client may only read/write documents where `clientUserId == request.auth.uid` - never
  another client's data, even under the same trainer.
- Ownership fields (`trainerId`, `clientUserId`) are immutable after creation and are
  cross-checked via `get()` lookups against the client's own profile doc on writes like
  session logging, rather than trusted from the write payload - so a client can't spoof a
  different `trainerId` to attach their data to (or read as) another tenant.
- The client-join flow (invite code redemption) is a security rule, not client-side trust:
  a client can only create their own profile doc if the invite code they reference exists,
  is unused, and belongs to the trainer they're claiming.

This is proven against the real Firestore emulator, not just written and assumed correct -
see [Running the rules tests](#running-the-firestore-rules-tests-45-tests) below.

### Why Room *and* Firestore

The Firestore Android SDK already has offline persistence and an offline write queue built
in, and read-mostly trainer-side data (roster, programs, invite codes) is fetched directly
via Firestore snapshot listeners to lean on that. But the one requirement called out
explicitly - client-side workout logging must survive being offline and sync later - gets a
dedicated **Room-is-source-of-truth** path instead: `SessionRepositoryImpl`,
`CheckInRepositoryImpl`, and the body-measurement half of `ProgressRepositoryImpl` write to
Room immediately (marked `PENDING_PUSH`), the UI reads only from Room (so it never blocks on
network), a Firestore listener mirrors remote changes back into Room (skipping any row
that's still `PENDING_PUSH` so an in-flight offline edit is never clobbered), and
`SyncWorker` (WorkManager, `NetworkType.CONNECTED` constraint) pushes pending rows up and
flips them to `SYNCED` once a connection exists. That gives the specific, testable
offline-first guarantee the brief asks for, on top of Firestore's own resilience everywhere
else.

## Setup

### 1. Firebase project

Create a Firebase project (or reuse an existing one) with Authentication (Email/Password
provider) and Cloud Firestore enabled, then download `google-services.json` for an Android
app registered as `com.ptcompanion` and place it at `app/google-services.json` (see
`app/google-services.json.example` for the expected shape; the real file is gitignored -
never commit it).

Deploy the rules and indexes from `firestore/`:

```
firebase deploy --only firestore:rules,firestore:indexes --project <your-project-id>
```

### 2. Build the app

```
./gradlew assembleDebug
```

Requires an Android SDK (`ANDROID_HOME`/`local.properties`) - this repository was built in a
network-restricted environment without one, so the Kotlin sources were verified for type
correctness with a standalone Kotlin compiler pass instead of a full Android Gradle build;
see "What wasn't verified" below.

### 3. Google Sign-In

`AuthRepository.signInWithGoogleIdToken` is implemented at the repository layer, but the
Credential Manager UI flow to obtain a Google ID token isn't wired into the sign-up screen in
this pass - it needs a real OAuth client ID from the Firebase console for this specific app,
which doesn't exist until you set up your own project. Email/password (the other option the
brief lists) is fully implemented for both trainer sign-up and sign-in.

## Running the Firestore rules tests (45 tests)

This is the part of the multi-tenancy requirement that's actually verified in this
environment, against the real Firestore emulator - not assumed correct from reading the
rules.

```
cd firebase-tests
npm install
cd ..
npx firebase-tools emulators:exec --only firestore --project pt-companion-rules-test \
  "cd firebase-tests && npm test"
```

All 45 tests pass. Coverage includes: cross-trainer roster queries being denied outright
(not silently filtered), client-to-client isolation within one trainer's roster, invite-code
tampering attempts, session/check-in/measurement ownership spoofing attempts, and the
exercise library being read-only shared reference data. See `firebase-tests/README.md` for
the full list.

## Demo dataset

`scripts/seed-demo-data.js` (Firebase Admin SDK) seeds two independent trainers, each with
their own clients and an active program, to demonstrate the "trainer A builds a program ->
assigns via invite code -> client logs a session -> trainer A sees it, trainer B's account
shows none of it" flow end to end.

Against the local emulator (safe default, no real project needed):

```
firebase emulators:start --only firestore,auth --project pt-companion-demo &
cd scripts && npm install
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  node seed-demo-data.js --project pt-companion-demo
```

Against a real project, set `GOOGLE_APPLICATION_CREDENTIALS` to a service account key and
run `node seed-demo-data.js --project <your-project-id>` (no emulator env vars set).

This creates:

- **Priya Trainer** (`trainer.a@ptcompanion.demo`) with clients Alice Chen, Ben Ortiz, Carla
  Nguyen - Alice has a completed session logged today (drives the "client logs a session ->
  trainer sees it" demo beat); Ben and Carla have a scheduled-but-not-yet-logged session.
- **Marcus Trainer** (`trainer.b@ptcompanion.demo`) with clients Diego Alvarez and Elena
  Petrova, same pattern.
- All accounts share the password `Passw0rd!`.

To demo: sign in as `trainer.a@ptcompanion.demo`, see Alice/Ben/Carla and Alice's compliance
state reflecting her logged session; sign out and sign in as `trainer.b@ptcompanion.demo` and
confirm the roster shows only Diego and Elena - none of trainer A's clients, programs, or
sessions are visible or queryable.

## What wasn't verified

This was built in a container without an Android SDK and with Google's Maven repository
(`dl.google.com` / `maven.google.com`) blocked by network policy, so a full
`./gradlew assembleDebug` could not be run here. To compensate:

- Every non-Compose Kotlin file (all domain models/interfaces, all Room entities/DAOs, all
  data<->domain mappers, all six repository implementations, and every ViewModel) was
  compiled for real with a standalone Kotlin/JVM compiler pass against stand-in
  Room/Firebase/Hilt/Compose-runtime API surfaces, and the two real bugs it caught
  (a `Map.takeLast()` that doesn't exist in the stdlib, and Firestore's Kotlin POJO mapper
  needing `@JvmOverloads` on DTO constructors) are fixed in this codebase.
- The Compose `@Composable` screens were not compiler-verified (that needs the Compose
  compiler plugin and a much larger stub surface) - only manually reviewed.
- Firestore Security Rules were verified for real against the Firestore emulator (see above)
  - this is the one piece the brief specifically requires not be "assumed to work," and it
    is the one piece actually exercised end-to-end here.

Building and running the app on a real device/emulator with Android Studio is the way to
close this gap; nothing in the above should require source changes to do so, only a Firebase
project and an Android SDK.
