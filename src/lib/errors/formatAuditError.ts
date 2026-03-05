function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Unexpected audit error.";
}

function extractRetrySeconds(message: string): number | null {
  const retryMatch =
    message.match(/Please retry in ([\d.]+)s\./i) ??
    message.match(/"retryDelay":"(\d+)s"/i) ??
    message.match(/retryDelay":"(\d+)s"/i);

  if (!retryMatch) {
    return null;
  }

  const seconds = Number.parseFloat(retryMatch[1]);
  return Number.isFinite(seconds) ? Math.max(1, Math.ceil(seconds)) : null;
}

function stripVerboseProviderDetails(message: string): string {
  return message
    .replace(/^\[GoogleGenerativeAI Error\]:\s*/i, "")
    .replace(/\s*For more information on this error,[\s\S]*$/i, "")
    .replace(/\s*\[\{"@type":"type\.googleapis\.com\/google\.rpc\.Help"[\s\S]*$/i, "")
    .trim();
}

export function formatAuditError(error: unknown): string {
  const rawMessage = extractErrorMessage(error);
  const message = stripVerboseProviderDetails(rawMessage);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("missing gemini_api_key")) {
    return "AI analysis is not configured yet. Add a valid Gemini API key and try again.";
  }

  if (
    lowerMessage.includes("quota exceeded") ||
    lowerMessage.includes("too many requests") ||
    lowerMessage.includes("429")
  ) {
    const retrySeconds = extractRetrySeconds(rawMessage);
    const retryHint = retrySeconds
      ? ` Please wait about ${retrySeconds} seconds and try again.`
      : " Please try again in a moment.";

    return `AI analysis is temporarily unavailable because the Gemini API quota was reached.${retryHint}`;
  }

  if (
    lowerMessage.includes("api key not valid") ||
    lowerMessage.includes("permission denied") ||
    lowerMessage.includes("403")
  ) {
    return "AI analysis could not be completed because the Gemini API key is invalid or does not have access.";
  }

  if (lowerMessage.includes("fetch failed")) {
    return "The requested page could not be fetched for analysis. Please confirm the URL is reachable and try again.";
  }

  if (lowerMessage.includes("page text is empty")) {
    return "The page did not contain enough readable text to analyze.";
  }

  if (lowerMessage.includes("invalid json") || lowerMessage.includes("response is not an object")) {
    return "AI analysis returned an unexpected response. Please try again.";
  }

  return message || "Audit failed. Please try again.";
}
