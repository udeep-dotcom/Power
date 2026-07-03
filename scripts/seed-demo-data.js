/**
 * Seeds two independent trainer accounts with clients, active programs, and a few
 * logged sessions, for the "trainer A builds a program -> client logs a session ->
 * trainer A sees it, while trainer B's account shows none of it" demo.
 *
 * Uses the Firebase Admin SDK, which bypasses security rules by design - this is a
 * trusted, server-side seeding tool, not something the app itself does.
 *
 * Usage:
 *   Against the local emulator (safe, default):
 *     firebase emulators:start --only firestore,auth &
 *     FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *       node seed-demo-data.js --project pt-companion-demo
 *
 *   Against a real Firebase project (requires GOOGLE_APPLICATION_CREDENTIALS pointing
 *   at a service account key with Firestore + Auth admin access):
 *     node seed-demo-data.js --project <your-real-project-id>
 */
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const projectIdFlagIndex = process.argv.indexOf("--project");
const projectId =
  projectIdFlagIndex !== -1 ? process.argv[projectIdFlagIndex + 1] : "pt-companion-demo";

const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

admin.initializeApp({ projectId });
const db = admin.firestore();
const auth = admin.auth();

const DEMO_PASSWORD = "Passw0rd!";

const trainers = [
  {
    uid: "demo-trainer-a",
    email: "trainer.a@ptcompanion.demo",
    displayName: "Priya Trainer",
    clients: [
      { uid: "demo-client-a1", email: "alice@ptcompanion.demo", displayName: "Alice Chen" },
      { uid: "demo-client-a2", email: "ben@ptcompanion.demo", displayName: "Ben Ortiz" },
      { uid: "demo-client-a3", email: "carla@ptcompanion.demo", displayName: "Carla Nguyen" },
    ],
  },
  {
    uid: "demo-trainer-b",
    email: "trainer.b@ptcompanion.demo",
    displayName: "Marcus Trainer",
    clients: [
      { uid: "demo-client-b1", email: "diego@ptcompanion.demo", displayName: "Diego Alvarez" },
      { uid: "demo-client-b2", email: "elena@ptcompanion.demo", displayName: "Elena Petrova" },
    ],
  },
];

async function ensureAuthUser(uid, email, displayName) {
  try {
    await auth.getUser(uid);
    await auth.updateUser(uid, { email, password: DEMO_PASSWORD, displayName });
  } catch (e) {
    await auth.createUser({ uid, email, password: DEMO_PASSWORD, displayName, emailVerified: true });
  }
}

async function seedExerciseLibrary() {
  const seedPath = path.resolve(__dirname, "../app/src/main/assets/exercise_library_seed.json");
  const exercises = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const batch = db.batch();
  for (const ex of exercises) {
    batch.set(db.collection("exerciseLibrary").doc(ex.exerciseId), ex);
  }
  await batch.commit();
  console.log(`Seeded ${exercises.length} exercise library items.`);
}

