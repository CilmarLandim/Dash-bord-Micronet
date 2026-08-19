export type FlowType = 'curriculum' | 'contact' | 'second_copy' | 'research' | 'report' | 'proposal';

type Question = {
  key: string;
  text: string;
  validate?: (answer: string) => string | null;
};

const required = (label: string) => (answer: string) => answer.trim() ? null : `${label} é obrigatório`;
const email = (answer: string) => /\S+@\S+\.\S+/.test(answer.trim()) ? null : 'Informe um e-mail válido';

const flowQuestions: Record<FlowType, Question[]> = {
  curriculum: [
    { key: 'fullName', text: 'Qual é o seu nome completo?', validate: required('O nome') },
    { key: 'email', text: 'Qual é o seu e-mail?', validate: email },
    { key: 'phone', text: 'Qual é o seu telefone?', validate: required('O telefone') },
    { key: 'experience', text: 'Descreva sua experiência profissional.', validate: required('A experiência') },
    { key: 'education', text: 'Informe sua formação acadêmica.', validate: required('A formação') },
    { key: 'skills', text: 'Quais são suas principais habilidades?', validate: required('As habilidades') },
  ],
  contact: [
    { key: 'name', text: 'Qual é o seu nome?', validate: required('O nome') },
    { key: 'email', text: 'Qual é o seu e-mail?', validate: email },
    { key: 'phone', text: 'Qual é o seu telefone?', validate: required('O telefone') },
    { key: 'subject', text: 'Qual é o assunto do contato?', validate: required('O assunto') },
    { key: 'message', text: 'Digite a sua mensagem.', validate: required('A mensagem') },
  ],
  second_copy: [
    { key: 'documentType', text: 'Qual documento precisa de segunda via?', validate: required('O tipo de documento') },
    { key: 'documentNumber', text: 'Qual é o número do documento?', validate: required('O número') },
    { key: 'holderName', text: 'Qual é o nome do titular?', validate: required('O nome do titular') },
  ],
  research: [
    { key: 'topic', text: 'Qual é o tema da pesquisa?', validate: required('O tema') },
    { key: 'level', text: 'Qual é o nível escolar?', validate: required('O nível') },
    { key: 'pages', text: 'Quantas páginas você precisa?', validate: required('O número de páginas') },
    { key: 'instructions', text: 'Há alguma instrução especial? Se não houver, digite “não”.' },
  ],
  report: [
    { key: 'reportType', text: 'Qual é o tipo de relatório?', validate: required('O tipo') },
    { key: 'period', text: 'Qual período será analisado?', validate: required('O período') },
    { key: 'department', text: 'Qual departamento está envolvido?', validate: required('O departamento') },
    { key: 'specificData', text: 'Quais dados devem aparecer no relatório?', validate: required('Os dados') },
  ],
  proposal: [
    { key: 'proposalType', text: 'Qual é o tipo de proposta?', validate: required('O tipo') },
    { key: 'client', text: 'Qual é o nome do cliente?', validate: required('O cliente') },
    { key: 'scope', text: 'Descreva o escopo do serviço.', validate: required('O escopo') },
    { key: 'value', text: 'Qual é o valor da proposta?', validate: required('O valor') },
    { key: 'validity', text: 'Qual é a validade da proposta?', validate: required('A validade') },
  ],
};

class FlowService {
  private currentFlow: FlowType | null = null;
  private questionIndex = 0;
  private data: Record<string, string> = {};

  initFlow(flow: FlowType) {
    this.currentFlow = flow;
    this.questionIndex = 0;
    this.data = {};
    return flow;
  }

  getNextQuestion() {
    if (!this.currentFlow) return '';
    return flowQuestions[this.currentFlow][this.questionIndex]?.text || '';
  }

  processAnswer(answer: string) {
    if (!this.currentFlow) return { valid: false, error: 'Nenhum fluxo ativo' };
    const question = flowQuestions[this.currentFlow][this.questionIndex];
    if (!question) return { valid: false, error: 'Fluxo já concluído' };

    const cleanAnswer = answer.trim();
    const error = question.validate?.(cleanAnswer) || null;
    if (error) return { valid: false, error };

    this.data[question.key] = cleanAnswer;
    this.questionIndex += 1;
    return { valid: true };
  }

  isFlowCompleted() {
    return Boolean(this.currentFlow && this.questionIndex >= flowQuestions[this.currentFlow].length);
  }

  getCollectedData() {
    return { ...this.data };
  }

  resetFlow() {
    this.currentFlow = null;
    this.questionIndex = 0;
    this.data = {};
  }
}

export const flowService = new FlowService();

