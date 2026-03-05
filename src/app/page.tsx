"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import AuditResult from "@/components/AuditResult";
import LayoutShell from "@/components/LayoutShell";
import UrlInputForm from "@/components/UrlInputForm";
import type { AuditApiSuccessResponse, AuditMetrics, AuditStreamStage } from "@/types/audit";

const stepConfig: Array<{ stage: AuditStreamStage; label: string }> = [
  { stage: "fetching_page", label: "Fetching webpage..." },
  { stage: "extracting_metrics", label: "Extracting metrics..." },
  { stage: "running_ai_analysis", label: "Running AI analysis..." },
  { stage: "generating_recommendations", label: "Generating recommendations..." },
  { stage: "completed", label: "Completed" },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<AuditStreamStage | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    inputUrl?: string;
    metrics?: AuditMetrics;
    analysis?: AuditApiSuccessResponse["analysis"];
    recommendations?: string[];
  } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  async function onAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setStage(null);
    setActiveUrl(url.trim());

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const streamUrl = `/api/audit/stream?url=${encodeURIComponent(url.trim())}`;
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("progress", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { stage: AuditStreamStage };
      setStage(data.stage);
    });

    eventSource.addEventListener("metrics", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        inputUrl: string;
        metrics: AuditMetrics;
      };

      setResult((prev) => ({
        ...(prev ?? {}),
        inputUrl: data.inputUrl,
        metrics: data.metrics,
      }));
    });

    eventSource.addEventListener("result", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as AuditApiSuccessResponse;
      setResult({
        inputUrl: data.inputUrl,
        metrics: data.metrics,
        analysis: data.analysis,
        recommendations: data.recommendations,
      });
      setLoading(false);
      setStage("completed");
      eventSource.close();
      eventSourceRef.current = null;
    });

    eventSource.addEventListener("failed", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { error: string };
      setError(data.error || "Audit failed.");
      setLoading(false);
      eventSource.close();
      eventSourceRef.current = null;
    });

    eventSource.onerror = () => {
      setError("Connection lost while receiving progress updates.");
      setLoading(false);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }

  const currentStepIndex = stepConfig.findIndex((step) => step.stage === stage);

  return (
    <LayoutShell>
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Website Audit Tool
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
            Run a website audit
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
            Enter any URL to fetch the page, extract on-page signals, and get AI-powered improvement
            suggestions.
          </p>

          <div className="mt-5 mb-1">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {stage === null
                  ? "Ready"
                  : stage === "completed"
                    ? "Audit complete"
                    : stepConfig.find((s) => s.stage === stage)?.label ?? "Running…"}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {stage === null
                  ? "0%"
                  : stage === "completed"
                    ? "100%"
                    : `${Math.round(((currentStepIndex + 1) / stepConfig.length) * 100)}%`}
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-in-out ${
                  stage === "completed" ? "bg-emerald-500" : "bg-slate-900"
                }`}
                style={{
                  width:
                    stage === null
                      ? "0%"
                      : stage === "completed"
                        ? "100%"
                        : `${Math.round(((currentStepIndex + 1) / stepConfig.length) * 100)}%`,
                }}
              />
            </div>
          </div>

          <UrlInputForm url={url} loading={loading} onUrlChange={setUrl} onSubmit={onAnalyze} />

          {activeUrl && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="shrink-0 font-medium text-slate-900">Auditing:</span>
              <span className="truncate text-slate-500">{activeUrl}</span>
            </div>
          )}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Audit Flow</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Progress</h2>
          <p className="mt-0.5 text-sm leading-5 text-slate-600">
            Track each step of the audit as results arrive.
          </p>

          <div className="mt-2.5 space-y-1">
            {stepConfig.map((step, index) => {
              const isDone = currentStepIndex >= 0 && index < currentStepIndex;
              const isActive = step.stage === stage && stage !== "completed";
              const isCompleted = step.stage === "completed" && stage === "completed";

              return (
                <article
                  key={step.stage}
                  className={`rounded-2xl border px-3 py-1.5 transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : isDone || isCompleted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-xs font-semibold">
                      {isDone || isCompleted ? "✓" : isActive ? "⏳" : "○"}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      <p
                        className={`text-xs ${
                          isActive ? "text-slate-300" : isDone || isCompleted ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        {getStepHelper(step.stage)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {error && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
        </section>
      </section>

      <AuditResult data={result} loading={loading} />
    </LayoutShell>
  );
}

function getStepHelper(stage: AuditStreamStage) {
  switch (stage) {
    case "fetching_page":
      return "Loading the raw HTML from the target page.";
    case "extracting_metrics":
      return "Parsing the page and computing factual signals.";
    case "running_ai_analysis":
      return "Reviewing SEO, UX, messaging, and content quality.";
    case "generating_recommendations":
      return "Converting findings into prioritized next steps.";
    case "completed":
      return "Audit finished and ready for review.";
    default:
      return "";
  }
}