function buildTemplateProgram(trainerId, programId, name) {
  return {
    programId,
    trainerId,
    name,
    isTemplate: true,
    clientUserId: null,
    clonedFromTemplateId: null,
    weeks: [
      {
        weekId: "week-1",
        index: 0,
        days: [
          {
            dayId: "day-1",
            index: 0,
            label: "Day 1 - Lower Body",
            exercises: [
              {
                exerciseId: "back-squat",
                exerciseName: "Back Squat",
                orderIndex: 0,
                sets: 4,
                reps: "6-8",
                targetWeightKg: 60,
                targetRpe: 8,
                restSeconds: 120,
                coachingNote: "Brace hard, full depth.",
              },
              {
                exerciseId: "romanian-deadlift",
                exerciseName: "Romanian Deadlift",
                orderIndex: 1,
                sets: 3,
                reps: "8-10",
                targetWeightKg: 50,
                targetRpe: 7,
                restSeconds: 90,
                coachingNote: null,
              },
            ],
          },
          {
            dayId: "day-2",
            index: 1,
            label: "Day 2 - Upper Body",
            exercises: [
              {
                exerciseId: "bench-press",
                exerciseName: "Barbell Bench Press",
                orderIndex: 0,
                sets: 4,
                reps: "5-6",
                targetWeightKg: 45,
                targetRpe: 8,
                restSeconds: 120,
                coachingNote: "Pause each rep on the chest.",
              },
              {
                exerciseId: "barbell-row",
                exerciseName: "Barbell Row",
                orderIndex: 1,
                sets: 3,
                reps: "8-10",
                targetWeightKg: 40,
                targetRpe: 7,
                restSeconds: 90,
                coachingNote: null,
              },
            ],
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function seedTrainer(trainer) {
  await ensureAuthUser(trainer.uid, trainer.email, trainer.displayName);
  await db.collection("trainers").doc(trainer.uid).set({
    trainerId: trainer.uid,
    displayName: trainer.displayName,
    email: trainer.email,
    plan: "free",
    createdAt: new Date().toISOString(),
  });

  const templateId = `tmpl-${trainer.uid}`;
  const template = buildTemplateProgram(trainer.uid, templateId, "Foundations Strength Block");
  await db.collection("programs").doc(templateId).set(template);

  for (const [i, client] of trainer.clients.entries()) {
    await ensureAuthUser(client.uid, client.email, client.displayName);

    const inviteCode = `${trainer.uid.slice(-1).toUpperCase()}${1000 + i}`;
    await db.collection("inviteCodes").doc(inviteCode).set({
      code: inviteCode,
      trainerId: trainer.uid,
      clientDisplayName: client.displayName,
      createdAt: new Date().toISOString(),
      expiresAt: null,
      used: true,
      usedByClientUserId: client.uid,
      usedAt: new Date().toISOString(),
    });

    const programId = `prog-${client.uid}`;
    const clientProgram = {
      ...buildTemplateProgram(trainer.uid, programId, template.name),
      isTemplate: false,
      clientUserId: client.uid,
      clonedFromTemplateId: templateId,
    };
    await db.collection("programs").doc(programId).set(clientProgram);

    await db.collection("clients").doc(client.uid).set({
      clientUserId: client.uid,
      trainerId: trainer.uid,
      displayName: client.displayName,
      email: client.email,
      joinedAt: new Date().toISOString(),
      activeProgramId: programId,
      redeemedInviteCode: inviteCode,
    });

    // First client of each trainer gets a completed session today, to drive the
    // "client logs a session -> trainer sees it" part of the demo. Others get a
    // mix of completed/scheduled history so the roster shows both compliance states.
    const today = new Date().toISOString().slice(0, 10);
    const sessionId = `sess-${client.uid}-1`;
    const completed = i === 0;
    await db.collection("sessions").doc(sessionId).set({
      sessionId,
      trainerId: trainer.uid,
      clientUserId: client.uid,
      programId,
      dayId: "day-1",
      dayLabel: "Day 1 - Lower Body",
      scheduledDate: today,
      status: completed ? "COMPLETED" : "SCHEDULED",
      completedAt: completed ? new Date().toISOString() : null,
      exercises: completed
        ? [
            {
              exerciseId: "back-squat",
              exerciseName: "Back Squat",
              orderIndex: 0,
              sets: [
                { setIndex: 0, targetReps: "6-8", actualReps: 7, actualWeightKg: 60, rpe: 8, completed: true },
                { setIndex: 1, targetReps: "6-8", actualReps: 7, actualWeightKg: 60, rpe: 8, completed: true },
                { setIndex: 2, targetReps: "6-8", actualReps: 6, actualWeightKg: 62.5, rpe: 8.5, completed: true },
              ],
            },
          ]
        : [],
    });

    console.log(`  seeded client ${client.displayName} (${client.uid}) for ${trainer.displayName}`);
  }

  console.log(`Seeded trainer ${trainer.displayName} (${trainer.uid}) with ${trainer.clients.length} clients.`);
}

async function main() {
  console.log(`Seeding project "${projectId}" ${usingEmulator ? "(emulator)" : "(REAL PROJECT)"}`);
  if (!usingEmulator) {
    console.log(
      "WARNING: FIRESTORE_EMULATOR_HOST is not set - this will write to a real Firebase project.",
    );
  }

  await seedExerciseLibrary();
  for (const trainer of trainers) {
    await seedTrainer(trainer);
  }

  console.log("\nDone. Demo login credentials (email / password):");
  for (const trainer of trainers) {
    console.log(`  ${trainer.email} / ${DEMO_PASSWORD}  (trainer, ${trainer.clients.length} clients)`);
    for (const client of trainer.clients) {
      console.log(`    ${client.email} / ${DEMO_PASSWORD}  (client of ${trainer.displayName})`);
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
