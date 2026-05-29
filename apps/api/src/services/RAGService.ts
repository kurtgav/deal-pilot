import { supabaseAdmin } from '../lib/supabase.js';

/**
 * Knowledge base retrieval. Data lives in Supabase (knowledge_* tables) and
 * is edited via the admin UI. To keep voice-turn latency low, the catalogue
 * is cached in memory and refreshed on demand (loadKnowledge) — the retrieval
 * functions stay synchronous so AIAgent doesn't need to await mid-conversation.
 */

interface Product {
  name: string;
  price: string;
  features: string[];
  bestFor: string;
  integrations: string[];
}
interface Objection { objection: string; rebuttal: string; }
interface DiscoveryStage { stage: string; questions: string[]; }

let products: Product[] = [];
let objections: Objection[] = [];
let discovery: DiscoveryStage[] = [];

/** Load (or reload) the knowledge cache from Supabase. Call at startup and
 *  after any admin edit so the AI grounds on the latest content. */
export async function loadKnowledge(): Promise<void> {
  const [p, o, d] = await Promise.all([
    supabaseAdmin.from('knowledge_products').select('*'),
    supabaseAdmin.from('knowledge_objections').select('*'),
    supabaseAdmin.from('knowledge_discovery').select('*'),
  ]);
  if (p.data) products = p.data.map((r: any) => ({
    name: r.name, price: r.price, features: r.features ?? [], bestFor: r.best_for, integrations: r.integrations ?? [],
  }));
  if (o.data) objections = o.data.map((r: any) => ({ objection: r.objection, rebuttal: r.rebuttal }));
  if (d.data) discovery = d.data.map((r: any) => ({ stage: r.stage, questions: r.questions ?? [] }));
  console.log(`[RAG] loaded ${products.length} products, ${objections.length} objections, ${discovery.length} discovery stages`);
}

// ---------- Tokenization ----------

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'do', 'for', 'from',
  'has', 'have', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'me',
  'my', 'no', 'not', 'of', 'on', 'or', 'our', 'so', 'that', 'the', 'their',
  'them', 'then', 'there', 'they', 'this', 'to', 'too', 'us', 'was', 'we',
  'were', 'what', 'when', 'who', 'will', 'with', 'would', 'you', 'your',
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

function tokenOverlapScore(queryTokens: string[], targetText: string): number {
  if (queryTokens.length === 0) return 0;
  const targetTokens = new Set(tokenize(targetText));
  if (targetTokens.size === 0) return 0;
  let score = 0;
  for (const t of queryTokens) {
    if (targetTokens.has(t)) score += t.length > 5 ? 1.5 : 1;
  }
  return score;
}

// ---------- Public retrieval API ----------

export function retrieveProductInfo(query: string, topK = 2): string {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return formatProductsCompact(products);

  const scored = products
    .map((p) => {
      const haystack = [p.name, p.bestFor, p.features.join(' '), p.integrations.join(' ')].join(' ');
      return { product: p, score: tokenOverlapScore(queryTokens, haystack) };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (scored.length === 0) return formatProductsCompact(products);

  return scored
    .map(
      (s) =>
        `• ${s.product.name} (${s.product.price})\n  Features: ${s.product.features.join(', ')}\n  Best for: ${s.product.bestFor}\n  Integrations: ${s.product.integrations.join(', ')}`,
    )
    .join('\n');
}

function formatProductsCompact(items: Product[]): string {
  return items.map((p) => `• ${p.name} — ${p.price} — ${p.bestFor}`).join('\n');
}

export function retrieveObjectionRebuttal(text: string): string | null {
  const queryTokens = tokenize(text);
  if (queryTokens.length === 0) return null;

  const RELEVANCE_THRESHOLD = 2;
  const scored = objections
    .map((o) => ({ objection: o, score: tokenOverlapScore(queryTokens, o.objection + ' ' + o.rebuttal) }))
    .filter((s) => s.score >= RELEVANCE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].objection.rebuttal : null;
}

export function getDiscoveryQuestions(stage: string): string[] {
  const s = discovery.find((st) => st.stage === stage);
  return s ? s.questions : [];
}

export function getAllKnowledgeContext(): string {
  return [
    'PRODUCTS:',
    ...products.map((p) => `• ${p.name} (${p.price}) — ${p.bestFor}`),
    '',
    'OBJECTION REBUTTALS (top 3 most common):',
    ...objections.slice(0, 3).map((o) => `• "${o.objection}" → ${o.rebuttal}`),
  ].join('\n');
}
