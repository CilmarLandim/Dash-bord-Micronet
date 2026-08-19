import React, { useState } from 'react';
import { Check, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { trpc } from '../services/trpc';
import { toast } from 'sonner';

const columns = [
  { status: 'todo' as const, label: 'A fazer', color: 'border-slate-300' },
  { status: 'in_progress' as const, label: 'Em progresso', color: 'border-blue-400' },
  { status: 'done' as const, label: 'Concluído', color: 'border-emerald-400' },
];
const nextStatus = { todo: 'in_progress', in_progress: 'done', done: 'done' } as const;

export default function ScrumBoard(): React.ReactElement {
  const [title, setTitle] = useState('');
  const itemsQuery = trpc.management.scrum.list.useQuery();
  const create = trpc.management.scrum.create.useMutation({ onSuccess: () => { setTitle(''); itemsQuery.refetch(); toast.success('Tarefa criada'); } });
  const update = trpc.management.scrum.update.useMutation({ onSuccess: () => itemsQuery.refetch() });
  const remove = trpc.management.scrum.delete.useMutation({ onSuccess: () => itemsQuery.refetch() });
  const items = itemsQuery.data ?? [];
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm border border-slate-200 sm:flex-row sm:items-center">
        <div className="flex-1"><h2 className="text-2xl font-black text-slate-800">Quadro Scrum</h2><p className="text-sm text-slate-500">Organize atividades e acompanhe custos fixos lançados.</p></div>
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (title.trim()) create.mutate({ title: title.trim(), priority: 'medium' }); }}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nova tarefa" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <button disabled={create.isPending} className="rounded-xl bg-primary px-3 py-2 text-white"><Plus className="h-5 w-5" /></button>
        </form>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <div key={column.status} className={`min-h-64 rounded-2xl border-t-4 ${column.color} bg-slate-50 p-4`}>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-slate-700">{column.label}</h3><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">{items.filter((item: { status: string }) => item.status === column.status).length}</span></div>
            <div className="space-y-3">
              {items.filter((item: { status: string }) => item.status === column.status).map((item: { id: number; title: string; priority: string; status: 'todo' | 'in_progress' | 'done' }) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2"><h4 className="font-semibold text-slate-800">{item.title}</h4><button onClick={() => remove.mutate({ id: item.id })} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>
                  <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.priority === 'high' ? 'bg-red-100 text-red-700' : item.priority === 'low' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{item.priority}</span>
                  {column.status !== 'done' && <button onClick={() => update.mutate({ id: item.id, status: nextStatus[item.status] })} className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">Avançar <ChevronRight className="h-4 w-4" /></button>}
                  {column.status === 'done' && <span className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-600"><Check className="h-4 w-4" /> Finalizada</span>}
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
