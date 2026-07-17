import { AIResponse } from '../../src/types';
import { OpenAI } from 'openai';

// Cliente OpenAI configurado automaticamente para o proxy da Manus
const client = new OpenAI();

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

const SYSTEM_PROMPT = `Você é o Agente Micronet, um assistente virtual inteligente e prestativo da empresa Micronet.
Sua missão é ajudar os usuários com serviços de impressão, cópias, design gráfico e, principalmente, na geração de documentos.

Informações sobre a Micronet:
- Serviços: ${micronetInfo.services.join(', ')}
- Contato: ${micronetInfo.contact.phone} | ${micronetInfo.contact.email}
- Endereço: ${micronetInfo.contact.address}

Fluxos de Documentos Disponíveis:
1. Currículo (curriculum): Gere currículos profissionais.
2. Contato (contact): Registre mensagens para a equipe.
3. Segunda Via (second_copy): Solicite 2ª via de documentos.
4. Pesquisa Escolar (research): Crie pesquisas completas.
5. Relatório (report): Gere relatórios personalizados.
6. Proposta (proposal): Crie propostas comerciais.

Diretrizes de Resposta:
- Seja sempre educado, profissional e direto.
- Se o usuário quiser iniciar um dos fluxos acima, você deve encorajá-lo a clicar nos botões de atalho ou dizer claramente que vai iniciar o fluxo.
- Suas respostas devem ser curtas e adequadas para serem lidas em voz alta (TTS).
- Use português do Brasil (pt-BR).
- Se não souber algo, direcione o usuário para o contato humano da Micronet.`;

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: any[],
  _context?: any
): Promise<AIResponse> {
  try {
    // Formata o histórico para o formato da OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiMessage = response.choices[0].message.content || 'Desculpe, não consegui processar sua solicitação.';

    // Lógica simples para detectar intenção de iniciar fluxo via texto
    let action: 'provide_info' | 'ask_question' = 'ask_question';
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('currículo') || lowerMessage.includes('cv')) {
      action = 'ask_question';
    } else if (lowerMessage.includes('contato') || lowerMessage.includes('falar')) {
      action = 'provide_info';
    }

    return {
      message: aiMessage,
      action: action,
    };
  } catch (error) {
    console.error('Erro ao chamar LLM:', error);
    return {
      message: 'Olá! No momento estou operando em modo simplificado. Como posso ajudar você com nossos serviços de impressão ou documentos?',
      action: 'ask_question',
    };
  }
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
