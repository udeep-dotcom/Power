import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { triggerAlertNotifications } from "@/lib/notifications";

// POST /api/notifications/trigger — send email+SMS for an alert
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { alertId } = await req.json();
  if (!alertId) {
    return NextResponse.json({ error: "alertId is required" }, { status: 400 });
  }

  try {
    const results = await triggerAlertNotifications(alertId);
    const failed = results.filter((r) => r.status === "rejected").length;
    return NextResponse.json({
      sent: results.length - failed,
      failed,
      message: failed === 0 ? "All notifications sent successfully" : `${failed} notification(s) failed`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to trigger notifications";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
