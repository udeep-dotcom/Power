/**
 * NEA (Nepal Electricity Authority) Integration Service
 *
 * Nepal's NEA does not yet have a public REST API for IPP generation reporting.
 * This service simulates the submission workflow and is structured to be easily
 * wired to a real endpoint when NEA publishes one.
 *
 * Current workflow:
 *   1. Prepare report data in NEA's monthly generation report format
 *   2. POST to NEA_API_URL (mock in dev, real endpoint in production)
 *   3. Store submission status + reference number in NeaSubmission table
 *   4. Support re-submission and status checks
 */

import { prisma } from "@/lib/db";

export type NeaReportPayload = {
  projectName: string;
  licenseNo: string;
  year: number;
  month: number;
  installedCapacity: number;
  energyGenerated: number;     // MWh
  energyDelivered: number;     // MWh (after transmission loss)
  peakDemand: number;          // MW
  plantLoadFactor: number;     // %
  availabilityFactor: number;  // %
  gridAvailability: number;    // %
  spillHours: number;
  forcedOutageHours: number;
  plannedOutageHours: number;
  revenue: number;             // NPR
  tariffApplied: number;       // NPR/kWh
  season: "wet" | "dry";
  remarks?: string;
};

function generateReferenceNo(projectId: string, year: number, month: number): string {
  const prefix = "NEA-IPP";
  const ts = Date.now().toString(36).toUpperCase();
  const monthStr = String(month).padStart(2, "0");
  return `${prefix}-${year}-${monthStr}-${ts}`;
}

async function submitToNEA(payload: NeaReportPayload): Promise<{
  success: boolean;
  referenceNo?: string;
  message: string;
  raw?: unknown;
}> {
  const neaApiUrl = process.env.NEA_API_URL;
  const neaApiKey = process.env.NEA_API_KEY;

  // If no real API URL configured, simulate submission
  if (!neaApiUrl || neaApiUrl.includes("api.nea.org.np")) {
    // Simulate a 1s network delay
    await new Promise((r) => setTimeout(r, 1000));

    // Simulate occasional rejection for testing
    const shouldReject = Math.random() < 0.05;
    if (shouldReject) {
      return {
        success: false,
        message: "NEA API: Submission rejected — energy delivered exceeds installed capacity × hours. Please verify data.",
      };
    }

    return {
      success: true,
      referenceNo: generateReferenceNo(payload.projectName, payload.year, payload.month),
      message: "Submission acknowledged by NEA (simulated). Reference number issued.",
    };
  }

  // Real API call
  try {
    const res = await fetch(neaApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": neaApiKey ?? "",
        "X-Source": "HydroTrack-Nepal",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message ?? "NEA API error", raw: data };
    }
    return {
      success: true,
      referenceNo: data.referenceNo ?? generateReferenceNo(payload.projectName, payload.year, payload.month),
      message: data.message ?? "Submission successful",
      raw: data,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error reaching NEA API",
    };
  }
}

export async function prepareAndSubmitReport({
  projectId,
  year,
  month,
}: {
  projectId: string;
  year: number;
  month: number;
}) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const monthlyData = await prisma.monthlyGeneration.findUnique({
    where: { projectId_year_month: { projectId, year, month } },
  });
  if (!monthlyData) throw new Error("No generation data found for this period");

  const daysInMonth = new Date(year, month, 0).getDate();
  const maxPossible = project.installedCapacity * 24 * daysInMonth;
  const availabilityFactor = parseFloat(
    ((monthlyData.actualGeneration / maxPossible) * 100).toFixed(2)
  );

  const payload: NeaReportPayload = {
    projectName: project.name,
    licenseNo: `IPP-${project.id.slice(0, 8).toUpperCase()}`,
    year,
    month,
    installedCapacity: project.installedCapacity,
    energyGenerated: monthlyData.actualGeneration,
    energyDelivered: Math.round(monthlyData.actualGeneration * 0.985), // ~1.5% transmission loss
    peakDemand: project.installedCapacity,
    plantLoadFactor: monthlyData.plf,
    availabilityFactor,
    gridAvailability: monthlyData.gridAvailability,
    spillHours: monthlyData.spillHours,
    forcedOutageHours: Math.round((100 - monthlyData.gridAvailability) / 100 * 24 * daysInMonth),
    plannedOutageHours: 0,
    revenue: monthlyData.revenue,
    tariffApplied: monthlyData.isWetSeason ? project.neaTariffWet : project.neaTariffDry,
    season: monthlyData.isWetSeason ? "wet" : "dry",
  };

  // Upsert submission record
  const existing = await prisma.neaSubmission.findUnique({
    where: { projectId_year_month: { projectId, year, month } },
  });

  const submissionRecord = existing
    ? await prisma.neaSubmission.update({
        where: { id: existing.id },
        data: { status: "draft", reportData: JSON.stringify(payload) },
      })
    : await prisma.neaSubmission.create({
        data: {
          projectId,
          year,
          month,
          status: "draft",
          reportData: JSON.stringify(payload),
        },
      });

  // Submit to NEA
  const result = await submitToNEA(payload);

  await prisma.neaSubmission.update({
    where: { id: submissionRecord.id },
    data: {
      status: result.success ? "submitted" : "rejected",
      submittedAt: result.success ? new Date() : null,
      referenceNo: result.referenceNo ?? null,
      remarks: result.message,
    },
  });

  return {
    success: result.success,
    referenceNo: result.referenceNo,
    message: result.message,
    payload,
  };
}

export async function getSubmissions(projectId?: string) {
  return prisma.neaSubmission.findMany({
    where: projectId ? { projectId } : undefined,
    include: { project: { select: { name: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}
