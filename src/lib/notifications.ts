import nodemailer from "nodemailer";
import twilio from "twilio";
import { prisma } from "@/lib/db";

// ─── Email Transport ───────────────────────────────────────────────────────────

function getMailTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  alertId,
}: {
  to: string;
  subject: string;
  html: string;
  alertId: string;
}) {
  const log = await prisma.notificationLog.create({
    data: {
      alertId,
      channel: "email",
      recipient: to,
      subject,
      body: html,
      status: "pending",
    },
  });

  try {
    const transport = getMailTransport();
    await transport.sendMail({
      from: process.env.SMTP_FROM || "HydroTrack Nepal <noreply@hydrotrack.np>",
      to,
      subject,
      html,
    });
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "sent" },
    });
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "failed", error },
    });
    return { success: false, error };
  }
}

// ─── SMS ───────────────────────────────────────────────────────────────────────

export async function sendSMS({
  to,
  body,
  alertId,
}: {
  to: string;
  body: string;
  alertId: string;
}) {
  const log = await prisma.notificationLog.create({
    data: {
      alertId,
      channel: "sms",
      recipient: to,
      body,
      status: "pending",
    },
  });

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await client.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to,
    });
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "sent" },
    });
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "failed", error },
    });
    return { success: false, error };
  }
}

// ─── Alert notification builder ────────────────────────────────────────────────

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  warning: "🟡",
  info: "🔵",
};

export function buildAlertEmail(alert: {
  severity: string;
  title: string;
  message: string;
  projectName: string;
  date: string;
}): { subject: string; html: string } {
  const emoji = SEVERITY_EMOJI[alert.severity] ?? "⚪";
  const subject = `${emoji} [${alert.severity.toUpperCase()}] ${alert.title} — ${alert.projectName}`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0f1a;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1e3a5f,#0f1929);padding:24px 28px;border-bottom:1px solid #1e3a5f">
        <div style="font-size:22px;font-weight:700">HydroTrack Nepal</div>
        <div style="font-size:13px;color:#6b7280;margin-top:2px">Hydropower Reporting System</div>
      </div>
      <div style="padding:28px">
        <div style="background:${alert.severity === "critical" ? "#7f1d1d" : alert.severity === "warning" ? "#78350f" : "#1e3a5f"};
             border-radius:8px;padding:4px 12px;display:inline-block;font-size:12px;font-weight:600;margin-bottom:16px">
          ${emoji} ${alert.severity.toUpperCase()}
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700">${alert.title}</h2>
        <p style="color:#9ca3af;font-size:13px;margin:0 0 16px">
          ${alert.projectName} · ${alert.date}
        </p>
        <p style="color:#d1d5db;line-height:1.6;margin:0 0 24px">${alert.message}</p>
        <a href="${process.env.NEXTAUTH_URL}/alerts"
           style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;padding:10px 20px;
                  border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
          View in HydroTrack →
        </a>
      </div>
      <div style="padding:16px 28px;background:#0f1929;font-size:12px;color:#4b5563">
        Sent by HydroTrack Nepal Automated Alert System. To manage notifications, visit Settings.
      </div>
    </div>
  `;
  return { subject, html };
}

export function buildAlertSMS(alert: {
  severity: string;
  title: string;
  projectName: string;
}): string {
  const emoji = SEVERITY_EMOJI[alert.severity] ?? "⚪";
  return `${emoji} HydroTrack Nepal [${alert.severity.toUpperCase()}]\n${alert.projectName}: ${alert.title}\nView: ${process.env.NEXTAUTH_URL}/alerts`;
}

// ─── Trigger alert notifications ───────────────────────────────────────────────

export async function triggerAlertNotifications(alertId: string) {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: { project: { include: { company: { include: { users: true } } } } },
  });

  if (!alert) throw new Error("Alert not found");

  const { subject, html } = buildAlertEmail({
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    projectName: alert.project.name,
    date: new Date(alert.createdAt).toLocaleDateString("en-NP"),
  });

  const smsBody = buildAlertSMS({
    severity: alert.severity,
    title: alert.title,
    projectName: alert.project.name,
  });

  // Notify all users in the company
  const users = alert.project.company.users;
  const results = await Promise.allSettled(
    users.flatMap((user) => [
      sendEmail({ to: user.email, subject, html, alertId }),
      // Only send SMS to critical alerts (to avoid noise)
      ...(alert.severity === "critical"
        ? [sendSMS({ to: `+977${user.email.split("@")[0]}`, body: smsBody, alertId })]
        : []),
    ])
  );

  // Mark alert as notified
  await prisma.alert.update({
    where: { id: alertId },
    data: { notified: true },
  });

  return results;
}
