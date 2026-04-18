// Nepal Hydropower Reporting System - Mock Data

export const currentUser = {
  id: "user_1",
  name: "Rajesh Sharma",
  email: "rajesh@nephydro.com.np",
  role: "Project Manager" as const,
  company: "Nepal Hydropower Pvt. Ltd.",
  projects: ["p1", "p2", "p3", "p4"],
};

export const projects = [
  {
    id: "p1",
    name: "Upper Seti Hydropower",
    location: "Pokhara, Kaski",
    river: "Seti Gandaki",
    installedCapacity: 42.5,
    type: "Run-of-River",
    status: "operational" as const,
    operator: "Butwal Power Company",
    commissionDate: "2018-03-15",
    licenseExpiry: "2048-03-14",
    neaTariff: { wet: 5.08, dry: 7.90 },
    coordinates: { lat: 28.25, lng: 83.97 },
    designFlow: 28.4,
    headHeight: 175,
    turbines: 3,
    color: "#3b82f6",
  },
  {
    id: "p2",
    name: "Solu Khola Hydropower",
    location: "Solukhumbu",
    river: "Solu Khola",
    installedCapacity: 86.0,
    type: "Run-of-River",
    status: "operational" as const,
    operator: "Solu Energy Ltd.",
    commissionDate: "2021-07-01",
    licenseExpiry: "2051-06-30",
    neaTariff: { wet: 5.08, dry: 8.40 },
    coordinates: { lat: 27.52, lng: 86.61 },
    designFlow: 45.2,
    headHeight: 580,
    turbines: 4,
    color: "#06b6d4",
  },
  {
    id: "p3",
    name: "Trishuli 3A",
    location: "Dhading",
    river: "Trishuli",
    installedCapacity: 60.0,
    type: "Run-of-River",
    status: "operational" as const,
    operator: "Trishuli Jalavidhyut Company",
    commissionDate: "2016-09-22",
    licenseExpiry: "2046-09-21",
    neaTariff: { wet: 4.80, dry: 7.00 },
    coordinates: { lat: 27.97, lng: 84.75 },
    designFlow: 38.0,
    headHeight: 195,
    turbines: 2,
    color: "#8b5cf6",
  },
  {
    id: "p4",
    name: "Likhu Khola",
    location: "Ramechhap",
    river: "Likhu Khola",
    installedCapacity: 82.4,
    type: "Run-of-River",
    status: "under-maintenance" as const,
    operator: "Likhu Hydropower Ltd.",
    commissionDate: "2022-12-01",
    licenseExpiry: "2052-11-30",
    neaTariff: { wet: 5.08, dry: 8.40 },
    coordinates: { lat: 27.42, lng: 86.10 },
    designFlow: 52.1,
    headHeight: 305,
    turbines: 4,
    color: "#f59e0b",
  },
];

// Monthly generation data for past 24 months (per project)
function genMonthly(projectId: string, capacityMW: number) {
  const records = [];
  // Wet season = Jun-Nov, Dry season = Dec-May
  const seasonFactors = [0.52, 0.48, 0.55, 0.60, 0.72, 0.88, 0.95, 0.97, 0.93, 0.85, 0.70, 0.55];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let year = 2025;
  let monthIdx = 2; // start March 2025, go back to April 2024

  // Generate April 2024 - March 2026 (24 months)
  for (let i = 0; i < 24; i++) {
    const m = (monthIdx + i) % 12;
    const y = year + Math.floor((monthIdx + i) / 12);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const maxGen = capacityMW * 24 * daysInMonth; // MWh if running at 100%
    const factor = seasonFactors[m] * (0.9 + Math.random() * 0.1);
    const planned = maxGen * seasonFactors[m] * 0.88;
    const actual = maxGen * factor * (projectId === "p4" && m >= 0 && y >= 2026 ? 0 : 1);
    const gridAvail = 92 + Math.random() * 7;
    const spillHours = m >= 5 && m <= 8 ? Math.round(Math.random() * 48) : Math.round(Math.random() * 6);
    const isWet = m >= 5 && m <= 10;
    const proj = projects.find(p => p.id === projectId)!;
    const tariff = isWet ? proj.neaTariff.wet : proj.neaTariff.dry;
    records.push({
      id: `${projectId}-${y}-${m + 1}`,
      projectId,
      year: y,
      month: m + 1,
      monthName: months[m],
      daysInMonth,
      plannedGeneration: Math.round(planned),
      actualGeneration: Math.round(actual),
      plf: parseFloat(((actual / maxGen) * 100).toFixed(1)),
      gridAvailability: parseFloat(gridAvail.toFixed(1)),
      spillHours,
      revenue: Math.round(actual * tariff * 1000), // NPR (actual is MWh, tariff is per kWh)
      isWetSeason: isWet,
    });
  }
  return records;
}

