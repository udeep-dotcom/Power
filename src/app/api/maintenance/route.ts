import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const companyId = (session.user as any).companyId;

  const projects = await prisma.project.findMany({ where: { companyId }, select: { id: true } });
  const projectIds = projects.map((p) => p.id);

  const logs = await prisma.maintenanceLog.findMany({
    where: {
      projectId: projectId ? projectId : { in: projectIds },
    },
    orderBy: { date: "desc" },
    include: { project: { select: { name: true, color: true } } },
  });

  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const project = await prisma.project.findFirst({
    where: { id: body.projectId, companyId: (session.user as any).companyId },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const log = await prisma.maintenanceLog.create({ data: body });
  return NextResponse.json(log, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, completedDate, duration, cost } = body;

  const log = await prisma.maintenanceLog.update({
    where: { id },
    data: { status, completedDate, duration, cost },
  });

  return NextResponse.json(log);
}
