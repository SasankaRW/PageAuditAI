import { load } from "cheerio";

import { fetchPageHtml } from "./fetchPage";

export function parseHtmlToDom(html: string): CheerioAPI {
  return load(html);
}

export async function scrapePageDom(url: string): Promise<CheerioAPI> {
  const html = await fetchPageHtml(url);
  return parseHtmlToDom(html);
}

type CheerioAPI = ReturnType<typeof load>;
