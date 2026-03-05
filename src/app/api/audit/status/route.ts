import { NextResponse } from "next/server";

import { getAuditJob } from "@/lib/auditJobStore";
import type { AuditJobResponse } from "@/types/audit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId")?.trim();

  if (!jobId) {
    const errorResponse: AuditJobResponse = {
      ok: false,
      error: "Query param 'jobId' is required.",
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  const job = getAuditJob(jobId);

  if (!job) {
    const errorResponse: AuditJobResponse = {
      ok: false,
      error: "Audit job not found or expired.",
    };
    return NextResponse.json(errorResponse, { status: 404 });
  }

  const successResponse: AuditJobResponse = { ok: true, job };
  return NextResponse.json(successResponse);
}
