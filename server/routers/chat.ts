import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { generateChatResponse, generateDocument } from '../services/llm';
import { dbService } from '../services/db';

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
    .input(
      z.object({
        sessionId: z.string(),
        message: z.string(),
        context: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Salva mensagem do usuário no SQLite
      dbService.addMessage(input.sessionId, 'user', input.message);

      // Recupera histórico do SQLite
      const history = dbService.getHistory(input.sessionId);

      // Gera resposta da IA (Claude)
      const response = await generateChatResponse(
        input.message,
        history,
        input.context
      );

      // Salva resposta da IA no SQLite
      dbService.addMessage(input.sessionId, 'assistant', response.message);

      return response;
    }),

  recordTime: publicProcedure
    .input(z.object({ 
      sessionId: z.string(), 
      seconds: z.number() 
    }))
    .mutation(async ({ input }) => {
      dbService.updateSessionTime(input.sessionId, input.seconds);
      return { success: true };
    }),

  generateDocument: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      type: z.enum(['curriculum', 'contact', 'second_copy', 'research', 'report', 'proposal']),
      data: z.any()
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
    .query(async ({ input }) => {
      return dbService.getHistory(input.sessionId);
    }),

  getSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = dbService.getSession(input.sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      return session;
    }),
});
