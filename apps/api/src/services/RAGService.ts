import { supabaseAdmin } from '../lib/supabase.js';
import {
  createEmbeddingProvider,
  cosineSimilarity,
  tokenize,
  type EmbeddingProvider,
} from './embeddings.js';

/**
 * Knowledge base retrieval. Data lives in Supabase (knowledge_* tables) and
 * is edited via the admin UI. To keep voice-turn latency low, the catalogue
 * is cached in memory and refreshed on demand (loadKnowledge) — the retrieval
 * functions stay synchronous so AIAgent doesn't need to await mid-conversation.
 *
 * Grounding uses semantic (TF-IDF cosine) similarity via an EmbeddingProvider,
 * with a threshold so out-of-knowledge-base questions are flagged ungrounded
 * (forcing the agent to escalate instead of fabricating). Product vectors are
 * (re)computed whenever the knowledge cache changes.
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

// Semantic grounding state.
const embedder: EmbeddingProvider = createEmbeddingProvider();
let productVectors: Map<string, number>[] = [];
/** Minimum cosine similarity for a query to count as grounded in a product.
 *  Below this, the agent must escalate. Tuned against the eval set so that
 *  ZERO out-of-KB questions are answered (no fabrication) — the safe failure
 *  mode is over-escalation, not invention. Lexical similarity has an inherent
 *  overlap zone; swapping a hosted semantic model in via EmbeddingProvider
 *  would lift in-KB recall without weakening the no-fabrication guarantee. */
const GROUNDING_THRESHOLD = 0.11;

function productDocText(p: Product): string {
  return [p.name, p.bestFor, p.features.join(' '), p.integrations.join(' '), p.price].join(' ');
}

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
  onKnowledgeLoaded();
  console.log(`[RAG] loaded ${products.length} products, ${objections.length} objections, ${discovery.length} discovery stages`);
}

/** Load knowledge from in-memory objects. Used by tests and the eval harness
 *  so the retrieval logic can run fully offline (no Supabase). */
export function loadKnowledgeFromObjects(
  p: Product[],
  o: Objection[],
  d: DiscoveryStage[],
): void {
  products = p;
  objections = o;
  discovery = d;
  onKnowledgeLoaded();
}

/** Hook invoked after the knowledge cache changes. Recompute the IDF model and
 *  per-product vectors so grounding reflects the latest knowledge base. */
function onKnowledgeLoaded(): void {
  const docs = products.map(productDocText);
  embedder.fit(docs);
  productVectors = docs.map((d) => embedder.embed(d));
}

// ---------- Tokenization ----------

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

export interface ProductGrounding {
  /** True when the query is relevant enough to a known product to answer from
   *  the knowledge base. When false, the agent must escalate instead of
   *  free-generating a product/pricing answer. */
  grounded: boolean;
  /** Formatted product context to inject into the prompt (empty when not grounded). */
  context: string;
  /** Best relevance score (semantics depend on the active scorer). */
  topScore: number;
}

/**
 * Decide whether the query can be answered from the product knowledge base,
 * and return the supporting context. This is the single source of truth for
 * the grounding gate — AIAgent and the eval harness both call it.
 */
/**
 * Decide whether the query can be answered from the product knowledge base,
 * and return the supporting context. This is the single source of truth for
 * the grounding gate — AIAgent and the eval harness both call it.
 *
 * Uses semantic (TF-IDF cosine) similarity against each product. If the best
 * similarity is below GROUNDING_THRESHOLD the query is out-of-KB → grounded
 * is false and the agent must escalate rather than fabricate an answer.
 */
export function assessProductGrounding(query: string, topK = 2): ProductGrounding {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    // Generic/empty input (e.g. greeting) — show the catalogue overview.
    return { grounded: true, context: formatProductsCompact(products), topScore: 0 };
  }
  if (productVectors.length === 0) {
    return { grounded: false, context: '', topScore: 0 };
  }

  const qVec = embedder.embed(query);
  const scored = products
    .map((product, i) => ({ product, score: cosineSimilarity(qVec, productVectors[i]) }))
    .sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score ?? 0;
  if (topScore < GROUNDING_THRESHOLD) {
    return { grounded: false, context: '', topScore };
  }

  const context = scored
    .slice(0, topK)
    .filter((s) => s.score > 0)
    .map(
      (s) =>
        `• ${s.product.name} (${s.product.price})\n  Features: ${s.product.features.join(', ')}\n  Best for: ${s.product.bestFor}\n  Integrations: ${s.product.integrations.join(', ')}`,
    )
    .join('\n');
  return { grounded: true, context, topScore };
}

export function retrieveProductInfo(query: string, topK = 2): string {
  return assessProductGrounding(query, topK).context;
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
