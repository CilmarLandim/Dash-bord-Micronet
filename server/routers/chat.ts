import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { generateChatResponse } from '../services/llm';

const sessions = new Map<string, any>();

export const chatRouter = router({
  startSession: publicProcedure.mutation(async () => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessions.set(sessionId, {
      id: sessionId,
      startTime: new Date(),
      messages: [],
      totalTimeSeconds: 0,
    });
    return { sessionId };
  }),

  endSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const session = sessions.get(input.sessionId);
      if (session) {
        session.endTime = new Date();
        session.totalTimeSeconds =
          (session.endTime - session.startTime) / 1000;
      }
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
      const session = sessions.get(input.sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // Adiciona mensagem do usuário
      session.messages.push({
        role: 'user',
        content: input.message,
        timestamp: new Date(),
      });

      // Gera resposta da IA
      const response = await generateChatResponse(
        input.message,
        session.messages,
        input.context
      );

      // Adiciona resposta da IA
      session.messages.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      });

      return response;
    }),

  getHistory: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = sessions.get(input.sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      return session.messages;
    }),

  getSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = sessions.get(input.sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      return session;
    }),
});
