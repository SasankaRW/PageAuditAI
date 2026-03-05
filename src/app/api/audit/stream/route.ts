import { computeBasicMetrics } from "@/lib/metrics/computeBasicMetrics";
import { parseHtmlToDom } from "@/lib/scraper/extractDom";
import { fetchPageHtml } from "@/lib/scraper/fetchPage";
import { generateWebsiteInsights } from "@/lib/ai/generateInsights";
import { formatAuditError } from "@/lib/errors/formatAuditError";
import type { AuditApiSuccessResponse, AuditStreamStage } from "@/types/audit";

type ProgressPayload = {
  stage: AuditStreamStage;
};

type MetricsPayload = {
  inputUrl: string;
  metrics: ReturnType<typeof computeBasicMetrics>;
};

type FailedPayload = {
  error: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim();

  if (!url) {
    return new Response("Missing required query param: url", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const sendEvent = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        sendEvent("progress", { stage: "fetching_page" } satisfies ProgressPayload);
        const html = await fetchPageHtml(url);

        sendEvent("progress", { stage: "extracting_metrics" } satisfies ProgressPayload);
        const $ = parseHtmlToDom(html);
        const metrics = computeBasicMetrics($, url);
        const pageText = $("body").text().replace(/\s+/g, " ").trim();
        sendEvent("metrics", { inputUrl: url, metrics } satisfies MetricsPayload);

        sendEvent("progress", { stage: "running_ai_analysis" } satisfies ProgressPayload);
        const insights = await generateWebsiteInsights({ metrics, pageText });

        sendEvent(
          "progress",
          { stage: "generating_recommendations" } satisfies ProgressPayload,
        );
        const { recommendations, ...analysis } = insights;

        sendEvent("progress", { stage: "completed" } satisfies ProgressPayload);

        const result: AuditApiSuccessResponse = {
          ok: true,
          inputUrl: url,
          metrics,
          analysis,
          recommendations,
        };

        sendEvent("result", result);
      } catch (error) {
        sendEvent("failed", { error: formatAuditError(error) } satisfies FailedPayload);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
