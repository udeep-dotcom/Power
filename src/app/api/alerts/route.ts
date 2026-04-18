import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get("resolved");

  const companyId = (session.user as any).companyId;
  const projects = await prisma.project.findMany({ where: { companyId }, select: { id: true } });
  const projectIds = projects.map((p) => p.id);

  const alerts = await prisma.alert.findMany({
    where: {
      projectId: { in: projectIds },
      ...(resolved !== null ? { resolved: resolved === "true" } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { name: true, color: true } } },
  });

  return NextResponse.json(alerts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, type, severity, title, message } = body;

  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: (session.user as any).companyId },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const alert = await prisma.alert.create({
    data: { projectId, type, severity, title, message },
  });

  return NextResponse.json(alert, { status: 201 });
}

// PATCH /api/alerts/:id — resolve or update
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, resolved } = body;

  const alert = await prisma.alert.update({
    where: { id },
    data: {
      resolved,
      resolvedAt: resolved ? new Date() : null,
    },
  });

  return NextResponse.json(alert);
}
