import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/generation?type=daily|monthly&projectId=&year=&month=
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "daily";
  const projectId = searchParams.get("projectId");
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;

  // Verify project belongs to user's company
  const companyId = (session.user as any).companyId;
  const projectFilter = projectId
    ? { id: projectId, companyId }
    : { companyId };
  const projects = await prisma.project.findMany({ where: projectFilter, select: { id: true } });
  const projectIds = projects.map((p) => p.id);

  if (type === "monthly") {
    const records = await prisma.monthlyGeneration.findMany({
      where: {
        projectId: { in: projectIds },
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { project: { select: { name: true, color: true } } },
    });
    return NextResponse.json(records);
  }

  const records = await prisma.dailyGeneration.findMany({
    where: {
      projectId: { in: projectIds },
      ...(year ? { date: { startsWith: `${year}-` } } : {}),
    },
    orderBy: { date: "desc" },
    take: 200,
    include: { project: { select: { name: true, color: true } } },
  });
  return NextResponse.json(records);
}

// POST /api/generation — create daily record
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, date, plannedGeneration, actualGeneration,
          gridAvailability, spillHours, discharge, headLevel } = body;

  // Check project belongs to company
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: (session.user as any).companyId },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const month = parseInt(date.split("-")[1]);
  const isWet = month >= 6 && month <= 11;
  const tariff = isWet ? project.neaTariffWet : project.neaTariffDry;
  const revenue = Math.round(actualGeneration * tariff * 1000);

  const record = await prisma.dailyGeneration.upsert({
    where: { projectId_date: { projectId, date } },
    create: {
      projectId, date, plannedGeneration, actualGeneration,
      gridAvailability: gridAvailability ?? 100,
      spillHours: spillHours ?? 0,
      discharge, headLevel, revenue,
    },
    update: {
      plannedGeneration, actualGeneration,
      gridAvailability: gridAvailability ?? 100,
      spillHours: spillHours ?? 0,
      discharge, headLevel, revenue,
    },
  });

  // Update monthly aggregation
  const [year, monthStr] = date.split("-");
  await recalcMonthly(projectId, parseInt(year), parseInt(monthStr));

  return NextResponse.json(record, { status: 201 });
}

// Recalculate monthly aggregate from daily records
async function recalcMonthly(projectId: string, year: number, month: number) {
  const days = await prisma.dailyGeneration.findMany({
    where: {
      projectId,
      date: { startsWith: `${year}-${String(month).padStart(2, "0")}` },
    },
  });

  if (days.length === 0) return;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  const daysInMonth = new Date(year, month, 0).getDate();
  const maxGen = project.installedCapacity * 24 * daysInMonth;
  const actualGeneration = days.reduce((s, d) => s + d.actualGeneration, 0);
  const plannedGeneration = days.reduce((s, d) => s + d.plannedGeneration, 0);
  const plf = parseFloat(((actualGeneration / maxGen) * 100).toFixed(2));
  const gridAvailability = parseFloat((days.reduce((s, d) => s + d.gridAvailability, 0) / days.length).toFixed(2));
  const spillHours = days.reduce((s, d) => s + d.spillHours, 0);
  const revenue = days.reduce((s, d) => s + d.revenue, 0);
  const isWetSeason = month >= 6 && month <= 11;

  await prisma.monthlyGeneration.upsert({
    where: { projectId_year_month: { projectId, year, month } },
    create: {
      projectId, year, month, actualGeneration, plannedGeneration,
      plf, gridAvailability, spillHours, revenue, isWetSeason,
    },
    update: {
      actualGeneration, plannedGeneration, plf,
      gridAvailability, spillHours, revenue,
    },
  });
}
