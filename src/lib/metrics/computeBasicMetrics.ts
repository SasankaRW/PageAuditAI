import { load } from "cheerio";

export type AuditMetrics = {
  wordCount: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  ctaCount: number;
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  missingAltPercent: number;
  metaTitle: string | null;
  metaDescription: string | null;
};

type CheerioDOM = ReturnType<typeof load>;

const CTA_KEYWORDS = [
  "buy",
  "shop",
  "subscribe",
  "sign up",
  "signup",
  "register",
  "book",
  "start",
  "get started",
  "request demo",
  "contact",
  "download",
  "learn more",
  "try now",
];

export function computeBasicMetrics(
  $: CheerioDOM,
  sourceUrl?: string,
): AuditMetrics {
  const pageText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = pageText ? pageText.split(" ").length : 0;

  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;

  const ctaCount = getCtaCount($);

  const { internalLinks, externalLinks } = getLinkCounts($, sourceUrl);

  const imageCount = $("img").length;
  const imagesMissingAlt = $("img")
    .filter((_: number, el: any) => {
      const alt = $(el).attr("alt");
      return !alt || !alt.trim();
    })
    .length;

  const missingAltPercent =
    imageCount === 0 ? 0 : Number(((imagesMissingAlt / imageCount) * 100).toFixed(2));

  const metaTitle = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').first().attr("content")?.trim() || null;

  return {
    wordCount,
    h1Count,
    h2Count,
    h3Count,
    ctaCount,
    internalLinks,
    externalLinks,
    imageCount,
    missingAltPercent,
    metaTitle,
    metaDescription,
  };
}

function getCtaCount($: CheerioDOM): number {
  const ctaSelectors =
    'a, button, input[type="submit"], input[type="button"], [role="button"]';

  return $(ctaSelectors)
    .filter((_: number, el: any) => {
      const text = $(el).text().trim().toLowerCase();
      const value = $(el).attr("value")?.trim().toLowerCase() ?? "";
      const ariaLabel = $(el).attr("aria-label")?.trim().toLowerCase() ?? "";
      const className = $(el).attr("class")?.trim().toLowerCase() ?? "";

      const targetText = [text, value, ariaLabel, className].join(" ");

      return CTA_KEYWORDS.some((keyword) => targetText.includes(keyword));
    })
    .length;
}

function getLinkCounts(
  $: CheerioDOM,
  sourceUrl?: string,
): { internalLinks: number; externalLinks: number } {
  let internalLinks = 0;
  let externalLinks = 0;

  const origin = getOrigin(sourceUrl);

  $("a[href]").each((_: number, el: any) => {
    const href = ($(el).attr("href") || "").trim();

    if (!href || href.startsWith("#")) {
      return;
    }

    const lowerHref = href.toLowerCase();
    if (
      lowerHref.startsWith("mailto:") ||
      lowerHref.startsWith("tel:") ||
      lowerHref.startsWith("javascript:")
    ) {
      return;
    }

    if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
      internalLinks += 1;
      return;
    }

    if (!/^https?:\/\//i.test(href)) {
      internalLinks += 1;
      return;
    }

    try {
      const linkUrl = new URL(href);
      if (origin && linkUrl.origin === origin) {
        internalLinks += 1;
      } else {
        externalLinks += 1;
      }
    } catch {
      internalLinks += 1;
    }
  });

  return { internalLinks, externalLinks };
}

function getOrigin(url?: string): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
