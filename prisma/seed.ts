import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding HydroTrack Nepal database...");

  // ── Company ────────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: "company_nepal_hydro" },
    update: {},
    create: {
      id: "company_nepal_hydro",
      name: "Nepal Hydropower Pvt. Ltd.",
    },
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash("hydrotrack123", 12);

  await prisma.user.upsert({
    where: { email: "admin@nephydro.com.np" },
    update: {},
    create: {
      name: "Rajesh Sharma",
      email: "admin@nephydro.com.np",
      password: pw,
      role: "ADMIN",
      companyId: company.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "owner@nephydro.com.np" },
    update: {},
    create: {
      name: "Sita Thapa",
      email: "owner@nephydro.com.np",
      password: pw,
      role: "PROJECT_OWNER",
      companyId: company.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "engineer@nephydro.com.np" },
    update: {},
    create: {
      name: "Bikash Gurung",
      email: "engineer@nephydro.com.np",
      password: pw,
      role: "ENGINEER",
      companyId: company.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "exec@nephydro.com.np" },
    update: {},
    create: {
      name: "Arun Pradhan",
      email: "exec@nephydro.com.np",
      password: pw,
      role: "EXECUTIVE",
      companyId: company.id,
    },
  });

  // ── Projects ───────────────────────────────────────────────────────────────
  const projectDefs = [
    {
      id: "p1", name: "Upper Seti Hydropower", location: "Pokhara, Kaski",
      river: "Seti Gandaki", installedCapacity: 42.5, type: "Run-of-River",
      status: "operational", operator: "Butwal Power Company",
      commissionDate: "2018-03-15", licenseExpiry: "2048-03-14",
      neaTariffWet: 5.08, neaTariffDry: 7.90, designFlow: 28.4,
      headHeight: 175, turbines: 3, color: "#3b82f6",
    },
    {
      id: "p2", name: "Solu Khola Hydropower", location: "Solukhumbu",
      river: "Solu Khola", installedCapacity: 86.0, type: "Run-of-River",
      status: "operational", operator: "Solu Energy Ltd.",
      commissionDate: "2021-07-01", licenseExpiry: "2051-06-30",
      neaTariffWet: 5.08, neaTariffDry: 8.40, designFlow: 45.2,
      headHeight: 580, turbines: 4, color: "#06b6d4",
    },
    {
      id: "p3", name: "Trishuli 3A", location: "Dhading",
      river: "Trishuli", installedCapacity: 60.0, type: "Run-of-River",
      status: "operational", operator: "Trishuli Jalavidhyut Company",
      commissionDate: "2016-09-22", licenseExpiry: "2046-09-21",
      neaTariffWet: 4.80, neaTariffDry: 7.00, designFlow: 38.0,
      headHeight: 195, turbines: 2, color: "#8b5cf6",
    },
    {
      id: "p4", name: "Likhu Khola", location: "Ramechhap",
      river: "Likhu Khola", installedCapacity: 82.4, type: "Run-of-River",
      status: "under-maintenance", operator: "Likhu Hydropower Ltd.",
      commissionDate: "2022-12-01", licenseExpiry: "2052-11-30",
      neaTariffWet: 5.08, neaTariffDry: 8.40, designFlow: 52.1,
      headHeight: 305, turbines: 4, color: "#f59e0b",
    },
  ];

  for (const p of projectDefs) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, companyId: company.id },
    });
  }

  // ── Monthly Generation (24 months: Apr 2024 – Mar 2026) ───────────────────
  const seasonFactors = [0.52, 0.48, 0.55, 0.60, 0.72, 0.88, 0.95, 0.97, 0.93, 0.85, 0.70, 0.55];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  for (const proj of projectDefs) {
    for (let i = 0; i < 24; i++) {
      const d = new Date(2024, 3 + i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const m = month - 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      const maxGen = proj.installedCapacity * 24 * daysInMonth;
      const factor = seasonFactors[m] * (0.88 + Math.random() * 0.1);
      const actualGeneration = Math.round(maxGen * factor);
      const plannedGeneration = Math.round(maxGen * seasonFactors[m] * 0.88);
      const plf = parseFloat(((actualGeneration / maxGen) * 100).toFixed(1));
      const gridAvailability = parseFloat((92 + Math.random() * 7).toFixed(1));
      const spillHours = m >= 5 && m <= 8 ? Math.round(Math.random() * 48) : Math.round(Math.random() * 6);
      const isWetSeason = m >= 5 && m <= 10;
      const tariff = isWetSeason ? proj.neaTariffWet : proj.neaTariffDry;
      const revenue = Math.round(actualGeneration * tariff * 1000);

      await prisma.monthlyGeneration.upsert({
        where: { projectId_year_month: { projectId: proj.id, year, month } },
        update: {},
        create: {
          projectId: proj.id, year, month, plannedGeneration,
          actualGeneration, plf, gridAvailability, spillHours, revenue, isWetSeason,
        },
      });
    }
  }

  // ── Daily Generation (April 2026, days 1–18) ──────────────────────────────
  for (const proj of projectDefs) {
    for (let day = 1; day <= 18; day++) {
      const date = `2026-04-${String(day).padStart(2, "0")}`;
      const maxGen = proj.installedCapacity * 24;
      const factor = 0.58 + Math.random() * 0.15;
      const actualGeneration = proj.status === "under-maintenance" && day > 10
        ? 0
        : parseFloat((maxGen * factor).toFixed(1));
      const plannedGeneration = parseFloat((maxGen * 0.65).toFixed(1));
      const tariff = proj.neaTariffDry;
      const revenue = Math.round(actualGeneration * tariff * 1000);

      await prisma.dailyGeneration.upsert({
        where: { projectId_date: { projectId: proj.id, date } },
        update: {},
        create: {
          projectId: proj.id, date, plannedGeneration, actualGeneration,
          gridAvailability: parseFloat((92 + Math.random() * 7).toFixed(1)),
          spillHours: Math.round(Math.random() * 2),
          discharge: parseFloat((proj.designFlow * (0.55 + Math.random() * 0.25)).toFixed(1)),
          revenue,
        },
      });
    }
  }

  // ── Alerts ────────────────────────────────────────────────────────────────
  const alertDefs = [
    {
      id: "a1", projectId: "p4", type: "maintenance", severity: "critical",
      title: "Turbine #2 Offline",
      message: "Turbine unit #2 at Likhu Khola tripped due to bearing overheating. Estimated repair: 5 days.",
      resolved: false,
    },
    {
      id: "a2", projectId: "p1", type: "underperformance", severity: "warning",
      title: "Generation Below Target",
      message: "Upper Seti generation is 18% below monthly target. Check intake gate and water level sensors.",
      resolved: false,
    },
    {
      id: "a3", projectId: "p2", type: "grid", severity: "info",
      title: "Grid Outage — NEA Scheduled",
      message: "NEA has scheduled 4-hour grid maintenance on April 20. Expected generation loss: ~344 MWh.",
      resolved: false,
    },
    {
      id: "a4", projectId: "p3", type: "underperformance", severity: "warning",
      title: "Low Water Level",
      message: "Trishuli 3A intake water level dropped to 82% of design head. Monitor sediment trap.",
      resolved: false,
    },
    {
      id: "a5", projectId: "p1", type: "compliance", severity: "info",
      title: "Monthly Report Due",
      message: "NEA monthly generation report for March 2026 is due by April 25. Please prepare submission.",
      resolved: false,
    },
    {
      id: "a6", projectId: "p2", type: "maintenance", severity: "info",
      title: "Penstock Inspection Complete",
      message: "Annual penstock inspection completed successfully. No defects found. Next inspection: April 2027.",
      resolved: true,
    },
  ];

  for (const a of alertDefs) {
    await prisma.alert.upsert({
      where: { id: a.id },
      update: {},
      create: { ...a },
    });
  }

  // ── Maintenance Logs ──────────────────────────────────────────────────────
  const maintDefs = [
    {
      id: "m1", projectId: "p4", date: "2026-04-11", completedDate: null,
      type: "corrective", component: "Turbine Unit #2",
      description: "Bearing overheating caused emergency shutdown. Replacing thrust bearing assembly.",
      duration: null, estimatedDays: 5, technician: "Hari Bahadur Thapa",
      status: "in-progress", cost: 2850000, generationLoss: 1978,
    },
    {
      id: "m2", projectId: "p2", date: "2026-04-03", completedDate: "2026-04-05",
      type: "preventive", component: "Penstock & Intake Gates",
      description: "Annual inspection of penstock. Gate seals checked and lubricated.",
      duration: 48, estimatedDays: 2, technician: "Binod Gurung",
      status: "completed", cost: 180000, generationLoss: 0,
    },
    {
      id: "m3", projectId: "p1", date: "2026-03-20", completedDate: "2026-03-21",
      type: "preventive", component: "Governor System",
      description: "Governor calibration and hydraulic oil change on all 3 turbine units.",
      duration: 18, estimatedDays: 1, technician: "Suman Tamang",
      status: "completed", cost: 95000, generationLoss: 918,
    },
    {
      id: "m5", projectId: "p1", date: "2026-04-25", completedDate: null,
      type: "preventive", component: "Desanding Basin",
      description: "Pre-monsoon desanding basin flush and inspection before wet season begins.",
      duration: null, estimatedDays: 1, technician: "Suman Tamang",
      status: "scheduled", cost: 45000, generationLoss: 0,
    },
  ];

  for (const m of maintDefs) {
    await prisma.maintenanceLog.upsert({
      where: { id: m.id },
      update: {},
      create: { ...m },
    });
  }

  console.log("✅ Seed complete!");
  console.log("\n📋 Demo credentials:");
  console.log("  Admin:          admin@nephydro.com.np    / hydrotrack123");
  console.log("  Project Owner:  owner@nephydro.com.np   / hydrotrack123");
  console.log("  Engineer:       engineer@nephydro.com.np / hydrotrack123");
  console.log("  Executive:      exec@nephydro.com.np    / hydrotrack123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
