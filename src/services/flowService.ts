// Tipos de fluxos e estados
export type FlowType = 'curriculum' | 'contact' | 'second_copy' | 'research' | 'report' | 'proposal';

export interface FlowState {
  type: FlowType;
  step: number;
  data: Record<string, any>;
  completed: boolean;
}

export interface FlowStep {
  question: string;
  field: string;
  validation?: (value: string) => boolean;
  errorMessage?: string;
}

// Definição dos fluxos
const FLOWS: Record<FlowType, FlowStep[]> = {
  curriculum: [
    {
      question: 'Qual é seu nome completo?',
      field: 'fullName',
      validation: (v) => v.length >= 3,
      errorMessage: 'Por favor, forneça um nome válido',
    },
    {
      question: 'Qual é sua experiência profissional? (descreva brevemente)',
      field: 'experience',
      validation: (v) => v.length >= 10,
      errorMessage: 'Por favor, descreva sua experiência',
    },
    {
      question: 'Qual é sua formação acadêmica?',
      field: 'education',
      validation: (v) => v.length >= 5,
      errorMessage: 'Por favor, descreva sua formação',
    },
    {
      question: 'Quais são suas principais habilidades?',
      field: 'skills',
      validation: (v) => v.length >= 5,
      errorMessage: 'Por favor, liste suas habilidades',
    },
  ],
  contact: [
    {
      question: 'Qual é seu nome?',
      field: 'name',
      validation: (v) => v.length >= 3,
      errorMessage: 'Por favor, forneça um nome válido',
    },
    {
      question: 'Qual é seu email?',
      field: 'email',
      validation: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      errorMessage: 'Por favor, forneça um email válido',
    },
    {
      question: 'Qual é seu telefone?',
      field: 'phone',
      validation: (v) => /^[\d\s\-\(\)]+$/.test(v) && v.length >= 10,
      errorMessage: 'Por favor, forneça um telefone válido',
    },
    {
      question: 'Qual é o assunto da sua mensagem?',
      field: 'subject',
      validation: (v) => v.length >= 5,
      errorMessage: 'Por favor, descreva o assunto',
    },
    {
      question: 'Qual é sua mensagem?',
      field: 'message',
      validation: (v) => v.length >= 10,
      errorMessage: 'Por favor, descreva sua mensagem',
    },
  ],
  second_copy: [
    {
      question: 'Qual tipo de documento você precisa? (RG, CPF, Certidão, etc)',
      field: 'documentType',
      validation: (v) => v.length >= 2,
      errorMessage: 'Por favor, especifique o tipo de documento',
    },
    {
      question: 'Qual é o número do documento?',
      field: 'documentNumber',
      validation: (v) => v.length >= 5,
      errorMessage: 'Por favor, forneça o número do documento',
    },
    {
      question: 'Qual é o nome completo do titular?',
      field: 'holderName',
      validation: (v) => v.length >= 3,
      errorMessage: 'Por favor, forneça um nome válido',
    },
  ],
  research: [
    {
      question: 'Qual é o tema da pesquisa?',
      field: 'topic',
      validation: (v) => v.length >= 5,
      errorMessage: 'Por favor, descreva o tema',
    },
    {
      question: 'Qual é o nível/série? (Fundamental, Médio, Superior, etc)',
      field: 'level',
      validation: (v) => v.length >= 3,
      errorMessage: 'Por favor, especifique o nível',
    },
    {
      question: 'Quantas páginas você precisa?',
      field: 'pages',
      validation: (v) => /^\d+$/.test(v) && parseInt(v) > 0,
      errorMessage: 'Por favor, forneça um número válido de páginas',
    },
    {
      question: 'Há alguma instrução especial?',
      field: 'instructions',
      validation: (v) => true, // Opcional
      errorMessage: '',
    },
  ],
  report: [
    {
      question: 'Qual é o tipo de relatório? (Técnico, Administrativo, Financeiro, etc)',
      field: 'reportType',
      validation: (v) => v.length >= 3,
      errorMessage: 'Por favor, especifique o tipo de relatório',
    },
    {
      question: 'Qual é o período? (Ex: Janeiro a Março de 2024)',
      field: 'period',
      validation: (v) => v.length >= 5,
      errorMessage: 'Por favor, especifique o período',
    },
    {
      question: 'Qual é o departamento ou área?',
      field: 'department',
      validation: (v) => v.length >= 3,
      errorMessage: 'Por favor, especifique o departamento',
    },
    {
      question: 'Quais dados específicos devem ser incluídos?',
      field: 'specificData',
      validation: (v) => v.length >= 5,
      errorMessage: 'Por favor, descreva os dados necessários',
    },
  ],
  proposal: [
    {
      question: 'Qual é o tipo de proposta? (Comercial, Técnica, Projeto, etc)',
      field: 'proposalType',
      validation: (v) => v.length >= 3,
      errorMessage: 'Por favor, especifique o tipo de proposta',
    },
    {
      question: 'Qual é o cliente ou destinatário?',
      field: 'client',
      validation: (v) => v.length >= 3,
      errorMessage: 'Por favor, forneça o nome do cliente',
    },
    {
      question: 'Descreva o escopo/detalhes da proposta',
      field: 'scope',
      validation: (v) => v.length >= 10,
      errorMessage: 'Por favor, descreva o escopo',
    },
    {
      question: 'Qual é o valor/investimento?',
      field: 'value',
      validation: (v) => /^[\d\.,]+$/.test(v),
      errorMessage: 'Por favor, forneça um valor válido',
    },
    {
      question: 'Qual é o prazo de validade da proposta?',
      field: 'validity',
      validation: (v) => v.length >= 3,
      errorMessage: 'Por favor, especifique o prazo',
    },
  ],
};

