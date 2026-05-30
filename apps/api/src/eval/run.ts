/**
 * Eval harness — the scoreboard. Run with: pnpm --filter @dealpilot/api eval
 *
 * Metric 1 (offline, deterministic): GROUNDING / hallucination rate.
 *   For each labeled product question we ask the grounding gate whether the
 *   agent WOULD answer from the KB. Out-of-KB questions that get answered
 *   instead of escalated are hallucinations.
 *
 * Metric 2 (needs an LLM key): FIELD EXTRACTION precision/recall vs labels.
 *   Skipped gracefully when NVIDIA_NIM_API_KEY is absent so the grounding
 *   baseline still runs in CI / offline.
 */
import productsJson from '../knowledge/products.json' with { type: 'json' };
import objectionsJson from '../knowledge/objections.json' with { type: 'json' };
import discoveryJson from '../knowledge/discovery.json' with { type: 'json' };
import { loadKnowledgeFromObjects, assessProductGrounding } from '../services/RAGService.js';
import { QA_CASES, EXTRACTION_CASES } from './dataset.js';

function loadKB() {
  const products = (productsJson as any[]).map((p) => ({
    name: p.name, price: p.price, features: p.features ?? [], bestFor: p.bestFor, integrations: p.integrations ?? [],
  }));
  const objections = (objectionsJson as any[]).map((o) => ({ objection: o.objection, rebuttal: o.rebuttal }));
  const discovery = ((discoveryJson as any).stages ?? []).map((d: any) => ({ stage: d.stage, questions: d.questions ?? [] }));
  loadKnowledgeFromObjects(products, objections, discovery);
}

function runGrounding() {
  let inKbAnswered = 0, inKbTotal = 0, hallucinated = 0, outKbTotal = 0;
  const misses: string[] = [];

  for (const c of QA_CASES) {
    const willAnswer = assessProductGrounding(c.q).grounded;
    if (c.inKB) {
      inKbTotal++;
      if (willAnswer) inKbAnswered++; else misses.push(`  [missed in-KB] "${c.q}" → escalated`);
    } else {
      outKbTotal++;
      if (willAnswer) { hallucinated++; misses.push(`  [HALLUCINATION] "${c.q}" → answered instead of escalating`); }
    }
  }

  const hallucinationRate = outKbTotal ? hallucinated / outKbTotal : 0;
  const answerRecall = inKbTotal ? inKbAnswered / inKbTotal : 0;

  console.log('── GROUNDING ──────────────────────────────────');
  console.log(`  In-KB answer recall : ${(answerRecall * 100).toFixed(1)}%  (${inKbAnswered}/${inKbTotal} answered)`);
  console.log(`  HALLUCINATION RATE  : ${(hallucinationRate * 100).toFixed(1)}%  (${hallucinated}/${outKbTotal} out-of-KB answered instead of escalated)`);
  if (misses.length) { console.log('  Details:'); misses.forEach((m) => console.log(m)); }
  return { hallucinationRate, answerRecall };
}

function norm(s: string): string { return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
function tokens(s: string): Set<string> { return new Set(norm(s).split(' ').filter((w) => w.length > 2)); }
function looseMatch(expected: string, actual: string): boolean {
  const e = tokens(expected), a = tokens(actual);
  if (e.size === 0) return a.size === 0;
  let hit = 0; for (const t of e) if (a.has(t)) hit++;
  return hit / e.size >= 0.5;
}

function fieldMatches(key: string, expected: any, actual: any): boolean {
  if (actual === undefined || actual === null) return false;
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    return expected.every((ev: string) => actual.some((av: string) => looseMatch(ev, av)));
  }
  if (['budgetSignal', 'urgency', 'technicalFit'].includes(key)) {
    return String(expected).toLowerCase() === String(actual).toLowerCase();
  }
  return looseMatch(String(expected), String(actual));
}

async function runExtraction() {
  if (!process.env.NVIDIA_NIM_API_KEY) {
    console.log('── FIELD EXTRACTION ───────────────────────────');
    console.log('  SKIPPED (set NVIDIA_NIM_API_KEY to run the live extraction eval).');
    return;
  }
  const { extractFields } = await import('../services/FieldExtractor.js');
  let tp = 0, expectedTotal = 0, predictedTotal = 0;

  for (const c of EXTRACTION_CASES) {
    const transcript = [
      { speaker: 'AI' as const, text: 'Tell me about your needs.', timestamp: '' },
      { speaker: 'PROSPECT' as const, text: c.prospectText, timestamp: '' },
    ];
    const delta = await extractFields(transcript, { painPoints: [], objections: [], unansweredQuestions: [] });
    const expectedKeys = Object.keys(c.expected);
    expectedTotal += expectedKeys.length;
    predictedTotal += Object.keys(delta).filter((k) => (delta as any)[k] !== undefined).length;
    for (const k of expectedKeys) {
      if (fieldMatches(k, (c.expected as any)[k], (delta as any)[k])) tp++;
    }
  }

  const precision = predictedTotal ? tp / predictedTotal : 0;
  const recall = expectedTotal ? tp / expectedTotal : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  console.log('── FIELD EXTRACTION ───────────────────────────');
  console.log(`  Precision : ${(precision * 100).toFixed(1)}%`);
  console.log(`  Recall    : ${(recall * 100).toFixed(1)}%`);
  console.log(`  F1        : ${(f1 * 100).toFixed(1)}%`);
}

async function main() {
  loadKB();
  console.log('\n=== DealPilot eval scoreboard ===\n');
  runGrounding();
  console.log('');
  await runExtraction();
  console.log('\n=================================\n');
}

main().catch((e) => { console.error('[eval] failed:', e); process.exit(1); });
