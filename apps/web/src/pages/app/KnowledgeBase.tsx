import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { toast } from '../../components/Toaster';
import { Plus, Trash2 } from 'lucide-react';

type Tab = 'products' | 'objections';

interface ProductRow { id: string; name: string; price: string; features: string[]; best_for: string; integrations: string[]; user_id: string | null; }
interface ObjectionRow { id: string; objection: string; rebuttal: string; user_id: string | null; }

export default function KnowledgeBase() {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [objections, setObjections] = useState<ObjectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.getKnowledge('products'), api.getKnowledge('objections')])
      .then(([p, o]) => { setProducts(p); setObjections(o); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const addProduct = async () => {
    const name = prompt('Product name?');
    if (!name) return;
    const price = prompt('Price?') || '';
    try { await api.createKnowledge('products', { name, price, features: [], integrations: [], best_for: '' }); load(); }
    catch (e: any) { toast(e.message || 'Failed to add product', 'error'); }
  };
  const addObjection = async () => {
    const objection = prompt('Objection?');
    if (!objection) return;
    const rebuttal = prompt('Rebuttal?') || '';
    try { await api.createKnowledge('objections', { objection, rebuttal }); load(); }
    catch (e: any) { toast(e.message || 'Failed to add objection', 'error'); }
  };
  const remove = async (resource: Tab, id: string) => {
    if (!confirm('Delete this entry?')) return;
    try { await api.deleteKnowledge(resource, id); load(); }
    catch (e: any) { toast(e.message || 'Failed to delete', 'error'); }
  };

  if (loading) return <div className="max-w-5xl text-center py-16 text-[14px] text-slate-400">Loading knowledge base…</div>;

  return (
    <div className="max-w-5xl space-y-6">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-[13px] text-red-700">{error}</div>}

      <div className="flex items-center gap-2">
        {(['products', 'objections'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium capitalize transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t}
          </button>
        ))}
        <button
          onClick={tab === 'products' ? addProduct : addObjection}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {tab === 'products' && (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="dash-card p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-slate-900">{p.name} <span className="text-slate-400 font-normal">· {p.price}</span></div>
                <div className="text-[13px] text-slate-500 mt-1">{p.best_for}</div>
                <div className="text-[12px] text-slate-400 mt-1 truncate">{p.features?.join(', ')}</div>
              </div>
              {p.user_id ? (
                <button onClick={() => remove('products', p.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors shrink-0"><Trash2 className="h-4 w-4" /></button>
              ) : (
                <span className="text-[11px] text-slate-300 shrink-0">global</span>
              )}
            </div>
          ))}
          {products.length === 0 && <div className="text-center py-12 text-[14px] text-slate-400">No products yet.</div>}
        </div>
      )}

      {tab === 'objections' && (
        <div className="space-y-3">
          {objections.map(o => (
            <div key={o.id} className="dash-card p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-slate-900">{o.objection}</div>
                <div className="text-[13px] text-slate-500 mt-1 leading-relaxed">{o.rebuttal}</div>
              </div>
              {o.user_id ? (
                <button onClick={() => remove('objections', o.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors shrink-0"><Trash2 className="h-4 w-4" /></button>
              ) : (
                <span className="text-[11px] text-slate-300 shrink-0">global</span>
              )}
            </div>
          ))}
          {objections.length === 0 && <div className="text-center py-12 text-[14px] text-slate-400">No objections yet.</div>}
        </div>
      )}
    </div>
  );
}
