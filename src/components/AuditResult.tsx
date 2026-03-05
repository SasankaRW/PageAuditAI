import type { AuditMetrics, WebsiteAnalysis } from "@/types/audit";

type AuditResultProps = {
  data: {
    metrics?: AuditMetrics;
    analysis?: WebsiteAnalysis;
    recommendations?: string[];
  } | null;
  loading: boolean;
};

type MetricRow = [label: string, value: string | number];

const insightLabels: Record<keyof WebsiteAnalysis, string> = {
  seo_analysis: "SEO Analysis",
  messaging_analysis: "Messaging Analysis",
  cta_analysis: "CTA Analysis",
  content_depth: "Content Depth",
  ux_analysis: "UX Analysis",
};

const metricDescriptions: Record<string, string> = {
  "Word Count": "How much on-page text users can read.",
  "H1 Count": "Main page headline count.",
  "H2 Count": "Section-level heading count.",
  "H3 Count": "Sub-section heading count.",
  "CTA Count": "Calls-to-action identified on page.",
  "Internal Links": "Links pointing to the same site.",
  "External Links": "Links pointing to other websites.",
  "Image Count": "Total image elements found.",
  "Missing Alt %": "Share of images missing alt text.",
  "Meta Title": "Current <title> tag text.",
  "Meta Description": "Current meta description text.",
};

const primaryMetricLabels = new Set([
  "Word Count",
  "H1 Count",
  "CTA Count",
  "Internal Links",
  "External Links",
  "Missing Alt %",
]);

function getScoreTone(score: number) {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 60) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

function normalizeRecommendation(text: string) {
  return text.replace(/\*\*/g, "").replace(/^"+|"+$/g, "").trim();
}

function averageScore(analysis?: WebsiteAnalysis) {
  if (!analysis) {
    return null;
  }

  const scores = Object.values(analysis).map((section) => section.score);
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function getScoreLabel(score: number | null) {
  if (score === null) {
    return "Waiting";
  }

  if (score >= 80) {
    return "Strong";
  }

  if (score >= 60) {
    return "Needs polish";
  }

  return "Needs work";
}

function getPriorityLabel(index: number) {
  if (index === 0) {
    return "Highest impact";
  }

  if (index < 3) {
    return "High priority";
  }

  return "Next step";
}

function getSectionAccent(score: number) {
  if (score >= 80) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (score >= 60) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-rose-200 bg-rose-50 text-rose-800";
}

function SpinnerIcon() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
      aria-hidden
    />
  );
}

function SectionStatus({
  loading,
  ready,
}: {
  loading: boolean;
  ready: boolean;
}) {
  if (ready) {
    return <span className="text-emerald-700">✓</span>;
  }

  if (loading) {
    return <SpinnerIcon />;
  }

  return <span className="text-slate-400">○</span>;
}

