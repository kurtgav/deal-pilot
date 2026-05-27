import type { ExtractedSalesFields, TranscriptLine } from '@dealpilot/shared';
import { callLLM } from './AIAgent.js';

const EXTRACTION_PROMPT = `You are a sales field extraction engine. Given the conversation, extract any NEW information into JSON. Only include fields with NEW data. Return ONLY valid JSON — no markdown, no code fences.

Fields:
- industry (string)
- useCase (string)
- painPoints (string array)
- budgetSignal ("Low" | "Medium" | "High" | "Unknown")
- urgency ("Low" | "Medium" | "High" | "Unknown")
- technicalFit ("Weak" | "Moderate" | "Strong" | "Unknown")
- objections (string array)
- recommendedPackage (string)
- nextStep (string)
- unansweredQuestions (string array)

Return: {"delta": { ...only new fields... }}
If nothing new, return: {"delta": {}}`;

export async function extractFields(
  transcript: TranscriptLine[],
  currentFields: ExtractedSalesFields
): Promise<Partial<ExtractedSalesFields>> {
  if (transcript.length < 2) return {};

  try {
    const recentLines = transcript.slice(-6).map((l) => `${l.speaker}: ${l.text}`).join('\n');
    const response = await callLLM(
      EXTRACTION_PROMPT,
      `Current fields: ${JSON.stringify(currentFields)}\n\nRecent transcript:\n${recentLines}`
    );

    // Try to extract JSON from response (handle markdown fences)
    let jsonStr = response.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    return parsed.delta || {};
  } catch (err) {
    // Silently fail — field extraction is non-critical
    return {};
  }
}
