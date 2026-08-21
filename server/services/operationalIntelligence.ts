import type { AIResponse, DocumentActionPayload, DocumentType, ExpenseActionPayload, SuggestedOperationalAction } from '../../src/types';
import type { OperationalSnapshot, Priority } from './db';

const BRIEFING_PATTERNS = [
  /\b(briefing|resumo|situa[cç][aã]o|status|pend[eê]ncia|pend[eê]ncias|prioridade|prioridades)\b/i,
  /\b(como est[aá] (a )?(opera[cç][aã]o|empresa|rotina))\b/i,
];
const CREATE_TASK_PATTERN = /^\s*(?:criar|crie|adicionar|adicione)\s+tarefa\s*:\s*(.+)$/i;
const CREATE_EXPENSE_PATTERN = /^\s*(?:registrar|registre|adicionar|adicione|lan[cç]ar|lance)\s+despesa\s*:\s*(.+)$/i;
const CREATE_DOCX_PATTERN = /^\s*(?:gerar|gere|criar|crie)\s+(?:documento\s+)?docx\s*:\s*(.+)$/i;

const documentTypes: Record<string, DocumentType> = {
  curriculo: 'curriculum',
  currículo: 'curriculum',
  contato: 'contact',
  'segunda via': 'second_copy',
  '2 via': 'second_copy',
  pesquisa: 'research',
  relatorio: 'report',
  relatório: 'report',
  proposta: 'proposal',
};

function taskPriorityFromText(title: string): Priority {
  if (/\b(urgente|hoje|cr[ií]tico|alta prioridade)\b/i.test(title)) return 'high';
  if (/\b(quando poss[ií]vel|baixa prioridade|sem pressa)\b/i.test(title)) return 'low';
  return 'medium';
}

function labelForDocumentType(type: DocumentType) {
  const labels: Record<DocumentType, string> = {
    curriculum: 'currículo',
    contact: 'solicitação de contato',
    second_copy: 'segunda via',
    research: 'pesquisa escolar',
    report: 'relatório operacional',
    proposal: 'proposta comercial',
  };
  return labels[type];
}

function parseCurrency(value: string) {
  const normalized = value.trim().replace(/R\$\s*/i, '').replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseExpense(value: string): ExpenseActionPayload | null {
  const parts = value.split(/[;|]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const amount = parseCurrency(parts[1]);
  if (!amount) return null;

  const categoryValue = (parts[2] || 'variável').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const category = categoryValue.startsWith('fix') ? 'fixed' : categoryValue.startsWith('out') ? 'other' : 'variable';

  return {
    description: parts[0],
    amount,
    category,
    status: 'pending',
    expenseDate: new Date().toISOString().slice(0, 10),
  };
}

function resolveDocumentType(value: string): DocumentType | null {
  const normalized = value.trim().toLowerCase();
  return Object.entries(documentTypes).find(([name]) => normalized.includes(name))?.[1] ?? null;
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
    reasoning: ['Intenção identificada: criação de tarefa.', `Prioridade sugerida: ${priority}.`, 'Ação mantida em modo supervisionado, aguardando confirmação.'],
    suggestedActions: [action],
  };
}

function proposeExpense(expense: ExpenseActionPayload): AIResponse {
  const categoryLabel = expense.category === 'fixed' ? 'fixa' : expense.category === 'other' ? 'outra' : 'variável';
  const action: SuggestedOperationalAction = {
    id: `create-expense-${Date.now()}`,
    type: 'create_expense',
    label: 'Confirmar lançamento da despesa',
    description: `Registrar a despesa ${categoryLabel} “${expense.description}” no valor de R$ ${expense.amount.toFixed(2)} como pendente.`,
    payload: expense,
    requiresConfirmation: true,
  };
  return {
    message: `Preparei o lançamento da despesa “${expense.description}”. Nenhum valor foi registrado ainda; confirme a ação para persistir o lançamento.`,
    action: 'propose_action',
    reasoning: ['Intenção identificada: lançamento de despesa.', `Categoria identificada: ${categoryLabel}.`, 'Ação financeira aguardando confirmação explícita.'],
    suggestedActions: [action],
  };
}

export function proposeDocumentGeneration(payload: DocumentActionPayload): AIResponse {
  const action: SuggestedOperationalAction = {
    id: `generate-docx-${Date.now()}`,
    type: 'generate_document',
    label: 'Confirmar geração do DOCX',
    description: `Gerar o arquivo DOCX de ${labelForDocumentType(payload.type)} com os dados coletados.`,
    payload,
    requiresConfirmation: true,
  };
  return {
    message: `Os dados foram organizados. O arquivo DOCX de ${labelForDocumentType(payload.type)} está pronto para ser gerado após sua confirmação.`,
    action: 'propose_action',
    reasoning: ['Dados do documento recebidos.', 'Formato selecionado: DOCX.', 'Geração mantida em modo supervisionado, aguardando confirmação.'],
    suggestedActions: [action],
  };
}

export function analyzeOperationalIntent(message: string, snapshot: OperationalSnapshot): AIResponse | null {
  const normalized = message.trim();
  const createTaskMatch = normalized.match(CREATE_TASK_PATTERN);
  if (createTaskMatch?.[1]) return proposeTask(createTaskMatch[1]);

  const createExpenseMatch = normalized.match(CREATE_EXPENSE_PATTERN);
  if (createExpenseMatch?.[1]) {
    const expense = parseExpense(createExpenseMatch[1]);
    if (!expense) {
      return {
        message: 'Para preparar uma despesa, use o formato: “Registrar despesa: descrição; valor; categoria”. Exemplo: “Registrar despesa: Internet; 99,90; fixa”.',
        action: 'ask_question',
      };
    }
    return proposeExpense(expense);
  }

  const createDocxMatch = normalized.match(CREATE_DOCX_PATTERN);
  if (createDocxMatch?.[1]) {
    const type = resolveDocumentType(createDocxMatch[1]);
    if (!type) {
      return {
        message: 'Informe o tipo de DOCX: currículo, contato, segunda via, pesquisa, relatório ou proposta.',
        action: 'ask_question',
      };
    }
    return proposeDocumentGeneration({
      type,
      format: 'docx',
      data: { solicitacao: createDocxMatch[1].trim() },
    });
  }

  if (BRIEFING_PATTERNS.some((pattern) => pattern.test(normalized))) return buildOperationalBriefing(snapshot);
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
