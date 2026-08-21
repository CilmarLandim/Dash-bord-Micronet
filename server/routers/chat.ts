import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { generateChatResponse, generateDocument } from '../services/llm';
import { dbService } from '../services/db';
import { analyzeOperationalIntent, buildOperationalBriefing, formatOperationalContext } from '../services/operationalIntelligence';

const taskPriority = z.enum(['low', 'medium', 'high']);
const expenseCategory = z.enum(['fixed', 'variable', 'other']);
const expenseStatus = z.enum(['pending', 'paid', 'cancelled']);
const documentType = z.enum(['curriculum', 'contact', 'second_copy', 'research', 'report', 'proposal']);

const operationalActionInput = z.discriminatedUnion('action', [
  z.object({
    sessionId: z.string(),
    action: z.literal('create_task'),
    payload: z.object({
      title: z.string().trim().min(3).max(140),
      description: z.string().trim().max(500).optional(),
      priority: taskPriority.default('medium'),
    }),
  }),
  z.object({
    sessionId: z.string(),
    action: z.literal('create_expense'),
    payload: z.object({
      description: z.string().trim().min(3).max(180),
      amount: z.number().positive(),
      category: expenseCategory.default('variable'),
      status: expenseStatus.default('pending'),
      expenseDate: z.string().optional(),
    }),
  }),
  z.object({
    sessionId: z.string(),
    action: z.literal('generate_document'),
    payload: z.object({
      type: documentType,
      format: z.literal('docx'),
      data: z.record(z.unknown()),
    }),
  }),
]);

export const chatRouter = router({
  startSession: publicProcedure.mutation(async () => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    dbService.createSession(sessionId);
    return { sessionId };
  }),

  endSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      dbService.endSession(input.sessionId);
      return { success: true };
    }),

  sendMessage: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      message: z.string().min(1),
      context: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      dbService.addMessage(input.sessionId, 'user', input.message);
      const history = dbService.getHistory(input.sessionId);
      const snapshot = dbService.getOperationalSnapshot();
      const operationalResponse = analyzeOperationalIntent(input.message, snapshot);
      const response = operationalResponse ?? await generateChatResponse(
        input.message,
        history,
        { ...input.context, operationalContext: formatOperationalContext(snapshot) },
      );
      dbService.addMessage(input.sessionId, 'assistant', response.message);
      return response;
    }),

  getBriefing: publicProcedure.query(() => buildOperationalBriefing(dbService.getOperationalSnapshot())),
  getOperationalSnapshot: publicProcedure.query(() => dbService.getOperationalSnapshot()),

  executeOperationalAction: publicProcedure
    .input(operationalActionInput)
    .mutation(async ({ input }) => {
      if (input.action === 'create_task') {
        const task = dbService.createScrumItem(input.payload);
        const message = `Ação confirmada: a tarefa “${task.title}” foi criada na coluna A fazer com prioridade ${task.priority === 'high' ? 'alta' : task.priority === 'low' ? 'baixa' : 'média'}.`;
        dbService.addMessage(input.sessionId, 'assistant', message);
        return { message, task, operationalSnapshot: dbService.getOperationalSnapshot() };
      }

      if (input.action === 'create_expense') {
        const expense = dbService.createExpense({
          ...input.payload,
          expenseDate: input.payload.expenseDate || new Date().toISOString().slice(0, 10),
        });
        const categoryLabel = expense.category === 'fixed' ? 'fixa' : expense.category === 'other' ? 'outra' : 'variável';
        const automaticTask = expense.category === 'fixed' ? ' Uma tarefa vinculada também foi adicionada ao quadro Scrum.' : '';
        const message = `Ação confirmada: a despesa ${categoryLabel} “${expense.description}” de R$ ${expense.amount.toFixed(2)} foi registrada como ${expense.status === 'paid' ? 'paga' : 'pendente'}.${automaticTask}`;
        dbService.addMessage(input.sessionId, 'assistant', message);
        return { message, expense, operationalSnapshot: dbService.getOperationalSnapshot() };
      }

      const document = await generateDocument(input.payload.type, input.payload.data, 'docx');
      dbService.createDocument({
        id: document.id,
        sessionId: input.sessionId,
        type: input.payload.type,
        title: input.payload.type,
        filePath: document.filePath,
        url: document.url,
      });
      const message = `Ação confirmada: o documento DOCX foi gerado com sucesso. Arquivo disponível em ${document.url}.`;
      dbService.addMessage(input.sessionId, 'assistant', message);
      return { message, document, operationalSnapshot: dbService.getOperationalSnapshot() };
    }),

  recordTime: publicProcedure
    .input(z.object({ sessionId: z.string(), seconds: z.number().nonnegative() }))
    .mutation(async ({ input }) => {
      dbService.updateSessionTime(input.sessionId, input.seconds);
      return { success: true };
    }),

  generateDocument: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      type: documentType,
      format: z.enum(['pdf', 'docx']).default('pdf'),
      data: z.record(z.unknown()),
    }))
    .mutation(async ({ input }) => {
      const document = await generateDocument(input.type, input.data, input.format);
      dbService.createDocument({
        id: document.id,
        sessionId: input.sessionId,
        type: input.type,
        title: input.type,
        filePath: document.filePath,
        url: document.url,
      });
      return document;
    }),

  getHistory: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => dbService.getHistory(input.sessionId)),

  getSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = dbService.getSession(input.sessionId);
      if (!session) throw new Error('Sessão não encontrada');
      return session;
    }),
});
