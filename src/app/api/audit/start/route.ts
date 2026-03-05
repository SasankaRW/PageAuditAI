import { NextResponse } from "next/server";

import {
  completeAuditJob,
  createAuditJob,
  failAuditJob,
  setAuditJobMetrics,
  setAuditJobStage,
} from "@/lib/auditJobStore";
import { generateWebsiteInsights } from "@/lib/ai/generateInsights";
import { computeBasicMetrics } from "@/lib/metrics/computeBasicMetrics";
import { parseHtmlToDom } from "@/lib/scraper/extractDom";
import { fetchPageHtml } from "@/lib/scraper/fetchPage";
import type { AuditJobResponse, AuditRequestBody } from "@/types/audit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuditRequestBody;
    const url = body?.url?.trim();

    if (!url) {
      const errorResponse: AuditJobResponse = {
        ok: false,
        error: "Request body must include a non-empty 'url'.",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const job = createAuditJob(url);

    const html = await fetchPageHtml(url);
    setAuditJobStage(job.jobId, "extracting_metrics");

    const $ = parseHtmlToDom(html);
    const metrics = computeBasicMetrics($, url);
    const pageText = $("body").text().replace(/\s+/g, " ").trim();
    const updatedJob = setAuditJobMetrics(job.jobId, metrics);

    void generateInsightsInBackground(job.jobId, metrics, pageText);

    const successResponse: AuditJobResponse = {
      ok: true,
      job: updatedJob ?? job,
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start audit.";
    const errorResponse: AuditJobResponse = { ok: false, error: message };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

async function generateInsightsInBackground(
  jobId: string,
  metrics: ReturnType<typeof computeBasicMetrics>,
  pageText: string,
) {
  try {
    const insights = await generateWebsiteInsights({ metrics, pageText });
    const { recommendations, ...analysis } = insights;
    completeAuditJob(jobId, { analysis, recommendations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI analysis failed.";
    failAuditJob(jobId, message);
  }
}
