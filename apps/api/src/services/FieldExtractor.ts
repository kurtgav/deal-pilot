import type { ExtractedSalesFields, TranscriptLine } from '@dealpilot/shared';
import { callLLM } from './AIAgent.js';

const EXTRACTION_PROMPT = `You are a sales field extraction engine. Given the latest conversation transcript, extract any NEW information into the following JSON structure. Only include fields where you found NEW information. Return ONLY valid JSON, no markdown.

Fields to extract:
- industry (string)
- useCase (string)  
- painPoints (string array)
- budgetSignal ("Low" | "Medium" | "High" | "Unknown")
- urgency ("Low" | "Medium" | "High" | "Unknown")
- technicalFit ("Weak" | "Moderate" | "Strong" | "Unknown")
- objections (string array)
- recommendedPackage (string)
- nextStep (string)
- unansweredQuestions (string array - questions the AI couldn't answer)

Return format: {"delta": { ...only changed fields... }}`;

export async function extractFields(
  transcript: TranscriptLine[],
  currentFields: ExtractedSalesFields
): Promise<Partial<ExtractedSalesFields>> {
  const recentLines = transcript.slice(-6).map((l) => `${l.speaker}: ${l.text}`).join('\n');

  const response = await callLLM(
    EXTRACTION_PROMPT,
    `Current extracted fields: ${JSON.stringify(currentFields)}\n\nRecent transcript:\n${recentLines}`
  );

  try {
    const parsed = JSON.parse(response);
    return parsed.delta || {};
  } catch {
    return {};
  }
}
