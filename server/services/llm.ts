import { AIResponse } from '../../src/types';

// Simulação de respostas da IA
// Em produção, integrar com OpenAI, Claude, etc.

const flowResponses: Record<string, string[]> = {
  curriculum: [
    'Para criar um currículo, preciso de algumas informações. Qual é o seu nome completo?',
    'Qual é sua experiência profissional mais recente?',
    'Qual é sua formação acadêmica?',
    'Quais são suas principais habilidades?',
    'Seu currículo foi gerado com sucesso! Deseja imprimir?',
  ],
  contact: [
    'Vou ajudá-lo a entrar em contato conosco. Qual é o seu nome?',
    'Qual é seu email?',
    'Qual é seu telefone?',
    'Qual é o assunto do seu contato?',
    'Sua mensagem foi registrada. Entraremos em contato em breve!',
  ],
  second_copy: [
    'Para solicitar uma segunda via, qual documento você precisa?',
    'Qual é o número do documento?',
    'Sua segunda via foi gerada. Deseja imprimir?',
  ],
  research: [
    'Vou ajudá-lo com uma pesquisa escolar. Qual é o tema?',
    'Qual é a série ou nível escolar?',
    'Quantas páginas você precisa?',
    'Sua pesquisa foi gerada com sucesso!',
  ],
  report: [
    'Vou ajudá-lo a gerar um relatório. Qual é o tipo?',
    'Qual é o período do relatório?',
    'Quais dados você gostaria de incluir?',
    'Seu relatório foi gerado com sucesso!',
  ],
  proposal: [
    'Vou ajudá-lo a criar uma proposta. Qual é o tipo?',
    'Descreva os detalhes da proposta',
    'Qual é o valor?',
    'Sua proposta foi gerada com sucesso!',
  ],
};

const micronetInfo = {
  name: 'Micronet',
  description: 'Somos uma empresa de soluções digitais e impressão',
  services: ['Impressão', 'Cópias', 'Encadernação', 'Design gráfico', 'Consultoria'],
  contact: {
    phone: '(11) 3000-0000',
    email: 'contato@micronet.com.br',
    address: 'Rua Principal, 123 - São Paulo, SP',
  },
};

export async function generateChatResponse(
  userMessage: string,
  _conversationHistory: any[],
  _context?: any
): Promise<AIResponse> {
  // Detecta intenção do usuário
  const lowerMessage = userMessage.toLowerCase();

  // Respostas sobre Micronet
  if (
    lowerMessage.includes('micronet') ||
    lowerMessage.includes('empresa') ||
    lowerMessage.includes('serviço') ||
    lowerMessage.includes('o que vocês fazem')
  ) {
    return {
      message: `A ${micronetInfo.name} oferece os seguintes serviços: ${micronetInfo.services.join(', ')}. 
      Entre em contato: ${micronetInfo.contact.phone} ou ${micronetInfo.contact.email}`,
      action: 'provide_info',
    };
  }

  // Detecta fluxo de currículo
  if (lowerMessage.includes('currículo') || lowerMessage.includes('cv')) {
    return {
      message: flowResponses.curriculum[0],
      action: 'ask_question',
      nextQuestion: {
        id: 'name',
        text: 'Qual é o seu nome completo?',
        type: 'text',
        required: true,
      },
    };
  }

  // Detecta fluxo de contato
  if (
    lowerMessage.includes('contato') ||
    lowerMessage.includes('falar') ||
    lowerMessage.includes('dúvida')
  ) {
    return {
      message: flowResponses.contact[0],
      action: 'ask_question',
      nextQuestion: {
        id: 'contact_name',
        text: 'Qual é o seu nome?',
        type: 'text',
        required: true,
      },
    };
  }

  // Detecta fluxo de segunda via
  if (lowerMessage.includes('segunda via') || lowerMessage.includes('2ª via')) {
    return {
      message: flowResponses.second_copy[0],
      action: 'ask_question',
      nextQuestion: {
        id: 'doc_type',
        text: 'Qual documento você precisa?',
        type: 'select',
        required: true,
        options: ['RG', 'CPF', 'Carteira de Trabalho', 'Comprovante de Residência'],
      },
    };
  }

  // Detecta fluxo de pesquisa
  if (lowerMessage.includes('pesquisa') || lowerMessage.includes('trabalho escolar')) {
    return {
      message: flowResponses.research[0],
      action: 'ask_question',
      nextQuestion: {
        id: 'research_theme',
        text: 'Qual é o tema da pesquisa?',
        type: 'text',
        required: true,
      },
    };
  }

  // Detecta fluxo de relatório
  if (lowerMessage.includes('relatório')) {
    return {
      message: flowResponses.report[0],
      action: 'ask_question',
      nextQuestion: {
        id: 'report_type',
        text: 'Qual é o tipo de relatório?',
        type: 'select',
        required: true,
        options: ['Vendas', 'Financeiro', 'Operacional', 'Outro'],
      },
    };
  }

  // Detecta fluxo de proposta
  if (lowerMessage.includes('proposta')) {
    return {
      message: flowResponses.proposal[0],
      action: 'ask_question',
      nextQuestion: {
        id: 'proposal_type',
        text: 'Qual é o tipo de proposta?',
        type: 'text',
        required: true,
      },
    };
  }

  // Resposta padrão
  return {
    message: `Entendi sua pergunta: "${userMessage}". 
    Como posso ajudá-lo? Posso gerar documentos como:
    • Currículo
    • Contato
    • Segunda via
    • Pesquisa escolar
    • Relatório
    • Proposta
    
    Ou você gostaria de saber mais sobre a Micronet?`,
    action: 'ask_question',
  };
}

export async function generateDocument(
  type: string,
  data: any
): Promise<{ id: string; content: string; filePath: string }> {
  // Simulação de geração de documento
  const documentId = `doc_${Date.now()}`;
  const content = `Documento: ${type}\n\nDados:\n${JSON.stringify(data, null, 2)}`;
  const filePath = `/documentos/${type}/${documentId}.pdf`;

  return {
    id: documentId,
    content,
    filePath,
  };
}
