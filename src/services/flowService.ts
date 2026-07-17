export type FlowType = 'curriculum' | 'contact' | 'second_copy' | 'research' | 'report' | 'proposal';

export interface FlowResult {
  valid: boolean;
  error?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select';
  options?: string[];
  required: boolean;
  validation?: (value: string) => boolean;
}

export class FlowService {
  private currentFlow: FlowType | null = null;
  private currentStep = 0;
  private collectedData: Record<string, any> = {};

  private flows: Record<FlowType, Question[]> = {
    curriculum: [
      { id: 'fullName', text: 'Qual é o seu nome completo?', type: 'text', required: true },
      { id: 'email', text: 'Qual é o seu e-mail?', type: 'email', required: true },
      { id: 'phone', text: 'Qual é o seu telefone?', type: 'phone', required: true },
      { id: 'experience', text: 'Fale um pouco sobre sua experiência profissional.', type: 'text', required: true },
      { id: 'education', text: 'Qual sua formação acadêmica?', type: 'text', required: true },
      { id: 'skills', text: 'Quais são suas principais habilidades?', type: 'text', required: true },
    ],
    contact: [
      { id: 'name', text: 'Qual é o seu nome?', type: 'text', required: true },
      { id: 'email', text: 'Qual é o seu e-mail?', type: 'email', required: true },
      { id: 'subject', text: 'Qual o assunto do contato?', type: 'text', required: true },
      { id: 'message', text: 'Digite sua mensagem.', type: 'text', required: true },
    ],
    second_copy: [
      { id: 'documentType', text: 'Qual documento você precisa?', type: 'select', options: ['RG', 'CPF', 'CNH', 'Título de Eleitor'], required: true },
      { id: 'documentNumber', text: 'Qual o número do documento?', type: 'text', required: true },
      { id: 'holderName', text: 'Qual o nome do titular?', type: 'text', required: true },
    ],
    research: [
      { id: 'topic', text: 'Qual o tema da pesquisa?', type: 'text', required: true },
      { id: 'level', text: 'Qual o nível escolar?', type: 'text', required: true },
      { id: 'pages', text: 'Quantas páginas você precisa?', type: 'number', required: true },
    ],
    report: [
      { id: 'reportType', text: 'Qual o tipo de relatório?', type: 'text', required: true },
      { id: 'period', text: 'Qual o período (ex: Janeiro/2024)?', type: 'text', required: true },
      { id: 'details', text: 'Quais detalhes incluir?', type: 'text', required: true },
    ],
    proposal: [
      { id: 'clientName', text: 'Para qual cliente é a proposta?', type: 'text', required: true },
      { id: 'service', text: 'Qual serviço será proposto?', type: 'text', required: true },
      { id: 'value', text: 'Qual o valor estimado?', type: 'number', required: true },
    ],
  };

  initFlow(type: FlowType) {
    this.currentFlow = type;
    this.currentStep = 0;
    this.collectedData = {};
  }

  getNextQuestion(): string {
    if (!this.currentFlow) return '';
    const questions = this.flows[this.currentFlow];
    return questions[this.currentStep].text;
  }

  processAnswer(answer: string): FlowResult {
    if (!this.currentFlow) return { valid: false, error: 'Nenhum fluxo ativo' };
    
    const questions = this.flows[this.currentFlow];
    const question = questions[this.currentStep];

    // Validações básicas
    if (question.required && !answer.trim()) {
      return { valid: false, error: 'Este campo é obrigatório' };
    }

    if (question.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(answer)) {
        return { valid: false, error: 'E-mail inválido' };
      }
    }

    if (question.type === 'phone') {
      const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
      const digitsOnly = answer.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return { valid: false, error: 'Telefone inválido. Use (11) 99999-9999' };
      }
    }

    this.collectedData[question.id] = answer;
    this.currentStep++;
    return { valid: true };
  }

  isFlowCompleted(): boolean {
    if (!this.currentFlow) return false;
    return this.currentStep >= this.flows[this.currentFlow].length;
  }

  getCollectedData() {
    return this.collectedData;
  }

  resetFlow() {
    this.currentFlow = null;
    this.currentStep = 0;
    this.collectedData = {};
  }
}

export const flowService = new FlowService();
