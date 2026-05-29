import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { loadKnowledge } from '../services/RAGService.js';

export const knowledgeRouter = Router();

// Map resource path -> table + allowed columns.
const TABLES: Record<string, { table: string; cols: string[] }> = {
  products: { table: 'knowledge_products', cols: ['name', 'price', 'features', 'best_for', 'integrations'] },
  objections: { table: 'knowledge_objections', cols: ['objection', 'rebuttal'] },
  discovery: { table: 'knowledge_discovery', cols: ['stage', 'questions'] },
};

function pick(body: any, cols: string[]) {
  const out: any = {};
  for (const c of cols) if (body[c] !== undefined) out[c] = body[c];
  return out;
}

knowledgeRouter.get('/:resource', async (req, res) => {
  const meta = TABLES[req.params.resource];
  if (!meta) return res.status(404).json({ error: 'Unknown resource' });
  const { data, error } = await supabaseAdmin
    .from(meta.table)
    .select('*')
    .or(`user_id.eq.${req.user!.id},user_id.is.null`)
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

knowledgeRouter.post('/:resource', async (req, res) => {
  const meta = TABLES[req.params.resource];
  if (!meta) return res.status(404).json({ error: 'Unknown resource' });
  const row = { ...pick(req.body, meta.cols), user_id: req.user!.id };
  const { data, error } = await supabaseAdmin.from(meta.table).insert(row).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  await loadKnowledge();
  res.status(201).json(data);
});

knowledgeRouter.put('/:resource/:id', async (req, res) => {
  const meta = TABLES[req.params.resource];
  if (!meta) return res.status(404).json({ error: 'Unknown resource' });
  const { data, error } = await supabaseAdmin
    .from(meta.table)
    .update(pick(req.body, meta.cols))
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select('*')
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found or not owned' });
  await loadKnowledge();
  res.json(data);
});

knowledgeRouter.delete('/:resource/:id', async (req, res) => {
  const meta = TABLES[req.params.resource];
  if (!meta) return res.status(404).json({ error: 'Unknown resource' });
  const { error } = await supabaseAdmin
    .from(meta.table)
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);
  if (error) return res.status(500).json({ error: error.message });
  await loadKnowledge();
  res.status(204).end();
});
