/**
 * EmbeddingProvider — the seam for turning text into vectors so retrieval can
 * use semantic similarity instead of brittle keyword overlap.
 *
 * The default implementation is a deterministic, synchronous, OFFLINE TF-IDF
 * vectorizer. It is a real upgrade over raw token-overlap because:
 *   1. Terms are IDF-weighted (rare, distinctive terms like "salesforce" or
 *      "soc" matter more than generic ones).
 *   2. Out-of-vocabulary query terms (e.g. "hipaa", "dynamics", "on-premise")
 *      are weighted as highly distinctive, so a question full of unknown terms
 *      gets a LOW cosine similarity to every known product → it is correctly
 *      flagged as out-of-knowledge-base.
 *
 * It stays synchronous so the retrieval path adds no latency to a voice turn.
 * To swap in a hosted semantic model later, implement this interface (embedding
 * the KB at fit() time and the query at embed() time) and inject it.
 */
export interface EmbeddingProvider {
  /** Learn any corpus statistics (vocabulary, IDF) from the KB documents. */
  fit(docs: string[]): void;
  /** Map text to a sparse vector (token -> weight). */
  embed(text: string): Map<string, number>;
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'do', 'does', 'for',
  'from', 'has', 'have', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just',
  'me', 'my', 'no', 'not', 'of', 'on', 'or', 'our', 'so', 'that', 'the',
  'their', 'them', 'then', 'there', 'they', 'this', 'to', 'too', 'us', 'was',
  'we', 'were', 'what', 'when', 'who', 'will', 'with', 'would', 'you', 'your',
  'like', 'really', 'kind', 'sort', 'maybe', 'right', 'um', 'uh', 'okay',
  'know', 'think', 'looking', 'thing', 'things', 'something', 'anything',
  'how', 'can', 'could', 'should', 'about', 'any', 'much', 'many',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map(stem);
}

/** Crude suffix stripping so morphological variants collide
 *  (e.g. integrate/integration/integrations → integr). Good enough to lift
 *  lexical recall without a full stemmer. */
function stem(w: string): string {
  for (const suf of ['ations', 'ation', 'ing', 'ions', 'ion', 'ces', 'ed', 'es', 's']) {
    if (w.length > suf.length + 2 && w.endsWith(suf)) return w.slice(0, -suf.length);
  }
  return w;
}

class TfIdfProvider implements EmbeddingProvider {
  private idf = new Map<string, number>();
  private idfOov = 2; // weight for terms unseen in the KB (treated as distinctive)

  fit(docs: string[]): void {
    this.idf.clear();
    const n = docs.length || 1;
    const df = new Map<string, number>();
    for (const doc of docs) {
      for (const t of new Set(tokenize(doc))) df.set(t, (df.get(t) ?? 0) + 1);
    }
    for (const [t, d] of df) this.idf.set(t, Math.log((n + 1) / (d + 1)) + 1);
    // An out-of-vocabulary term is at least as distinctive as the rarest known term.
    this.idfOov = Math.log(n + 1) + 1;
  }

  embed(text: string): Map<string, number> {
    const tf = new Map<string, number>();
    for (const t of tokenize(text)) tf.set(t, (tf.get(t) ?? 0) + 1);
    const vec = new Map<string, number>();
    for (const [t, count] of tf) {
      vec.set(t, count * (this.idf.get(t) ?? this.idfOov));
    }
    return vec;
  }
}

export function createEmbeddingProvider(): EmbeddingProvider {
  return new TfIdfProvider();
}

export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0;
  for (const [, v] of a) normA += v * v;
  for (const [, v] of b) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [t, v] of small) {
    const w = large.get(t);
    if (w !== undefined) dot += v * w;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
