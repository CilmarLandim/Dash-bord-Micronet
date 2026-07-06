import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { generateDocument, getDocument, deleteDocument } from '../services/documentService';

export const documentsRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        type: z.enum(['curriculum', 'contact', 'second_copy', 'research', 'report', 'proposal']),
        data: z.record(z.any()),
        format: z.enum(['pdf', 'docx']).default('pdf'),
        useLetterhead: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const document = await generateDocument(input.type, { ...input.data, useLetterhead: input.useLetterhead }, input.format);
        return {
          success: true,
          document: {
            id: document.id,
            type: document.type,
            fileName: document.fileName,
            format: document.format,
            createdAt: document.createdAt,
          },
        };
      } catch (error) {
        console.error('Erro ao gerar documento:', error);
        throw new Error(`Falha ao gerar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),

  download: publicProcedure
    .input(
      z.object({
        documentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const buffer = await getDocument(input.documentId);
        if (!buffer) {
          throw new Error('Documento não encontrado');
        }
        return {
          success: true,
          buffer: buffer.toString('base64'),
        };
      } catch (error) {
        console.error('Erro ao baixar documento:', error);
        throw new Error(`Falha ao baixar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),

  delete: publicProcedure
    .input(
      z.object({
        documentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const success = deleteDocument(input.documentId);
        if (!success) {
          throw new Error('Documento não encontrado');
        }
        return {
          success: true,
        };
      } catch (error) {
        console.error('Erro ao deletar documento:', error);
        throw new Error(`Falha ao deletar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),
});
