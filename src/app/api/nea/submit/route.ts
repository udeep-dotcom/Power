import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prepareAndSubmitReport, getSubmissions } from "@/lib/nea";

// GET /api/nea/submit?projectId= — list submissions for a project
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;

  const submissions = await getSubmissions(projectId);
  return NextResponse.json(submissions);
}

// POST /api/nea/submit — submit monthly report to NEA
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ADMIN", "PROJECT_OWNER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Only project owners can submit NEA reports" }, { status: 403 });
  }

  try {
    const { projectId, year, month } = await req.json();
    if (!projectId || !year || !month) {
      return NextResponse.json({ error: "projectId, year, and month are required" }, { status: 400 });
    }

    const result = await prepareAndSubmitReport({ projectId, year, month });
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
