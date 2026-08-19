import React from 'react';
import { BarChart3, Clock3, FileText, MessageSquare, Wallet } from 'lucide-react';
import { trpc } from '../services/trpc';

const money = (value: number) => `R$ ${value.toFixed(2)}`;

export default function StatisticsBoard(): React.ReactElement {
  const query = trpc.management.statistics.useQuery();
  if (query.isLoading) return <div className="rounded-2xl bg-white p-8 text-center text-slate-500">Carregando estatísticas...</div>;
  const data = query.data;
  if (!data) return <div className="rounded-2xl bg-white p-8 text-center text-slate-500">Não foi possível carregar as estatísticas.</div>;
  const taskTotal = data.tasks.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
  const expenseTotal = data.expenses.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
  const cards = [
    { label: 'Sessões', value: data.sessions.total, icon: Clock3, color: 'text-blue-600 bg-blue-50' },
    { label: 'Mensagens', value: data.messages, icon: MessageSquare, color: 'text-violet-600 bg-violet-50' },
    { label: 'Documentos', value: data.documents, icon: FileText, color: 'text-amber-600 bg-amber-50' },
    { label: 'Despesas ativas', value: money(expenseTotal), icon: Wallet, color: 'text-emerald-600 bg-emerald-50' },
  ];
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Dashboard de Estatísticas</h2>
        <p className="text-sm text-slate-500">Visão consolidada da operação Micronet Era.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`rounded-xl p-3 ${color}`}><Icon className="h-5 w-5" /></span>
              <BarChart3 className="h-5 w-5 text-slate-300" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-800">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-800">Tarefas por status</h3>
          <div className="mt-4 space-y-3">
            {['todo', 'in_progress', 'done'].map((status) => {
              const taskItem = data.tasks.find((item: { status: string; total: number }) => item.status === status);
              const total = taskItem ? taskItem.total : 0;
              const percent = taskTotal ? Math.round((total / taskTotal) * 100) : 0;
              const label = status === 'todo' ? 'A fazer' : status === 'in_progress' ? 'Em progresso' : 'Concluído';
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                    <span>{label}</span>
                    <span>{total} ({percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${status === 'done' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-800">Despesas por categoria</h3>
          <div className="mt-4 space-y-3">
            {data.expenses.length ? (
              data.expenses.map((item: { category: string; total: number }) => (
                <div key={item.category} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-sm capitalize text-slate-600">{item.category}</span>
                  <strong className="text-sm text-slate-800">{money(item.total)}</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Nenhuma despesa ativa.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
