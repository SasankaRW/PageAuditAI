import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_MODEL_NAME = "gemini-2.5-flash";
export const MAX_PAGE_TEXT_CHARS = 8000;

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: GEMINI_MODEL_NAME });
}
