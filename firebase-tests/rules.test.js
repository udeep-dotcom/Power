/**
 * Firestore Security Rules test suite for PT Companion.
 *
 * Proves the multi-tenancy boundary server-side (not client-side filtering):
 * trainer A must never be able to read/write/query trainer B's data, and a
 * client must never be able to read another client's data - even within the
 * same trainer's roster.
 *
 * Run with the Firebase emulator via `npm test` from firebase-tests/ (see
 * firebase-tests/README.md), which wraps this in `firebase emulators:exec`.
 */
const fs = require("fs");
const path = require("path");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  collection,
  query,
  where,
} = require("firebase/firestore");

const PROJECT_ID = "pt-companion-rules-test";
const EMULATOR_HOST = "127.0.0.1";
const EMULATOR_PORT = 8080;

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(
        path.resolve(__dirname, "../firestore/firestore.rules"),
        "utf8",
      ),
      host: EMULATOR_HOST,
      port: EMULATOR_PORT,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

function dbFor(uid) {
  return (uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext()).firestore();
}

async function seed(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

describe("trainer profile isolation", () => {
  test("a trainer can create their own profile doc", async () => {
    const db = dbFor("trainerA");
    await assertSucceeds(
      setDoc(doc(db, "trainers", "trainerA"), {
        trainerId: "trainerA",
        displayName: "Trainer A",
        email: "a@example.com",
        plan: "free",
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test("a trainer cannot create a profile doc for someone else's uid", async () => {
    const db = dbFor("trainerA");
    await assertFails(
      setDoc(doc(db, "trainers", "trainerB"), {
        trainerId: "trainerB",
        displayName: "Trainer B",
        email: "b@example.com",
        plan: "free",
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test("the plan field cannot be set to anything but 'free' on create", async () => {
    const db = dbFor("trainerA");
    await assertFails(
      setDoc(doc(db, "trainers", "trainerA"), {
        trainerId: "trainerA",
        displayName: "Trainer A",
        email: "a@example.com",
        plan: "pro",
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test("trainer B cannot read trainer A's profile", async () => {
    await seed((db) =>
      setDoc(doc(db, "trainers", "trainerA"), {
        trainerId: "trainerA",
        displayName: "Trainer A",
        email: "a@example.com",
        plan: "free",
        createdAt: new Date().toISOString(),
      }),
    );
    const dbB = dbFor("trainerB");
    await assertFails(getDoc(doc(dbB, "trainers", "trainerA")));
  });

  test("an unauthenticated user cannot read any trainer profile", async () => {
    await seed((db) =>
      setDoc(doc(db, "trainers", "trainerA"), {
        trainerId: "trainerA",
        displayName: "Trainer A",
        email: "a@example.com",
        plan: "free",
        createdAt: new Date().toISOString(),
      }),
    );
    const anon = dbFor(null);
    await assertFails(getDoc(doc(anon, "trainers", "trainerA")));
  });
});

describe("invite code redemption / client join flow", () => {
  test("a trainer can generate an invite code for their own roster", async () => {
    const db = dbFor("trainerA");
    await assertSucceeds(
      setDoc(doc(db, "inviteCodes", "CODEA1"), {
        code: "CODEA1",
        trainerId: "trainerA",
        clientDisplayName: "New Client",
        createdAt: new Date().toISOString(),
        expiresAt: null,
        used: false,
        usedByClientUserId: null,
        usedAt: null,
      }),
    );
  });

  test("a trainer cannot generate an invite code claiming another trainer's id", async () => {
    const db = dbFor("trainerB");
    await assertFails(
      setDoc(doc(db, "inviteCodes", "SPOOF1"), {
        code: "SPOOF1",
        trainerId: "trainerA",
        clientDisplayName: null,
        createdAt: new Date().toISOString(),
        expiresAt: null,
        used: false,
        usedByClientUserId: null,
        usedAt: null,
      }),
    );
  });

  test("a would-be client can redeem a valid, unused invite code and is bound to the right trainer", async () => {
    await seed((db) =>
      setDoc(doc(db, "inviteCodes", "CODEA1"), {
        code: "CODEA1",
        trainerId: "trainerA",
        clientDisplayName: "Client A1",
        createdAt: new Date().toISOString(),
        expiresAt: null,
        used: false,
        usedByClientUserId: null,
        usedAt: null,
      }),
    );

    const db = dbFor("clientA1");
    const batch = writeBatch(db);
    batch.set(doc(db, "clients", "clientA1"), {
      clientUserId: "clientA1",
      trainerId: "trainerA",
      displayName: "Client A1",
      email: "a1@example.com",
      joinedAt: new Date().toISOString(),
      activeProgramId: null,
      redeemedInviteCode: "CODEA1",
    });
    batch.update(doc(db, "inviteCodes", "CODEA1"), {
      used: true,
      usedByClientUserId: "clientA1",
      usedAt: new Date().toISOString(),
    });
    await assertSucceeds(batch.commit());
  });

  test("a client cannot self-attach to a trainer other than the one on the invite", async () => {
    await seed((db) =>
      setDoc(doc(db, "inviteCodes", "CODEA1"), {
        code: "CODEA1",
        trainerId: "trainerA",
        clientDisplayName: "Client A1",
        createdAt: new Date().toISOString(),
        expiresAt: null,
        used: false,
        usedByClientUserId: null,
        usedAt: null,
      }),
    );

    const db = dbFor("maliciousClient");
    const batch = writeBatch(db);
    batch.set(doc(db, "clients", "maliciousClient"), {
      clientUserId: "maliciousClient",
      trainerId: "trainerB", // tampering: not the invite's trainer
      displayName: "Malicious",
      email: "m@example.com",
      joinedAt: new Date().toISOString(),
      activeProgramId: null,
      redeemedInviteCode: "CODEA1",
    });
    batch.update(doc(db, "inviteCodes", "CODEA1"), {
      used: true,
      usedByClientUserId: "maliciousClient",
      usedAt: new Date().toISOString(),
    });
    await assertFails(batch.commit());
  });

  test("a used invite code cannot be redeemed a second time", async () => {
    await seed((db) =>
      setDoc(doc(db, "inviteCodes", "CODEA1"), {
        code: "CODEA1",
        trainerId: "trainerA",
        clientDisplayName: "Client A1",
        createdAt: new Date().toISOString(),
        expiresAt: null,
        used: true,
        usedByClientUserId: "clientA1",
        usedAt: new Date().toISOString(),
      }),
    );

    const db = dbFor("clientA2");
    const batch = writeBatch(db);
    batch.set(doc(db, "clients", "clientA2"), {
      clientUserId: "clientA2",
      trainerId: "trainerA",
      displayName: "Client A2",
      email: "a2@example.com",
      joinedAt: new Date().toISOString(),
      activeProgramId: null,
      redeemedInviteCode: "CODEA1",
    });
    batch.update(doc(db, "inviteCodes", "CODEA1"), {
      used: true,
      usedByClientUserId: "clientA2",
      usedAt: new Date().toISOString(),
    });
    await assertFails(batch.commit());
  });

  test("a client cannot create a profile document for a different uid", async () => {
    await seed((db) =>
      setDoc(doc(db, "inviteCodes", "CODEA1"), {
        code: "CODEA1",
        trainerId: "trainerA",
        clientDisplayName: null,
        createdAt: new Date().toISOString(),
        expiresAt: null,
        used: false,
        usedByClientUserId: null,
        usedAt: null,
      }),
    );

    const db = dbFor("clientA1");
    await assertFails(
      setDoc(doc(db, "clients", "someOtherClient"), {
        clientUserId: "someOtherClient",
        trainerId: "trainerA",
        displayName: "Client A1",
        email: "a1@example.com",
        joinedAt: new Date().toISOString(),
        activeProgramId: null,
        redeemedInviteCode: "CODEA1",
      }),
    );
  });
});

describe("cross-trainer roster isolation (the core requirement)", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "clients", "clientA1"), {
        clientUserId: "clientA1",
        trainerId: "trainerA",
        displayName: "Client A1",
        email: "a1@example.com",
        joinedAt: new Date().toISOString(),
        activeProgramId: null,
      });
      await setDoc(doc(db, "clients", "clientA2"), {
        clientUserId: "clientA2",
        trainerId: "trainerA",
        displayName: "Client A2",
        email: "a2@example.com",
        joinedAt: new Date().toISOString(),
        activeProgramId: null,
      });
      await setDoc(doc(db, "clients", "clientB1"), {
        clientUserId: "clientB1",
        trainerId: "trainerB",
        displayName: "Client B1",
        email: "b1@example.com",
        joinedAt: new Date().toISOString(),
        activeProgramId: null,
      });
    });
  });

  test("trainer A can query their own roster and only sees their own clients", async () => {
    const db = dbFor("trainerA");
    const snap = await assertSucceeds(
      getDocs(query(collection(db, "clients"), where("trainerId", "==", "trainerA"))),
    );
    const ids = snap.docs.map((d) => d.id).sort();
    expect(ids).toEqual(["clientA1", "clientA2"]);
  });

  test("trainer B querying for trainer A's roster is denied outright", async () => {
    const db = dbFor("trainerB");
    await assertFails(
      getDocs(query(collection(db, "clients"), where("trainerId", "==", "trainerA"))),
    );
  });

  test("trainer B cannot fetch a specific client of trainer A by id", async () => {
    const db = dbFor("trainerB");
    await assertFails(getDoc(doc(db, "clients", "clientA1")));
  });

  test("client A1 can read their own profile", async () => {
    const db = dbFor("clientA1");
    await assertSucceeds(getDoc(doc(db, "clients", "clientA1")));
  });

  test("client A1 cannot read client A2's profile, even under the same trainer", async () => {
    const db = dbFor("clientA1");
    await assertFails(getDoc(doc(db, "clients", "clientA2")));
  });

  test("client A1 cannot read client B1's profile (different trainer)", async () => {
    const db = dbFor("clientA1");
    await assertFails(getDoc(doc(db, "clients", "clientB1")));
  });

  test("trainer A can assign a program to their client by updating activeProgramId", async () => {
    const db = dbFor("trainerA");
    await assertSucceeds(updateDoc(doc(db, "clients", "clientA1"), { activeProgramId: "prog-1" }));
  });

  test("trainer A cannot rewrite a client's trainerId to steal them from trainer B", async () => {
    const db = dbFor("trainerA");
    await assertFails(updateDoc(doc(db, "clients", "clientB1"), { trainerId: "trainerA" }));
  });

  test("trainer B cannot modify trainer A's client roster in any way", async () => {
    const db = dbFor("trainerB");
    await assertFails(updateDoc(doc(db, "clients", "clientA1"), { activeProgramId: "prog-1" }));
  });
});

describe("program isolation", () => {
  test("a trainer can create a template program for themselves", async () => {
    const db = dbFor("trainerA");
    await assertSucceeds(
      setDoc(doc(db, "programs", "tmplA1"), {
        programId: "tmplA1",
        trainerId: "trainerA",
        name: "Strength Block",
        isTemplate: true,
        clientUserId: null,
        clonedFromTemplateId: null,
        weeks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  });

  test("a trainer cannot create a program under another trainer's id", async () => {
    const db = dbFor("trainerB");
    await assertFails(
      setDoc(doc(db, "programs", "tmplSpoof"), {
        programId: "tmplSpoof",
        trainerId: "trainerA",
        name: "Spoofed",
        isTemplate: true,
        clientUserId: null,
        clonedFromTemplateId: null,
        weeks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  });

  test("trainer B cannot read trainer A's template", async () => {
    await seed((db) =>
      setDoc(doc(db, "programs", "tmplA1"), {
        programId: "tmplA1",
        trainerId: "trainerA",
        name: "Strength Block",
        isTemplate: true,
        clientUserId: null,
        clonedFromTemplateId: null,
        weeks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    const db = dbFor("trainerB");
    await assertFails(getDoc(doc(db, "programs", "tmplA1")));
  });

  test("the client it's assigned to can read their own program copy", async () => {
    await seed((db) =>
      setDoc(doc(db, "programs", "progA1"), {
        programId: "progA1",
        trainerId: "trainerA",
        name: "Strength Block",
        isTemplate: false,
        clientUserId: "clientA1",
        clonedFromTemplateId: "tmplA1",
        weeks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    const db = dbFor("clientA1");
    await assertSucceeds(getDoc(doc(db, "programs", "progA1")));
  });

  test("a different client of the same trainer cannot read that program", async () => {
    await seed((db) =>
      setDoc(doc(db, "programs", "progA1"), {
        programId: "progA1",
        trainerId: "trainerA",
        name: "Strength Block",
        isTemplate: false,
        clientUserId: "clientA1",
        clonedFromTemplateId: "tmplA1",
        weeks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    const db = dbFor("clientA2");
    await assertFails(getDoc(doc(db, "programs", "progA1")));
  });

  test("a client can never write to a program document", async () => {
    await seed((db) =>
      setDoc(doc(db, "programs", "progA1"), {
        programId: "progA1",
        trainerId: "trainerA",
        name: "Strength Block",
        isTemplate: false,
        clientUserId: "clientA1",
        clonedFromTemplateId: "tmplA1",
        weeks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    const db = dbFor("clientA1");
    await assertFails(updateDoc(doc(db, "programs", "progA1"), { name: "Hacked" }));
  });
});

describe("workout session isolation (offline-first logging)", () => {
  beforeEach(async () => {
    await seed((db) =>
      setDoc(doc(db, "clients", "clientA1"), {
        clientUserId: "clientA1",
        trainerId: "trainerA",
        displayName: "Client A1",
        email: "a1@example.com",
        joinedAt: new Date().toISOString(),
        activeProgramId: null,
      }),
    );
  });

  test("a client can log their own session with the correct trainerId", async () => {
    const db = dbFor("clientA1");
    await assertSucceeds(
      setDoc(doc(db, "sessions", "sess1"), {
        sessionId: "sess1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        programId: null,
        dayId: null,
        dayLabel: "Day 1",
        scheduledDate: "2026-07-03",
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        exercises: [],
      }),
    );
  });

  test("a client cannot spoof a different trainerId on their own session", async () => {
    const db = dbFor("clientA1");
    await assertFails(
      setDoc(doc(db, "sessions", "sess1"), {
        sessionId: "sess1",
        trainerId: "trainerB",
        clientUserId: "clientA1",
        programId: null,
        dayId: null,
        dayLabel: "Day 1",
        scheduledDate: "2026-07-03",
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        exercises: [],
      }),
    );
  });

  test("a client cannot create a session doc claiming to be another client", async () => {
    const db = dbFor("clientA1");
    await assertFails(
      setDoc(doc(db, "sessions", "sess1"), {
        sessionId: "sess1",
        trainerId: "trainerA",
        clientUserId: "clientA2",
        programId: null,
        dayId: null,
        dayLabel: "Day 1",
        scheduledDate: "2026-07-03",
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        exercises: [],
      }),
    );
  });

  test("the owning trainer can read the client's logged session", async () => {
    await seed((db) =>
      setDoc(doc(db, "sessions", "sess1"), {
        sessionId: "sess1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        programId: null,
        dayId: null,
        dayLabel: "Day 1",
        scheduledDate: "2026-07-03",
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        exercises: [],
      }),
    );
    const db = dbFor("trainerA");
    await assertSucceeds(getDoc(doc(db, "sessions", "sess1")));
  });

  test("a different trainer cannot read the session", async () => {
    await seed((db) =>
      setDoc(doc(db, "sessions", "sess1"), {
        sessionId: "sess1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        programId: null,
        dayId: null,
        dayLabel: "Day 1",
        scheduledDate: "2026-07-03",
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        exercises: [],
      }),
    );
    const db = dbFor("trainerB");
    await assertFails(getDoc(doc(db, "sessions", "sess1")));
  });

  test("the trainer cannot write to the client's session (read-only review)", async () => {
    await seed((db) =>
      setDoc(doc(db, "sessions", "sess1"), {
        sessionId: "sess1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        programId: null,
        dayId: null,
        dayLabel: "Day 1",
        scheduledDate: "2026-07-03",
        status: "SCHEDULED",
        completedAt: null,
        exercises: [],
      }),
    );
    const db = dbFor("trainerA");
    await assertFails(updateDoc(doc(db, "sessions", "sess1"), { status: "COMPLETED" }));
  });

  test("a different client cannot update another client's session", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "clients", "clientA2"), {
        clientUserId: "clientA2",
        trainerId: "trainerA",
        displayName: "Client A2",
        email: "a2@example.com",
        joinedAt: new Date().toISOString(),
        activeProgramId: null,
      });
      await setDoc(doc(db, "sessions", "sess1"), {
        sessionId: "sess1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        programId: null,
        dayId: null,
        dayLabel: "Day 1",
        scheduledDate: "2026-07-03",
        status: "SCHEDULED",
        completedAt: null,
        exercises: [],
      });
    });
    const db = dbFor("clientA2");
    await assertFails(updateDoc(doc(db, "sessions", "sess1"), { status: "COMPLETED" }));
  });

  test("the owning client can update their own session to log a set", async () => {
    await seed((db) =>
      setDoc(doc(db, "sessions", "sess1"), {
        sessionId: "sess1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        programId: null,
        dayId: null,
        dayLabel: "Day 1",
        scheduledDate: "2026-07-03",
        status: "SCHEDULED",
        completedAt: null,
        exercises: [],
      }),
    );
    const db = dbFor("clientA1");
    await assertSucceeds(updateDoc(doc(db, "sessions", "sess1"), { status: "COMPLETED" }));
  });
});

describe("weekly check-in isolation", () => {
  beforeEach(async () => {
    await seed((db) =>
      setDoc(doc(db, "clients", "clientA1"), {
        clientUserId: "clientA1",
        trainerId: "trainerA",
        displayName: "Client A1",
        email: "a1@example.com",
        joinedAt: new Date().toISOString(),
        activeProgramId: null,
      }),
    );
  });

  test("a client can submit their own weekly check-in", async () => {
    const db = dbFor("clientA1");
    await assertSucceeds(
      setDoc(doc(db, "checkIns", "ci1"), {
        checkInId: "ci1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        weekOf: "2026-06-29",
        energyLevel: 4,
        sorenessLevel: 2,
        stickingToPlan: true,
        note: null,
        submittedAt: new Date().toISOString(),
      }),
    );
  });

  test("the owning trainer can read the check-in", async () => {
    await seed((db) =>
      setDoc(doc(db, "checkIns", "ci1"), {
        checkInId: "ci1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        weekOf: "2026-06-29",
        energyLevel: 4,
        sorenessLevel: 2,
        stickingToPlan: true,
        note: null,
        submittedAt: new Date().toISOString(),
      }),
    );
    const db = dbFor("trainerA");
    await assertSucceeds(getDoc(doc(db, "checkIns", "ci1")));
  });

  test("a different trainer cannot read the check-in", async () => {
    await seed((db) =>
      setDoc(doc(db, "checkIns", "ci1"), {
        checkInId: "ci1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        weekOf: "2026-06-29",
        energyLevel: 4,
        sorenessLevel: 2,
        stickingToPlan: true,
        note: null,
        submittedAt: new Date().toISOString(),
      }),
    );
    const db = dbFor("trainerB");
    await assertFails(getDoc(doc(db, "checkIns", "ci1")));
  });

  test("a client cannot submit a check-in with a spoofed trainerId", async () => {
    const db = dbFor("clientA1");
    await assertFails(
      setDoc(doc(db, "checkIns", "ci1"), {
        checkInId: "ci1",
        trainerId: "trainerB",
        clientUserId: "clientA1",
        weekOf: "2026-06-29",
        energyLevel: 4,
        sorenessLevel: 2,
        stickingToPlan: true,
        note: null,
        submittedAt: new Date().toISOString(),
      }),
    );
  });
});

describe("body measurement isolation", () => {
  beforeEach(async () => {
    await seed((db) =>
      setDoc(doc(db, "clients", "clientA1"), {
        clientUserId: "clientA1",
        trainerId: "trainerA",
        displayName: "Client A1",
        email: "a1@example.com",
        joinedAt: new Date().toISOString(),
        activeProgramId: null,
      }),
    );
  });

  test("a client can log their own body measurement", async () => {
    const db = dbFor("clientA1");
    await assertSucceeds(
      setDoc(doc(db, "bodyMeasurements", "m1"), {
        entryId: "m1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        date: "2026-07-03",
        weightKg: 82.1,
        note: null,
      }),
    );
  });

  test("the owning trainer can log a measurement for their client", async () => {
    const db = dbFor("trainerA");
    await assertSucceeds(
      setDoc(doc(db, "bodyMeasurements", "m1"), {
        entryId: "m1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        date: "2026-07-03",
        weightKg: 82.1,
        note: null,
      }),
    );
  });

  test("a different trainer cannot log a measurement for trainer A's client", async () => {
    const db = dbFor("trainerB");
    await assertFails(
      setDoc(doc(db, "bodyMeasurements", "m1"), {
        entryId: "m1",
        trainerId: "trainerB",
        clientUserId: "clientA1",
        date: "2026-07-03",
        weightKg: 82.1,
        note: null,
      }),
    );
  });

  test("a different trainer cannot read trainer A's client's measurements", async () => {
    await seed((db) =>
      setDoc(doc(db, "bodyMeasurements", "m1"), {
        entryId: "m1",
        trainerId: "trainerA",
        clientUserId: "clientA1",
        date: "2026-07-03",
        weightKg: 82.1,
        note: null,
      }),
    );
    const db = dbFor("trainerB");
    await assertFails(getDoc(doc(db, "bodyMeasurements", "m1")));
  });
});

describe("exercise library (shared reference data)", () => {
  test("any signed-in user can read the exercise library", async () => {
    await seed((db) =>
      setDoc(doc(db, "exerciseLibrary", "back-squat"), {
        exerciseId: "back-squat",
        name: "Back Squat",
        muscleGroup: "QUADS",
        equipment: "Barbell",
      }),
    );
    const db = dbFor("clientA1");
    await assertSucceeds(getDoc(doc(db, "exerciseLibrary", "back-squat")));
  });

  test("an unauthenticated user cannot read the exercise library", async () => {
    await seed((db) =>
      setDoc(doc(db, "exerciseLibrary", "back-squat"), {
        exerciseId: "back-squat",
        name: "Back Squat",
        muscleGroup: "QUADS",
        equipment: "Barbell",
      }),
    );
    const db = dbFor(null);
    await assertFails(getDoc(doc(db, "exerciseLibrary", "back-squat")));
  });

  test("no one can write to the exercise library from the app, not even a trainer", async () => {
    const db = dbFor("trainerA");
    await assertFails(
      setDoc(doc(db, "exerciseLibrary", "back-squat"), {
        exerciseId: "back-squat",
        name: "Back Squat",
        muscleGroup: "QUADS",
        equipment: "Barbell",
      }),
    );
  });
});
