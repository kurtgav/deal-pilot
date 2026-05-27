import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const knowledgePath = join(__dirname, '..', 'knowledge');

const products = JSON.parse(readFileSync(join(knowledgePath, 'products.json'), 'utf-8'));
const objections = JSON.parse(readFileSync(join(knowledgePath, 'objections.json'), 'utf-8'));
const discovery = JSON.parse(readFileSync(join(knowledgePath, 'discovery.json'), 'utf-8'));

export function retrieveProductInfo(query: string): string {
  const q = query.toLowerCase();
  const relevant = products.filter((p: any) =>
    p.name.toLowerCase().includes(q) ||
    p.features.some((f: string) => f.toLowerCase().includes(q)) ||
    p.bestFor.toLowerCase().includes(q)
  );
  if (relevant.length > 0) return JSON.stringify(relevant, null, 2);
  // Return all products as context if no specific match
  return JSON.stringify(products, null, 2);
}

export function retrieveObjectionRebuttal(objectionText: string): string | null {
  const q = objectionText.toLowerCase();
  const match = objections.find((o: any) =>
    q.includes(o.objection.toLowerCase()) ||
    o.objection.toLowerCase().split(' ').some((w: string) => w.length > 4 && q.includes(w))
  );
  return match ? match.rebuttal : null;
}

export function getDiscoveryQuestions(stage: string): string[] {
  const s = discovery.stages.find((st: any) => st.stage === stage);
  return s ? s.questions : [];
}

export function getAllKnowledgeContext(): string {
  return `PRODUCTS:\n${JSON.stringify(products, null, 2)}\n\nOBJECTION REBUTTALS:\n${JSON.stringify(objections, null, 2)}`;
}
