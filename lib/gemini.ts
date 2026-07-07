import { buildAnalysisInputSummary, deterministicWeeklyAnalysis, parseAnalysisResult } from "./analysis";
import type { AnalysisInput, AnalysisResult } from "./types";

function geminiPrompt(input: AnalysisInput) {
  return `You are AscensionOS, a private performance analysis system.

Return strict JSON only. No markdown. Use this exact shape:
{
  "summary": "string",
  "strongestPatterns": ["string"],
  "weakestPatterns": ["string"],
  "risks": ["string"],
  "nextActions": ["string"],
  "confidence": "low|medium|high",
  "sourceDates": ["YYYY-MM-DD"],
  "sourceMetrics": ["metric=value"],
  "provider": "gemini",
  "model": "string",
  "caveats": ["string"]
}

Rules:
- Be direct, serious, and practical.
- Cite source dates and metrics from the input.
- Do not diagnose medical or mental-health conditions.
- Produce 3-5 next actions max.

Input summary:
${buildAnalysisInputSummary(input)}

Full input JSON:
${JSON.stringify(input)}`;
}

export async function geminiAnalyzeWeekly(input: AnalysisInput): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return deterministicWeeklyAnalysis(input, ["Gemini API key is missing; deterministic analysis was used."]);
  }

  try {
    const model = "gemini-1.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt(input) }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini response did not include text.");
    return {
      ...parseAnalysisResult(JSON.parse(text), "gemini"),
      provider: "gemini",
      model
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini analysis failed.";
    return deterministicWeeklyAnalysis(input, [`Gemini fallback activated: ${message}`]);
  }
}
