import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

interface FlowInfo {
  type: string;
  label: string;
  emoji: string;
  description: string;
}

interface MicronetInfo {
  name: string;
  description: string;
  version: string;
  features: string[];
  contact: {
    email: string;
    phone: string;
    website: string;
  };
}

const micronetInfo: MicronetInfo = {
  name: 'Micronet Agent',
  description: 'Agente Virtual de Atendimento Inteligente para Micronet',
  version: '1.0.0',
  features: [
    'Chat com IA',
    'Geração de documentos (PDF e DOCX)',
    'Suporte a voz',
    'Múltiplos fluxos de atendimento',
    'Histórico de sessões',
    'Rastreamento de tempo',
  ],
  contact: {
    email: 'suporte@micronet.com',
    phone: '+55 (11) 3000-0000',
    website: 'https://www.micronet.com',
  },
};

const flows: FlowInfo[] = [
  {
    type: 'curriculum',
    label: 'Currículo',
    emoji: '📄',
    description: 'Gere seu currículo profissional de forma rápida e fácil',
  },
  {
    type: 'contact',
    label: 'Contato',
    emoji: '📞',
    description: 'Envie uma mensagem de contato para a Micronet',
  },
  {
    type: 'second_copy',
    label: 'Segunda Via',
    emoji: '🔄',
    description: 'Solicite segunda via de documentos importantes',
  },
  {
    type: 'research',
    label: 'Pesquisa Escolar',
    emoji: '🎓',
    description: 'Gere uma pesquisa escolar completa e bem estruturada',
  },
  {
    type: 'report',
    label: 'Relatório',
    emoji: '📊',
    description: 'Crie um relatório profissional personalizado',
  },
  {
    type: 'proposal',
    label: 'Proposta',
    emoji: '💼',
    description: 'Gere uma proposta comercial completa',
  },
];

export const infoRouter = router({
  getMicronetInfo: publicProcedure.query(async () => {
    try {
      return {
        success: true,
        data: micronetInfo,
      };
    } catch (error) {
      console.error('Erro ao obter informações da Micronet:', error);
      throw new Error(`Falha ao obter informações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }),

  getFlows: publicProcedure.query(async () => {
    try {
      return {
        success: true,
        data: flows,
      };
    } catch (error) {
      console.error('Erro ao obter fluxos:', error);
      throw new Error(`Falha ao obter fluxos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }),

  getFlowByType: publicProcedure
    .input(
      z.object({
        type: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const flow = flows.find((f) => f.type === input.type);
        if (!flow) {
          throw new Error(`Fluxo não encontrado: ${input.type}`);
        }
        return {
          success: true,
          data: flow,
        };
      } catch (error) {
        console.error('Erro ao obter fluxo:', error);
        throw new Error(`Falha ao obter fluxo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),

  getUsageStats: publicProcedure.query(async () => {
    try {
      // Estatísticas simuladas (em produção, vir do banco de dados)
      return {
        success: true,
        data: {
          totalSessions: 0,
          totalDocumentsGenerated: 0,
          averageSessionDuration: 0,
          mostUsedFlow: 'curriculum',
          userSatisfaction: 0,
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error(`Falha ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }),

  getStatus: publicProcedure.query(async () => {
    try {
      return {
        success: true,
        status: 'online',
        version: micronetInfo.version,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Erro ao obter status:', error);
      throw new Error(`Falha ao obter status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }),
});
