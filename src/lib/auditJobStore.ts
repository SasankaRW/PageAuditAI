import { randomUUID } from "node:crypto";

import type { AuditJobState, AuditStage, WebsiteAnalysis } from "@/types/audit";
import type { AuditMetrics } from "@/lib/metrics/computeBasicMetrics";

const JOB_TTL_MS = 15 * 60 * 1000;
const jobs = new Map<string, AuditJobState>();

export function createAuditJob(inputUrl: string): AuditJobState {
  cleanupExpiredJobs();

  const now = Date.now();
  const job: AuditJobState = {
    jobId: randomUUID(),
    inputUrl,
    stage: "fetching_webpage",
    createdAt: now,
    updatedAt: now,
  };

  jobs.set(job.jobId, job);
  return job;
}

export function getAuditJob(jobId: string): AuditJobState | null {
  cleanupExpiredJobs();
  return jobs.get(jobId) ?? null;
}

export function setAuditJobStage(jobId: string, stage: AuditStage): AuditJobState | null {
  const existing = jobs.get(jobId);
  if (!existing) {
    return null;
  }

  const next: AuditJobState = {
    ...existing,
    stage,
    updatedAt: Date.now(),
  };

  jobs.set(jobId, next);
  return next;
}

export function setAuditJobMetrics(
  jobId: string,
  metrics: AuditMetrics,
): AuditJobState | null {
  const existing = jobs.get(jobId);
  if (!existing) {
    return null;
  }

  const next: AuditJobState = {
    ...existing,
    metrics,
    stage: "generating_ai",
    updatedAt: Date.now(),
  };

  jobs.set(jobId, next);
  return next;
}

export function completeAuditJob(
  jobId: string,
  payload: { analysis: WebsiteAnalysis; recommendations: string[] },
): AuditJobState | null {
  const existing = jobs.get(jobId);
  if (!existing) {
    return null;
  }

  const next: AuditJobState = {
    ...existing,
    stage: "completed",
    analysis: payload.analysis,
    recommendations: payload.recommendations,
    updatedAt: Date.now(),
  };

  jobs.set(jobId, next);
  return next;
}

export function failAuditJob(jobId: string, error: string): AuditJobState | null {
  const existing = jobs.get(jobId);
  if (!existing) {
    return null;
  }

  const next: AuditJobState = {
    ...existing,
    stage: "failed",
    error,
    updatedAt: Date.now(),
  };

  jobs.set(jobId, next);
  return next;
}

function cleanupExpiredJobs() {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (now - job.updatedAt > JOB_TTL_MS) {
      jobs.delete(jobId);
    }
  }
}
