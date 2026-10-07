type DocumentType = "question" | "answer" | "markingScheme";

interface ExamMarkerDocument {
  type: DocumentType;
  mimeType: string;
  data: string;
}

interface ExamMarkerRequest {
  subject?: string;
  level?: string;
  questionText?: string;
  markingSchemeText?: string;
  answerText?: string;
  documents?: ExamMarkerDocument[];
}

const MAX_TEXT_LENGTH = 20000;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60 * 1000;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

export async function handleExamMarker(
  payload: unknown,
  apiKey: string | undefined,
  clientKey = "anonymous",
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!apiKey) {
    return { status: 503, body: { error: "Exam Marker is not configured. Add GROQ_API_KEY to the server environment and restart the server." } };
  }
  const now = Date.now();
  const window = requestWindows.get(clientKey);
  if (window && now - window.startedAt < RATE_WINDOW_MS && window.count >= RATE_LIMIT) {
    return { status: 429, body: { error: "Too many marking requests. Please wait a minute and try again." } };
  }
  requestWindows.set(clientKey, window && now - window.startedAt < RATE_WINDOW_MS
    ? { ...window, count: window.count + 1 }
    : { startedAt: now, count: 1 });
  if (requestWindows.size > 1000) {
    for (const [key, value] of requestWindows) {
      if (now - value.startedAt >= RATE_WINDOW_MS) requestWindows.delete(key);
    }
  }
  if (!payload || typeof payload !== "object") {
    return { status: 400, body: { error: "The request body must be valid JSON." } };
  }

  const request = payload as ExamMarkerRequest;
  const subject = typeof request.subject === "string" ? request.subject.slice(0, 100) : "";
  const level = typeof request.level === "string" ? request.level.slice(0, 50) : "";
  const questionText = typeof request.questionText === "string" ? request.questionText.trim() : "";
  const markingSchemeText = typeof request.markingSchemeText === "string" ? request.markingSchemeText.trim() : "";
  const answerText = typeof request.answerText === "string" ? request.answerText.trim() : "";
  const documents = Array.isArray(request.documents) ? request.documents : [];

  if ([questionText, markingSchemeText, answerText].some((text) => text.length > MAX_TEXT_LENGTH)) {
    return { status: 413, body: { error: "Each text field must be 20,000 characters or fewer." } };
  }
  if (documents.length > 5) {
    return { status: 413, body: { error: "Upload up to five images per marking session." } };
  }

  let imageBytes = 0;
  for (const document of documents) {
    if (!document || !["question", "answer", "markingScheme"].includes(document.type)) {
      return { status: 400, body: { error: "Each uploaded image must have a valid document type." } };
    }
    if (!ALLOWED_IMAGE_TYPES.has(document.mimeType) || typeof document.data !== "string") {
      return { status: 400, body: { error: "Use a JPEG, PNG, or WebP image." } };
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(document.data)) {
      return { status: 400, body: { error: "One of the uploaded images could not be read." } };
    }
    imageBytes += Math.floor(document.data.length * 3 / 4);
  }
  if (imageBytes > MAX_IMAGE_BYTES) {
    return { status: 413, body: { error: "Images exceed the 3 MB total limit. Upload fewer or smaller images." } };
  }

  const hasQuestion = Boolean(questionText || documents.some((document) => document.type === "question"));
  const hasScheme = Boolean(markingSchemeText || documents.some((document) => document.type === "markingScheme"));
  if (!hasQuestion || !hasScheme) {
    return { status: 400, body: { error: "Provide both a question and its marking scheme, using text or an image for each." } };
  }

  const userContent: ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[] = [{
    type: "text",
    text: [
      "Assess only the supplied exam question, marking scheme, and optional student answer.",
      `QUESTION TEXT:\n${questionText || "Read from the attached question image."}`,
      `MARKING SCHEME TEXT:\n${markingSchemeText || "Read from the attached marking-scheme image."}`,
      `STUDENT ANSWER TEXT:\n${answerText || (documents.some((document) => document.type === "answer") ? "Read from the attached student-answer image." : "No answer supplied. Do not award a student mark.")}`,
      "Images follow, each labelled with its document type. Read them directly; do not replace unclear content with assumptions.",
    ].join("\n\n"),
  }];
  for (const [index, document] of documents.entries()) {
    userContent.push({ type: "text", text: `Image ${index + 1}: ${document.type === "markingScheme" ? "marking scheme" : document.type === "answer" ? "student answer" : "exam question"}.` });
    userContent.push({ type: "image_url", image_url: { url: `data:${document.mimeType};base64,${document.data}` } });
  }

  const systemInstruction = [
    "You are a careful Scottish Qualifications Authority exam tutor. Read the supplied images and text as source material.",
    `Subject and level, if supplied: ${subject || "not specified"} · ${level || "not specified"}.`,
    "Your explanation must be specific to this exact question. Use only the supplied marking scheme to determine available marks and award criteria. Never invent question details, mark allocations, or criteria. If any required source is unreadable or ambiguous, say exactly what is unclear in confidenceNote and do not guess.",
    "Explain the question command word and what it requires. Explain every relevant marking-scheme point in plain language. If a student answer is supplied and the question and scheme are readable, award marks criterion by criterion, allowing equivalent valid wording, and explain each award or omission. If there is no answer, set score to null and each awarded value to null. If the scheme does not state a total, derive maxMarks only when the individual allocations can be read unambiguously; otherwise set maxMarks and score to null.",
    "Return only a JSON object with this exact shape: {\"questionExplanation\":[string],\"markingSchemeExplanation\":[string],\"score\":number|null,\"maxMarks\":number|null,\"markBreakdown\":[{\"criterion\":string,\"available\":number,\"awarded\":number|null,\"rationale\":string}],\"answerFeedback\":[string],\"improvements\":[string],\"confidenceNote\":string}.",
    "Keep feedback constructive and explain what to change to earn the specific missing marks. Do not include generic study advice or claims of official marking.",
  ].join(" ");

  try {
    let providerMessage = "";
    let providerStatus: number | undefined;
    let generatedText = "";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userContent },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 2048,
          }),
        });
        if (response.ok) {
          const data = await response.json() as {
            choices?: { message?: { content?: string | { type?: string; text?: string }[] | null } }[];
          };
          const content = data.choices?.[0]?.message?.content;
          generatedText = typeof content === "string"
            ? content.trim()
            : Array.isArray(content)
              ? content.map((part) => part.text || "").join("").trim()
              : "";
          if (!generatedText) providerMessage = "Groq returned no text response.";
          break;
        }

        providerStatus = response.status;
        const providerError = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
        providerMessage = typeof providerError?.error?.message === "string" ? providerError.error.message : `Groq returned HTTP ${response.status}.`;
      } catch (error) {
        providerMessage = error instanceof Error ? error.message : "Groq request failed.";
      }

      const temporaryOverload = /high demand|overload|temporarily unavailable|try again later/i.test(providerMessage);
      const retryable = [500, 502, 503, 504].includes(providerStatus || 0)
        || providerStatus === 429 && temporaryOverload
        || temporaryOverload;
      if (!retryable || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
    }

    if (!generatedText) {
      providerMessage = providerMessage.replaceAll(apiKey, "[redacted]").slice(0, 240);
      console.error("Groq Exam Marker request failed:", providerStatus, providerMessage);
      return { status: 502, body: { error: `Groq could not process this request: ${providerMessage}` } };
    }

    const result = JSON.parse(generatedText) as Record<string, unknown>;
    const requiredArrays = ["questionExplanation", "markingSchemeExplanation", "markBreakdown", "answerFeedback", "improvements"];
    const stringArraysValid = ["questionExplanation", "markingSchemeExplanation", "answerFeedback", "improvements"]
      .every((key) => Array.isArray(result[key]) && (result[key] as unknown[]).every((item) => typeof item === "string"));
    const breakdownValid = Array.isArray(result.markBreakdown) && result.markBreakdown.every((item) => {
      if (!item || typeof item !== "object") return false;
      const mark = item as Record<string, unknown>;
      return typeof mark.criterion === "string"
        && typeof mark.rationale === "string"
        && typeof mark.available === "number"
        && mark.available >= 0
        && (mark.awarded === null || (typeof mark.awarded === "number" && mark.awarded >= 0 && mark.awarded <= mark.available));
    });
    const marksValid = (result.score === null || (typeof result.score === "number" && result.score >= 0))
      && (result.maxMarks === null || (typeof result.maxMarks === "number" && result.maxMarks > 0))
      && (result.score === null || typeof result.maxMarks === "number" && result.score <= result.maxMarks);
    const invalidFields = [
      ...requiredArrays.filter((key) => !Array.isArray(result[key])),
      ...(!stringArraysValid ? ["text fields"] : []),
      ...(!breakdownValid ? ["markBreakdown"] : []),
      ...(!marksValid ? ["score/maxMarks"] : []),
      ...(typeof result.confidenceNote !== "string" ? ["confidenceNote"] : []),
    ];
    if (invalidFields.length > 0) {
      console.warn("Groq Exam Marker returned invalid fields:", invalidFields.join(", "));
      return { status: 502, body: { error: `The AI response was incomplete (${invalidFields.join(", " )}). Please try again.` } };
    }
    return { status: 200, body: { result } };
  } catch (error) {
    console.error("Exam Marker request error:", error instanceof Error ? error.message : "Unknown error");
    return { status: 502, body: { error: "Could not read the AI response. Try again with clearer images or pasted text." } };
  }
}