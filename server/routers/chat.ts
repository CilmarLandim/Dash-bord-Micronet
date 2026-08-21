import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { generateChatResponse, generateDocument } from '../services/llm';
import { dbService } from '../services/db';
import { analyzeOperationalIntent, buildOperationalBriefing, formatOperationalContext } from '../services/operationalIntelligence';

const taskPriority = z.enum(['low', 'medium', 'high']);

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

  getBriefing: publicProcedure.query(() => {
    return buildOperationalBriefing(dbService.getOperationalSnapshot());
  }),

  getOperationalSnapshot: publicProcedure.query(() => {
    return dbService.getOperationalSnapshot();
  }),

  executeOperationalAction: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      action: z.literal('create_task'),
      payload: z.object({
        title: z.string().trim().min(3).max(140),
        description: z.string().trim().max(500).optional(),
        priority: taskPriority.default('medium'),
      }),
    }))
    .mutation(async ({ input }) => {
      const task = dbService.createScrumItem({
        title: input.payload.title,
        description: input.payload.description,
        priority: input.payload.priority,
      });
      const message = `Ação confirmada: a tarefa “${task.title}” foi criada na coluna A fazer com prioridade ${task.priority === 'high' ? 'alta' : task.priority === 'low' ? 'baixa' : 'média'}.`;
      dbService.addMessage(input.sessionId, 'assistant', message);
      return { message, task, operationalSnapshot: dbService.getOperationalSnapshot() };
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
      type: z.enum(['curriculum', 'contact', 'second_copy', 'research', 'report', 'proposal']),
      format: z.enum(['pdf', 'docx']).default('pdf'),
      data: z.any(),
    }))
    .mutation(async ({ input }) => {
      const document = await generateDocument(input.type, input.data);
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