export const monthlyGeneration = [
  ...genMonthly("p1", 42.5),
  ...genMonthly("p2", 86.0),
  ...genMonthly("p3", 60.0),
  ...genMonthly("p4", 82.4),
];

// Daily generation for current month (April 2026)
export const dailyGeneration = (() => {
  const records = [];
  const today = 18; // April 18, 2026
  for (const proj of projects) {
    const isWet = false; // April is dry season
    const tariff = isWet ? proj.neaTariff.wet : proj.neaTariff.dry;
    for (let d = 1; d <= today; d++) {
      const maxGen = proj.installedCapacity * 24;
      const factor = 0.58 + Math.random() * 0.15;
      const actual = proj.status === "under-maintenance" && d > 10 ? 0 : maxGen * factor;
      const planned = maxGen * 0.65;
      records.push({
        id: `${proj.id}-2026-4-${d}`,
        projectId: proj.id,
        date: `2026-04-${String(d).padStart(2, "0")}`,
        day: d,
        plannedGeneration: parseFloat(planned.toFixed(1)),
        actualGeneration: parseFloat(actual.toFixed(1)),
        gridAvailability: parseFloat((92 + Math.random() * 7).toFixed(1)),
        spillHours: Math.round(Math.random() * 2),
        discharge: parseFloat((proj.designFlow * (0.55 + Math.random() * 0.25)).toFixed(1)),
        headLevel: parseFloat((proj.headHeight * (0.92 + Math.random() * 0.08)).toFixed(1)),
        revenue: Math.round(actual * tariff * 1000),
      });
    }
  }
  return records;
})();

export const alerts = [
  {
    id: "a1",
    projectId: "p4",
    type: "maintenance",
    severity: "critical" as const,
    title: "Turbine #2 Offline",
    message: "Turbine unit #2 at Likhu Khola tripped due to bearing overheating. Estimated repair: 5 days.",
    date: "2026-04-11",
    resolved: false,
  },
  {
    id: "a2",
    projectId: "p1",
    type: "underperformance",
    severity: "warning" as const,
    title: "Generation Below Target",
    message: "Upper Seti generation is 18% below monthly target. Check intake gate and water level sensors.",
    date: "2026-04-15",
    resolved: false,
  },
  {
    id: "a3",
    projectId: "p2",
    type: "grid",
    severity: "info" as const,
    title: "Grid Outage — NEA Scheduled",
    message: "NEA has scheduled 4-hour grid maintenance on April 20. Expected generation loss: ~344 MWh.",
    date: "2026-04-17",
    resolved: false,
  },
  {
    id: "a4",
    projectId: "p3",
    type: "underperformance",
    severity: "warning" as const,
    title: "Low Water Level",
    message: "Trishuli 3A intake water level dropped to 82% of design head. Monitor sediment trap.",
    date: "2026-04-16",
    resolved: false,
  },
  {
    id: "a5",
    projectId: "p1",
    type: "compliance",
    severity: "info" as const,
    title: "Monthly Report Due",
    message: "NEA monthly generation report for March 2026 is due by April 25. Please prepare submission.",
    date: "2026-04-18",
    resolved: false,
  },
  {
    id: "a6",
    projectId: "p2",
    type: "maintenance",
    severity: "resolved" as const,
    title: "Penstock Inspection Complete",
    message: "Annual penstock inspection completed successfully. No defects found. Next inspection: April 2027.",
    date: "2026-04-05",
    resolved: true,
  },
  {
    id: "a7",
    projectId: "p3",
    type: "grid",
    severity: "resolved" as const,
    title: "Grid Disturbance Resolved",
    message: "NEA 132kV transmission line restored after 6-hour outage. Plant reconnected and ramping up.",
    date: "2026-04-08",
    resolved: true,
  },
];

