import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const knowledgePath = join(__dirname, '..', 'knowledge');

interface Product {
  id: string;
  name: string;
  price: string;
  features: string[];
  bestFor: string;
  integrations: string[];
}

interface Objection {
  objection: string;
  rebuttal: string;
}

interface DiscoveryStage {
  stage: string;
  questions: string[];
}

interface DiscoveryDoc {
  stages: DiscoveryStage[];
}

const products: Product[] = JSON.parse(readFileSync(join(knowledgePath, 'products.json'), 'utf-8'));
const objections: Objection[] = JSON.parse(readFileSync(join(knowledgePath, 'objections.json'), 'utf-8'));
const discovery: DiscoveryDoc = JSON.parse(readFileSync(join(knowledgePath, 'discovery.json'), 'utf-8'));

// ---------- Tokenization ----------

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'do', 'for', 'from',
  'has', 'have', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'me',
  'my', 'no', 'not', 'of', 'on', 'or', 'our', 'so', 'that', 'the', 'their',
  'them', 'then', 'there', 'they', 'this', 'to', 'too', 'us', 'was', 'we',
  'were', 'what', 'when', 'who', 'will', 'with', 'would', 'you', 'your',
  // call-context filler
  'like', 'really', 'kind', 'sort', 'maybe', 'right', 'um', 'uh', 'okay',
  'know', 'think', 'looking', 'thing', 'things', 'something', 'anything',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Count overlapping tokens between query and target text.
 * Both sides are tokenized and stop-word filtered. Each unique query token
 * that appears in target contributes 1 to the score; longer tokens (>5 chars)
 * contribute 1.5 (favours specific terms over generic ones).
 */
function tokenOverlapScore(queryTokens: string[], targetText: string): number {
  if (queryTokens.length === 0) return 0;
  const targetTokens = new Set(tokenize(targetText));
  if (targetTokens.size === 0) return 0;
  let score = 0;
  for (const t of queryTokens) {
    if (targetTokens.has(t)) {
      score += t.length > 5 ? 1.5 : 1;
    }
  }
  return score;
}

// ---------- Public retrieval API ----------

/**
 * Retrieve product info ranked by relevance to the query.
 * Returns the top-K most relevant products formatted for prompt injection.
 * If nothing scores above threshold, returns a compact "all products" summary.
 */
export function retrieveProductInfo(query: string, topK = 2): string {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return formatProductsCompact(products);
  }

  const scored = products
    .map((p) => {
      const haystack = [
        p.name,
        p.bestFor,
        p.features.join(' '),
        p.integrations.join(' '),
      ].join(' ');
      return { product: p, score: tokenOverlapScore(queryTokens, haystack) };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (scored.length === 0) {
    return formatProductsCompact(products);
  }

  return scored
    .map(
      (s) =>
        `• ${s.product.name} (${s.product.price})\n  Features: ${s.product.features.join(', ')}\n  Best for: ${s.product.bestFor}\n  Integrations: ${s.product.integrations.join(', ')}`,
    )
    .join('\n');
}

function formatProductsCompact(items: Product[]): string {
  return items
    .map((p) => `• ${p.name} — ${p.price} — ${p.bestFor}`)
    .join('\n');
}

/**
 * Retrieve the best matching objection rebuttal for a given prospect line.
 * Uses token-overlap scoring so paraphrased objections still match.
 * Returns null when no candidate scores above the relevance threshold.
 */
export function retrieveObjectionRebuttal(text: string): string | null {
  const queryTokens = tokenize(text);
  if (queryTokens.length === 0) return null;

  const RELEVANCE_THRESHOLD = 2; // need >=2 overlapping tokens to consider a match
  const scored = objections
    .map((o) => ({
      objection: o,
      score: tokenOverlapScore(queryTokens, o.objection + ' ' + o.rebuttal),
    }))
    .filter((s) => s.score >= RELEVANCE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].objection.rebuttal : null;
}

/** Get discovery questions for a given call stage. */
export function getDiscoveryQuestions(stage: string): string[] {
  const s = discovery.stages.find((st) => st.stage === stage);
  return s ? s.questions : [];
}

/** Full knowledge dump (used sparingly — large prompt cost). */
export function getAllKnowledgeContext(): string {
  return [
    'PRODUCTS:',
    ...products.map((p) => `• ${p.name} (${p.price}) — ${p.bestFor}`),
    '',
    'OBJECTION REBUTTALS (top 3 most common):',
    ...objections.slice(0, 3).map((o) => `• "${o.objection}" → ${o.rebuttal}`),
  ].join('\n');
}
