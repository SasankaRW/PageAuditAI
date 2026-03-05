import axios from "axios";
import https from "node:https";

export async function fetchPageHtml(url: string): Promise<string> {
  if (!url || !url.trim()) {
    throw new Error("A URL is required to fetch page HTML.");
  }

  let normalizedUrl: URL;

  try {
    normalizedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL provided: "${url}".`);
  }

  try {
    return await getHtmlViaAxios(normalizedUrl.toString());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("unable to get local issuer certificate")) {
      try {
        return await getHtmlViaAxios(
          normalizedUrl.toString(),
          new https.Agent({ rejectUnauthorized: false }),
        );
      } catch (retryError) {
        const retryMessage =
          retryError instanceof Error ? retryError.message : String(retryError);
        throw new Error(`Failed to fetch page HTML: ${retryMessage}`);
      }
    }

    throw new Error(`Failed to fetch page HTML: ${message}`);
  }
}

async function getHtmlViaAxios(
  url: string,
  httpsAgent?: https.Agent,
): Promise<string> {
  const response = await axios.get<string>(url, {
    headers: {
      "User-Agent": "PageAuditAI/1.0 (+internal-audit-tool)",
      Accept: "text/html,application/xhtml+xml",
    },
    responseType: "text",
    timeout: 20000,
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400,
    ...(httpsAgent ? { httpsAgent } : {}),
  });

  return response.data;
}