export const maintenanceLogs = [
  {
    id: "m1",
    projectId: "p4",
    date: "2026-04-11",
    completedDate: null,
    type: "corrective",
    component: "Turbine Unit #2",
    description: "Bearing overheating caused emergency shutdown. Replacing thrust bearing assembly.",
    duration: null,
    estimatedDays: 5,
    technician: "Hari Bahadur Thapa",
    status: "in-progress" as const,
    cost: 2850000,
    generationLoss: 1978,
  },
  {
    id: "m2",
    projectId: "p2",
    date: "2026-04-03",
    completedDate: "2026-04-05",
    type: "preventive",
    component: "Penstock & Intake Gates",
    description: "Annual inspection of penstock for corrosion, cracks. Gate seals checked and lubricated.",
    duration: 48,
    estimatedDays: 2,
    technician: "Binod Gurung",
    status: "completed" as const,
    cost: 180000,
    generationLoss: 0,
  },
  {
    id: "m3",
    projectId: "p1",
    date: "2026-03-20",
    completedDate: "2026-03-21",
    type: "preventive",
    component: "Governor System",
    description: "Governor calibration and hydraulic oil change on all 3 turbine units.",
    duration: 18,
    estimatedDays: 1,
    technician: "Suman Tamang",
    status: "completed" as const,
    cost: 95000,
    generationLoss: 918,
  },
  {
    id: "m4",
    projectId: "p3",
    date: "2026-03-10",
    completedDate: "2026-03-12",
    type: "corrective",
    component: "Transformer Unit #1",
    description: "Oil leak detected at main power transformer. Oil replaced and seal repaired.",
    duration: 36,
    estimatedDays: 2,
    technician: "Prakash Adhikari",
    status: "completed" as const,
    cost: 420000,
    generationLoss: 2160,
  },
  {
    id: "m5",
    projectId: "p1",
    date: "2026-04-25",
    completedDate: null,
    type: "preventive",
    component: "Desanding Basin",
    description: "Pre-monsoon desanding basin flush and inspection before wet season begins.",
    duration: null,
    estimatedDays: 1,
    technician: "Suman Tamang",
    status: "scheduled" as const,
    cost: 45000,
    generationLoss: 0,
  },
  {
    id: "m6",
    projectId: "p2",
    date: "2026-05-15",
    completedDate: null,
    type: "preventive",
    component: "All Turbines",
    description: "Pre-monsoon turbine runner inspection and blade cleaning for high-flow season.",
    duration: null,
    estimatedDays: 3,
    technician: "Binod Gurung",
    status: "scheduled" as const,
    cost: 320000,
    generationLoss: 0,
  },
];

// Summary stats computed from data
export function getProjectStats(projectId: string) {
  const proj = projects.find(p => p.id === projectId)!;
  const monthly = monthlyGeneration.filter(r => r.projectId === projectId);
  const lastMonth = monthly[monthly.length - 1];
  const ytd = monthly.filter(r => r.year === 2026);
  const totalGenYTD = ytd.reduce((s, r) => s + r.actualGeneration, 0);
  const totalRevYTD = ytd.reduce((s, r) => s + r.revenue, 0);
  const avgPLF = ytd.length ? ytd.reduce((s, r) => s + r.plf, 0) / ytd.length : 0;
  return { proj, lastMonth, totalGenYTD, totalRevYTD, avgPLF };
}

export function getPortfolioSummary() {
  const allMonthly = monthlyGeneration;
  const ytd = allMonthly.filter(r => r.year === 2026);
  const totalCapacity = projects.reduce((s, p) => s + p.installedCapacity, 0);
  const totalGenYTD = ytd.reduce((s, r) => s + r.actualGeneration, 0);
  const totalRevYTD = ytd.reduce((s, r) => s + r.revenue, 0);
  const avgPLF = ytd.length ? ytd.reduce((s, r) => s + r.plf, 0) / ytd.length : 0;
  const activeAlerts = alerts.filter(a => !a.resolved).length;
  return { totalCapacity, totalGenYTD, totalRevYTD, avgPLF, activeAlerts };
}
