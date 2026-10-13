import { handleExamMarker } from "./exam-marker-handler";

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  const forwardedFor = request.headers?.["x-forwarded-for"];
  const clientKey = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0]?.trim()
    || request.socket?.remoteAddress
    || "unknown";
  const result = await handleExamMarker(request.body, runtime.process?.env?.GROQ_API_KEY, clientKey);
  return response.status(result.status).json(result.body);
}