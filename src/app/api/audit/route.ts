import { NextResponse } from "next/server";

import { generateWebsiteInsights } from "@/lib/ai/generateInsights";
import { computeBasicMetrics } from "@/lib/metrics/computeBasicMetrics";
import { scrapePageDom } from "@/lib/scraper/extractDom";
import type {
  AuditApiErrorResponse,
  AuditApiSuccessResponse,
  AuditRequestBody,
} from "@/types/audit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuditRequestBody;
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Request body must include a non-empty 'url'." },
        { status: 400 },
      );
    }

    const $ = await scrapePageDom(url);
    const metrics = computeBasicMetrics($, url);
    const pageText = $("body").text().replace(/\s+/g, " ").trim();
    const insights = await generateWebsiteInsights({ metrics, pageText });
    const { recommendations, ...analysis } = insights;

    const response: AuditApiSuccessResponse = {
      ok: true,
      inputUrl: url,
      metrics,
      analysis,
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected scrape error.";
    const response: AuditApiErrorResponse = { ok: false, error: message };

    return NextResponse.json(response, { status: 500 });
  }
}
