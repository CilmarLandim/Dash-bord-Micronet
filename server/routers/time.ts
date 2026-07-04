import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

// Armazenar tempo das sessões em memória (em produção, usar banco de dados)
const sessionTimeMap = new Map<string, { totalSeconds: number; lastUpdated: Date }>();

export const timeRouter = router({
  recordTime: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        seconds: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const current = sessionTimeMap.get(input.sessionId) || { totalSeconds: 0, lastUpdated: new Date() };
        current.totalSeconds += input.seconds;
        current.lastUpdated = new Date();
        sessionTimeMap.set(input.sessionId, current);

        return {
          success: true,
          totalSeconds: current.totalSeconds,
        };
      } catch (error) {
        console.error('Erro ao registrar tempo:', error);
        throw new Error(`Falha ao registrar tempo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),

  getSessionTime: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const timeData = sessionTimeMap.get(input.sessionId);
        const totalSeconds = timeData?.totalSeconds || 0;

        return {
          sessionId: input.sessionId,
          totalSeconds,
          formattedTime: formatTime(totalSeconds),
        };
      } catch (error) {
        console.error('Erro ao obter tempo da sessão:', error);
        throw new Error(`Falha ao obter tempo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),

  resetSessionTime: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        sessionTimeMap.delete(input.sessionId);
        return {
          success: true,
        };
      } catch (error) {
        console.error('Erro ao resetar tempo:', error);
        throw new Error(`Falha ao resetar tempo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),
});

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(' ') : '0s';
}
