import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  DollarSign,
  FileText,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '../services/trpc';
import { KeygenManager } from './KeygenManager';

type Section = 'overview' | 'sessions' | 'documents' | 'board' | 'licenses';
type BoardColumn = 'todo' | 'in_progress' | 'done';

const sectionLabels: Record<Section, string> = {
  overview: 'Visão geral',
  sessions: 'Atendimentos',
  documents: 'Documentos',
  board: 'Quadro Scrum',
  licenses: 'Licenças',
};

const columnLabels: Record<BoardColumn, string> = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  done: 'Concluído',
};

const columnStyles: Record<BoardColumn, string> = {
  todo: 'border-slate-200 bg-slate-50',
  in_progress: 'border-blue-200 bg-blue-50',
  done: 'border-emerald-200 bg-emerald-50',
};

function formatDate(value: unknown) {
  if (!value) return '—';
  return new Date(Number(value)).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDuration(seconds: number) {
  const safeSeconds = Number(seconds || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

function formatCurrency(value: unknown) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function nextColumn(column: BoardColumn): BoardColumn {
  if (column === 'todo') return 'in_progress';
  if (column === 'in_progress') return 'done';
  return 'todo';
}

export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sessionSearch, setSessionSearch] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [fixedCostDescription, setFixedCostDescription] = useState('');
  const [fixedCostAmount, setFixedCostAmount] = useState('');
  const [recurrence, setRecurrence] = useState<'monthly' | 'weekly' | 'annual' | 'one_time'>('monthly');

  const utils = trpc.useUtils();
  const overviewQuery = trpc.admin.overview.useQuery();
  const sessionsQuery = trpc.admin.sessions.useQuery({
    limit: 100,
    search: sessionSearch.trim() || undefined,
  });
  const documentsQuery = trpc.admin.documents.useQuery({ limit: 100 });
  const boardQuery = trpc.admin.board.useQuery();

  const refreshAll = () => {
    void utils.admin.overview.invalidate();
    void utils.admin.sessions.invalidate();
    void utils.admin.documents.invalidate();
    void utils.admin.board.invalidate();
  };

  const createTaskMutation = trpc.admin.createTask.useMutation({
    onSuccess: () => {
      setTaskTitle('');
      setTaskDescription('');
      toast.success('Atividade adicionada ao quadro');
      void utils.admin.board.invalidate();
    },
    onError: () => toast.error('Não foi possível adicionar a atividade'),
  });

  const createFixedCostMutation = trpc.admin.createFixedCost.useMutation({
    onSuccess: () => {
      setFixedCostDescription('');
      setFixedCostAmount('');
      toast.success('Custo fixo lançado e movido para Em andamento');
      void utils.admin.board.invalidate();
      void utils.admin.overview.invalidate();
    },
    onError: () => toast.error('Não foi possível lançar o custo fixo'),
  });

  const moveTaskMutation = trpc.admin.moveTask.useMutation({
    onSuccess: () => void utils.admin.board.invalidate(),
    onError: () => toast.error('Não foi possível mover o card'),
  });

  const markPaidMutation = trpc.admin.markFixedCostPaid.useMutation({
    onSuccess: () => {
      toast.success('Custo marcado como pago e movido para Concluído');
      void utils.admin.board.invalidate();
    },
    onError: () => toast.error('Não foi possível atualizar o custo'),
  });

  const metrics = overviewQuery.data?.metrics;
  const board = boardQuery.data;
  const boardColumns = useMemo(() => {
    if (!board) return [] as Array<[BoardColumn, any[]]>;
    return [
      ['todo', board.columns.todo],
      ['in_progress', board.columns.in_progress],
      ['done', board.columns.done],
    ] as Array<[BoardColumn, any[]]>;
  }, [board]);

  const submitTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    createTaskMutation.mutate({
      title: taskTitle,
      description: taskDescription || undefined,
      taskType: 'activity',
    });
  };

  const submitExpense = (event: React.FormEvent) => {
    event.preventDefault();
    if (!expenseDescription.trim() || !expenseAmount) return;
    createTaskMutation.mutate({
      title: `Despesa: ${expenseDescription}`,
      description: 'Despesa lançada manualmente.',
      taskType: 'expense',
      amount: Number(expenseAmount),
    });
    setExpenseDescription('');
    setExpenseAmount('');
  };

  const submitFixedCost = (event: React.FormEvent) => {
    event.preventDefault();
    if (!fixedCostDescription.trim() || !fixedCostAmount) return;
    createFixedCostMutation.mutate({
      description: fixedCostDescription,
      amount: Number(fixedCostAmount),
      recurrence,
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Centro de controle</p>
          <h2 className="mt-1 text-3xl font-black text-slate-900">Visão geral</h2>
          <p className="mt-1 text-sm text-slate-500">Acompanhe a operação da Micronet em um único lugar.</p>
        </div>
        <button onClick={refreshAll} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:border-primary hover:text-primary">
          <RefreshCw className="h-4 w-4" /> Atualizar dados
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Activity />} label="Atendimentos" value={metrics?.sessions ?? 0} detail={`${metrics?.activeSessions ?? 0} ativos`} tone="teal" />
        <MetricCard icon={<Clock3 />} label="Tempo processado" value={formatDuration(metrics?.totalSeconds ?? 0)} detail="somatório das sessões" tone="blue" />
        <MetricCard icon={<FileText />} label="Documentos" value={metrics?.documents ?? 0} detail={`${metrics?.messages ?? 0} mensagens registradas`} tone="amber" />
        <MetricCard icon={<KeyRound />} label="Licenças ativas" value={metrics?.activeLicenses ?? 0} detail={`${metrics?.licenses ?? 0} emitidas`} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Atendimentos recentes" icon={<CalendarClock className="h-5 w-5" />}>
          <RecentSessions sessions={overviewQuery.data?.recentSessions || []} />
        </Panel>
        <Panel title="Documentos recentes" icon={<FileText className="h-5 w-5" />}>
          <RecentDocuments documents={overviewQuery.data?.recentDocuments || []} />
        </Panel>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <PageHeading title="Atendimentos" description="Histórico de sessões e volume de mensagens do agente." />
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} placeholder="Buscar pelo ID da sessão" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
      </div>
      <Panel title={`${sessionsQuery.data?.length ?? 0} sessões encontradas`} icon={<ListChecks className="h-5 w-5" />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
              <tr><th className="px-3 py-3">Sessão</th><th className="px-3 py-3">Início</th><th className="px-3 py-3">Duração</th><th className="px-3 py-3">Mensagens</th><th className="px-3 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(sessionsQuery.data || []).map((session: any) => (
                <tr key={session.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{session.id}</td>
                  <td className="px-3 py-3 text-slate-500">{formatDate(session.startTime)}</td>
                  <td className="px-3 py-3 font-semibold text-slate-700">{formatDuration(session.totalTimeSeconds)}</td>
                  <td className="px-3 py-3 text-slate-500">{session.messageCount}</td>
                  <td className="px-3 py-3"><StatusBadge active={!session.endTime} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sessionsQuery.isLoading && sessionsQuery.data?.length === 0 && <EmptyState text="Nenhum atendimento encontrado." />}
        </div>
      </Panel>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <PageHeading title="Documentos" description="Consulte os documentos produzidos durante os atendimentos." />
      <Panel title="Arquivo de documentos" icon={<FileText className="h-5 w-5" />}>
        <div className="space-y-3">
          {(documentsQuery.data || []).map((document: any) => (
            <div key={document.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><FileText className="h-5 w-5" /></div>
                <div><p className="font-bold text-slate-800">{document.title || document.type}</p><p className="text-xs text-slate-500">{document.id} · {formatDate(document.createdAt)}</p></div>
              </div>
              <a href={document.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Abrir documento <ArrowRight className="h-4 w-4" /></a>
            </div>
          ))}
          {!documentsQuery.isLoading && documentsQuery.data?.length === 0 && <EmptyState text="Nenhum documento foi registrado ainda." />}
        </div>
      </Panel>
    </div>
  );

  const renderBoard = () => (
    <div className="space-y-6">
      <PageHeading title="Quadro Scrum" description="Custos, despesas e atividades avançam pelo fluxo operacional." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Nova atividade" icon={<Plus className="h-5 w-5" />}>
          <form onSubmit={submitTask} className="space-y-3">
            <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Título da atividade" className="form-control" />
            <textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Descrição opcional" rows={3} className="form-control resize-none" />
            <button disabled={createTaskMutation.isPending || !taskTitle.trim()} className="primary-button"><Plus className="h-4 w-4" /> Adicionar ao quadro</button>
          </form>
        </Panel>
        <Panel title="Lançar despesa" icon={<Wallet className="h-5 w-5" />}>
          <form onSubmit={submitExpense} className="space-y-3">
            <input value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} placeholder="Descrição da despesa" className="form-control" />
            <input value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} type="number" min="0" step="0.01" placeholder="Valor (R$)" className="form-control" />
            <button disabled={createTaskMutation.isPending || !expenseDescription.trim() || !expenseAmount} className="primary-button"><DollarSign className="h-4 w-4" /> Lançar em A fazer</button>
          </form>
        </Panel>
        <Panel title="Lançar custo fixo" icon={<DollarSign className="h-5 w-5" />}>
          <form onSubmit={submitFixedCost} className="space-y-3">
            <input value={fixedCostDescription} onChange={(event) => setFixedCostDescription(event.target.value)} placeholder="Ex.: Internet, aluguel" className="form-control" />
            <div className="grid grid-cols-2 gap-2"><input value={fixedCostAmount} onChange={(event) => setFixedCostAmount(event.target.value)} type="number" min="0" step="0.01" placeholder="Valor (R$)" className="form-control" /><select value={recurrence} onChange={(event) => setRecurrence(event.target.value as typeof recurrence)} className="form-control"><option value="monthly">Mensal</option><option value="weekly">Semanal</option><option value="annual">Anual</option><option value="one_time">Único</option></select></div>
            <button disabled={createFixedCostMutation.isPending || !fixedCostDescription.trim() || !fixedCostAmount} className="primary-button"><CalendarClock className="h-4 w-4" /> Lançar custo fixo</button>
          </form>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {boardColumns.map(([column, tasks]) => (
          <section key={column} className={`rounded-2xl border p-4 ${columnStyles[column]}`}>
            <div className="mb-4 flex items-center justify-between"><h3 className="font-black text-slate-800">{columnLabels[column]}</h3><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500">{tasks.length}</span></div>
            <div className="space-y-3">
              {tasks.map((task: any) => (
                <article key={task.id} className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2"><div><p className="font-bold text-slate-800">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.description || 'Sem descrição'}</p></div><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">{task.taskType}</span></div>
                  {task.amount != null && <p className="mt-3 text-sm font-black text-primary">{formatCurrency(task.amount)}</p>}
                  <button onClick={() => moveTaskMutation.mutate({ taskId: task.id, columnName: nextColumn(column) })} disabled={moveTaskMutation.isPending} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">{column === 'done' ? 'Reabrir tarefa' : 'Avançar'} <ChevronRight className="h-3.5 w-3.5" /></button>
                </article>
              ))}
              {tasks.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-5 text-center text-xs text-slate-500">Nenhum item nesta coluna.</p>}
            </div>
          </section>
        ))}
      </div>

      <Panel title="Custos fixos lançados" icon={<CheckCircle2 className="h-5 w-5" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(board?.fixedCosts || []).map((cost: any) => (
            <div key={cost.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4"><div><p className="font-bold text-slate-800">{cost.description}</p><p className="text-xs text-slate-500">{cost.recurrence} · {formatCurrency(cost.amount)}</p></div>{cost.status === 'paid' ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><Check className="h-4 w-4" /> Pago</span> : <button onClick={() => markPaidMutation.mutate({ costId: cost.id })} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">Marcar pago</button>}</div>
          ))}
          {(board?.fixedCosts || []).length === 0 && <EmptyState text="Nenhum custo fixo lançado." />}
        </div>
      </Panel>
    </div>
  );

  const renderContent = () => {
    if (activeSection === 'overview') return renderOverview();
    if (activeSection === 'sessions') return renderSessions();
    if (activeSection === 'documents') return renderDocuments();
    if (activeSection === 'board') return renderBoard();
    return <KeygenManager />;
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-900 p-3 text-white shadow-xl xl:sticky xl:top-4">
        <div className="mb-4 border-b border-white/10 px-3 pb-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">Micronet Era</p><h2 className="mt-1 text-xl font-black">Painel Admin</h2></div>
        <nav className="space-y-1">
          {(Object.keys(sectionLabels) as Section[]).map((section) => {
            const icons: Record<Section, React.ReactNode> = { overview: <LayoutDashboard className="h-4 w-4" />, sessions: <ListChecks className="h-4 w-4" />, documents: <FileText className="h-4 w-4" />, board: <ClipboardList className="h-4 w-4" />, licenses: <KeyRound className="h-4 w-4" /> };
            return <button key={section} onClick={() => setActiveSection(section)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${activeSection === section ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>{icons[section]} {sectionLabels[section]}</button>;
          })}
        </nav>
        <div className="mt-5 rounded-xl bg-white/10 p-3 text-xs text-slate-300"><p className="font-bold text-white">Regra do menu</p><p className="mt-1 leading-relaxed">Um módulo é exibido por vez para manter o foco da operação.</p></div>
      </aside>
      <main className="min-w-0">{renderContent()}</main>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; detail: string; tone: 'teal' | 'blue' | 'amber' | 'violet' }> = ({ icon, label, value, detail, tone }) => {
  const toneClasses = { teal: 'bg-teal-50 text-teal-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>{icon}</div><p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-3xl font-black text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
};

const Panel: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800"><span className="text-primary">{icon}</span><h3 className="font-black">{title}</h3></div>{children}</div>;

const PageHeading: React.FC<{ title: string; description: string }> = ({ title, description }) => <div><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Administração</p><h2 className="mt-1 text-3xl font-black text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>;

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => active ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ativa</span> : <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500"><XCircle className="h-3.5 w-3.5" /> Encerrada</span>;

const RecentSessions: React.FC<{ sessions: any[] }> = ({ sessions }) => sessions.length ? <div className="space-y-3">{sessions.map((session) => <div key={session.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="font-mono text-xs font-bold text-slate-700">{session.id}</p><p className="mt-1 text-xs text-slate-500">{formatDate(session.startTime)}</p></div><StatusBadge active={!session.endTime} /></div>)}</div> : <EmptyState text="Nenhum atendimento registrado." />;

const RecentDocuments: React.FC<{ documents: any[] }> = ({ documents }) => documents.length ? <div className="space-y-3">{documents.map((document) => <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-primary/5"><div className="flex items-center gap-3"><FileText className="h-4 w-4 text-primary" /><div><p className="text-sm font-bold text-slate-700">{document.title || document.type}</p><p className="text-xs text-slate-500">{formatDate(document.createdAt)}</p></div></div><ArrowRight className="h-4 w-4 text-slate-400" /></a>)}</div> : <EmptyState text="Nenhum documento registrado." />;

const EmptyState: React.FC<{ text: string }> = ({ text }) => <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">{text}</div>;

export default AdminDashboard;
