import type { AIResponse, SuggestedOperationalAction } from '../../src/types';
import type { OperationalSnapshot, Priority } from './db';

const BRIEFING_PATTERNS = [
  /\b(briefing|resumo|situa[cç][aã]o|status|pend[eê]ncia|pend[eê]ncias|prioridade|prioridades)\b/i,
  /\b(como est[aá] (a )?(opera[cç][aã]o|empresa|rotina))\b/i,
];

const CREATE_TASK_PATTERN = /^\s*(?:criar|crie|adicionar|adicione)\s+tarefa\s*:\s*(.+)$/i;

function taskPriorityFromText(title: string): Priority {
  if (/\b(urgente|hoje|cr[ií]tico|alta prioridade)\b/i.test(title)) return 'high';
  if (/\b(quando poss[ií]vel|baixa prioridade|sem pressa)\b/i.test(title)) return 'low';
  return 'medium';
}

export function buildOperationalBriefing(snapshot: OperationalSnapshot): AIResponse {
  const openTasks = snapshot.tasks.todo + snapshot.tasks.inProgress;
  const parts: string[] = [];

  if (openTasks === 0) {
    parts.push('Não há tarefas abertas no quadro Scrum.');
  } else {
    parts.push(`Há ${openTasks} tarefa${openTasks === 1 ? '' : 's'} em aberto, sendo ${snapshot.tasks.todo} a fazer e ${snapshot.tasks.inProgress} em progresso.`);
  }

  if (snapshot.expenses.pendingCount > 0) {
    parts.push(`Existem ${snapshot.expenses.pendingCount} despesa${snapshot.expenses.pendingCount === 1 ? '' : 's'} pendente${snapshot.expenses.pendingCount === 1 ? '' : 's'}, totalizando R$ ${snapshot.expenses.pendingTotal.toFixed(2)}.`);
  } else {
    parts.push('Não existem despesas pendentes.');
  }

  const sessionLabel = snapshot.sessions.total === 1 ? 'sessão' : 'sessões';
  parts.push(`${snapshot.documents.total} documento${snapshot.documents.total === 1 ? '' : 's'} registrado${snapshot.documents.total === 1 ? '' : 's'} e ${snapshot.sessions.total} ${sessionLabel} no histórico.`);

  const nextStep = snapshot.tasks.todo > 0
    ? 'Recomendo começar pela próxima tarefa da coluna A fazer.'
    : snapshot.expenses.pendingCount > 0
      ? 'Recomendo revisar as despesas pendentes antes de criar novas demandas.'
      : 'Recomendo registrar a próxima prioridade operacional do dia.';

  return {
    message: `Briefing operacional: ${parts.join(' ')} ${nextStep}`,
    action: 'operational_briefing',
    reasoning: [
      `Quadro Scrum: ${snapshot.tasks.todo} a fazer, ${snapshot.tasks.inProgress} em progresso e ${snapshot.tasks.done} concluídas.`,
      `Financeiro: R$ ${snapshot.expenses.pendingTotal.toFixed(2)} em despesas pendentes.`,
      nextStep,
    ],
    operationalSnapshot: snapshot,
    suggestedActions: snapshot.tasks.todo === 0
      ? [{
          id: 'suggest-create-task',
          type: 'create_task',
          label: 'Criar próxima prioridade',
          description: 'Proponha uma tarefa para a próxima ação operacional.',
          payload: { title: 'Definir próxima prioridade operacional', priority: 'medium' },
          requiresConfirmation: true,
        }]
      : [],
  };
}

function proposeTask(title: string): AIResponse {
  const cleanedTitle = title.trim().replace(/[.]+$/, '');
  const priority = taskPriorityFromText(cleanedTitle);
  const action: SuggestedOperationalAction = {
    id: `create-task-${Date.now()}`,
    type: 'create_task',
    label: 'Confirmar criação da tarefa',
    description: `Criar a tarefa “${cleanedTitle}” com prioridade ${priority === 'high' ? 'alta' : priority === 'low' ? 'baixa' : 'média'}.`,
    payload: { title: cleanedTitle, priority },
    requiresConfirmation: true,
  };

  return {
    message: `Entendi a solicitação. Preparei a criação da tarefa “${cleanedTitle}”. A ação só será executada depois da sua confirmação.`,
    action: 'propose_action',
    reasoning: [
      'Intenção identificada: criação de tarefa.',
      `Prioridade sugerida: ${priority === 'high' ? 'alta' : priority === 'low' ? 'baixa' : 'média'}.`,
      'Ação mantida em modo supervisionado, aguardando confirmação.',
    ],
    suggestedActions: [action],
  };
}

export function analyzeOperationalIntent(message: string, snapshot: OperationalSnapshot): AIResponse | null {
  const normalized = message.trim();
  const createTaskMatch = normalized.match(CREATE_TASK_PATTERN);

  if (createTaskMatch?.[1]) {
    return proposeTask(createTaskMatch[1]);
  }

  if (BRIEFING_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return buildOperationalBriefing(snapshot);
  }

  return null;
}

export function formatOperationalContext(snapshot: OperationalSnapshot): string {
  return [
    `Sessões registradas: ${snapshot.sessions.total}.`,
    `Mensagens registradas: ${snapshot.messages.total}.`,
    `Documentos registrados: ${snapshot.documents.total}.`,
    `Tarefas: ${snapshot.tasks.todo} a fazer, ${snapshot.tasks.inProgress} em progresso e ${snapshot.tasks.done} concluídas.`,
    `Despesas pendentes: ${snapshot.expenses.pendingCount}, total de R$ ${snapshot.expenses.pendingTotal.toFixed(2)}.`,
  ].join(' ');
}