// Serviço de gerenciamento de fluxos
export class FlowService {
  private currentFlow: FlowState | null = null;

  initFlow(flowType: FlowType): FlowState {
    this.currentFlow = {
      type: flowType,
      step: 0,
      data: {},
      completed: false,
    };
    return this.currentFlow;
  }

  getCurrentFlow(): FlowState | null {
    return this.currentFlow;
  }

  getCurrentStep(): FlowStep | null {
    if (!this.currentFlow) return null;
    const flow = FLOWS[this.currentFlow.type];
    if (this.currentFlow.step >= flow.length) return null;
    return flow[this.currentFlow.step];
  }

  getNextQuestion(): string {
    const step = this.getCurrentStep();
    return step?.question || 'Fluxo concluído!';
  }

  processAnswer(answer: string): { valid: boolean; error?: string } {
    if (!this.currentFlow) {
      return { valid: false, error: 'Nenhum fluxo ativo' };
    }

    const step = this.getCurrentStep();
    if (!step) {
      return { valid: false, error: 'Fluxo concluído' };
    }

    // Valida resposta
    if (step.validation && !step.validation(answer)) {
      return { valid: false, error: step.errorMessage };
    }

    // Armazena resposta
    this.currentFlow.data[step.field] = answer;

    // Avança para próximo passo
    this.currentFlow.step++;

    // Verifica se fluxo foi concluído
    const flow = FLOWS[this.currentFlow.type];
    if (this.currentFlow.step >= flow.length) {
      this.currentFlow.completed = true;
    }

    return { valid: true };
  }

  isFlowCompleted(): boolean {
    return this.currentFlow?.completed || false;
  }

  getCollectedData(): Record<string, any> {
    return this.currentFlow?.data || {};
  }

  resetFlow(): void {
    this.currentFlow = null;
  }

  // Gera resumo do fluxo para documento
  generateSummary(): string {
    if (!this.currentFlow) return '';

    const { type, data } = this.currentFlow;
    let summary = '';

    switch (type) {
      case 'curriculum':
        summary = `
CURRÍCULO

Nome: ${data.fullName}
Experiência: ${data.experience}
Formação: ${data.education}
Habilidades: ${data.skills}
        `;
        break;

      case 'contact':
        summary = `
FORMULÁRIO DE CONTATO

Nome: ${data.name}
Email: ${data.email}
Telefone: ${data.phone}
Assunto: ${data.subject}
Mensagem: ${data.message}
        `;
        break;

      case 'second_copy':
        summary = `
SOLICITAÇÃO DE SEGUNDA VIA

Tipo de Documento: ${data.documentType}
Número: ${data.documentNumber}
Titular: ${data.holderName}
        `;
        break;

      case 'research':
        summary = `
PESQUISA ESCOLAR

Tema: ${data.topic}
Nível: ${data.level}
Páginas: ${data.pages}
Instruções: ${data.instructions || 'Nenhuma'}
        `;
        break;

      case 'report':
        summary = `
RELATÓRIO

Tipo: ${data.reportType}
Período: ${data.period}
Departamento: ${data.department}
Dados: ${data.specificData}
        `;
        break;

      case 'proposal':
        summary = `
PROPOSTA

Tipo: ${data.proposalType}
Cliente: ${data.client}
Escopo: ${data.scope}
Valor: ${data.value}
Validade: ${data.validity}
        `;
        break;
    }

    return summary;
  }
}

export const flowService = new FlowService();
