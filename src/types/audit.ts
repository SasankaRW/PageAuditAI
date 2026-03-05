import type { AuditMetrics } from "@/lib/metrics/computeBasicMetrics";
export type { AuditMetrics } from "@/lib/metrics/computeBasicMetrics";

export type InsightSection = {
  score: number;
  summary: string;
  findings: string[];
  actions: string[];
};

export type WebsiteAnalysis = {
  seo_analysis: InsightSection;
  messaging_analysis: InsightSection;
  cta_analysis: InsightSection;
  content_depth: InsightSection;
  ux_analysis: InsightSection;
};

export type WebsiteInsights = WebsiteAnalysis & {
  recommendations: string[];
};

export type AuditRequestBody = {
  url?: string;
};

export type AuditApiSuccessResponse = {
  ok: true;
  inputUrl: string;
  metrics: AuditMetrics;
  analysis: WebsiteAnalysis;
  recommendations: string[];
};

export type AuditApiErrorResponse = {
  ok: false;
  error: string;
};

export type AuditApiResponse = AuditApiSuccessResponse | AuditApiErrorResponse;

export type AuditStreamStage =
  | "fetching_page"
  | "extracting_metrics"
  | "running_ai_analysis"
  | "generating_recommendations"
  | "completed";

export type AuditStage =
  | "fetching_webpage"
  | "extracting_metrics"
  | "generating_ai"
  | "completed"
  | "failed";

export type AuditJobState = {
  jobId: string;
  inputUrl: string;
  stage: AuditStage;
  metrics?: AuditMetrics;
  analysis?: WebsiteAnalysis;
  recommendations?: string[];
  error?: string;
  createdAt: number;
  updatedAt: number;
};

export type AuditJobResponse =
  | {
      ok: true;
      job: AuditJobState;
    }
  | {
      ok: false;
      error: string;
    };