export default function AuditResult({ data, loading }: AuditResultProps) {
  const metricsRows: MetricRow[] = data?.metrics
    ? [
        ["Word Count", data.metrics.wordCount],
        ["H1 Count", data.metrics.h1Count],
        ["H2 Count", data.metrics.h2Count],
        ["H3 Count", data.metrics.h3Count],
        ["CTA Count", data.metrics.ctaCount],
        ["Internal Links", data.metrics.internalLinks],
        ["External Links", data.metrics.externalLinks],
        ["Image Count", data.metrics.imageCount],
        ["Missing Alt %", `${data.metrics.missingAltPercent}%`],
        ["Meta Title", data.metrics.metaTitle ?? "-"],
        ["Meta Description", data.metrics.metaDescription ?? "-"],
      ]
    : [];

  const analysisScore = averageScore(data?.analysis);
  const summaryCards = [
    {
      label: "Overall Audit Score",
      value: analysisScore !== null ? `${analysisScore}/100` : "Pending",
      helper:
        analysisScore !== null
          ? getScoreLabel(analysisScore)
          : "Will appear after AI analysis",
    },
    {
      label: "Content Readiness",
      value: data?.metrics ? `${data.metrics.wordCount} words` : "Pending",
      helper: "Depth of content available for users and search engines",
    },
    {
      label: "Conversion Signals",
      value: data?.metrics ? `${data.metrics.ctaCount} CTA(s)` : "Pending",
      helper: "Calls-to-action detected on the page",
    },
    {
      label: "Accessibility Signals",
      value: data?.metrics ? `${data.metrics.missingAltPercent}% missing alt` : "Pending",
      helper: "Image accessibility coverage",
    },
  ];

  return (
    <>
      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Audit Overview
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Fast read of the page quality</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Use this summary first, then move into metrics, insights, and recommended actions.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Status</p>
            <p className="mt-1 text-lg font-semibold">
              {loading ? "Audit in progress" : data?.analysis ? "Audit complete" : "Ready to run"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-2 text-xs text-slate-600">{card.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <SectionStatus loading={loading && !data?.metrics} ready={Boolean(data?.metrics)} />
          <h2 className="text-lg font-semibold text-slate-900">Metrics</h2>
        </div>
        <p className="mb-5 text-sm text-slate-600">
          Factual on-page signals extracted immediately after the page is parsed.
        </p>
        {!data?.metrics ? (
          <p className="text-slate-500">Run an audit to see metrics.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Key Signals
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {metricsRows
                  .filter(([label]) => primaryMetricLabels.has(label))
                  .map(([label, value]) => (
                    <article key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {label}
                      </p>
                      <p className="mt-2 break-words text-2xl font-semibold text-slate-900">
                        {String(value)}
                      </p>
                      <p className="mt-2 text-xs text-slate-600">{metricDescriptions[label]}</p>
                    </article>
                  ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Supporting Details
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {metricsRows
                  .filter(([label]) => !primaryMetricLabels.has(label))
                  .map(([label, value]) => (
                    <article
                      key={label}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{label}</p>
                        <p className="mt-1 text-xs text-slate-500">{metricDescriptions[label]}</p>
                      </div>
                      <p className="max-w-[50%] break-words text-right font-semibold text-slate-700">
                        {String(value)}
                      </p>
                    </article>
                  ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <SectionStatus loading={loading && !data?.analysis} ready={Boolean(data?.analysis)} />
          <h2 className="text-lg font-semibold text-slate-900">AI Insights</h2>
        </div>
        <p className="mb-5 text-sm text-slate-600">
          Section-by-section diagnosis showing where the page is weak and what to improve next.
        </p>
        {!data?.analysis ? (
          <p className="text-slate-500">Insights will appear when AI analysis is complete.</p>
        ) : (
          <div className="grid gap-4">
            {(Object.keys(insightLabels) as Array<keyof typeof insightLabels>).map((key) => {
              const section = data.analysis?.[key];
              if (!section) {
                return null;
              }

              return (
                <article
                  key={key}
                  className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Insight Area
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {insightLabels[key]}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getScoreTone(section.score)}`}
                    >
                      Score: {section.score}/100
                    </span>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Summary
                      </p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getSectionAccent(
                          section.score,
                        )}`}
                      >
                        {section.score >= 80
                          ? "Strong"
                          : section.score >= 60
                            ? "Needs polish"
                            : "Needs work"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{section.summary}</p>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                    <section className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">•</span>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          What We Found
                        </p>
                      </div>
                      <ul className="mt-3 space-y-3">
                        {section.findings.map((item, index) => (
                          <li key={item} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                              {index + 1}
                            </span>
                            <p className="text-sm leading-6 text-slate-700">{item}</p>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">→</span>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          What To Do Next
                        </p>
                      </div>
                      <ul className="mt-3 space-y-3">
                        {section.actions.map((item, index) => (
                          <li
                            key={item}
                            className="rounded-2xl border border-emerald-200 bg-white px-3 py-3"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                              Action {index + 1}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-emerald-950">{item}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <SectionStatus
            loading={loading && !data?.recommendations?.length}
            ready={Boolean(data?.recommendations?.length)}
          />
          <h2 className="text-lg font-semibold text-slate-900">Recommendations</h2>
        </div>
        <p className="mb-5 text-sm text-slate-600">
          A practical action plan ordered so the team can focus on the biggest improvements first.
        </p>
        {data?.recommendations?.length ? (
          <div className="grid gap-3">
            {data.recommendations.map((item, index) => (
              <article
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Recommendation {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {getPriorityLabel(index)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    Action item
                  </span>
                </div>
                <p className="mt-3 leading-6 text-slate-700">{normalizeRecommendation(item)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">Recommendations will appear when AI analysis is complete.</p>
        )}
      </section>
    </>
  );
}
