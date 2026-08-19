import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { trpc } from '../services/trpc';
import { toast } from 'sonner';

export default function ExpenseManager(): React.ReactElement {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'fixed' | 'variable' | 'other'>('variable');
  const expensesQuery = trpc.management.expenses.list.useQuery();
  const create = trpc.management.expenses.create.useMutation({ onSuccess: () => { setDescription(''); setAmount(''); expensesQuery.refetch(); toast.success('Despesa registrada'); } });
  const updateStatus = trpc.management.expenses.updateStatus.useMutation({ onSuccess: () => expensesQuery.refetch() });
  const remove = trpc.management.expenses.delete.useMutation({ onSuccess: () => expensesQuery.refetch() });
  const expenses = expensesQuery.data ?? [];
  const total = useMemo(() => expenses.filter((expense: { status: string }) => expense.status !== 'cancelled').reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0), [expenses]);
  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-800">Despesas</h2>
            <p className="text-sm text-slate-500">Total ativo: <strong>R$ {total.toFixed(2)}</strong></p>
          </div>
          <form className="grid gap-2 sm:grid-cols-[1fr_120px_130px_auto]" onSubmit={(event) => { event.preventDefault(); const value = Number(amount.replace(',', '.')); if (description.trim() && value > 0) create.mutate({ description: description.trim(), amount: value, category, status: 'pending' }); }}>
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Valor" inputMode="decimal" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="fixed">Fixo</option>
              <option value="variable">Variável</option>
              <option value="other">Outro</option>
            </select>
            <button disabled={create.isPending} className="rounded-xl bg-secondary px-3 py-2 text-white"><Plus className="h-5 w-5" /></button>
          </form>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {expenses.map((expense: { id: number; description: string; amount: number; category: string; status: string; expense_date: string }) => (
            <div key={expense.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{expense.description}</p>
                <p className="text-xs text-slate-500">{expense.category} · {expense.expense_date}</p>
              </div>
              <strong className="text-slate-800">R$ {expense.amount.toFixed(2)}</strong>
              <select value={expense.status} onChange={(event) => updateStatus.mutate({ id: expense.id, status: event.target.value as 'pending' | 'paid' | 'cancelled' })} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <button onClick={() => remove.mutate({ id: expense.id })} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {expenses.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Nenhuma despesa registrada.</p>}
        </div>
      </div>
    </section>
  );
}
